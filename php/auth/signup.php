<?php
require_once '../config/database.php';
require_once '../utils/helpers.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Helpers::errorResponse('Invalid request method', 405);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    Helpers::errorResponse('Invalid JSON data', 400);
}

try {
    $db = new Database();
    $conn = $db->connect();

    // Validate required fields
    $required = ['first_name', 'last_name', 'email', 'password', 'user_id', 'dob', 'role'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            Helpers::errorResponse("$field is required", 400);
        }
    }

    // Sanitize inputs
    $data = Helpers::sanitizeInput($data);

    // Validate email format
    if (!Helpers::isValidEmail($data['email'])) {
        Helpers::errorResponse('Invalid email format', 400);
    }

    // Validate date of birth
    if (!Helpers::isValidDate($data['dob']) || !Helpers::isMinimumAge($data['dob'])) {
        Helpers::errorResponse('You must be at least 16 years old', 400);
    }

    // Validate user ID (numeric)
    if (!is_numeric($data['user_id']) || $data['user_id'] <= 0) {
        Helpers::errorResponse('User ID must be a positive number', 400);
    }

    // Check if email already exists
    $checkEmail = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
    $checkEmail->execute([$data['email']]);
    if ($checkEmail->fetch()) {
        Helpers::errorResponse('Email already registered', 409);
    }

    // Check if user_id already exists
    $checkUserId = $conn->prepare("SELECT user_id FROM users WHERE user_id = ?");
    $checkUserId->execute([$data['user_id']]);
    if ($checkUserId->fetch()) {
        Helpers::errorResponse('User ID already exists', 409);
    }

    // Validate role
    $validRoles = ['student', 'faculty', 'intern'];
    if (!in_array($data['role'], $validRoles)) {
        Helpers::errorResponse('Invalid role', 400);
    }

    // Validate password strength
    $passwordStrength = Helpers::checkPasswordStrength($data['password']);
    if ($passwordStrength < 3) {
        Helpers::errorResponse('Password is too weak. Please include uppercase, lowercase, numbers, and special characters.', 400);
    }

    // Hash password
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

    // Start transaction
    $conn->beginTransaction();

    // Insert into users table
    $userSql = "INSERT INTO users (user_id, first_name, last_name, email, password_hash, role, dob) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
    $userStmt = $conn->prepare($userSql);
    $userStmt->execute([
        intval($data['user_id']),
        $data['first_name'],
        $data['last_name'],
        $data['email'],
        $hashedPassword,
        $data['role'],
        $data['dob']
    ]);

    // Insert role-specific data
    if ($data['role'] === 'student') {
        if (empty($data['major_id']) || empty($data['year_of_study'])) {
            throw new Exception('Major and year of study are required for students');
        }
        $studentSql = "INSERT INTO students (student_id, major_id, year_of_study) VALUES (?, ?, ?)";
        $studentStmt = $conn->prepare($studentSql);
        $studentStmt->execute([
            intval($data['user_id']),
            intval($data['major_id']),
            intval($data['year_of_study'])
        ]);
    } elseif ($data['role'] === 'faculty') {
        if (empty($data['department_id']) || empty($data['designation'])) {
            throw new Exception('Department and designation are required for faculty');
        }
        $facultySql = "INSERT INTO faculty (faculty_id, department_id, designation) VALUES (?, ?, ?)";
        $facultyStmt = $conn->prepare($facultySql);
        $facultyStmt->execute([
            intval($data['user_id']),
            intval($data['department_id']),
            $data['designation']
        ]);
    } elseif ($data['role'] === 'intern') {
        if (empty($data['assigned_department']) || empty($data['start_date']) || empty($data['end_date'])) {
            throw new Exception('Assigned department, start date, and end date are required for interns');
        }
        $internSql = "INSERT INTO interns (intern_id, assigned_department, start_date, end_date) VALUES (?, ?, ?, ?)";
        $internStmt = $conn->prepare($internSql);
        $internStmt->execute([
            intval($data['user_id']),
            intval($data['assigned_department']),
            $data['start_date'],
            $data['end_date']
        ]);
    }

    $conn->commit();
    
    // Log the registration
    Helpers::logActivity($data['user_id'], 'registration', "New {$data['role']} account created");
    
    Helpers::successResponse('Registration successful');

} catch (PDOException $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    error_log("Database error in signup: " . $e->getMessage());
    Helpers::errorResponse('Database error occurred', 500);
} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    Helpers::errorResponse($e->getMessage(), 400);
}
?>