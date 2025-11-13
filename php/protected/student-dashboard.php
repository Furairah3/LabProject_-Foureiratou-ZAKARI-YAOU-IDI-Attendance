<?php
require_once '../middleware/auth.php';
AuthMiddleware::requireRole(['student']);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'getStudentData':
            getStudentData();
            break;
        case 'getCourses':
            getStudentCourses();
            break;
        case 'getSessions':
            getStudentSessions();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'updateProfile':
            updateStudentProfile();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
}

function getStudentData() {
    try {
        $user = AuthMiddleware::getCurrentUser();
        $db = new Database();
        $conn = $db->connect();
        
        $sql = "SELECT u.user_id, u.first_name, u.last_name, u.email, u.dob, 
                       s.major_id, s.year_of_study, m.major_name
                FROM users u 
                LEFT JOIN students s ON u.user_id = s.student_id 
                LEFT JOIN majors m ON s.major_id = m.major_id
                WHERE u.user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user['user_id']]);
        $studentData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($studentData) {
            echo json_encode(['success' => true, 'data' => $studentData]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Student data not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching student data']);
    }
}

function getStudentCourses() {
    try {
        $user = AuthMiddleware::getCurrentUser();
        $db = new Database();
        $conn = $db->connect();
        
        $sql = "SELECT c.course_id, c.course_code, c.course_name, csl.status
                FROM course_student_list csl
                JOIN courses c ON csl.course_id = c.course_id
                WHERE csl.student_id = ? AND csl.status = 'enrolled'";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user['user_id']]);
        $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $courses]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching courses']);
    }
}

function getStudentSessions() {
    try {
        $user = AuthMiddleware::getCurrentUser();
        $db = new Database();
        $conn = $db->connect();
        
        $sql = "SELECT s.session_id, c.course_code, s.topic, s.date, s.start_time, s.end_time, s.location
                FROM sessions s
                JOIN courses c ON s.course_id = c.course_id
                JOIN course_student_list csl ON c.course_id = csl.course_id
                WHERE csl.student_id = ? AND s.date >= CURDATE()
                ORDER BY s.date, s.start_time";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user['user_id']]);
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format sessions for display
        $formattedSessions = [];
        foreach ($sessions as $session) {
            $formattedSessions[] = [
                'session_id' => $session['session_id'],
                'course_code' => $session['course_code'],
                'topic' => $session['topic'],
                'date' => $session['date'],
                'day' => date('l', strtotime($session['date'])),
                'time' => date('g:i A', strtotime($session['start_time'])),
                'location' => $session['location']
            ];
        }
        
        echo json_encode(['success' => true, 'data' => $formattedSessions]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching sessions']);
    }
}

function updateStudentProfile() {
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
        
        // Update students table
        $studentSql = "UPDATE students SET major_id = ?, year_of_study = ? WHERE student_id = ?";
        $studentStmt = $conn->prepare($studentSql);
        $studentStmt->execute([
            $data['major_id'],
            $data['year_of_study'],
            $user['user_id']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error updating profile']);
    }
}
?>