-- USERS TABLE
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'faculty', 'admin', 'intern') NOT NULL,
    dob DATE
);

-- STUDENTS TABLE
CREATE TABLE students (
    student_id INT PRIMARY KEY,  -- references user_id
    major_id INT,
    year_of_study INT,
    gpa DECIMAL(3,2),
    FOREIGN KEY (student_id) REFERENCES users(user_id)
);

-- FACULTY TABLE
CREATE TABLE faculty (
    faculty_id INT PRIMARY KEY,  -- references user_id
    department_id INT,
    designation VARCHAR(100),
    FOREIGN KEY (faculty_id) REFERENCES users(user_id)
);

-- DEPARTMENT TABLE
CREATE TABLE departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(150) NOT NULL,
    building_location VARCHAR(150),
    head_id INT,  -- FK to faculty
    FOREIGN KEY (head_id) REFERENCES faculty(faculty_id)
);

-- MAJOR TABLE
CREATE TABLE majors (
    major_id INT PRIMARY KEY AUTO_INCREMENT,
    major_name VARCHAR(150) NOT NULL,
    duration INT,  -- in years
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- INTERNS TABLE
CREATE TABLE interns (
    intern_id INT PRIMARY KEY,  -- references user_id
    start_date DATE,
    end_date DATE,
    assigned_department INT,
    FOREIGN KEY (intern_id) REFERENCES users(user_id),
    FOREIGN KEY (assigned_department) REFERENCES departments(department_id)
);

-- COURSES TABLE
CREATE TABLE courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) UNIQUE,
    course_name VARCHAR(150) NOT NULL,
    description TEXT,
    credit_hours INT,
    department_id INT,
    faculty_id INT NOT NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- COURSE-STUDENT ENROLLMENT TABLE
CREATE TABLE course_student_list (
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('enrolled', 'pending', 'dropped') DEFAULT 'enrolled',
    PRIMARY KEY (course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- SESSIONS TABLE
CREATE TABLE sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    topic VARCHAR(150),
    location VARCHAR(100),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    date DATE NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    CHECK (end_time > start_time)
);

-- ATTENDANCE TABLE
CREATE TABLE attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    check_in_time TIME,
    remarks TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- PARTICIPATION TABLE (optional: track class participation)
CREATE TABLE participation (
    participation_id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    score INT DEFAULT 0,
    remarks TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);
