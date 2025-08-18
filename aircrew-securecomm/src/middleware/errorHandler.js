const { logger, auditLogger } = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error with full context
  const errorContext = {
    error: err.message,
    stack: err.stack,
    endpoint: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    username: req.user?.username,
    timestamp: new Date().toISOString(),
    requestId: req.securityContext?.requestId
  };

  // Log security-relevant errors to audit log
  if (err.name === 'UnauthorizedError' || 
      err.name === 'ForbiddenError' || 
      err.message.includes('authentication') ||
      err.message.includes('authorization')) {
    auditLogger.error('Security-related error', errorContext);
  } else {
    logger.error('Application error', errorContext);
  }

  // Don't leak internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Default error response
  let statusCode = 500;
  let errorResponse = {
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  };

  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      statusCode = 400;
      errorResponse = {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.details || err.message,
        timestamp: new Date().toISOString()
      };
      break;

    case 'UnauthorizedError':
    case 'JsonWebTokenError':
      statusCode = 401;
      errorResponse = {
        error: 'Authentication failed',
        code: 'AUTHENTICATION_FAILED',
        timestamp: new Date().toISOString()
      };
      break;

    case 'TokenExpiredError':
      statusCode = 401;
      errorResponse = {
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      };
      break;

    case 'ForbiddenError':
      statusCode = 403;
      errorResponse = {
        error: 'Access forbidden',
        code: 'ACCESS_FORBIDDEN',
        timestamp: new Date().toISOString()
      };
      break;

    case 'NotFoundError':
      statusCode = 404;
      errorResponse = {
        error: 'Resource not found',
        code: 'RESOURCE_NOT_FOUND',
        timestamp: new Date().toISOString()
      };
      break;

    case 'ConflictError':
      statusCode = 409;
      errorResponse = {
        error: 'Resource conflict',
        code: 'RESOURCE_CONFLICT',
        details: err.message,
        timestamp: new Date().toISOString()
      };
      break;

    case 'RateLimitError':
      statusCode = 429;
      errorResponse = {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: err.retryAfter || 900, // 15 minutes default
        timestamp: new Date().toISOString()
      };
      break;

    case 'DatabaseError':
    case 'SequelizeError':
      statusCode = 500;
      errorResponse = {
        error: 'Database service error',
        code: 'DATABASE_ERROR',
        timestamp: new Date().toISOString()
      };
      break;

    default:
      // Check for specific HTTP status codes
      if (err.statusCode || err.status) {
        statusCode = err.statusCode || err.status;
        errorResponse.error = err.message || 'Request failed';
        errorResponse.code = err.code || 'REQUEST_FAILED';
      }
      break;
  }

  // Add development-specific error details
  if (isDevelopment) {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || err.message;
  }

  // Add request ID for tracking
  if (req.securityContext?.requestId) {
    errorResponse.requestId = req.securityContext.requestId;
  }

  // Security headers for error responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  auditLogger.warn('404 - Resource not found', {
    endpoint: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    error: 'Resource not found',
    code: 'RESOURCE_NOT_FOUND',
    endpoint: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Async error wrapper to catch promise rejections
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error classes for better error handling
 */
class CustomError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
  }
}

class ValidationError extends CustomError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class UnauthorizedError extends CustomError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends CustomError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends CustomError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends CustomError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends CustomError {
  constructor(message = 'Rate limit exceeded', retryAfter = 900) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  CustomError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError
};
