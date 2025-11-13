class FacultyDashboard {
    constructor() {
        this.currentFaculty = null;
        this.init();
    }

    async init() {
        await this.checkAuthentication();
        this.setupNavigation();
        this.setupEventListeners();
        await this.loadFacultyData();
        await this.loadCourses();
        await this.loadSessions();
    }

    async checkAuthentication() {
        try {
            const response = await fetch('../php/auth/check-auth.php');
            const result = await response.json();
            
            if (!result.success) {
                window.location.href = 'login.html';
                return;
            }
            
            if (result.user.role !== 'faculty') {
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

    async loadFacultyData() {
        try {
            const response = await fetch('../php/protected/faculty-dashboard.php?action=getFacultyData');
            const result = await response.json();
            
            if (result.success) {
                this.currentFaculty = result.data;
                this.updateFacultyInfo();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error loading faculty data:', error);
            // Fallback to mock data
            this.currentFaculty = {
                faculty_id: 'F12345',
                first_name: 'Sarah',
                last_name: 'Johnson',
                email: 'sarah.johnson@university.edu',
                dob: '1975-08-20',
                department_id: 1,
                department_name: 'Computer Science',
                designation: 'Associate Professor'
            };
            this.updateFacultyInfo();
        }
    }

    updateFacultyInfo() {
        document.getElementById('facultyName').textContent = 
            `${this.currentFaculty.first_name} ${this.currentFaculty.last_name}`;
        document.getElementById('facultyId').textContent = this.currentFaculty.faculty_id;
        document.getElementById('facultyDepartment').textContent = this.currentFaculty.department_name;
        document.getElementById('facultyDesignation').textContent = this.currentFaculty.designation;

        // Update profile form
        document.getElementById('profileFirstName').value = this.currentFaculty.first_name;
        document.getElementById('profileLastName').value = this.currentFaculty.last_name;
        document.getElementById('profileEmail').value = this.currentFaculty.email;
        document.getElementById('profileDob').value = this.currentFaculty.dob;
        document.getElementById('profileDesignation').value = this.currentFaculty.designation;
        
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
            if (dept.department_id === this.currentFaculty.department_id) {
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
        // Session management
        document.getElementById('createSessionBtn').addEventListener('click', () => {
            this.toggleSessionForm();
        });

        document.getElementById('cancelSessionBtn').addEventListener('click', () => {
            this.toggleSessionForm();
        });

        document.getElementById('takeAttendanceBtn').addEventListener('click', () => {
            this.takeAttendance();
        });

        // Session form submission
        document.getElementById('sessionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createSession();
        });

        // Reports
        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.generateReport();
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

    async loadCourses() {
        try {
            const response = await fetch('../php/protected/faculty-dashboard.php?action=getCourses');
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
                        enrolled_students: 45,
                        total_sessions: 15
                    },
                    { 
                        course_id: 2, 
                        course_code: 'CS 401', 
                        course_name: 'Advanced Web Development',
                        enrolled_students: 32,
                        total_sessions: 12
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
                <p>Enrolled Students: ${course.enrolled_students}</p>
                <p>Total Sessions: ${course.total_sessions}</p>
                <div class="course-actions">
                    <button class="action-btn small view-course-btn" data-course-id="${course.course_id}">
                        View Details
                    </button>
                    <button class="action-btn small manage-students-btn" data-course-id="${course.course_id}">
                        Manage Students
                    </button>
                </div>
            `;
            container.appendChild(courseElement);
        });

        // Populate session course dropdown
        const sessionCourseSelect = document.getElementById('sessionCourse');
        sessionCourseSelect.innerHTML = '<option value="">Select Course</option>';
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.course_id;
            option.textContent = `${course.course_code} - ${course.course_name}`;
            sessionCourseSelect.appendChild(option);
        });

        // Populate report course dropdown
        const reportCourseSelect = document.getElementById('reportCourse');
        reportCourseSelect.innerHTML = '<option value="">All Courses</option>';
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.course_id;
            option.textContent = `${course.course_code} - ${course.course_name}`;
            reportCourseSelect.appendChild(option);
        });
    }

    async loadSessions() {
        try {
            const response = await fetch('../php/protected/faculty-dashboard.php?action=getSessions');
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
                        start_time: '10:30',
                        end_time: '12:00',
                        location: 'Room 101',
                        attendance: '42/45'
                    }
                ];
            }

            this.displaySessions(sessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    displaySessions(sessions) {
        const container = document.getElementById('upcomingSessions');
        container.innerHTML = '';

        if (sessions.length === 0) {
            container.innerHTML = '<div class="session-item">No upcoming sessions.</div>';
            return;
        }

        sessions.forEach(session => {
            const sessionElement = document.createElement('div');
            sessionElement.className = 'session-item';
            sessionElement.innerHTML = `
                <div class="session-info">
                    <h4>${session.course_code} - ${session.topic}</h4>
                    <p>Date: ${this.formatDate(session.date)} | Time: ${this.formatTime(session.start_time)} - ${this.formatTime(session.end_time)}</p>
                    <p>Location: ${session.location} | Attendance: ${session.attendance}</p>
                </div>
                <div class="session-actions">
                    <button class="action-btn small take-attendance-btn" data-session-id="${session.session_id}">
                        Take Attendance
                    </button>
                    <button class="action-btn small edit-session-btn" data-session-id="${session.session_id}">
                        Edit
                    </button>
                </div>
            `;
            container.appendChild(sessionElement);
        });
    }

    toggleSessionForm() {
        const form = document.getElementById('createSessionForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }

    async createSession() {
        const formData = new FormData(document.getElementById('sessionForm'));
        const sessionData = {
            course_id: formData.get('course_id'),
            topic: formData.get('topic'),
            date: formData.get('date'),
            start_time: formData.get('start_time'),
            end_time: formData.get('end_time'),
            location: formData.get('location')
        };

        if (this.validateSession(sessionData)) {
            try {
                const response = await fetch('../php/protected/faculty-dashboard.php?action=createSession', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(sessionData)
                });

                const result = await response.json();
                
                if (result.success) {
                    alert('Session created successfully!');
                    document.getElementById('sessionForm').reset();
                    this.toggleSessionForm();
                    await this.loadSessions(); // Refresh sessions list
                } else {
                    alert('Failed to create session: ' + result.message);
                }
            } catch (error) {
                console.error('Error creating session:', error);
                alert('Error creating session. Please try again.');
            }
        }
    }

    validateSession(data) {
        const errors = [];

        if (!data.course_id) {
            errors.push('Course selection is required');
        }

        if (!data.topic.trim()) {
            errors.push('Topic is required');
        }

        if (!data.date) {
            errors.push('Date is required');
        }

        if (!data.start_time) {
            errors.push('Start time is required');
        }

        if (!data.end_time) {
            errors.push('End time is required');
        }

        if (data.start_time && data.end_time && data.start_time >= data.end_time) {
            errors.push('End time must be after start time');
        }

        if (errors.length > 0) {
            alert('Please fix the following errors:\n' + errors.join('\n'));
            return false;
        }

        return true;
    }

    takeAttendance() {
        alert('Opening attendance taking interface...');
        // Here you would typically open a modal or redirect to attendance page
    }

    generateReport() {
        alert('Generating attendance report...');
        // Here you would typically generate and display reports
    }

    async updateProfile() {
        const formData = new FormData(document.getElementById('profileForm'));
        const profileData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            dob: formData.get('dob'),
            department_id: formData.get('department_id'),
            designation: formData.get('designation')
        };

        if (this.validateProfile(profileData)) {
            try {
                const response = await fetch('../php/protected/faculty-dashboard.php?action=updateProfile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(profileData)
                });

                const result = await response.json();
                
                if (result.success) {
                    alert('Profile updated successfully!');
                    this.currentFaculty = { ...this.currentFaculty, ...profileData };
                    this.updateFacultyInfo();
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

        if (!data.department_id) {
            errors.push('Department is required');
        }

        if (!data.designation.trim()) {
            errors.push('Designation is required');
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

    formatTime(timeString) {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FacultyDashboard();
});