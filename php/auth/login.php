<?php
require_once '../config/database.php';
require_once '../utils/helpers.php';

session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Helpers::errorResponse('Invalid request method', 405);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['email']) || !isset($data['password'])) {
    Helpers::errorResponse('Email and password are required', 400);
}

try {
    $db = new Database();
    $conn = $db->connect();

    // Sanitize inputs
    $email = Helpers::sanitizeInput($data['email']);
    $password = $data['password'];

    $sql = "SELECT u.user_id, u.first_name, u.last_name, u.email, u.password_hash, u.role 
            FROM users u 
            WHERE u.email = ? AND u.user_id IS NOT NULL";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password_hash'])) {
        // Regenerate session ID for security
        session_regenerate_id(true);
        
        // Set session variables
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['first_name'] . ' ' . $user['last_name'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
        $_SESSION['csrf_token'] = Helpers::generateCSRFToken();

        // Log successful login
        Helpers::logActivity($user['user_id'], 'login_success');

        Helpers::successResponse('Login successful', [
            'username' => $user['first_name'] . ' ' . $user['last_name'],
            'user_id' => $user['user_id'],
            'role' => $user['role']
        ]);
    } else {
        // Log failed login attempt
        if ($user) {
            Helpers::logActivity($user['user_id'], 'login_failed', 'Invalid password');
        } else {
            error_log("Failed login attempt for email: $email");
        }
        
        Helpers::errorResponse('Invalid email or password', 401);
    }

} catch (PDOException $e) {
    error_log("Database error in login: " . $e->getMessage());
    Helpers::errorResponse('Database error occurred', 500);
}
?>