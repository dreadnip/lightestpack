<?php
// Application middleware

// e.g: $app->add(new \Slim\Csrf\Guard);

$app->add(new \Zeuxisoo\Whoops\Provider\Slim\WhoopsMiddleware);

$protected = function ($request, $response, $next) {
    $response = $next($request, $response);
    if(isset($_SESSION['logged_in']) && $_SESSION['logged_in'] == true){
        return $response;
    }else{
        return $response->withStatus(302)->withHeader('Location', '/login');
    }
};