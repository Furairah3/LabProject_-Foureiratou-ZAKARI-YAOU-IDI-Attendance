// dashboard.js

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    logoutUser();
});

// Auto-logout after inactivity (optional)
let inactivityTimer;
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logoutUser, 30 * 60 * 1000); // 30 minutes
}

// Reset timer on user activity
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);

function logoutUser() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
        // Clear all stored data
        sessionStorage.removeItem('user');
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
        
        // Clear any cookies (if used)
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // Show logout message
        showLogoutMessage();
        
        // Redirect to login page after a brief delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

function showLogoutMessage() {
    const logoutMessage = document.createElement('div');
    logoutMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        z-index: 10000;
        font-size: 1.2em;
    `;
    logoutMessage.textContent = 'Logging out... Thank you for using our system!';
    document.body.appendChild(logoutMessage);
}

// Check authentication on page load
function checkAuthentication() {
    const userData = sessionStorage.getItem('user');
    if (!userData) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!checkAuthentication()) {
        return;
    }

    const userData = sessionStorage.getItem('user');
    const user = JSON.parse(userData);
    initializeDashboard(user);

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            showTab(tab);
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Quick action buttons
    document.querySelectorAll('.action-btn[data-section]').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const navLink = document.querySelector(`[data-section="${section}"]`);
            if (navLink) {
                navLink.classList.add('active');
            }
        });
    });

    // Mark attendance modal
    const markAttendanceBtn = document.getElementById('markAttendanceBtn');
    const closeModalBtn = document.getElementById('closeModal');
    
    if (markAttendanceBtn) {
        markAttendanceBtn.addEventListener('click', showAttendanceModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAttendanceModal);
    }

    // Load initial data
    loadDashboardData(user);
    loadAttendanceData(user);
    loadSessionsData(user);

    // Start inactivity timer
    resetInactivityTimer();
});

function initializeDashboard(user) {
    // Update user welcome message
    const userWelcome = document.getElementById('userWelcome');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (userWelcome) {
        userWelcome.textContent = `Welcome, ${user.first_name}!`;
    }
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome back, ${user.first_name}!`;
    }

    // Update profile section
    updateProfileSection(user);
}

function updateProfileSection(user) {
    const profileName = document.getElementById('profileName');
    const profileRole = document.getElementById('profileRole');
    const profileEmail = document.getElementById('profileEmail');
    const profileUserId = document.getElementById('profileUserId');
    const profileDob = document.getElementById('profileDob');
    const profileJoinDate = document.getElementById('profileJoinDate');
    const avatarInitials = document.getElementById('avatarInitials');

    if (profileName) profileName.textContent = `${user.first_name} ${user.last_name}`;
    if (profileRole) profileRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    if (profileEmail) profileEmail.textContent = user.email;
    if (profileUserId) profileUserId.textContent = user.user_id;
    
    // Format date of birth
    if (user.dob && profileDob) {
        const dob = new Date(user.dob);
        profileDob.textContent = dob.toLocaleDateString();
    }
    
    // Format join date
    if (user.created_at && profileJoinDate) {
        const joinDate = new Date(user.created_at);
        profileJoinDate.textContent = joinDate.toLocaleDateString();
    }

    // Avatar initials
    if (avatarInitials) {
        const initials = (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
        avatarInitials.textContent = initials;
    }

    // Role-specific details
    updateRoleSpecificDetails(user);
}

function updateRoleSpecificDetails(user) {
    const container = document.getElementById('roleSpecificDetails');
    if (!container) return;

    container.innerHTML = '';

    if (user.role === 'student') {
        container.innerHTML = `
            <div class="detail-group">
                <label>Major:</label>
                <span>${user.major_id || 'Not specified'}</span>
            </div>
            <div class="detail-group">
                <label>Year of Study:</label>
                <span>${user.year_of_study || 'Not specified'}</span>
            </div>
        `;
    } else if (user.role === 'faculty') {
        container.innerHTML = `
            <div class="detail-group">
                <label>Department:</label>
                <span>${user.department_id || 'Not specified'}</span>
            </div>
            <div class="detail-group">
                <label>Designation:</label>
                <span>${user.designation || 'Not specified'}</span>
            </div>
        `;
    } else if (user.role === 'intern') {
        container.innerHTML = `
            <div class="detail-group">
                <label>Assigned Department:</label>
                <span>${user.assigned_department || 'Not specified'}</span>
            </div>
            <div class="detail-group">
                <label>Internship Period:</label>
                <span>${user.start_date ? new Date(user.start_date).toLocaleDateString() : 'Not specified'} - ${user.end_date ? new Date(user.end_date).toLocaleDateString() : 'Not specified'}</span>
            </div>
        `;
    }
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

function showTab(tabId) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Show selected tab pane
    const targetTab = document.getElementById(`${tabId}-tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

function loadDashboardData(user) {
    // Simulate loading dashboard statistics
    setTimeout(() => {
        const totalAttendance = document.getElementById('totalAttendance');
        const presentDays = document.getElementById('presentDays');
        const attendanceRate = document.getElementById('attendanceRate');
        const upcomingSessions = document.getElementById('upcomingSessions');

        if (totalAttendance) totalAttendance.textContent = '24';
        if (presentDays) presentDays.textContent = '18';
        if (attendanceRate) attendanceRate.textContent = '85%';
        if (upcomingSessions) upcomingSessions.textContent = '3';

        // Load recent activity
        const activities = [
            { action: 'Attendance marked', course: 'Mathematics', time: '2 hours ago', type: 'success' },
            { action: 'Session attended', course: 'Physics Lab', time: '1 day ago', type: 'success' },
            { action: 'Upcoming session', course: 'Chemistry', time: 'Tomorrow 10:00 AM', type: 'info' },
            { action: 'Profile updated', course: '', time: '2 days ago', type: 'info' }
        ];

        const activityList = document.getElementById('recentActivity');
        if (activityList) {
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item ${activity.type}">
                    <div class="activity-icon">${getActivityIcon(activity.type)}</div>
                    <div class="activity-content">
                        <strong>${activity.action}</strong>
                        ${activity.course ? ` - ${activity.course}` : ''}
                        <small>${activity.time}</small>
                    </div>
                </div>
            `).join('');
        }
    }, 1000);
}

