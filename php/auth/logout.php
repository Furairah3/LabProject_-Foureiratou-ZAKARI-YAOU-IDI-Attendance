<?php
require_once '../middleware/auth.php';

header('Content-Type: application/json');

try {
    AuthMiddleware::logout();
    Helpers::successResponse('Logged out successfully');
} catch (Exception $e) {
    Helpers::errorResponse('Logout failed', 500);
}
?>