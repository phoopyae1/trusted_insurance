const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
require('dotenv').config();

async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  // Special handling for customer-agent endpoints used by chat/AI tools:
  // If there is NO Authorization header but a userId is provided in the body/query,
  // we authenticate using that userId (only for CUSTOMER role).
  const isCustomerAgentRoute =
    (req.baseUrl && req.baseUrl.includes('customer-agent')) ||
    (req.originalUrl && req.originalUrl.includes('/api/customer-agent/'));

  const userIdFromBody = req.body && req.body.userId;
  const userIdFromQuery = req.query && req.query.userId;

  if (!header && isCustomerAgentRoute && (userIdFromBody || userIdFromQuery)) {
    try {
      const customerId = Number(userIdFromBody || userIdFromQuery);
      if (!Number.isFinite(customerId)) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid userId provided for authentication',
            code: 'INVALID_USER_ID'
          }
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User account not found. Please log in again.',
            code: 'USER_NOT_FOUND'
          }
        });
      }

      if (user.role !== 'CUSTOMER') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'This endpoint is only accessible to customers',
            code: 'FORBIDDEN',
            requiredRole: 'CUSTOMER',
            userRole: user.role,
          }
        });
      }

      // Attach user to request and continue without JWT
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };

      return next();
    } catch (err) {
      console.error('Error during userId-based authentication:', err);
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication failed. Please try again.',
          code: 'AUTHENTICATION_FAILED'
        }
      });
    }
  }

  // Standard JWT-based authentication
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
    // Verify JWT token signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token payload',
          code: 'INVALID_TOKEN_PAYLOAD'
        }
      });
    }
    
    // Verify user still exists in database and get latest user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User account not found. Token is invalid.',
          code: 'USER_NOT_FOUND'
        }
      });
    }
    
    // Verify email matches (additional security check)
    if (decoded.email && decoded.email !== user.email) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token email mismatch. Please log in again.',
          code: 'TOKEN_EMAIL_MISMATCH'
        }
      });
    }
    
    // Use database user data (more reliable than token payload)
    // This ensures role changes are reflected immediately
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    
    next();
  } catch (err) {
    let message = 'Invalid token';
    let code = 'INVALID_TOKEN';
    
    if (err.name === 'TokenExpiredError') {
      message = 'Token has expired. Please refresh your session.';
      code = 'TOKEN_EXPIRED';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token format';
      code = 'INVALID_TOKEN_FORMAT';
    } else if (err.code === 'P2002' || err.message?.includes('prisma')) {
      // Database error
      message = 'Authentication service error. Please try again.';
      code = 'AUTH_SERVICE_ERROR';
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

// Middleware specifically for customer role
function requireCustomer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      }
    });
  }
  
  if (req.user.role !== 'CUSTOMER') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Forbidden: This endpoint is only accessible to customers',
        code: 'FORBIDDEN',
        requiredRole: 'CUSTOMER',
        userRole: req.user.role
      }
    });
  }
  
  next();
}

module.exports = { authenticate, authorize, requireCustomer };
