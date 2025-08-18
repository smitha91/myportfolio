const express = require('express');
const { authenticateToken, authorizeChannelAccess } = require('../middleware/auth');
const { validationRules, handleValidationErrors, sanitizeInput } = require('../middleware/security');
const { asyncHandler } = require('../middleware/errorHandler');
const { auditLogger, logDataAccess } = require('../utils/logger');

const router = express.Router();

// Mock message database (replace with actual database in production)
const messages = [];

/**
 * GET /api/v1/messages/:channel
 * Get messages from a specific channel (RBAC protected)
 */
router.get('/:channel',
  authenticateToken,
  authorizeChannelAccess,
  asyncHandler(async (req, res) => {
    const { channel } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Filter messages by channel
    const channelMessages = messages
      .filter(msg => msg.channel === channel)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    logDataAccess('READ_MESSAGES', req.user.id, channel, {
      channel,
      messageCount: channelMessages.length,
      userRole: req.user.role,
      ip: req.ip
    });

    res.json({
      messages: channelMessages,
      channel,
      total: messages.filter(msg => msg.channel === channel).length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  })
);

/**
 * POST /api/v1/messages
 * Send a message to a channel (RBAC protected)
 */
router.post('/',
  sanitizeInput,
  validationRules.message,
  handleValidationErrors,
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { content, channel, priority = 'normal' } = req.body;

    // Verify channel access using the same logic as the middleware
    const channelPermissions = {
      'flight-deck': ['pilot', 'admin'],
      'cabin-crew': ['flight-attendant', 'pilot', 'admin'],
      'maintenance-bay': ['maintenance', 'pilot', 'admin'],
      'operations-center': ['pilot', 'maintenance', 'admin'],
      'general-crew': ['pilot', 'flight-attendant', 'maintenance', 'admin']
    };

    const allowedRoles = channelPermissions[channel];
    
    if (!allowedRoles || !allowedRoles.includes(req.user.role)) {
      auditLogger.warn('Unauthorized message send attempt', {
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        channel: channel,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        error: `Access denied to ${channel} channel`,
        code: 'CHANNEL_ACCESS_DENIED',
        allowedRoles: allowedRoles
      });
    }

    // Create message
    const message = {
      id: messages.length + 1,
      content,
      channel,
      priority,
      sender: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        employeeId: req.user.employeeId
      },
      timestamp: new Date().toISOString(),
      edited: false,
      editHistory: []
    };

    messages.push(message);

    logDataAccess('SEND_MESSAGE', req.user.id, channel, {
      messageId: message.id,
      channel,
      priority,
      contentLength: content.length,
      userRole: req.user.role,
      ip: req.ip
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  })
);

/**
 * PUT /api/v1/messages/:messageId
 * Edit a message (only by sender or admin)
 */
router.put('/:messageId',
  sanitizeInput,
  validationRules.message,
  handleValidationErrors,
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = messages.find(msg => msg.id === parseInt(messageId));

    if (!message) {
      return res.status(404).json({
        error: 'Message not found',
        code: 'MESSAGE_NOT_FOUND'
      });
    }

    // Check if user can edit (sender or admin)
    if (message.sender.id !== req.user.id && req.user.role !== 'admin') {
      auditLogger.warn('Unauthorized message edit attempt', {
        userId: req.user.id,
        username: req.user.username,
        messageId: parseInt(messageId),
        originalSender: message.sender.id,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        error: 'Can only edit your own messages',
        code: 'EDIT_PERMISSION_DENIED'
      });
    }

    // Store edit history
    message.editHistory.push({
      previousContent: message.content,
      editedBy: req.user.id,
      editedAt: new Date().toISOString()
    });

    message.content = content;
    message.edited = true;

    logDataAccess('EDIT_MESSAGE', req.user.id, message.channel, {
      messageId: parseInt(messageId),
      channel: message.channel,
      editCount: message.editHistory.length,
      userRole: req.user.role,
      ip: req.ip
    });

    res.json({
      message: 'Message updated successfully',
      data: message
    });
  })
);

