const jwt = require('jsonwebtoken');
const { auditLogger } = require('../utils/logger');

// In-memory blacklist for demo purposes (use database in production)
const blacklistedTokens = new Set();

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      auditLogger.warn('Authentication attempt without token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Check if token is blacklisted (in-memory for demo)
    if (blacklistedTokens.has(token)) {
      auditLogger.warn('Attempt to use blacklisted token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        token: token.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ 
        error: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        auditLogger.warn('Invalid token verification attempt', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          error: err.message,
          timestamp: new Date().toISOString()
        });

        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: 'Token has expired',
            code: 'TOKEN_EXPIRED'
          });
        }

        return res.status(403).json({ 
          error: 'Invalid token',
          code: 'TOKEN_INVALID'
        });
      }

      req.user = user;
      
      // Log successful authentication
      auditLogger.info('Successful authentication', {
        userId: user.id,
        username: user.username,
        role: user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        timestamp: new Date().toISOString()
      });

      next();
    });
  } catch (error) {
    auditLogger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Role-based access control middleware
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        auditLogger.warn('Authorization failure - insufficient role', {
          userId: req.user.id,
          username: req.user.username,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          timestamp: new Date().toISOString()
        });

        return res.status(403).json({ 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: allowedRoles
        });
      }

      // Log successful authorization
      auditLogger.info('Successful authorization', {
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        endpoint: req.path,
        timestamp: new Date().toISOString()
      });

      next();
    } catch (error) {
      auditLogger.error('Authorization middleware error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
      
      return res.status(500).json({ 
        error: 'Authorization service error',
        code: 'AUTH_SERVICE_ERROR'
      });
    }
  };
};

/**
 * Channel access control middleware for aviation crew communications
 */
const authorizeChannelAccess = (req, res, next) => {
  try {
    const { channel } = req.params;
    const userRole = req.user.role;

    // Define channel access permissions
    const channelPermissions = {
      'flight-deck': ['pilot', 'admin'],
      'cabin-crew': ['flight-attendant', 'pilot', 'admin'],
      'maintenance-bay': ['maintenance', 'pilot', 'admin'],
      'operations-center': ['pilot', 'maintenance', 'admin'],
      'general-crew': ['pilot', 'flight-attendant', 'maintenance', 'admin']
    };

    const allowedRoles = channelPermissions[channel];

    if (!allowedRoles) {
      auditLogger.warn('Access attempt to unknown channel', {
        userId: req.user.id,
        username: req.user.username,
        role: userRole,
        channel: channel,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      return res.status(404).json({ 
        error: 'Channel not found',
        code: 'CHANNEL_NOT_FOUND'
      });
    }

    if (!allowedRoles.includes(userRole)) {
      auditLogger.warn('Unauthorized channel access attempt', {
        userId: req.user.id,
        username: req.user.username,
        role: userRole,
        channel: channel,
        allowedRoles: allowedRoles,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({ 
        error: `Access denied to ${channel} channel`,
        code: 'CHANNEL_ACCESS_DENIED',
        allowedRoles: allowedRoles
      });
    }

    // Log successful channel access
    auditLogger.info('Channel access granted', {
      userId: req.user.id,
      username: req.user.username,
      role: userRole,
      channel: channel,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    auditLogger.error('Channel authorization middleware error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      channel: req.params?.channel,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      error: 'Channel authorization service error',
      code: 'CHANNEL_AUTH_ERROR'
    });
  }
};

/**
 * MFA verification middleware
 */
const requireMFA = (req, res, next) => {
  try {
    if (!req.user.mfaVerified) {
      auditLogger.warn('MFA verification required', {
        userId: req.user.id,
        username: req.user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({ 
        error: 'Multi-factor authentication required',
        code: 'MFA_REQUIRED'
      });
    }

    next();
  } catch (error) {
    auditLogger.error('MFA middleware error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      error: 'MFA service error',
      code: 'MFA_SERVICE_ERROR'
    });
  }
};

// Helper functions for token blacklisting
const addToBlacklist = (token) => {
  blacklistedTokens.add(token);
};

const isBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeChannelAccess,
  requireMFA,
  addToBlacklist,
  isBlacklisted
};
