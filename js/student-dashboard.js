class StudentDashboard {
    constructor() {
        this.currentStudent = null;
        this.init();
    }

    async init() {
        await this.checkAuthentication();
        this.setupNavigation();
        this.setupEventListeners();
        await this.loadStudentData();
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
            
            if (result.user.role !== 'student') {
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

    async loadStudentData() {
        try {
            const response = await fetch('../php/protected/student-dashboard.php?action=getStudentData');
            const result = await response.json();
            
            if (result.success) {
                this.currentStudent = result.data;
                this.updateStudentInfo();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            // Fallback to mock data for demo
            this.currentStudent = {
                student_id: 'S12345',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@university.edu',
                dob: '2000-05-15',
                major_id: 1,
                major_name: 'Computer Science',
                year_of_study: 3,
                gpa: 3.75
            };
            this.updateStudentInfo();
        }
    }

    updateStudentInfo() {
        document.getElementById('studentName').textContent = 
            `${this.currentStudent.first_name} ${this.currentStudent.last_name}`;
        document.getElementById('studentId').textContent = this.currentStudent.student_id;
        document.getElementById('studentMajor').textContent = this.currentStudent.major_name;
        document.getElementById('studentYear').textContent = this.currentStudent.year_of_study;

        // Update profile form
        document.getElementById('profileFirstName').value = this.currentStudent.first_name;
        document.getElementById('profileLastName').value = this.currentStudent.last_name;
        document.getElementById('profileEmail').value = this.currentStudent.email;
        document.getElementById('profileDob').value = this.currentStudent.dob;
        document.getElementById('profileYear').value = this.currentStudent.year_of_study;
        
        // Populate major dropdown
        this.populateMajorDropdown();
    }

    populateMajorDropdown() {
        const majors = [
            { major_id: 1, major_name: 'Computer Science' },
            { major_id: 2, major_name: 'Software Engineering' },
            { major_id: 3, major_name: 'Data Science' },
            { major_id: 4, major_name: 'Applied Mathematics' }
        ];

        const majorSelect = document.getElementById('profileMajor');
        majorSelect.innerHTML = '<option value="">Select your major</option>';
        
        majors.forEach(major => {
            const option = document.createElement('option');
            option.value = major.major_id;
            option.textContent = major.major_name;
            if (major.major_id === this.currentStudent.major_id) {
                option.selected = true;
            }
            majorSelect.appendChild(option);
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
        // Join session button
        document.getElementById('joinSessionBtn').addEventListener('click', () => {
            this.joinSession();
        });

        // View grades button
        document.getElementById('viewGradesBtn').addEventListener('click', () => {
            this.viewGrades();
        });

        // Feedback button
        document.getElementById('feedbackBtn').addEventListener('click', () => {
            this.viewFeedback();
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
            const response = await fetch('../php/protected/student-dashboard.php?action=getCourses');
            const result = await response.json();
            
            let courses = [];
            if (result.success) {
                courses = result.data;
            } else {
                // Fallback to mock data
                courses = [
                    { course_id: 1, course_code: 'CS 301', course_name: 'Web Technology', status: 'enrolled' },
                    { course_id: 2, course_code: 'CS 302', course_name: 'Algorithm Design and Analysis', status: 'enrolled' },
                    { course_id: 3, course_code: 'CS 303', course_name: 'Intermediate Computer Programming', status: 'enrolled' },
                    { course_id: 4, course_code: 'CS 304', course_name: 'Hardware and System Fundamentals', status: 'enrolled' }
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
            container.innerHTML = '<div class="course-item"><p>No courses enrolled.</p></div>';
            return;
        }

        courses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.className = 'course-item';
            courseElement.innerHTML = `
                <h3>${course.course_code} - ${course.course_name}</h3>
                <p>Status: <span class="status-${course.status}">${course.status}</span></p>
                <button class="action-btn small view-course-btn" data-course-id="${course.course_id}">
                    View Details
                </button>
            `;
            container.appendChild(courseElement);
        });

        // Add event listeners to view course buttons
        document.querySelectorAll('.view-course-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = e.target.getAttribute('data-course-id');
                this.viewCourseDetails(courseId);
            });
        });
    }

    async loadSessions() {
        try {
            const response = await fetch('../php/protected/student-dashboard.php?action=getSessions');
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
                        date: '2024-10-07', 
                        day: 'Monday', 
                        time: '10:30 AM',
                        topic: 'Introduction to HTML & CSS',
                        location: 'Room 101'
                    },
                    { 
                        session_id: 2, 
                        course_code: 'CS 302', 
                        date: '2024-10-08', 
                        day: 'Tuesday', 
                        time: '02:00 PM',
                        topic: 'Sorting Algorithms',
                        location: 'Room 202'
                    }
                ];
            }

            this.displaySessions(sessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    displaySessions(sessions) {
        const container = document.getElementById('sessionsContainer');
        container.innerHTML = '';

        if (sessions.length === 0) {
            container.innerHTML = '<div class="session-item">No upcoming sessions.</div>';
            return;
        }

        sessions.forEach(session => {
            const sessionElement = document.createElement('div');
            sessionElement.className = 'session-item';
            sessionElement.innerHTML = `
                <strong>${session.day}, ${this.formatDate(session.date)}:</strong> 
                ${session.course_code} (${session.time}) - ${session.topic}
                <br><small>Location: ${session.location}</small>
            `;
            container.appendChild(sessionElement);
        });
    }

    joinSession() {
        const currentSession = this.getCurrentSession();
        if (currentSession) {
            alert(`Joining session: ${currentSession.course_code} - ${currentSession.topic}`);
            // Here you would typically redirect to the session or open a video call
        } else {
            alert('No active session available at the moment.');
        }
    }

    getCurrentSession() {
        // In a real app, this would check for currently active sessions
        return {
            course_code: 'CS 301',
            topic: 'Introduction to HTML & CSS',
            session_id: 1
        };
    }

    viewGrades() {
        const gradesContainer = document.getElementById('gradesContainer');
        const feedbackContainer = document.getElementById('feedbackContainer');
        
        feedbackContainer.style.display = 'none';
        gradesContainer.style.display = 'block';

        // Mock grades data
        const grades = [
            { course: 'CS 301', assignment: 'Midterm', grade: 'A', percentage: 92 },
            { course: 'CS 301', assignment: 'Final Project', grade: 'A-', percentage: 89 },
            { course: 'CS 302', assignment: 'Quiz 1', grade: 'B+', percentage: 87 }
        ];

        gradesContainer.innerHTML = this.generateGradesTable(grades);
    }

    viewFeedback() {
        const gradesContainer = document.getElementById('gradesContainer');
        const feedbackContainer = document.getElementById('feedbackContainer');
        
        gradesContainer.style.display = 'none';
        feedbackContainer.style.display = 'block';

        // Mock feedback data
        const feedback = [
            { course: 'CS 301', faculty: 'Dr. Smith', feedback: 'Excellent work on the final project!', date: '2024-10-01' },
            { course: 'CS 302', faculty: 'Prof. Johnson', feedback: 'Good understanding of algorithms, keep practicing.', date: '2024-09-28' }
        ];

        feedbackContainer.innerHTML = this.generateFeedbackList(feedback);
    }

    generateGradesTable(grades) {
        let html = '<h3>Your Grades</h3><table><thead><tr><th>Course</th><th>Assignment</th><th>Grade</th><th>Percentage</th></tr></thead><tbody>';
        grades.forEach(grade => {
            html += `<tr>
                <td>${grade.course}</td>
                <td>${grade.assignment}</td>
                <td>${grade.grade}</td>
                <td>${grade.percentage}%</td>
            </tr>`;
        });
        html += '</tbody></table>';
        return html;
    }

    generateFeedbackList(feedback) {
        let html = '<h3>Faculty Feedback</h3><div class="feedback-list">';
        feedback.forEach(item => {
            html += `<div class="feedback-item">
                <h4>${item.course} - ${item.faculty}</h4>
                <p>${item.feedback}</p>
                <small>Date: ${item.date}</small>
            </div>`;
        });
        html += '</div>';
        return html;
    }

    viewCourseDetails(courseId) {
        alert(`Viewing details for course ID: ${courseId}`);
        // Here you would typically navigate to course details page
    }

    async updateProfile() {
        const formData = new FormData(document.getElementById('profileForm'));
        const profileData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            dob: formData.get('dob'),
            major_id: formData.get('major_id'),
            year_of_study: formData.get('year_of_study')
        };

        if (this.validateProfile(profileData)) {
            try {
                const response = await fetch('../php/protected/student-dashboard.php?action=updateProfile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(profileData)
                });

                const result = await response.json();
                
                if (result.success) {
                    alert('Profile updated successfully!');
                    this.currentStudent = { ...this.currentStudent, ...profileData };
                    this.updateStudentInfo();
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

        if (!data.major_id) {
            errors.push('Major is required');
        }

        if (!data.year_of_study || data.year_of_study < 1 || data.year_of_study > 5) {
            errors.push('Valid year of study (1-5) is required');
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
        const options = { month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StudentDashboard();
});