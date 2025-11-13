<?php
require_once '../middleware/auth.php';
AuthMiddleware::requireRole(['faculty']);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'getFacultyData':
            getFacultyData();
            break;
        case 'getCourses':
            getFacultyCourses();
            break;
        case 'getSessions':
            getFacultySessions();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'updateProfile':
            updateFacultyProfile();
            break;
        case 'createSession':
            createSession();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
}

function getFacultyData() {
    try {
        $user = AuthMiddleware::getCurrentUser();
        $db = new Database();
        $conn = $db->connect();
        
        $sql = "SELECT u.user_id, u.first_name, u.last_name, u.email, u.dob,
                       f.department_id, f.designation, d.department_name
                FROM users u 
                LEFT JOIN faculty f ON u.user_id = f.faculty_id 
                LEFT JOIN departments d ON f.department_id = d.department_id
                WHERE u.user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user['user_id']]);
        $facultyData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($facultyData) {
            echo json_encode(['success' => true, 'data' => $facultyData]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Faculty data not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching faculty data']);
    }
}

function getFacultyCourses() {
    try {
        $user = AuthMiddleware::getCurrentUser();
        $db = new Database();
        $conn = $db->connect();
        
        $sql = "SELECT c.course_id, c.course_code, c.course_name, 
                       COUNT(DISTINCT csl.student_id) as enrolled_students,
                       COUNT(DISTINCT s.session_id) as total_sessions
                FROM courses c
                LEFT JOIN course_student_list csl ON c.course_id = csl.course_id AND csl.status = 'enrolled'
                LEFT JOIN sessions s ON c.course_id = s.course_id
                WHERE c.faculty_id = ?
                GROUP BY c.course_id";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user['user_id']]);
        $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $courses]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching courses']);
    }
}

function getFacultySessions() {
    try {
        $user = AuthMiddleware::getCurrentUser();
        $db = new Database();
        $conn = $db->connect();
        
        $sql = "SELECT s.session_id, c.course_code, s.topic, s.date, s.start_time, s.end_time, s.location,
                       (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.session_id AND a.status = 'present') as present_count,
                       (SELECT COUNT(*) FROM course_student_list csl WHERE csl.course_id = c.course_id AND csl.status = 'enrolled') as total_students
                FROM sessions s
                JOIN courses c ON s.course_id = c.course_id
                WHERE c.faculty_id = ? AND s.date >= CURDATE()
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
                'start_time' => $session['start_time'],
                'end_time' => $session['end_time'],
                'location' => $session['location'],
                'attendance' => $session['present_count'] . '/' . $session['total_students']
            ];
        }
        
        echo json_encode(['success' => true, 'data' => $formattedSessions]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching sessions']);
    }
}

function updateFacultyProfile() {
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
        
        // Update faculty table
        $facultySql = "UPDATE faculty SET department_id = ?, designation = ? WHERE faculty_id = ?";
        $facultyStmt = $conn->prepare($facultySql);
        $facultyStmt->execute([
            $data['department_id'],
            $data['designation'],
            $user['user_id']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error updating profile']);
    }
}

function createSession() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $db = new Database();
        $conn = $db->connect();
        
        $sql = "INSERT INTO sessions (course_id, topic, date, start_time, end_time, location) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data['course_id'],
            $data['topic'],
            $data['date'],
            $data['start_time'],
            $data['end_time'],
            $data['location']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Session created successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error creating session']);
    }
}
?>