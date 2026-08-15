// API Configuration - LIVE
const API_URL = 'https://modern-furniture-api.onrender.com/api';

// Modal Functions
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function switchModal(targetId) {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    openModal(targetId);
}

// Close modal on background click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
});

// Show message in modal
function showMessage(elementId, message, type = 'success') {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.className = `message ${type}`;
        el.style.display = 'block';
    }
}

// Login Handler - LIVE
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        console.log('Attempting login for:', email);
        console.log('API URL:', API_URL);
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showMessage('loginMessage', '✅ Login successful!', 'success');
            
            setTimeout(() => {
                closeModal('loginModal');
                const user = data.user;
                if (['super_admin', 'ceo_admin', 'branch_admin'].includes(user.role)) {
                    window.location.href = 'pages/admin/admin-login.html';
                } else {
                    window.location.href = 'pages/dashboard.html';
                }
            }, 1000);
        } else {
            showMessage('loginMessage', data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('loginMessage', `Network error: ${error.message}`, 'error');
    }
}

// Signup Handler
async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    
    if (password !== confirm) {
        showMessage('signupMessage', 'Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 8) {
        showMessage('signupMessage', 'Password must be at least 8 characters!', 'error');
        return;
    }
    
    try {
        console.log('Attempting signup for:', email);
        console.log('API URL:', API_URL);
        
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        console.log('Signup response:', data);
        
        if (data.success) {
            showMessage('signupMessage', '✅ Account created! Please login.', 'success');
            
            setTimeout(() => {
                closeModal('signupModal');
                document.getElementById('loginEmail').value = email;
                openModal('loginModal');
            }, 1500);
        } else {
            showMessage('signupMessage', data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showMessage('signupMessage', `Network error: ${error.message}`, 'error');
    }
}

// Forgot Password Handler
async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    try {
        console.log('Attempting forgot password for:', email);
        console.log('API URL:', API_URL);
        
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        console.log('Forgot password response:', data);
        
        if (data.success) {
            showMessage('forgotMessage', '✅ Reset link sent to your email!', 'success');
            
            setTimeout(() => {
                closeModal('forgotModal');
                openModal('loginModal');
            }, 1500);
        } else {
            showMessage('forgotMessage', data.message || 'Something went wrong', 'error');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        showMessage('forgotMessage', `Network error: ${error.message}`, 'error');
    }
}

// Show Dashboard Preview
function showDashboardPreview(user) {
    const preview = document.getElementById('dashboardPreview');
    const userInfo = document.getElementById('userInfo');
    
    if (preview && userInfo) {
        userInfo.innerHTML = `
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
        `;
        preview.style.display = 'block';
    }
}

function closeDashboardPreview() {
    const preview = document.getElementById('dashboardPreview');
    if (preview) {
        preview.style.display = 'none';
        window.location.href = 'pages/dashboard.html';
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    const preview = document.getElementById('dashboardPreview');
    if (preview) {
        preview.style.display = 'none';
    }
    showMessage('loginMessage', 'Logged out successfully', 'success');
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const nav = document.querySelector('.nav-links');
    const auth = document.querySelector('.auth-buttons');
    
    if (nav) {
        if (nav.style.display === 'flex') {
            nav.style.display = 'none';
        } else {
            nav.style.display = 'flex';
            nav.style.flexDirection = 'column';
            nav.style.position = 'absolute';
            nav.style.top = '80px';
            nav.style.left = '0';
            nav.style.width = '100%';
            nav.style.background = 'rgba(26,42,58,0.98)';
            nav.style.backdropFilter = 'blur(20px)';
            nav.style.padding = '30px 24px';
            nav.style.gap = '20px';
            nav.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
        }
    }
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        const preview = document.getElementById('dashboardPreview');
        if (preview) {
            showDashboardPreview(JSON.parse(user));
        }
    }
});

console.log('✅ auth.js loaded with LIVE API URL:', API_URL);