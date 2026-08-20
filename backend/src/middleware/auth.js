const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserById } = require('../utils/fileHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'modern-furniture-secret-key';

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Find user (searches both users and admins)
            let user = findUserById(decoded.id);
            
            if (!user && decoded.email) {
                user = findUserByEmail(decoded.email);
            }
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Check if user is active
            if (user.isActive === false) {
                return res.status(401).json({
                    success: false,
                    message: 'Account deactivated. Contact support.'
                });
            }
            
            // Set user object with all properties
            req.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                branch: user.branch || null,
                isActive: user.isActive !== false,
                isAdmin: ['super_admin', 'ceo_admin', 'branch_admin', 'admin'].includes(user.role),
                isSuperAdmin: user.role === 'super_admin',
                isCEOAdmin: user.role === 'ceo_admin' || user.role === 'super_admin',
                isBranchAdmin: ['branch_admin', 'ceo_admin', 'super_admin'].includes(user.role)
            };
            
            req.userId = user.id;
            req.userRole = user.role;
            
            next();
        } catch (error) {
            console.error('❌ Token verification error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token provided'
        });
    }
};

// Check Super Admin
const isSuperAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'super_admin' || req.user.isSuperAdmin)) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Super Admin privileges required'
        });
    }
};

// Check CEO Admin
const isCEOAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'ceo_admin' || req.user.role === 'super_admin' || req.user.isCEOAdmin)) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'CEO Admin privileges required'
        });
    }
};

// Check Branch Admin
const isBranchAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'branch_admin' || req.user.role === 'ceo_admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Branch Admin privileges required'
        });
    }
};

// Check any admin
const isAdmin = (req, res, next) => {
    if (req.user && (req.user.isAdmin || ['super_admin', 'ceo_admin', 'branch_admin', 'admin'].includes(req.user.role))) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Admin privileges required'
        });
    }
};

// Check branch access
const hasBranchAccess = (branch) => {
    return (req, res, next) => {
        if (req.user.role === 'super_admin' || req.user.role === 'ceo_admin') {
            next();
        } else if (req.user.role === 'branch_admin' && req.user.branch === branch) {
            next();
        } else {
            res.status(403).json({
                success: false,
                message: 'You do not have access to this branch'
            });
        }
    };
};

// Rate limiting middleware
const rateLimit = (maxRequests, windowMs) => {
    const requests = {};
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        
        if (!requests[key]) {
            requests[key] = [];
        }
        
        // Clean old requests
        requests[key] = requests[key].filter(time => now - time < windowMs);
        
        if (requests[key].length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later'
            });
        }
        
        requests[key].push(now);
        next();
    };
};

module.exports = {
    protect,
    isSuperAdmin,
    isCEOAdmin,
    isBranchAdmin,
    isAdmin,
    hasBranchAccess,
    rateLimit
};