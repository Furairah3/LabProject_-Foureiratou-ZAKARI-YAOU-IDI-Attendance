class FacultyInternDashboard {
    constructor() {
        this.currentIntern = null;
        this.init();
    }

    async init() {
        await this.checkAuthentication();
        this.setupNavigation();
        this.setupEventListeners();
        await this.loadInternData();
        await this.loadCourses();
        await this.loadSessions();
        this.setupDateValidation();
    }

    async checkAuthentication() {
        try {
            const response = await fetch('../php/auth/check-auth.php');
            const result = await response.json();
            
            if (!result.success) {
                window.location.href = 'login.html';
                return;
            }
            
            if (result.user.role !== 'intern') {
                this.redirectToRoleDashboard(result.user.role);
                return;
            }
            
        } catch (error) {
            console.error('Authentication check failed:', error);
            window.location.href = 'login.html';
        }
    }

    redirectToRoleDashboard(role) {
        const dashboardRoutes = {
            student: 'student-dashboard.html',
            faculty: 'faculty-dashboard.html',
            intern: 'intern-dashboard.html'
        };
        window.location.href = dashboardRoutes[role];
    }

    async loadInternData() {
        try {
            const response = await fetch('../php/protected/intern-dashboard.php?action=getInternData');
            const result = await response.json();
            
            if (result.success) {
                this.currentIntern = result.data;
                this.updateInternInfo();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error loading intern data:', error);
            // Fallback to mock data
            this.currentIntern = {
                intern_id: 'I12345',
                first_name: 'Alex',
                last_name: 'Thompson',
                email: 'alex.thompson@university.edu',
                dob: '1998-03-15',
                assigned_department: 1,
                department_name: 'Computer Science',
                start_date: '2024-09-01',
                end_date: '2024-12-15'
            };
            this.updateInternInfo();
        }
    }

    updateInternInfo() {
        document.getElementById('internName').textContent = 
            `${this.currentIntern.first_name} ${this.currentIntern.last_name}`;
        document.getElementById('internId').textContent = this.currentIntern.intern_id;
        document.getElementById('internDepartment').textContent = this.currentIntern.department_name;
        document.getElementById('internPeriod').textContent = 
            `${this.formatDate(this.currentIntern.start_date)} to ${this.formatDate(this.currentIntern.end_date)}`;

        // Update profile form
        document.getElementById('profileFirstName').value = this.currentIntern.first_name;
        document.getElementById('profileLastName').value = this.currentIntern.last_name;
        document.getElementById('profileEmail').value = this.currentIntern.email;
        document.getElementById('profileDob').value = this.currentIntern.dob;
        document.getElementById('profileStartDate').value = this.currentIntern.start_date;
        document.getElementById('profileEndDate').value = this.currentIntern.end_date;
        
        // Populate department dropdown
        this.populateDepartmentDropdown();
    }

    populateDepartmentDropdown() {
        const departments = [
            { department_id: 1, department_name: 'Computer Science' },
            { department_id: 2, department_name: 'Mathematics' },
            { department_id: 3, department_name: 'Physics' },
            { department_id: 4, department_name: 'Engineering' }
        ];

        const departmentSelect = document.getElementById('profileDepartment');
        departmentSelect.innerHTML = '<option value="">Select department</option>';
        
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.department_id;
            option.textContent = dept.department_name;
            if (dept.department_id === this.currentIntern.assigned_department) {
                option.selected = true;
            }
            departmentSelect.appendChild(option);
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.id !== 'logoutBtn') {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetPage = link.getAttribute('data-page');
                    this.showSection(targetPage);
                    
                    // Update active state
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                });
            }
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
    }

    setupEventListeners() {
        // Sessions section
        document.getElementById('viewSessionsBtn').addEventListener('click', () => {
            this.viewAllSessions();
        });

        document.getElementById('takeAttendanceBtn').addEventListener('click', () => {
            this.takeAttendance();
        });

        // Reports section
        document.getElementById('viewAllReportsBtn').addEventListener('click', () => {
            this.viewAllReports();
        });

        document.getElementById('studentManagementBtn').addEventListener('click', () => {
            this.manageStudents();
        });

        document.getElementById('generateAttendanceReportBtn').addEventListener('click', () => {
            this.generateAttendanceReport();
        });

        // Profile form submission
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    setupDateValidation() {
        const startDateInput = document.getElementById('profileStartDate');
        const endDateInput = document.getElementById('profileEndDate');

        endDateInput.addEventListener('change', () => {
            this.validateDateRange(startDateInput, endDateInput);
        });

        startDateInput.addEventListener('change', () => {
            this.validateDateRange(startDateInput, endDateInput);
        });
    }

    validateDateRange(startInput, endInput) {
        const startDate = new Date(startInput.value);
        const endDate = new Date(endInput.value);

        if (startDate && endDate && startDate > endDate) {
            alert('End date cannot be before start date');
            endInput.value = '';
            endInput.focus();
            return false;
        }
        return true;
    }

    async loadCourses() {
        try {
            const response = await fetch('../php/protected/intern-dashboard.php?action=getCourses');
            const result = await response.json();
            
            let courses = [];
            if (result.success) {
                courses = result.data;
            } else {
                // Fallback to mock data
                courses = [
                    { 
                        course_id: 1, 
                        course_code: 'CS 301', 
                        course_name: 'Web Technology',
                        faculty_supervisor: 'Dr. Sarah Johnson',
                        total_students: 45,
                        sessions_conducted: 8
                    },
                    { 
                        course_id: 2, 
                        course_code: 'CS 401', 
                        course_name: 'Hardware and System Fundamentals',
                        faculty_supervisor: 'Prof. Michael Chen',
                        total_students: 32,
                        sessions_conducted: 6
                    }
                ];
            }

            this.displayCourses(courses);
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    }

    displayCourses(courses) {
        const container = document.getElementById('coursesContainer');
        container.innerHTML = '';

        if (courses.length === 0) {
            container.innerHTML = '<div class="course-item"><p>No courses assigned.</p></div>';
            return;
        }

        courses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.className = 'course-item';
            courseElement.innerHTML = `
                <h3>${course.course_code} - ${course.course_name}</h3>
                <div class="course-details">
                    <p><strong>Faculty Supervisor:</strong> ${course.faculty_supervisor}</p>
                    <p><strong>Total Students:</strong> ${course.total_students}</p>
                    <p><strong>Sessions Conducted:</strong> ${course.sessions_conducted}</p>
                </div>
                <div class="course-actions">
                    <button class="action-btn small view-course-btn" data-course-id="${course.course_id}">
                        View Course
                    </button>
                    <button class="action-btn small manage-attendance-btn" data-course-id="${course.course_id}">
                        Manage Attendance
                    </button>
                </div>
            `;
            container.appendChild(courseElement);
        });

        // Add event listeners to course buttons
        document.querySelectorAll('.view-course-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = e.target.getAttribute('data-course-id');
                this.viewCourseDetails(courseId);
            });
        });

        document.querySelectorAll('.manage-attendance-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = e.target.getAttribute('data-course-id');
                this.manageCourseAttendance(courseId);
            });
        });
    }

    async loadSessions() {
        try {
            const response = await fetch('../php/protected/intern-dashboard.php?action=getSessions');
            const result = await response.json();
            
            let sessions = [];
            if (result.success) {
                sessions = result.data;
            } else {
                // Fallback to mock data
                sessions = [
                    {
                        session_id: 1,
                        course_code: 'CS 301',
                        topic: 'Introduction to HTML & CSS',
                        date: '2024-10-07',
                        attendance_count: 42,
                        total_students: 45,
                        status: 'completed'
                    },
                    {
                        session_id: 2,
                        course_code: 'CS 301',
                        topic: 'CSS Frameworks and Responsive Design',
                        date: '2024-10-14',
                        attendance_count: 40,
                        total_students: 45,
                        status: 'completed'
                    },
                    {
                        session_id: 3,
                        course_code: 'CS 401',
                        topic: 'Computer Architecture Basics',
                        date: '2024-10-09',
                        attendance_count: 30,
                        total_students: 32,
                        status: 'completed'
                    },
                    {
                        session_id: 4,
                        course_code: 'CS 301',
                        topic: 'JavaScript Fundamentals',
                        date: '2024-10-21',
                        attendance_count: null,
                        total_students: 45,
                        status: 'upcoming'
                    }
                ];
            }

            this.displaySessions(sessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    displaySessions(sessions) {
        const tableBody = document.getElementById('sessionsTableBody');
        tableBody.innerHTML = '';

        if (sessions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">No sessions found.</td></tr>';
            return;
        }

        sessions.forEach(session => {
            const row = document.createElement('tr');
            const attendanceText = session.attendance_count !== null ? 
                `${session.attendance_count}/${session.total_students}` : 'Not taken';
            
            const statusBadge = session.status === 'completed' ? 
                '<span class="status-completed">Completed</span>' : 
                '<span class="status-upcoming">Upcoming</span>';

            row.innerHTML = `
                <td>${this.formatDate(session.date)} ${statusBadge}</td>
                <td>${session.course_code}</td>
                <td>${session.topic}</td>
                <td>${attendanceText}</td>
                <td>
                    <button class="action-btn small view-session-btn" data-session-id="${session.session_id}">
                        View
                    </button>
                    ${session.status === 'upcoming' ? 
                        `<button class="action-btn small take-session-attendance-btn" data-session-id="${session.session_id}">
                            Take Attendance
                        </button>` : 
                        `<button class="action-btn small view-attendance-btn" data-session-id="${session.session_id}">
                            View Attendance
                        </button>`
                    }
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Add event listeners to session buttons
        document.querySelectorAll('.view-session-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sessionId = e.target.getAttribute('data-session-id');
                this.viewSessionDetails(sessionId);
            });
        });

        document.querySelectorAll('.take-session-attendance-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sessionId = e.target.getAttribute('data-session-id');
                this.takeSessionAttendance(sessionId);
            });
        });
    }

    viewAllSessions() {
        this.loadSessions();
        alert('Displaying all sessions');
    }

    takeAttendance() {
        const activeSessions = this.getActiveSessions();
        
        if (activeSessions.length > 0) {
            if (activeSessions.length === 1) {
                this.takeSessionAttendance(activeSessions[0].session_id);
            } else {
                this.showSessionSelectionModal(activeSessions);
            }
        } else {
            alert('No active sessions available for attendance at the moment.');
        }
    }

    getActiveSessions() {
        // In real app, this would fetch active sessions from API
        return [
            {
                session_id: 4,
                course_code: 'CS 301',
                topic: 'JavaScript Fundamentals',
                date: '2024-10-21'
            }
        ];
    }

    takeSessionAttendance(sessionId) {
        alert(`Taking attendance for session ID: ${sessionId}`);
        // Here you would typically redirect to attendance interface or show modal
    }

    viewSessionDetails(sessionId) {
        alert(`Viewing details for session ID: ${sessionId}`);
    }

    viewAllReports() {
        const reportsContainer = document.getElementById('reportsContainer');
        const studentContainer = document.getElementById('studentManagementContainer');
        
        studentContainer.style.display = 'none';
        reportsContainer.style.display = 'block';

        // Mock reports data
        const reports = [
            { 
                report_id: 1, 
                title: 'Monthly Attendance Summary - October 2024', 
                generated_date: '2024-10-25',
                type: 'summary'
            },
            { 
                report_id: 2, 
                title: 'CS 301 - Student Performance Analysis', 
                generated_date: '2024-10-20',
                type: 'course'
            },
            { 
                report_id: 3, 
                title: 'Attendance Trends - Fall 2024', 
                generated_date: '2024-10-15',
                type: 'trend'
            }
        ];

        reportsContainer.innerHTML = this.generateReportsList(reports);
    }

    generateReportsList(reports) {
        let html = '<div class="reports-list">';
        html += '<h3>Available Reports</h3>';
        
        reports.forEach(report => {
            html += `
                <div class="report-item">
                    <div class="report-info">
                        <h4>${report.title}</h4>
                        <p>Generated: ${this.formatDate(report.generated_date)}</p>
                        <span class="report-type ${report.type}">${report.type}</span>
                    </div>
                    <div class="report-actions">
                        <button class="action-btn small view-report-btn" data-report-id="${report.report_id}">
                            View
                        </button>
                        <button class="action-btn small download-report-btn" data-report-id="${report.report_id}">
                            Download
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    manageStudents() {
        const reportsContainer = document.getElementById('reportsContainer');
        const studentContainer = document.getElementById('studentManagementContainer');
        
        reportsContainer.style.display = 'none';
        studentContainer.style.display = 'block';

        // Mock student data
        const students = [
            {
                student_id: 'S1001',
                name: 'John Doe',
                email: 'john.doe@student.edu',
                course: 'CS 301',
                attendance_rate: '93%',
                status: 'active'
            },
            {
                student_id: 'S1002',
                name: 'Jane Smith',
                email: 'jane.smith@student.edu',
                course: 'CS 301',
                attendance_rate: '87%',
                status: 'active'
            },
            {
                student_id: 'S1003',
                name: 'Mike Johnson',
                email: 'mike.johnson@student.edu',
                course: 'CS 401',
                attendance_rate: '78%',
                status: 'warning'
            }
        ];

        studentContainer.innerHTML = this.generateStudentManagementTable(students);
    }

    generateStudentManagementTable(students) {
        let html = '<div class="student-management">';
        html += '<h3>Student Management</h3>';
        html += '<div class="management-controls">';
        html += '<input type="text" id="studentSearch" placeholder="Search students..." class="search-input">';
        html += '<select id="courseFilter" class="filter-select">';
        html += '<option value="">All Courses</option>';
        html += '<option value="CS 301">CS 301</option>';
        html += '<option value="CS 401">CS 401</option>';
        html += '</select>';
        html += '</div>';
        html += '<table class="student-table">';
        html += '<thead><tr><th>Student ID</th><th>Name</th><th>Email</th><th>Course</th><th>Attendance</th><th>Status</th><th>Actions</th></tr></thead>';
        html += '<tbody>';
        
        students.forEach(student => {
            const statusClass = student.status === 'warning' ? 'status-warning' : 'status-active';
            html += `
                <tr>
                    <td>${student.student_id}</td>
                    <td>${student.name}</td>
                    <td>${student.email}</td>
                    <td>${student.course}</td>
                    <td>${student.attendance_rate}</td>
                    <td><span class="${statusClass}">${student.status}</span></td>
                    <td>
                        <button class="action-btn small view-student-btn" data-student-id="${student.student_id}">
                            View
                        </button>
                        <button class="action-btn small contact-student-btn" data-student-id="${student.student_id}">
                            Contact
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        return html;
    }

    generateAttendanceReport() {
        alert('Generating comprehensive attendance report...');
        
        // Show loading state
        const generateBtn = document.getElementById('generateAttendanceReportBtn');
        const originalText = generateBtn.textContent;
        generateBtn.textContent = 'Generating...';
        generateBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            generateBtn.textContent = originalText;
            generateBtn.disabled = false;
            
            // Show report
            this.viewAllReports();
            alert('Attendance report generated successfully!');
        }, 2000);
    }

    viewCourseDetails(courseId) {
        alert(`Viewing details for course ID: ${courseId}`);
    }

    manageCourseAttendance(courseId) {
        alert(`Managing attendance for course ID: ${courseId}`);
    }

    async updateProfile() {
        const formData = new FormData(document.getElementById('profileForm'));
        const profileData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            dob: formData.get('dob'),
            assigned_department: formData.get('assigned_department'),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date')
        };

        if (this.validateProfile(profileData)) {
            try {
                const response = await fetch('../php/protected/intern-dashboard.php?action=updateProfile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(profileData)
                });

                const result = await response.json();
                
                if (result.success) {
                    alert('Profile updated successfully!');
                    this.currentIntern = { ...this.currentIntern, ...profileData };
                    this.updateInternInfo();
                } else {
                    alert('Failed to update profile: ' + result.message);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Error updating profile. Please try again.');
            }
        }
    }

    validateProfile(data) {
        const errors = [];

        if (!data.first_name.trim()) {
            errors.push('First name is required');
        }

        if (!data.last_name.trim()) {
            errors.push('Last name is required');
        }

        if (!this.isValidEmail(data.email)) {
            errors.push('Valid email is required');
        }

        if (!data.dob) {
            errors.push('Date of birth is required');
        }

        if (!data.assigned_department) {
            errors.push('Assigned department is required');
        }

        if (!data.start_date) {
            errors.push('Start date is required');
        }

        if (!data.end_date) {
            errors.push('End date is required');
        }

        if (data.start_date && data.end_date) {
            const startDate = new Date(data.start_date);
            const endDate = new Date(data.end_date);
            if (startDate > endDate) {
                errors.push('End date cannot be before start date');
            }
        }

        if (errors.length > 0) {
            alert('Please fix the following errors:\n' + errors.join('\n'));
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async logout() {
        try {
            const response = await fetch('../php/auth/logout.php');
            const result = await response.json();
            
            if (result.success) {
                window.location.href = 'login.html';
            } else {
                alert('Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error during logout. Please try again.');
        }
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FacultyInternDashboard();
});