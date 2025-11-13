<?php
class Helpers {
    
    /**
     * Sanitize input data
     */
    public static function sanitizeInput($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeInput'], $data);
        }
        
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
        return $data;
    }
    
    /**
     * Validate email format
     */
    public static function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Validate date format (YYYY-MM-DD)
     */
    public static function isValidDate($date) {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $d = DateTime::createFromFormat('Y-m-d', $date);
            return $d && $d->format('Y-m-d') === $date;
        }
        return false;
    }
    
    /**
     * Validate time format (HH:MM)
     */
    public static function isValidTime($time) {
        return preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $time);
    }
    
    /**
     * Check if user is at least minimum age
     */
    public static function isMinimumAge($dob, $minAge = 16) {
        $birthDate = new DateTime($dob);
        $today = new DateTime();
        $age = $today->diff($birthDate)->y;
        return $age >= $minAge;
    }
    
    /**
     * Format date for display
     */
    public static function formatDate($dateString, $format = 'F j, Y') {
        $date = new DateTime($dateString);
        return $date->format($format);
    }
    
    /**
     * Format time for display
     */
    public static function formatTime($timeString, $format = 'g:i A') {
        $time = DateTime::createFromFormat('H:i', $timeString);
        return $time ? $time->format($format) : $timeString;
    }
    
    /**
     * Generate random password
     */
    public static function generateRandomPassword($length = 12) {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
        $password = '';
        for ($i = 0; $i < $length; $i++) {
            $password .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $password;
    }
    
    /**
     * Check password strength
     */
    public static function checkPasswordStrength($password) {
        $strength = 0;
        
        // Length check
        if (strlen($password) >= 8) $strength++;
        
        // Uppercase check
        if (preg_match('/[A-Z]/', $password)) $strength++;
        
        // Lowercase check
        if (preg_match('/[a-z]/', $password)) $strength++;
        
        // Number check
        if (preg_match('/[0-9]/', $password)) $strength++;
        
        // Special character check
        if (preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) $strength++;
        
        return $strength;
    }
    
    /**
     * Log activity
     */
    public static function logActivity($userId, $action, $details = '') {
        try {
            $db = new Database();
            $conn = $db->connect();
            
            $sql = "INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent) 
                    VALUES (?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $userId,
                $action,
                $details,
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]);
        } catch (Exception $e) {
            // Silently fail logging - don't break the application
            error_log("Activity logging failed: " . $e->getMessage());
        }
    }
    
    /**
     * Send email notification
     */
    public static function sendEmail($to, $subject, $message) {
        // In a real application, you would use PHPMailer or similar
        $headers = "From: attendance-system@yourdomain.com\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        
        return mail($to, $subject, $message, $headers);
    }
    
    /**
     * Get client IP address
     */
    public static function getClientIP() {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            return $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        }
    }
    
    /**
     * Check if request is AJAX
     */
    public static function isAjaxRequest() {
        return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }
    
    /**
     * JSON response helper
     */
    public static function jsonResponse($success, $message = '', $data = []) {
        header('Content-Type: application/json');
        $response = ['success' => $success];
        
        if ($message) {
            $response['message'] = $message;
        }
        
        if (!empty($data)) {
            $response['data'] = $data;
        }
        
        echo json_encode($response);
        exit;
    }
    
    /**
     * Error response helper
     */
    public static function errorResponse($message, $code = 400) {
        http_response_code($code);
        self::jsonResponse(false, $message);
    }
    
    /**
     * Success response helper
     */
    public static function successResponse($message = '', $data = []) {
        self::jsonResponse(true, $message, $data);
    }
    
    /**
     * Generate CSRF token
     */
    public static function generateCSRFToken() {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    /**
     * Validate CSRF token
     */
    public static function validateCSRFToken($token) {
        return isset($_SESSION['csrf_token']) && 
               hash_equals($_SESSION['csrf_token'], $token);
    }
    
    /**
     * Calculate attendance percentage
     */
    public static function calculateAttendancePercentage($present, $total) {
        if ($total === 0) return 0;
        return round(($present / $total) * 100, 2);
    }
    
    /**
     * Get academic year
     */
    public static function getAcademicYear() {
        $month = date('n');
        $year = date('Y');
        
        // Assuming academic year runs from September to August
        if ($month >= 9) {
            return $year . '-' . ($year + 1);
        } else {
            return ($year - 1) . '-' . $year;
        }
    }
    
    /**
     * Format file size
     */
    public static function formatFileSize($bytes) {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
?>