<?php

//	controller.php
//
//	index:
//		* set-up
//		* action handling
//		* emails
//		* pdf generation
//		* basic functions
//
//

function process($list)
{
    //total weights
    $base_weight = 0;
    foreach($list->ls_content->categories as &$category){
        $total_category_weight = 0;
        foreach($category->items as $item){
            $total_category_weight += ($item->quantity * $item->weight);
        }
        $category->total_weight = $total_category_weight;
        $base_weight += $total_category_weight;
    }
    $list->base_weight = round($base_weight / 1000, 1);

    //tags
    $list->tags = explode(',',$list->ls_tags);
    return $list;
}

function search($query)
{
    //Get all lists and prep an empty result container
    $lists = get_all_lists();
    $filter = [];

    //split the query
    $query = explode(' ',$query);
    foreach($lists as $list){
        $list->tags = explode(',',$list->ls_tags);

        $intersect = array_diff($query, $list->tags);

        if (empty($intersect)) {
            $filter[] = $list;
        }
    }
    return $filter;
}

function login_user($user)
{
    $_SESSION['user_id'] = $user->us_id;
    $_SESSION['user_email'] = $user->us_email;
    $_SESSION['user_lists'] = get_user_lists($user->us_id);
    $_SESSION['logged_in'] = true; //   login
    $cookiehash = hash('sha256', $user->us_email . 'the super secret lighterpack key');
    setcookie("pers",$cookiehash,time()+3600*24*365,'/','localhost');
    store_cookie($user->us_id, $cookiehash);
}


function check_cookie()
{
    $persistent_login_cookie = $_COOKIE['pers']; 
    if (!empty($persistent_login_cookie)) {   
        $user = get_user_by_cookie($persistent_login_cookie);
        if($user){
            login_user($user);
        }
    }
}

function generate_new_list_id()
{
    return strtoupper(substr(md5(rand()), 0, 6));
}

/* ============================================
                Email functions
============================================ */

/**
* send_activation_email
* @param string $email | email adress to send the activation mail to
* @param string $hash | activation hash to include in the email
* @return Returns TRUE if the mail was successfully accepted for delivery, FALSE otherwise.
*/
function send_activation_email($email, $hash)
{
    $to      = $email;
    $subject = '[BetterLighterpack] Confirm your new account 🚀';
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";

    // Additional headers
    $headers .= 'From: BetterLighterpack<accounts@betterLighterpack.com>' . "\r\n";
    $headers .= 'Reply-To: support@betterLighterpack.com' . "\r\n";

    $email_path = __DIR__."/../mail/activation.php";
    ob_start();
    include_once($email_path);
    $mail_body = ob_get_clean();

    return mail($to, $subject, $mail_body, $headers);
}

function send_password_reset_email($user, $reset_hash)
{
    $to      = $user->us_email;
    $subject = '[Runelogs] Reset your password 🔒';
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";

    // Additional headers
    $headers .= 'From: Runelogs<accounts@runelo.gs>' . "\r\n";
    $headers .= 'Reply-To: support@runelo.gs' . "\r\n";

    $email_path = __DIR__."/../mail/reset.php";
    ob_start();
    include_once($email_path);
    $mail_body = ob_get_clean();

    return mail($to, $subject, $mail_body, $headers);
}