/**
 * DELETE /api/v1/messages/:messageId
 * Delete a message (only by sender or admin)
 */
router.delete('/:messageId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const messageIndex = messages.findIndex(msg => msg.id === parseInt(messageId));

    if (messageIndex === -1) {
      return res.status(404).json({
        error: 'Message not found',
        code: 'MESSAGE_NOT_FOUND'
      });
    }

    const message = messages[messageIndex];

    // Check if user can delete (sender or admin)
    if (message.sender.id !== req.user.id && req.user.role !== 'admin') {
      auditLogger.warn('Unauthorized message deletion attempt', {
        userId: req.user.id,
        username: req.user.username,
        messageId: parseInt(messageId),
        originalSender: message.sender.id,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        error: 'Can only delete your own messages',
        code: 'DELETE_PERMISSION_DENIED'
      });
    }

    // Remove message
    messages.splice(messageIndex, 1);

    logDataAccess('DELETE_MESSAGE', req.user.id, message.channel, {
      messageId: parseInt(messageId),
      channel: message.channel,
      userRole: req.user.role,
      ip: req.ip
    });

    res.json({
      message: 'Message deleted successfully',
      code: 'MESSAGE_DELETED'
    });
  })
);

/**
 * GET /api/v1/messages/:messageId/history
 * Get edit history of a message (admin only)
 */
router.get('/:messageId/history',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    // Only admins can view edit history
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }

    const message = messages.find(msg => msg.id === parseInt(messageId));

    if (!message) {
      return res.status(404).json({
        error: 'Message not found',
        code: 'MESSAGE_NOT_FOUND'
      });
    }

    logDataAccess('VIEW_MESSAGE_HISTORY', req.user.id, message.channel, {
      messageId: parseInt(messageId),
      channel: message.channel,
      historyCount: message.editHistory.length,
      userRole: req.user.role,
      ip: req.ip
    });

    res.json({
      messageId: parseInt(messageId),
      editHistory: message.editHistory,
      currentContent: message.content,
      totalEdits: message.editHistory.length
    });
  })
);

/**
 * GET /api/v1/messages/channels/list
 * Get list of available channels for current user role
 */
router.get('/channels/list',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userRole = req.user.role;

    const channelPermissions = {
      'flight-deck': ['pilot', 'admin'],
      'cabin-crew': ['flight-attendant', 'pilot', 'admin'],
      'maintenance-bay': ['maintenance', 'pilot', 'admin'],
      'operations-center': ['pilot', 'maintenance', 'admin'],
      'general-crew': ['pilot', 'flight-attendant', 'maintenance', 'admin']
    };

    const channelDescriptions = {
      'flight-deck': {
        name: 'Flight Deck',
        description: 'Critical flight operations and pilot coordination',
        icon: '✈️',
        priority: 'high'
      },
      'cabin-crew': {
        name: 'Cabin Crew',
        description: 'Flight attendant coordination and passenger services',
        icon: '👩‍✈️',
        priority: 'normal'
      },
      'maintenance-bay': {
        name: 'Maintenance Bay',
        description: 'Technical staff and aircraft maintenance',
        icon: '🔧',
        priority: 'high'
      },
      'operations-center': {
        name: 'Operations Center',
        description: 'Ground operations and dispatch coordination',
        icon: '🏢',
        priority: 'normal'
      },
      'general-crew': {
        name: 'General Crew',
        description: 'Cross-functional team communication',
        icon: '👥',
        priority: 'low'
      }
    };

    const accessibleChannels = Object.entries(channelPermissions)
      .filter(([channel, allowedRoles]) => allowedRoles.includes(userRole))
      .map(([channel]) => ({
        id: channel,
        ...channelDescriptions[channel],
        messageCount: messages.filter(msg => msg.channel === channel).length
      }));

    res.json({
      channels: accessibleChannels,
      userRole,
      totalChannels: accessibleChannels.length
    });
  })
);

module.exports = router;
