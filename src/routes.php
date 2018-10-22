<?php

/*

Browse routes 

*/

$app->get('/browse/random', function ($request, $response, $args) {

	$lists = get_list_ids();
    $random_list_id = array_rand($lists);
    return $response->withHeader('Location', '/browse/'.$lists[$random_list_id]);
});

$app->get('/browse[/{id}]', function ($request, $response, $args) {

	if(isset($args['id'])){
		$list_id = $args['id'];
		$list = get_list($list_id);
        if($list){
            $args['list'] = process($list);
        }
	}

    return $this->view->fetch('browse.twig', $args);
});

/* 

Search routes

*/

$app->map(['GET','POST'], '/search[/{search_query}]', function ($request, $response, $args) {

	if ($request->isPost()) {
		$post = (object)$request->getParams();
		$search_query = $post->search;
		$args['search_query'] = $search_query;
    	$args['search_results'] = search($search_query);
	}else{
        //when it's a get
        if(isset($args['search_query'])){
            $search_query = $args['search_query'];
            $args['search_results'] = search($search_query);
        }
    }

    return $this->view->fetch('search.twig', $args);
});

/* 

User auth

*/

$app->map(['GET','POST'], '/login', function ($request, $response, $args) use ($app) {

    if ($request->isPost()) {

        $post = (object)$request->getParams();
        $args['form_input']['user_email'] = $post->user_email;

        //validate
        if ($request->getAttribute('has_errors')) { //check for validation errors

              $args['errors'] = $request->getAttribute('errors'); //report them back if there are any

        } else {

            //if not, move on
            if (isset($post->user_email) && isset($post->user_password)) {

                $user = check_user($post->user_email); //  try to look up the client id in the local db

                if (isset($user) && $user != null) {

                    if ($user->us_status == 'active') {
                        if (password_verify($post->user_password, $user->us_password) == true) { //   match the passwords

                            login_user($user);

                            return $response->withHeader('Location', '/');
                        } else {
                            //wrong password
                            $args['errors']['user_password'][] = "Wrong password";
                        }
                    } else {
                        $args['errors']['user_email'][] = "Inactive account. Check your inbox.";
                    }
                } else {
                    //client not found
                    $args['errors']['user_email'][] = "Unknown email";
                }
            }
        }
    }

    return $this->view->fetch('login.twig', $args);

})->add($container->get('loginValidation'));

$app->get('/logout', function ($request, $response, $args) use ($app) {
    session_destroy();
    setcookie("pers", "", time()-3600);
    return $response->withHeader('Location', '/');  
});

$app->map(['GET','POST'], '/register', function ($request, $response, $args) use ($app) {

    if ($request->isPost()) {

        $post = (object)$request->getParams();
        $args['form_input']['user_email'] = $post->user_email;

        //validate
        if ($request->getAttribute('has_errors')) {

            $args['errors'] = $request->getAttribute('errors');

        } else {

            $user = check_user($post->user_email); //  try to look up the client id in the local db

            if (isset($user) && $user != null) {
                //client already is in local db
                $args['errors']['user_email'][] = "E-mail is already in use!";           
                
            } else {
                //compare the entered passwords
                if ($post->user_password == $post->user_password_confirm) {

                    //add new user
                    $activation_hash = sha1("betterlighterpack_random_key".$post->user_email);
                    $user_id = add_user($post->user_email, password_hash($post->user_password, PASSWORD_DEFAULT), 'inactive', $activation_hash);
                    
                    //send activation email
                    send_activation_email($post->user_email, $activation_hash);

                    $args['signup_completed'] = true;
                } else {
                    $args['errors']['user_password_confirm'][] = "Passwords don't match.";
                }
            }
        }
    }

    return $this->view->fetch('register.twig', $args);

})->add($container->get('registerValidation'));

/* 

Save

*/

$app->post('/save', function ($request, $response, $args) {
    $post = (object)$request->getParams();
    $res = update_list($post->list_id, $post->list_name, json_encode($post->content));
    return $res;
});

$app->get('/gear', function ($request, $response, $args) {
    return json_encode(get_gear());
});

/* 

My lists

*/

$app->get('/lists', function ($request, $response, $args) {

    if(isset($_SESSION['user_id'])){
        $user_id = $_SESSION['user_id'];
        $args['lists'] = get_lists($user_id);
    }

    return $this->view->fetch('lists.twig', $args);
})->add($protected);

$app->get('/create', function ($request, $response, $args) {

    if(isset($_SESSION['user_id'])){
        $user_id = $_SESSION['user_id'];
        $new_list_id = generate_new_list_id();
        $new_list_content = json_encode([ "categories" => [] ]);
        $new_list_id = create_new_list($new_list_id, 'Your new list', $new_list_content, $user_id);
        $_SESSION['user_lists'] = get_user_lists($user_id); //update the user's lists in the session
        return $new_list_id;
    }

})->add($protected);

$app->get('/delete[/{key}]', function ($request, $response, $args) {

    if(isset($args['key'])){
        $list_key = $args['key'];
        if(in_array($list_key, $_SESSION['user_lists'])){
            $list = delete_list($list_key);
        }
    }

    return $response->withStatus(302)->withHeader('Location', '/lists');
})->add($protected);

$app->post('/import', function ($request, $response, $args) {

    $post = (object)$request->getParams();
    $curl = curl_init();
    $url = "https://lighterpack.com/csv/".$post->import;
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    $result = curl_exec($curl);
    $responseCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    if($responseCode == 200 && $result){
        $new_list = import($result);
        return $response->withStatus(302)->withHeader('Location', '/browse/'.$new_list);
    }else{
        return $response->withStatus(302)->withHeader('Location', '/lists');
    }

});

/*

Basic routes

*/

$app->get('/about', function ($request, $response, $args) {

    return $this->view->fetch('about.twig', $args);
});

$app->get('/', function ($request, $response, $args) {

    return $this->view->fetch('index.twig', $args);
});