const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Optional auth middleware - doesn't fail if no token, just sets req.user if available
auth.optional = async (req, res, next) => {
    try {
        // Try to get token from header, cookie, or query parameter
        const token = req.header('Authorization')?.replace('Bearer ', '') 
                   || req.cookies?.token 
                   || req.query?.token;
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            
            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        // Silently fail - this is optional auth
        console.log('Optional auth failed (non-critical):', error.message);
    }
    
    next();
};

module.exports = auth;