function getActivityIcon(type) {
    const icons = {
        success: '✅',
        warning: '⚠️',
        info: 'ℹ️',
        error: '❌'
    };
    return icons[type] || '●';
}

function loadAttendanceData(user) {
    // Simulate loading attendance data
    setTimeout(() => {
        const sampleData = [
            { date: '2024-01-15', session: 'Mathematics Lecture', status: 'Present', time: '09:00 AM', remarks: 'On time' },
            { date: '2024-01-14', session: 'Physics Lab', status: 'Present', time: '02:00 PM', remarks: 'On time' },
            { date: '2024-01-13', session: 'Chemistry', status: 'Absent', time: '-', remarks: 'Medical leave' },
            { date: '2024-01-12', session: 'Computer Science', status: 'Present', time: '10:30 AM', remarks: 'Late (15 mins)' }
        ];

        const tableBody = document.getElementById('attendanceTableBody');
        if (tableBody) {
            tableBody.innerHTML = sampleData.map(record => `
                <tr>
                    <td>${new Date(record.date).toLocaleDateString()}</td>
                    <td>${record.session}</td>
                    <td><span class="status-${record.status.toLowerCase()}">${record.status}</span></td>
                    <td>${record.time}</td>
                    <td>${record.remarks}</td>
                </tr>
            `).join('');
        }
    }, 1500);
}

function loadSessionsData(user) {
    // Simulate loading sessions data
    setTimeout(() => {
        const todaySessions = [
            { name: 'Mathematics Lecture', time: '09:00 - 10:30', room: 'Room 101', status: 'upcoming' },
            { name: 'Computer Science Lab', time: '14:00 - 16:00', room: 'Lab A', status: 'upcoming' }
        ];

        const upcomingSessions = [
            { name: 'Physics Lecture', date: 'Tomorrow', time: '10:00 - 11:30', room: 'Room 201' },
            { name: 'Chemistry Lab', date: 'Jan 18', time: '13:00 - 15:00', room: 'Lab B' }
        ];

        const completedSessions = [
            { name: 'Mathematics Tutorial', date: 'Jan 12', time: 'Completed', room: 'Room 101', attendance: 'Present' },
            { name: 'Physics Lab', date: 'Jan 11', time: 'Completed', room: 'Lab A', attendance: 'Present' }
        ];

        // Populate today's sessions
        const todaySessionsContainer = document.getElementById('todaySessions');
        if (todaySessionsContainer) {
            todaySessionsContainer.innerHTML = todaySessions.map(session => `
                <div class="session-item ${session.status}">
                    <div class="session-info">
                        <h4>${session.name}</h4>
                        <p>⏰ ${session.time} | 📍 ${session.room}</p>
                    </div>
                    <button class="action-btn small join-session">Join Session</button>
                </div>
            `).join('');
        }

        // Populate upcoming sessions
        const upcomingSessionsContainer = document.getElementById('upcomingSessionsList');
        if (upcomingSessionsContainer) {
            upcomingSessionsContainer.innerHTML = upcomingSessions.map(session => `
                <div class="session-item upcoming">
                    <div class="session-info">
                        <h4>${session.name}</h4>
                        <p>📅 ${session.date} | ⏰ ${session.time} | 📍 ${session.room}</p>
                    </div>
                </div>
            `).join('');
        }

        // Populate completed sessions
        const completedSessionsContainer = document.getElementById('completedSessions');
        if (completedSessionsContainer) {
            completedSessionsContainer.innerHTML = completedSessions.map(session => `
                <div class="session-item completed">
                    <div class="session-info">
                        <h4>${session.name}</h4>
                        <p>📅 ${session.date} | ⏰ ${session.time} | 📍 ${session.room}</p>
                        <p class="attendance-status">Attendance: ${session.attendance}</p>
                    </div>
                </div>
            `).join('');
        }

    }, 2000);
}

function showAttendanceModal() {
    const modal = document.getElementById('attendanceModal');
    if (modal) {
        modal.style.display = 'flex';

        // Simulate loading available sessions
        const availableSessions = document.getElementById('availableSessions');
        if (availableSessions) {
            availableSessions.innerHTML = `
                <div class="session-option">
                    <input type="radio" name="session" id="session1" value="math">
                    <label for="session1">
                        <strong>Mathematics Lecture</strong><br>
                        <small>Room 101 | 09:00 AM - 10:30 AM</small>
                    </label>
                </div>
                <div class="session-option">
                    <input type="radio" name="session" id="session2" value="cs">
                    <label for="session2">
                        <strong>Computer Science Lab</strong><br>
                        <small>Lab A | 02:00 PM - 04:00 PM</small>
                    </label>
                </div>
            `;
        }
    }
}

function closeAttendanceModal() {
    const modal = document.getElementById('attendanceModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
const attendanceModal = document.getElementById('attendanceModal');
if (attendanceModal) {
    attendanceModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeAttendanceModal();
        }
    });
}