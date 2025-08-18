const { body, validationResult } = require('express-validator');
const { auditLogger } = require('../utils/logger');

/**
 * Input sanitization and validation middleware
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Remove potentially dangerous characters
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
        .replace(/on\w+='[^']*'/gi, '') // Remove event handlers (single quotes)
        .trim();
    };

    // Recursively sanitize request body
    const sanitizeObject = (obj) => {
      if (obj === null || obj === undefined) return obj;
      
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[sanitizeString(key)] = sanitizeObject(value);
        }
        return sanitized;
      }
      
      return obj;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    auditLogger.error('Input sanitization error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      endpoint: req.path,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      error: 'Input processing error',
      code: 'INPUT_PROCESSING_ERROR'
    });
  }
};

/**
 * Security headers middleware
 */
const securityMiddleware = (req, res, next) => {
  // Add security-related request tracking
  req.securityContext = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  // Set additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Validation rules for different endpoints
 */
const validationRules = {
  login: [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9@._-]+$/)
      .withMessage('Username contains invalid characters'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters'),
    body('mfaCode')
      .optional()
      .isLength({ min: 6, max: 6 })
      .withMessage('MFA code must be exactly 6 digits')
      .isNumeric()
      .withMessage('MFA code must be numeric')
  ],

  message: [
    body('content')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message content must be between 1 and 1000 characters')
      .trim(),
    body('channel')
      .isIn(['flight-deck', 'cabin-crew', 'maintenance-bay', 'operations-center', 'general-crew'])
      .withMessage('Invalid channel specified'),
    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'critical'])
      .withMessage('Invalid priority level')
  ],

  userRegistration: [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9@._-]+$/)
      .withMessage('Username contains invalid characters'),
    body('email')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    body('role')
      .isIn(['pilot', 'flight-attendant', 'maintenance', 'admin'])
      .withMessage('Invalid role specified'),
    body('employeeId')
      .isLength({ min: 3, max: 20 })
      .withMessage('Employee ID must be between 3 and 20 characters')
      .matches(/^[A-Z0-9-]+$/)
      .withMessage('Employee ID must contain only uppercase letters, numbers, and hyphens')
  ]
};

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    auditLogger.warn('Validation errors detected', {
      errors: errors.array(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }

  next();
};

/**
 * SQL injection prevention middleware
 */
const preventSQLInjection = (req, res, next) => {
  try {
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\'|\"|;|--|\*|\||&)/g,
      /(\b(OR|AND)\b.*=.*)/gi
    ];

    const checkForSQLInjection = (value) => {
      if (typeof value !== 'string') return false;
      
      return sqlInjectionPatterns.some(pattern => pattern.test(value));
    };

    const scanObject = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && checkForSQLInjection(value)) {
          auditLogger.warn('Potential SQL injection attempt detected', {
            field: currentPath,
            value: value,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path,
            userId: req.user?.id,
            timestamp: new Date().toISOString()
          });

          return res.status(400).json({
            error: 'Invalid input detected',
            code: 'INVALID_INPUT',
            field: currentPath
          });
        }
        
        if (typeof value === 'object' && value !== null) {
          const result = scanObject(value, currentPath);
          if (result) return result;
        }
      }
      return null;
    };

    // Check request body
    if (req.body && typeof req.body === 'object') {
      const result = scanObject(req.body);
      if (result) return result;
    }

    // Check query parameters
    if (req.query && typeof req.query === 'object') {
      const result = scanObject(req.query);
      if (result) return result;
    }

    next();
  } catch (error) {
    auditLogger.error('SQL injection prevention error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      endpoint: req.path,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      error: 'Security validation error',
      code: 'SECURITY_VALIDATION_ERROR'
    });
  }
};

module.exports = {
  sanitizeInput,
  securityMiddleware,
  validationRules,
  handleValidationErrors,
  preventSQLInjection
};
