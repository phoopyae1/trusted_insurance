const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400, 'DUPLICATE_ENTRY');
  }

  if (err.code === 'P2025') {
    const message = 'Record not found';
    error = new AppError(message, 404, 'NOT_FOUND');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Handle ValidationError with errors array
  if (err.errors && Array.isArray(err.errors)) {
    return res.status(error.statusCode || 400).json({
      success: false,
      error: {
        message: error.message || 'Validation failed',
        code: error.code || 'VALIDATION_ERROR',
        errors: err.errors
      }
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      code: error.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}

module.exports = errorHandler;
