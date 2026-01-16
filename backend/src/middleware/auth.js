const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'No authorization header provided',
        code: 'UNAUTHORIZED'
      }
    });
  }
  
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid authorization header format. Use: Bearer <token>',
        code: 'INVALID_AUTH_HEADER'
      }
    });
  }
  
  const token = parts[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token is missing',
        code: 'MISSING_TOKEN'
      }
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    let message = 'Invalid token';
    let code = 'INVALID_TOKEN';
    
    if (err.name === 'TokenExpiredError') {
      message = 'Token has expired';
      code = 'TOKEN_EXPIRED';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token format';
      code = 'INVALID_TOKEN_FORMAT';
    }
    
    return res.status(401).json({
      success: false,
      error: {
        message,
        code
      }
    });
  }
}

function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ 
        success: false,
        error: {
          message: 'Forbidden: User not authenticated',
          code: 'FORBIDDEN'
        }
      });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: {
          message: `Forbidden: Requires one of the following roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
          code: 'FORBIDDEN',
          requiredRoles: roles,
          userRole: req.user.role
        }
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
