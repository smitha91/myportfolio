const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Security-focused audit log format
const auditLogFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      eventType: 'SECURITY_EVENT',
      ...meta
    });
  })
);

// Main application logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'aircrew-securecomm',
    version: '1.0.0'
  },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Security audit logger - separate from main application logs
const auditLogger = winston.createLogger({
  level: 'info',
  format: auditLogFormat,
  defaultMeta: {
    service: 'aircrew-securecomm-audit',
    version: '1.0.0'
  },
  transports: [
    // Dedicated audit log file
    new winston.transports.File({
      filename: path.join(logsDir, 'security-audit.log'),
      maxsize: 10485760, // 10MB - larger for security events
      maxFiles: 20,
      tailable: true
    }),
    
    // Critical security events to separate file
    new winston.transports.File({
      filename: path.join(logsDir, 'security-critical.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 15,
      tailable: true
    })
  ]
});

// Add console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
  
  auditLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `🔒 ${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
      })
    )
  }));
}

// Performance monitoring logger
const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'aircrew-securecomm-performance'
  },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    })
  ]
});

/**
 * Log security events with structured data
 */
const logSecurityEvent = (eventType, details, severity = 'info') => {
  const securityEvent = {
    eventType,
    severity,
    details,
    timestamp: new Date().toISOString(),
    source: 'aircrew-securecomm'
  };
  
  auditLogger[severity](`Security Event: ${eventType}`, securityEvent);
};

/**
 * Log authentication events
 */
const logAuthEvent = (action, userId, details = {}) => {
  logSecurityEvent('AUTHENTICATION', {
    action,
    userId,
    ...details
  }, details.success ? 'info' : 'warn');
};

/**
 * Log authorization events
 */
const logAuthzEvent = (action, userId, resource, granted, details = {}) => {
  logSecurityEvent('AUTHORIZATION', {
    action,
    userId,
    resource,
    granted,
    ...details
  }, granted ? 'info' : 'warn');
};

/**
 * Log data access events
 */
const logDataAccess = (action, userId, dataType, details = {}) => {
  logSecurityEvent('DATA_ACCESS', {
    action,
    userId,
    dataType,
    ...details
  });
};

/**
 * Log suspicious activity
 */
const logSuspiciousActivity = (activityType, details = {}) => {
  logSecurityEvent('SUSPICIOUS_ACTIVITY', {
    activityType,
    ...details
  }, 'warn');
};

/**
 * Log performance metrics
 */
const logPerformance = (metric, value, details = {}) => {
  performanceLogger.info('Performance Metric', {
    metric,
    value,
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    requestId: req.securityContext?.requestId
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    // Log request completion
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userId: req.user?.id,
      requestId: req.securityContext?.requestId
    });
    
    // Log performance metrics
    logPerformance('REQUEST_DURATION', duration, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode
    });
    
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = {
  logger,
  auditLogger,
  performanceLogger,
  logSecurityEvent,
  logAuthEvent,
  logAuthzEvent,
  logDataAccess,
  logSuspiciousActivity,
  logPerformance,
  requestLogger
};
