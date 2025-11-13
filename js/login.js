class LoginForm {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthentication();
        this.setupRealTimeValidation();
    }

    setupEventListeners() {
        const form = document.querySelector('form');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Enter key submission
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });
    }

    setupRealTimeValidation() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        emailInput.addEventListener('blur', () => {
            this.validateEmail();
        });

        passwordInput.addEventListener('blur', () => {
            this.validatePassword();
        });
    }

    validateEmail() {
        const emailInput = document.getElementById('email');
        const email = emailInput.value.trim();

        if (!email) {
            this.showError(emailInput, 'Email is required');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError(emailInput, 'Please enter a valid email address');
            return false;
        }

        this.clearError(emailInput);
        return true;
    }

    validatePassword() {
        const passwordInput = document.getElementById('password');
        const password = passwordInput.value;

        if (!password) {
            this.showError(passwordInput, 'Password is required');
            return false;
        }

        this.clearError(passwordInput);
        return true;
    }

    async checkAuthentication() {
        try {
            const response = await fetch('../php/auth/check-auth.php');
            const result = await response.json();
            
            if (result.success) {
                // User is already logged in, redirect to appropriate dashboard
                this.redirectToDashboard(result.user.role);
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
        }
    }

    async handleLogin() {
        if (!this.validateEmail() || !this.validatePassword()) {
            this.showGeneralError('Please fix the errors before logging in.');
            return;
        }

        const formData = {
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            this.setLoadingState(true);

            const response = await fetch('../php/auth/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.handleSuccessfulLogin(result);
            } else {
                this.handleFailedLogin(result.message);
            }
        } catch (error) {
            this.handleFailedLogin('An error occurred during login. Please try again.');
            console.error('Login error:', error);
        } finally {
            this.setLoadingState(false);
        }
    }

    handleSuccessfulLogin(result) {
        this.showSuccess('Login successful! Redirecting...');

        setTimeout(() => {
            this.redirectToDashboard(result.role);
        }, 1500);
    }

    redirectToDashboard(role) {
        const dashboardRoutes = {
            student: 'student-dashboard.html',
            faculty: 'faculty-dashboard.html',
            intern: 'intern-dashboard.html'
        };

        const route = dashboardRoutes[role] || 'student-dashboard.html';
        window.location.href = route;
    }

    handleFailedLogin(message) {
        this.showGeneralError(message);
        
        // Clear password field for security
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
        
        // Add shake animation to form
        const form = document.querySelector('form');
        form.classList.add('shake');
        setTimeout(() => {
            form.classList.remove('shake');
        }, 500);
    }

    setLoadingState(loading) {
        const submitButton = document.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        if (loading) {
            submitButton.disabled = true;
            submitButton.textContent = 'Signing In...';
            submitButton.style.opacity = '0.7';
        } else {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            submitButton.style.opacity = '1';
        }
    }

    showError(input, message) {
        this.clearError(input);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '0.8em';
        errorDiv.style.marginTop = '5px';
        
        input.style.borderColor = '#e74c3c';
        input.parentNode.appendChild(errorDiv);
    }

    clearError(input) {
        const errorDiv = input.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
        input.style.borderColor = '#ccc';
    }

    showGeneralError(message) {
        const existingError = document.querySelector('.general-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'general-error';
        errorDiv.textContent = message;
        
        const form = document.querySelector('form');
        form.insertBefore(errorDiv, form.firstChild);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const form = document.querySelector('form');
        form.insertBefore(successDiv, form.firstChild);
    }
}

// Initialize the login form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginForm();
});