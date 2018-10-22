<?php
// DIC configuration
use Respect\Validation\Validator as v;

$container = $app->getContainer();

$container['view'] = function ($container) {
    $view = new \Slim\Views\Twig(__DIR__.'/../templates', [
        'cache' => false, //'cache'
        'debug' => true
    ]);
    $view->addExtension(new \Slim\Views\TwigExtension(
        $container['router'],
        $container['request']->getUri()
    ));
    $view->addExtension(new Twig_Extension_Debug());

    return $view;
};

$container['view']['session'] = $_SESSION;

/* ========================================
            Logs
   ======================================== */

$container['logger'] = function ($c) {
    $settings = $c->get('settings')['logger'];
    $logger = new Monolog\Logger($settings['name']);
    $logger->pushProcessor(new Monolog\Processor\UidProcessor());
    $logger->pushHandler(new Monolog\Handler\StreamHandler($settings['path'], $settings['level']));
    return $logger;
};

/* ========================================
            Login validation
   ======================================== */

$container['loginValidation'] = function () {

  $emailValidator = v::notEmpty()->email()->setName('Email');
  $passwordValidator = v::notEmpty()->length(7, null)->setName('Password');
  $validators = array(
    'user_email' => $emailValidator,
    'user_password' => $passwordValidator
  );

  return new \DavidePastore\Slim\Validation\Validation($validators);
};

/* ========================================
            Register validation
   ======================================== */

$container['registerValidation'] = function () {

  $emailValidator = v::notEmpty()->email()->setName('Email');
  $passwordValidator = v::notEmpty()->length(7, null)->setName('Password');
  $validators = array(
    'user_email' => $emailValidator,
    'user_password' => $passwordValidator,
    'user_password_confirm' => $passwordValidator
  );

  return new \DavidePastore\Slim\Validation\Validation($validators);
};

/* ========================================
              Custom 404
   ======================================== */

$container['notFoundHandler'] = function ($c) {
    return function ($request, $response) use ($c) {
            return $c->view->render($response, '404.twig') 
                ->withStatus(404)
                ->withHeader('Content-Type', 'text/html');
        };
};