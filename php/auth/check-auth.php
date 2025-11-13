<?php
require_once '../middleware/auth.php';

header('Content-Type: application/json');

if (AuthMiddleware::isLoggedIn()) {
    $user = AuthMiddleware::getCurrentUser();
    Helpers::successResponse('User is authenticated', ['user' => $user]);
} else {
    Helpers::errorResponse('Not authenticated', 401);
}
?>