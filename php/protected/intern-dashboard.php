<?php
require_once '../middleware/auth.php';
AuthMiddleware::requireRole(['intern']);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'getInternData':
            getInternData();
            break;
        case 'getCourses':
            getInternCourses();
            break;
        case 'getSessions':
            getInternSessions();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'updateProfile':
            updateInternProfile();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
}

function getInternData() {
    try {
        $user = AuthMiddleware::getCurrentUser();
        $db = new Database();
        $conn = $db->connect();
        
        $sql = "SELECT u.user_id, u.first_name, u.last_name, u.email, u.dob,
                       i.assigned_department, i.start_date, i.end_date, d.department_name
                FROM users u 
                LEFT JOIN interns i ON u.user_id = i.intern_id 
                LEFT JOIN departments d ON i.assigned_department = d.department_id
                WHERE u.user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user['user_id']]);
        $internData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($internData) {
            echo json_encode(['success' => true, 'data' => $internData]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Intern data not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching intern data']);
    }
}

function getInternCourses() {
    try {
        $user = AuthMiddleware::getCurrentUser();
        $db = new Database();
        $conn = $db->connect();
        
        // Get courses from the intern's assigned department
        $sql = "SELECT c.course_id, c.course_code, c.course_name, 
                       CONCAT(u.first_name, ' ', u.last_name) as faculty_supervisor,
                       COUNT(DISTINCT csl.student_id) as total_students,
                       COUNT(DISTINCT s.session_id) as sessions_conducted
                FROM courses c
                JOIN faculty f ON c.faculty_id = f.faculty_id
                JOIN users u ON f.faculty_id = u.user_id
                LEFT JOIN course_student_list csl ON c.course_id = csl.course_id AND csl.status = 'enrolled'
                LEFT JOIN sessions s ON c.course_id = s.course_id
                WHERE c.department_id = (SELECT assigned_department FROM interns WHERE intern_id = ?)
                GROUP BY c.course_id";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user['user_id']]);
        $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $courses]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching courses']);
    }
}

function getInternSessions() {
    try {
        $user = AuthMiddleware::getCurrentUser();
        $db = new Database();
        $conn = $db->connect();
        
        $sql = "SELECT s.session_id, c.course_code, s.topic, s.date,
                       (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.session_id AND a.status = 'present') as attendance_count,
                       (SELECT COUNT(*) FROM course_student_list csl WHERE csl.course_id = c.course_id AND csl.status = 'enrolled') as total_students,
                       CASE 
                           WHEN s.date < CURDATE() THEN 'completed'
                           ELSE 'upcoming'
                       END as status
                FROM sessions s
                JOIN courses c ON s.course_id = c.course_id
                WHERE c.department_id = (SELECT assigned_department FROM interns WHERE intern_id = ?)
                ORDER BY s.date DESC
                LIMIT 10";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user['user_id']]);
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $sessions]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching sessions']);
    }
}

function updateInternProfile() {
    try {
        $user = AuthMiddleware::getCurrentUser();
        $data = json_decode(file_get_contents('php://input'), true);
        
        $db = new Database();
        $conn = $db->connect();
        
        // Update users table
        $userSql = "UPDATE users SET first_name = ?, last_name = ?, email = ?, dob = ? WHERE user_id = ?";
        $userStmt = $conn->prepare($userSql);
        $userStmt->execute([
            $data['first_name'],
            $data['last_name'],
            $data['email'],
            $data['dob'],
            $user['user_id']
        ]);
        
        // Update interns table
        $internSql = "UPDATE interns SET assigned_department = ?, start_date = ?, end_date = ? WHERE intern_id = ?";
        $internStmt = $conn->prepare($internSql);
        $internStmt->execute([
            $data['assigned_department'],
            $data['start_date'],
            $data['end_date'],
            $user['user_id']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error updating profile']);
    }
}
?>