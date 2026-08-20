// ============================================
// AUTH SERVICE - Using Correct Endpoints
// ============================================

const API_URL = 'https://modern-furniture-api.onrender.com/api';

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

    async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Login failed');

            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(name, email, password, phone = '', address = {}) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, phone, address })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Registration failed');

            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        if (!this.token) return null;

        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const data = await response.json();
            if (!response.ok) {
                this.logout();
                return null;
            }

            this.user = data.user;
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            console.error('Get user error:', error);
            this.logout();
            return null;
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
        window.location.href = '/index.html';
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
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

    getRedirectUrl() {
        if (!this.user) return '/index.html';
        return this.redirectUrls[this.user.role] || this.redirectUrls.user;
    }

    getAuthHeader() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }
}

// ===== CREATE INSTANCE =====
const auth = new AuthService();
window.auth = auth;
window.API_URL = API_URL;

console.log('✅ Auth service initialized');