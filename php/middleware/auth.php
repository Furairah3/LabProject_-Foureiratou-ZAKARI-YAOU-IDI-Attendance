<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

session_start();

class AuthMiddleware {
    public static function isLoggedIn() {
        return isset($_SESSION['user_id']) && 
               isset($_SESSION['logged_in']) && 
               $_SESSION['logged_in'] === true &&
               isset($_SESSION['login_time']);
    }

    public static function requireAuth() {
        if (!self::isLoggedIn()) {
            Helpers::errorResponse('Authentication required', 401);
        }
        
        // Check session expiration (8 hours)
        $sessionTimeout = 8 * 60 * 60; // 8 hours in seconds
        if (time() - $_SESSION['login_time'] > $sessionTimeout) {
            self::logout();
            Helpers::errorResponse('Session expired. Please login again.', 401);
        }
        
        // Update session time on activity
        $_SESSION['login_time'] = time();
    }

    public static function redirectIfLoggedIn() {
        if (self::isLoggedIn()) {
            $role = $_SESSION['role'] ?? 'student';
            header('Location: ../html/' . $role . '-dashboard.html');
            exit;
        }
    }

    public static function getCurrentUser() {
        if (self::isLoggedIn()) {
            return [
                'user_id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'email' => $_SESSION['email'],
                'role' => $_SESSION['role']
            ];
        }
        return null;
    }

    public static function requireRole($allowedRoles) {
        self::requireAuth();
        
        if (!is_array($allowedRoles)) {
            $allowedRoles = [$allowedRoles];
        }
        
        $userRole = $_SESSION['role'] ?? '';
        
        if (!in_array($userRole, $allowedRoles)) {
            Helpers::logActivity($_SESSION['user_id'], 'unauthorized_access', 
                "Attempted to access role-restricted content. User role: $userRole, Required: " . implode(',', $allowedRoles));
            Helpers::errorResponse('Access denied. Insufficient permissions.', 403);
        }
    }

    public static function logout() {
        if (isset($_SESSION['user_id'])) {
            Helpers::logActivity($_SESSION['user_id'], 'logout');
        }
        
        $_SESSION = array();

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }

        session_destroy();
    }
}
?>