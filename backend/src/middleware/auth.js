const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserById } = require('../utils/fileHandler');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            console.log('🔑 Decoded token:', decoded);
            
            // Try to find user by ID first (searches both users and admins)
            let user = findUserById(decoded.id);
            
            // If not found by ID, try by email
            if (!user && decoded.email) {
                user = findUserByEmail(decoded.email);
                if (user) {
                    console.log('✅ Found user by email:', user.name);
                }
            }
            
            if (user) {
                req.user = {
                    id: user.id,
                    name: user.name || 'Unknown Admin',
                    email: user.email,
                    role: user.role || 'admin',
                    branch: user.branch || null
                };
                console.log('✅ User authenticated from database:', req.user.name, '(', req.user.role, ')');
            } else {
                // Fallback to decoded token data
                req.user = {
                    id: decoded.id,
                    name: decoded.name || 'Unknown Admin',
                    email: decoded.email || 'unknown@example.com',
                    role: decoded.role || 'admin',
                    branch: decoded.branch || null
                };
                console.log('⚠️ User not found in database, using token data:', req.user.name, '(', req.user.role, ')');
            }
            
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

// Check if user is Super Admin
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Super Admin privileges required.'
        });
    }
};

// Check if user is CEO Admin
const isCEOAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'ceo_admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. CEO Admin privileges required.'
        });
    }
};

// Check if user is Branch Admin
const isBranchAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'branch_admin' || 
                     req.user.role === 'super_admin' || 
                     req.user.role === 'ceo_admin')) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Branch Admin privileges required.'
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

module.exports = { protect, isSuperAdmin, isCEOAdmin, isBranchAdmin, hasBranchAccess };