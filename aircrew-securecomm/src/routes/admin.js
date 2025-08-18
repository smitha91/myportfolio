const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/security');
const { asyncHandler } = require('../middleware/errorHandler');
const { auditLogger, logDataAccess, logSecurityEvent } = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/v1/admin/audit-logs
 * Get security audit logs (Admin only)
 */
router.get('/audit-logs',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate, 
      eventType, 
      userId, 
      severity = 'info',
      limit = 100,
      offset = 0 
    } = req.query;

    // In a real implementation, this would query a database
    // For demo purposes, we'll return mock audit log data
    const mockAuditLogs = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        eventType: 'AUTHENTICATION',
        severity: 'info',
        userId: 2,
        username: 'crew@airline.com',
        action: 'LOGIN_SUCCESS',
        details: {
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          role: 'flight-attendant'
        }
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        eventType: 'AUTHORIZATION',
        severity: 'warn',
        userId: 3,
        username: 'maint@airline.com',
        action: 'CHANNEL_ACCESS_DENIED',
        details: {
          channel: 'flight-deck',
          requiredRoles: ['pilot', 'admin'],
          userRole: 'maintenance',
          ip: '192.168.1.101'
        }
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity: 'warn',
        userId: null,
        username: 'unknown',
        action: 'RATE_LIMIT_EXCEEDED',
        details: {
          ip: '10.0.0.1',
          endpoint: '/api/v1/auth/login',
          attemptCount: 10
        }
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        eventType: 'DATA_ACCESS',
        severity: 'info',
        userId: 1,
        username: 'captain@airline.com',
        action: 'SEND_MESSAGE',
        details: {
          channel: 'flight-deck',
          messageId: 5,
          priority: 'high'
        }
      }
    ];

    logDataAccess('VIEW_AUDIT_LOGS', req.user.id, 'AUDIT_LOGS', {
      filters: { startDate, endDate, eventType, userId, severity },
      requestedBy: req.user.username,
      ip: req.ip
    });

    res.json({
      logs: mockAuditLogs,
      total: mockAuditLogs.length,
      filters: {
        startDate,
        endDate,
        eventType,
        userId,
        severity,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      meta: {
        requestedBy: req.user.username,
        requestTimestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * POST /api/v1/admin/revoke-token
 * Revoke user tokens (Admin only)
 */
router.post('/revoke-token',
  sanitizeInput,
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        code: 'USER_ID_REQUIRED'
      });
    }

    // In a real implementation, this would:
    // 1. Add all user's tokens to blacklist
    // 2. Update database records
    // 3. Optionally force user logout on all devices

    logSecurityEvent('TOKEN_REVOCATION', {
      targetUserId: userId,
      revokedBy: req.user.id,
      revokedByUsername: req.user.username,
      reason: reason || 'Admin revocation',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }, 'warn');

    res.json({
      message: `All tokens for user ${userId} have been revoked`,
      code: 'TOKENS_REVOKED',
      revokedBy: req.user.username,
      reason: reason || 'Admin revocation',
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * GET /api/v1/admin/users
 * Get user list and status (Admin only)
 */
router.get('/users',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    const { status = 'all', role, limit = 50, offset = 0 } = req.query;

    // Mock user data (replace with database query)
    const mockUsers = [
      {
        id: 1,
        username: 'captain@airline.com',
        email: 'captain@airline.com',
        role: 'pilot',
        employeeId: 'PILOT-001',
        isActive: true,
        mfaEnabled: false,
        lastLogin: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        loginCount: 45,
        failedLoginAttempts: 0
      },
      {
        id: 2,
        username: 'crew@airline.com',
        email: 'crew@airline.com',
        role: 'flight-attendant',
        employeeId: 'FA-002',
        isActive: true,
        mfaEnabled: true,
        lastLogin: new Date(Date.now() - 1800000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
        loginCount: 67,
        failedLoginAttempts: 1
      },
      {
        id: 3,
        username: 'maint@airline.com',
        email: 'maint@airline.com',
        role: 'maintenance',
        employeeId: 'MAINT-003',
        isActive: true,
        mfaEnabled: false,
        lastLogin: new Date(Date.now() - 7200000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
        loginCount: 23,
        failedLoginAttempts: 0
      }
    ];

    logDataAccess('VIEW_USER_LIST', req.user.id, 'USER_MANAGEMENT', {
      filters: { status, role },
      requestedBy: req.user.username,
      ip: req.ip
    });

    res.json({
      users: mockUsers,
      total: mockUsers.length,
      filters: {
        status,
        role,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      summary: {
        totalUsers: mockUsers.length,
        activeUsers: mockUsers.filter(u => u.isActive).length,
        mfaEnabledUsers: mockUsers.filter(u => u.mfaEnabled).length,
        roles: {
          pilot: mockUsers.filter(u => u.role === 'pilot').length,
          'flight-attendant': mockUsers.filter(u => u.role === 'flight-attendant').length,
          maintenance: mockUsers.filter(u => u.role === 'maintenance').length,
          admin: mockUsers.filter(u => u.role === 'admin').length
        }
      }
    });
  })
);

/**
 * PUT /api/v1/admin/users/:userId/status
 * Update user status (activate/deactivate) (Admin only)
 */
router.put('/users/:userId/status',
  sanitizeInput,
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isActive, reason } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'isActive must be a boolean value',
        code: 'INVALID_STATUS_VALUE'
      });
    }

    // Prevent admin from deactivating themselves
    if (parseInt(userId) === req.user.id && !isActive) {
      return res.status(400).json({
        error: 'Cannot deactivate your own account',
        code: 'SELF_DEACTIVATION_PREVENTED'
      });
    }

    logSecurityEvent('USER_STATUS_CHANGE', {
      targetUserId: parseInt(userId),
      newStatus: isActive ? 'ACTIVE' : 'INACTIVE',
      changedBy: req.user.id,
      changedByUsername: req.user.username,
      reason: reason || 'Admin action',
      ip: req.ip
    }, 'warn');

    res.json({
      message: `User ${userId} has been ${isActive ? 'activated' : 'deactivated'}`,
      code: 'USER_STATUS_UPDATED',
      userId: parseInt(userId),
      newStatus: isActive ? 'active' : 'inactive',
      updatedBy: req.user.username,
      reason: reason || 'Admin action',
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * GET /api/v1/admin/security-metrics
 * Get security metrics and statistics (Admin only)
 */
router.get('/security-metrics',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    const { timeframe = '24h' } = req.query;

    // Mock security metrics (replace with actual data collection)
    const mockMetrics = {
      timeframe,
      authentication: {
        totalLogins: 156,
        successfulLogins: 148,
        failedLogins: 8,
        mfaVerifications: 67,
        accountLockouts: 2,
        successRate: 94.9
      },
      authorization: {
        totalRequests: 1247,
        authorizedRequests: 1198,
        deniedRequests: 49,
        rbacViolations: 12,
        channelAccessDenied: 37
      },
      security: {
        rateLimitHits: 23,
        suspiciousActivities: 5,
        sqlInjectionAttempts: 3,
        xssAttempts: 1,
        invalidTokenUsage: 8
      },
      messages: {
        totalSent: 342,
        channelDistribution: {
          'general-crew': 145,
          'cabin-crew': 89,
          'flight-deck': 67,
          'maintenance-bay': 31,
          'operations-center': 10
        },
        priorityDistribution: {
          low: 201,
          normal: 98,
          high: 34,
          critical: 9
        }
      },
      performance: {
        averageResponseTime: 187,
        peakConcurrentUsers: 23,
        systemUptime: 99.97,
        errorRate: 0.03
      }
    };

    logDataAccess('VIEW_SECURITY_METRICS', req.user.id, 'SECURITY_METRICS', {
      timeframe,
      requestedBy: req.user.username,
      ip: req.ip
    });

    res.json({
      metrics: mockMetrics,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.username
    });
  })
);

/**
 * POST /api/v1/admin/security-alert
 * Create a security alert (Admin only)
 */
router.post('/security-alert',
  sanitizeInput,
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    const { severity, title, description, affectedUsers, action } = req.body;

    if (!severity || !title || !description) {
      return res.status(400).json({
        error: 'Severity, title, and description are required',
        code: 'MISSING_ALERT_FIELDS'
      });
    }

    const alertId = `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    logSecurityEvent('SECURITY_ALERT_CREATED', {
      alertId,
      severity,
      title,
      description,
      affectedUsers: affectedUsers || [],
      action: action || 'NONE',
      createdBy: req.user.id,
      createdByUsername: req.user.username,
      ip: req.ip
    }, 'error');

    res.status(201).json({
      message: 'Security alert created successfully',
      alertId,
      severity,
      title,
      description,
      createdBy: req.user.username,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE'
    });
  })
);

module.exports = router;
