// ============================================
// COMPLETE AUTHENTICATION - 100 YEAR TOKEN
// ============================================

const API_URL = 'https://modern-furniture-api.onrender.com/api';

// ===== AUTH SERVICE =====
class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.redirectUrls = {
            'super_admin': '/frontend/pages/admin/super-admin.html',
            'ceo_admin': '/frontend/pages/admin/ceo-admin.html',
            'branch_admin': '/frontend/pages/admin/branch-admin.html',
            'user': '/frontend/pages/dashboard.html'
        };
    }

    // ===== LOGIN USER - 100 YEAR TOKEN =====
    async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            this.token = data.token;
            this.user = data.user;
            
            // Store token - lasts 100 years!
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('tokenExpiry', 'never');  // ← ADDED THIS LINE

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // ===== REGISTER USER - 100 YEAR TOKEN =====
    async register(name, email, password, role = 'user', branch = null) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role, branch })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            this.token = data.token;
            this.user = data.user;
            
            // Store token - lasts 100 years!
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('tokenExpiry', 'never');  // ← ADDED THIS LINE

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // ===== GET CURRENT USER =====
    async getCurrentUser() {
        if (!this.token) return null;

        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                }
                return null;
            }

            this.user = data.user;
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }

    // ===== CHANGE PASSWORD =====
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Password change failed');
            }

            return { success: true, message: data.message };
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }

    // ===== FORGOT PASSWORD =====
    async forgotPassword(email) {
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return { success: true, message: data.message };
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    }

    // ===== LOGOUT =====
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');  // ← ADDED THIS LINE
        this.token = null;
        this.user = null;
        window.location.href = '/index.html';
    }

    // ===== CHECK ROLES =====
    isAuthenticated() {
        // Check if token exists
        if (!this.token || !this.user) return false;
        
        // Check if token is marked as 'never' expiring (100 years!)
        const expiry = localStorage.getItem('tokenExpiry');
        if (expiry === 'never') {
            return true;  // ← 100-year token - always valid
        }
        
        // Legacy token - check if expired
        if (expiry && new Date(expiry) < new Date()) {
            this.logout();
            return false;
        }
        
        return true;
    }

    isAdmin() {
        return this.user && ['super_admin', 'ceo_admin', 'branch_admin'].includes(this.user.role);
    }

    isSuperAdmin() {
        return this.user && this.user.role === 'super_admin';
    }

    isCEOAdmin() {
        return this.user && ['ceo_admin', 'super_admin'].includes(this.user.role);
    }

    isBranchAdmin() {
        return this.user && ['branch_admin', 'ceo_admin', 'super_admin'].includes(this.user.role);
    }

    // ===== GET REDIRECT URL =====
    getRedirectUrl() {
        if (!this.user) return '/index.html';
        return this.redirectUrls[this.user.role] || this.redirectUrls.user;
    }

    // ===== GET AUTH HEADER =====
    getAuthHeader() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }
}

// ===== CREATE INSTANCE =====
const auth = new AuthService();

// ===== EXPOSE GLOBALLY =====
window.auth = auth;
window.API_URL = API_URL;

console.log('✅ Auth service initialized with 100-year token expiry');