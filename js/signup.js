class SignUpForm {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDepartmentsAndMajors();
        this.setupRealTimeValidation();
    }

    setupEventListeners() {
        const form = document.getElementById('signupForm');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const roleSelect = document.getElementById('role');

        // Password confirmation validation
        confirmPassword.addEventListener('input', () => {
            this.validatePasswordMatch();
        });

        // Role change handler
        roleSelect.addEventListener('change', () => {
            this.toggleRoleFields();
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Real-time validation
        document.getElementById('user_id').addEventListener('blur', () => {
            this.validateUserId();
        });

        document.getElementById('email').addEventListener('blur', () => {
            this.validateEmail();
        });
    }

    setupRealTimeValidation() {
        const inputs = document.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    validateField(input) {
        const value = input.value.trim();
        const fieldName = input.name;
        
        switch (fieldName) {
            case 'first_name':
            case 'last_name':
                return this.validateName(input, value);
            case 'email':
                return this.validateEmail(input, value);
            case 'user_id':
                return this.validateUserId(input, value);
            case 'dob':
                return this.validateDateOfBirth(input, value);
            default:
                return this.validateRequired(input, value);
        }
    }

    validateName(input, value) {
        if (!value) {
            this.showError(input, 'This field is required');
            return false;
        }
        
        if (value.length < 2) {
            this.showError(input, 'Name must be at least 2 characters long');
            return false;
        }
        
        if (!/^[a-zA-Z\s\-']+$/.test(value)) {
            this.showError(input, 'Name can only contain letters, spaces, hyphens, and apostrophes');
            return false;
        }
        
        this.clearError(input);
        return true;
    }

    validateEmail(input = null, value = null) {
        if (!input) {
            input = document.getElementById('email');
            value = input.value.trim();
        }
        
        if (!value) {
            this.showError(input, 'Email is required');
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            this.showError(input, 'Please enter a valid email address');
            return false;
        }
        
        this.clearError(input);
        return true;
    }

    validateUserId(input = null, value = null) {
        if (!input) {
            input = document.getElementById('user_id');
            value = input.value.trim();
        }
        
        if (!value) {
            this.showError(input, 'User ID is required');
            return false;
        }
        
        if (!/^\d+$/.test(value)) {
            this.showError(input, 'User ID must contain only numbers');
            return false;
        }
        
        if (value.length < 5) {
            this.showError(input, 'User ID must be at least 5 digits long');
            return false;
        }
        
        this.clearError(input);
        return true;
    }

    validateDateOfBirth(input, value) {
        if (!value) {
            this.showError(input, 'Date of birth is required');
            return false;
        }
        
        const dob = new Date(value);
        const today = new Date();
        const minAge = 16;
        const maxAge = 100;
        
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        
        if (age < minAge) {
            this.showError(input, `You must be at least ${minAge} years old`);
            return false;
        }
        
        if (age > maxAge) {
            this.showError(input, `Please enter a valid date of birth`);
            return false;
        }
        
        this.clearError(input);
        return true;
    }

    validateRequired(input, value) {
        if (!value) {
            this.showError(input, 'This field is required');
            return false;
        }
        
        this.clearError(input);
        return true;
    }

    validatePasswordMatch() {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const message = document.getElementById('passwordMessage');
        
        if (password.value !== confirmPassword.value) {
            this.showError(confirmPassword, 'Passwords do not match!');
            message.style.display = 'block';
            return false;
        } else {
            this.clearError(confirmPassword);
            message.style.display = 'none';
            return this.validatePasswordStrength(password.value);
        }
    }

    validatePasswordStrength(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        const metRequirements = Object.values(requirements).filter(Boolean).length;
        const strength = (metRequirements / Object.keys(requirements).length) * 100;
        
        this.updatePasswordStrengthIndicator(strength);
        
        if (strength < 60) {
            this.showError(document.getElementById('password'), 'Password is too weak. Include uppercase, lowercase, numbers, and special characters.');
            return false;
        }
        
        this.clearError(document.getElementById('password'));
        return true;
    }

    updatePasswordStrengthIndicator(strength) {
        let indicator = document.getElementById('passwordStrengthIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'passwordStrengthIndicator';
            indicator.className = 'password-strength';
            document.getElementById('password').parentNode.appendChild(indicator);
        }
        
        let strengthText = '';
        let strengthClass = '';
        
        if (strength < 40) {
            strengthText = 'Weak';
            strengthClass = 'weak';
        } else if (strength < 70) {
            strengthText = 'Medium';
            strengthClass = 'medium';
        } else {
            strengthText = 'Strong';
            strengthClass = 'strong';
        }
        
        indicator.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill ${strengthClass}" style="width: ${strength}%"></div>
            </div>
            <span class="strength-text ${strengthClass}">${strengthText}</span>
        `;
    }

    toggleRoleFields() {
        const role = document.getElementById('role').value;
        
        // Hide all role-specific fields
        document.querySelectorAll('.role-specific-fields').forEach(field => {
            field.style.display = 'none';
            field.querySelectorAll('input, select').forEach(input => {
                input.removeAttribute('required');
                input.value = '';
            });
        });
        
        // Show fields specific to selected role
        if (role === 'student') {
            const studentFields = document.getElementById('studentFields');
            studentFields.style.display = 'block';
            studentFields.querySelectorAll('input, select').forEach(input => {
                input.setAttribute('required', 'required');
            });
        } else if (role === 'faculty') {
            const facultyFields = document.getElementById('facultyFields');
            facultyFields.style.display = 'block';
            facultyFields.querySelectorAll('input, select').forEach(input => {
                input.setAttribute('required', 'required');
            });
        } else if (role === 'intern') {
            const internFields = document.getElementById('internFields');
            internFields.style.display = 'block';
            internFields.querySelectorAll('input, select').forEach(input => {
                input.setAttribute('required', 'required');
            });
        }
    }

    async loadDepartmentsAndMajors() {
        try {
            // In a real application, you would fetch these from your API
            const departments = [
                { department_id: 1, department_name: 'Computer Science' },
                { department_id: 2, department_name: 'Mathematics' },
                { department_id: 3, department_name: 'Physics' },
                { department_id: 4, department_name: 'Engineering' }
            ];

            const majors = [
                { major_id: 1, major_name: 'Computer Science' },
                { major_id: 2, major_name: 'Software Engineering' },
                { major_id: 3, major_name: 'Data Science' },
                { major_id: 4, major_name: 'Applied Mathematics' }
            ];
            
            this.populateDepartmentDropdowns(departments);
            this.populateMajorDropdown(majors);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    populateDepartmentDropdowns(departments) {
        const departmentSelects = [
            'department_id',
            'assigned_department'
        ];
        
        departmentSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Select department</option>';
                departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.department_id;
                    option.textContent = dept.department_name;
                    select.appendChild(option);
                });
            }
        });
    }

    populateMajorDropdown(majors) {
        const select = document.getElementById('major_id');
        if (select) {
            select.innerHTML = '<option value="">Select major</option>';
            majors.forEach(major => {
                const option = document.createElement('option');
                option.value = major.major_id;
                option.textContent = major.major_name;
                select.appendChild(option);
            });
        }
    }

    async handleSubmit() {
        if (!this.validateAllFields()) {
            this.showGeneralError('Please fix the errors before submitting.');
            return;
        }

        const formData = new FormData(document.getElementById('signupForm'));
        const userData = this.prepareUserData(formData);

        try {
            this.setLoadingState(true);

            const response = await fetch('../php/auth/signup.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                this.showGeneralError(result.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            this.showGeneralError('An error occurred during registration. Please try again.');
            console.error('Registration error:', error);
        } finally {
            this.setLoadingState(false);
        }
    }

    prepareUserData(formData) {
        const role = formData.get('role');
        const userData = {
            user_id: formData.get('user_id'),
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: role,
            dob: formData.get('dob')
        };

        // Add role-specific data
        if (role === 'student') {
            userData.major_id = formData.get('major_id');
            userData.year_of_study = formData.get('year_of_study');
        } else if (role === 'faculty') {
            userData.department_id = formData.get('department_id');
            userData.designation = formData.get('designation');
        } else if (role === 'intern') {
            userData.assigned_department = formData.get('assigned_department');
            userData.start_date = formData.get('start_date');
            userData.end_date = formData.get('end_date');
        }

        return userData;
    }

    validateAllFields() {
        let isValid = true;

        // Validate basic fields
        const basicFields = ['first_name', 'last_name', 'email', 'user_id', 'dob', 'password'];
        basicFields.forEach(fieldName => {
            const input = document.querySelector(`[name="${fieldName}"]`);
            if (input && !this.validateField(input)) {
                isValid = false;
            }
        });

        // Validate password match
        if (!this.validatePasswordMatch()) {
            isValid = false;
        }

        // Validate role-specific fields
        const role = document.getElementById('role').value;
        if (role === 'student') {
            const studentFields = ['major_id', 'year_of_study'];
            studentFields.forEach(fieldName => {
                const input = document.querySelector(`[name="${fieldName}"]`);
                if (input && !this.validateField(input)) {
                    isValid = false;
                }
            });
        } else if (role === 'faculty') {
            const facultyFields = ['department_id', 'designation'];
            facultyFields.forEach(fieldName => {
                const input = document.querySelector(`[name="${fieldName}"]`);
                if (input && !this.validateField(input)) {
                    isValid = false;
                }
            });
        } else if (role === 'intern') {
            const internFields = ['assigned_department', 'start_date', 'end_date'];
            internFields.forEach(fieldName => {
                const input = document.querySelector(`[name="${fieldName}"]`);
                if (input && !this.validateField(input)) {
                    isValid = false;
                }
            });
        }

        return isValid;
    }

    setLoadingState(loading) {
        const submitButton = document.querySelector('#signupForm button[type="submit"]');
        const originalText = submitButton.textContent;
        
        if (loading) {
            submitButton.disabled = true;
            submitButton.textContent = 'Creating Account...';
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
        const existingError = document.getElementById('generalError');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.id = 'generalError';
        errorDiv.className = 'general-error';
        errorDiv.textContent = message;
        
        const form = document.getElementById('signupForm');
        form.insertBefore(errorDiv, form.firstChild);
        
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const form = document.getElementById('signupForm');
        form.insertBefore(successDiv, form.firstChild);
        
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Initialize the sign up form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignUpForm();
});