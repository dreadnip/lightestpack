<?php

use Symfony\Component\Yaml\Yaml;

function return_handler()
{
	$config_file = __DIR__ . '/parameters.yml';
	$params = Yaml::parse(file_get_contents($config_file));

    $host = $params['database']['host'];
    $name = $params['database']['name'];
    $user = $params['database']['user'];
    $pass = $params['database']['pass'];

    $dsn = "mysql:host=$host;dbname=$name;charset=utf8";

    $opts = [
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_OBJ
    ];

    try {
      return new PDO($dsn, $user, $pass, $opts);
    }
    catch(PDOException $e) {
        return $e;
        exit;
    }
}

function get_all_lists()
{
    $pdo = return_handler();
    $sql = "SELECT lists.*, users.us_email FROM lists INNER JOIN user_lists ON user_lists.ls_id = lists.ls_key INNER JOIN users ON user_lists.us_id = users.us_id ORDER BY lists.ls_stars DESC";
    $result = $pdo->query($sql)->fetchAll();
    foreach($result as $list){
        $list->ls_content = json_decode($list->ls_content);
    }
    $pdo = null;
    return $result;
}

function get_list_ids()
{
    $pdo = return_handler();
    $sql = "SELECT ls_id FROM lists";
    $result = $pdo->query($sql)->fetchAll(PDO::FETCH_COLUMN, 0);
    $pdo = null;
    return $result;
}

function get_list($list_id)
{
    $pdo = return_handler();
    $stmt = $pdo->prepare("SELECT * FROM lists WHERE ls_id = :list_id");
    $stmt->bindParam(':list_id', $list_id);
    $stmt->execute();

    $result = $stmt->fetchAll();
    foreach($result as $list){
        $list->ls_content = json_decode($list->ls_content);
    }
    $pdo = null;
    if (isset($result[0])) {
        return $result[0];
    } else {
        return false;
    } 
}

function get_user_lists($user_id)
{
    $pdo = return_handler();
    $stmt = $pdo->prepare("SELECT ls_id FROM user_lists WHERE us_id = :user_id");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    $pdo = null;
    if (isset($result)) {
        return $result;
    } else {
        return false;
    } 
}

function get_lists($user_id)
{
    $pdo = return_handler();
    $stmt = $pdo->prepare("SELECT lists.* FROM lists INNER JOIN user_lists ON user_lists.ls_id = lists.ls_key INNER JOIN users ON user_lists.us_id = users.us_id WHERE users.us_id = :user_id");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $result = $stmt->fetchAll();
    $pdo = null;
    if (isset($result)) {
        return $result;
    } else {
        return false;
    } 
}

function update_list($list_id, $list_name, $list_content)
{
    $pdo = return_handler();
    $stmt = $pdo->prepare("UPDATE lists SET ls_name = :list_name, ls_content = :list_content WHERE ls_id = :list_id");
    $stmt->bindParam(':list_id', $list_id);
    $stmt->bindParam(':list_name', $list_name);
    $stmt->bindParam(':list_content', $list_content);
    $stmt->execute();
    $pdo = null;
}

function create_new_list($list_id, $list_name, $list_content, $user_id)
{
    $pdo = return_handler();
    $add_list_stmt = $pdo->prepare("INSERT INTO lists VALUES (null, :list_id, :list_name, :list_content, :list_tags, :list_stars)");
    $add_list_stmt->bindParam(':list_id', $list_id);
    $add_list_stmt->bindParam(':list_name', $list_name);
    $add_list_stmt->bindParam(':list_content', $list_content);
    $add_list_stmt->bindValue(':list_tags', '');
    $add_list_stmt->bindValue(':list_stars', 0);
    $add_list_stmt->execute();
    $new_list_id = $pdo->lastInsertId();

    $add_list_record_stmt = $pdo->prepare("INSERT INTO user_lists VALUES (:list_id, :us_id)");
    $add_list_record_stmt->bindParam(':list_id', $new_list_id);
    $add_list_record_stmt->bindParam(':us_id', $user_id);
    $add_list_record_stmt->execute();

    $pdo = null;
    $_SESSION['user_lists'][] = $new_list_id;
    return $list_id;
}


/* Users */

function check_user($user_email)
{
    $pdo = return_handler();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE us_email = :user_email");
    $stmt->bindParam(':user_email', $user_email);
    $stmt->execute();

    $result = $stmt->fetchAll();
    $pdo = null;
    if (isset($result[0])) {
        return $result[0];
    } else {
        return false;
    } 
}

function activate_user($code)
{
    $pdo = return_handler();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE us_activation_hash = :code");
    $stmt->bindParam(':code', $code);
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (isset($result[0]['us_id'])) {
        $stmt = $pdo->prepare("UPDATE users SET us_status = 'active', us_activation_hash = '' WHERE us_activation_hash = :code");
        $stmt->bindParam(':code', $code);
        $stmt->execute();
        $pdo = null;
        return true;
    } else {
        $pdo = null;
        return false;
    }
}

function add_user($email, $password, $status, $hash)
{
    $pdo = return_handler();;
    $stmt = $pdo->prepare("INSERT INTO users VALUES (null, :password, :email, :status, :hash)");
    $stmt->bindParam(':password', $password);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':hash', $hash);
    $stmt->execute();
    $new_id = $pdo->lastInsertId(); //user id just created
    $pdo = null;
    return $new_id;
}

function store_cookie($user_id, $cookiehash)
{
    $pdo = return_handler();
    $stmt = $pdo->prepare("UPDATE users SET us_login_cookie = :cookie_hash WHERE us_id = :user_id");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':cookie_hash', $cookiehash);
    $stmt->execute();
    $pdo = null;
}

function get_user_by_cookie($cookie)
{
    $pdo = return_handler();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE us_login_cookie = :cookie");
    $stmt->bindParam(':cookie', $cookie);
    $stmt->execute();
    $result = $stmt->fetchAll();
    $pdo = null;
    if (isset($result[0])) {
        return $result[0];
    } else {
        return false;
    } 
}

/* Gear */

function get_gear()
{
    $pdo = return_handler();
    $sql = "SELECT * FROM gear";
    $result = $pdo->query($sql)->fetchAll();
    $pdo = null;
    if (isset($result)) {
        return $result;
    } else {
        return false;
    } 
}