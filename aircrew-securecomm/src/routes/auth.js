const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { validationRules, handleValidationErrors, sanitizeInput } = require('../middleware/security');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { auditLogger, logAuthEvent, logSuspiciousActivity } = require('../utils/logger');

const router = express.Router();

// Mock user database (replace with actual database in production)
const users = [
  {
    id: 1,
    username: 'captain@airline.com',
    email: 'captain@airline.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTuFJWK7wfDDAKm', // SecureFlight123!
    role: 'pilot',
    employeeId: 'PILOT-001',
    mfaSecret: null,
    mfaEnabled: false,
    isActive: true,
    lastLogin: null,
    failedLoginAttempts: 0,
    lockedUntil: null
  },
  {
    id: 2,
    username: 'crew@airline.com',
    email: 'crew@airline.com',
    password: '$2a$12$FMvTyD7UvCKhKxbRa8J8HuGpEn1.VMY.bMHEQZG1zXU8eQGLRUJ5G', // CabinSafe456!
    role: 'flight-attendant',
    employeeId: 'FA-002',
    mfaSecret: null,
    mfaEnabled: false,
    isActive: true,
    lastLogin: null,
    failedLoginAttempts: 0,
    lockedUntil: null
  },
  {
    id: 3,
    username: 'maint@airline.com',
    email: 'maint@airline.com',
    password: '$2a$12$ZXB7UvWrK9JQnP5kL2F8VeYxQ9D6hG3mNcRr4wRt5uE8qW3xY7vB2', // TechSecure789!
    role: 'maintenance',
    employeeId: 'MAINT-003',
    mfaSecret: null,
    mfaEnabled: false,
    isActive: true,
    lastLogin: null,
    failedLoginAttempts: 0,
    lockedUntil: null
  },
  {
    id: 4,
    username: 'admin@airline.com',
    email: 'admin@airline.com',
    password: '$2a$12$HKD5Rt9TlP2NvVxQ8L3YG.UwM7Y2BzXcVnR5oAhGq9Kx6E1sF4TpS', // AdminControl000!
    role: 'admin',
    employeeId: 'ADMIN-004',
    mfaSecret: null,
    mfaEnabled: false,
    isActive: true,
    lastLogin: null,
    failedLoginAttempts: 0,
    lockedUntil: null
  }
];

// Blacklisted tokens (replace with Redis or database in production)
const blacklistedTokens = new Set();

/**
 * Helper function to find user by username
 */
const findUserByUsername = (username) => {
  return users.find(user => user.username === username || user.email === username);
};

/**
 * Helper function to check if account is locked
 */
const isAccountLocked = (user) => {
  return user.lockedUntil && new Date() < new Date(user.lockedUntil);
};

/**
 * Helper function to lock account after failed attempts
 */
const lockAccount = (user) => {
  user.failedLoginAttempts += 1;
  
  if (user.failedLoginAttempts >= 5) {
    user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    
    logSuspiciousActivity('ACCOUNT_LOCKED', {
      userId: user.id,
      username: user.username,
      failedAttempts: user.failedLoginAttempts,
      lockDuration: '15 minutes'
    });
  }
};

/**
 * Helper function to reset failed login attempts
 */
const resetFailedAttempts = (user) => {
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
};

/**
 * Generate JWT tokens
 */
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
    mfaVerified: false // Will be set to true after MFA verification
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    issuer: process.env.JWT_ISSUER || 'aircrew-securecomm'
  });

  const refreshToken = jwt.sign(
    { id: user.id, tokenType: 'refresh' },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
      issuer: process.env.JWT_ISSUER || 'aircrew-securecomm'
    }
  );

  return { accessToken, refreshToken };
};

/**
 * POST /api/v1/auth/login
 * Authenticate user with username/password and optional MFA
 */
router.post('/login', 
  sanitizeInput,
  validationRules.login,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { username, password, mfaCode } = req.body;
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');

    // Find user
    const user = findUserByUsername(username);
    
    if (!user) {
      logAuthEvent('LOGIN_FAILED', null, {
        reason: 'USER_NOT_FOUND',
        username,
        ip: clientIP,
        userAgent,
        success: false
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      logAuthEvent('LOGIN_BLOCKED', user.id, {
        reason: 'ACCOUNT_LOCKED',
        username,
        ip: clientIP,
        userAgent,
        lockedUntil: user.lockedUntil,
        success: false
      });

      return res.status(423).json({
        error: 'Account temporarily locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED',
        retryAfter: Math.ceil((new Date(user.lockedUntil) - new Date()) / 1000)
      });
    }

    // Check if account is active
    if (!user.isActive) {
      logAuthEvent('LOGIN_FAILED', user.id, {
        reason: 'ACCOUNT_INACTIVE',
        username,
        ip: clientIP,
        userAgent,
        success: false
      });

      return res.status(403).json({
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
      lockAccount(user);
      
      logAuthEvent('LOGIN_FAILED', user.id, {
        reason: 'INVALID_PASSWORD',
        username,
        ip: clientIP,
        userAgent,
        failedAttempts: user.failedLoginAttempts,
        success: false
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // If MFA is enabled, verify the code
    if (user.mfaEnabled && user.mfaSecret) {
      if (!mfaCode) {
        return res.status(200).json({
          message: 'MFA code required',
          code: 'MFA_REQUIRED',
          requiresMFA: true
        });
      }

      const mfaValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaCode,
        window: 2 // Allow 2 time steps (60 seconds) tolerance
      });

      if (!mfaValid) {
        lockAccount(user);
        
        logAuthEvent('MFA_FAILED', user.id, {
          username,
          ip: clientIP,
          userAgent,
          failedAttempts: user.failedLoginAttempts,
          success: false
        });

        return res.status(401).json({
          error: 'Invalid MFA code',
          code: 'INVALID_MFA_CODE'
        });
      }
    }

    // Successful authentication - reset failed attempts
    resetFailedAttempts(user);
    user.lastLogin = new Date().toISOString();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // If MFA was provided and valid, mark as MFA verified in token
    if (user.mfaEnabled && mfaCode) {
      const payload = jwt.decode(accessToken);
      payload.mfaVerified = true;
      
      const mfaVerifiedToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
        issuer: process.env.JWT_ISSUER || 'aircrew-securecomm'
      });
      
      logAuthEvent('LOGIN_SUCCESS_WITH_MFA', user.id, {
        username,
        role: user.role,
        ip: clientIP,
        userAgent,
        success: true
      });

      return res.json({
        message: 'Authentication successful',
        accessToken: mfaVerifiedToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          mfaEnabled: user.mfaEnabled
        }
      });
    }

    logAuthEvent('LOGIN_SUCCESS', user.id, {
      username,
      role: user.role,
      ip: clientIP,
      userAgent,
      mfaRequired: user.mfaEnabled,
      success: true
    });

    res.json({
      message: 'Authentication successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        mfaEnabled: user.mfaEnabled
      }
    });
  })
);

/**
 * POST /api/v1/auth/logout
 * Logout user and blacklist token
 */
router.post('/logout', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      blacklistedTokens.add(token);
      
      logAuthEvent('LOGOUT', req.user.id, {
        username: req.user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      });
    }

    res.json({
      message: 'Logout successful',
      code: 'LOGOUT_SUCCESS'
    });
  })
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
  sanitizeInput,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    // Check if token is blacklisted
    if (blacklistedTokens.has(refreshToken)) {
      logSuspiciousActivity('BLACKLISTED_TOKEN_USAGE', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        tokenType: 'refresh'
      });

      return res.status(401).json({
        error: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      if (decoded.tokenType !== 'refresh') {
        return res.status(401).json({
          error: 'Invalid token type',
          code: 'INVALID_TOKEN_TYPE'
        });
      }

      const user = users.find(u => u.id === decoded.id);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'User not found or inactive',
          code: 'USER_NOT_FOUND'
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
      
      // Blacklist old refresh token
      blacklistedTokens.add(refreshToken);

      logAuthEvent('TOKEN_REFRESH', user.id, {
        username: user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      });

      res.json({
        message: 'Token refresh successful',
        accessToken,
        refreshToken: newRefreshToken
      });

    } catch (error) {
      logAuthEvent('TOKEN_REFRESH_FAILED', null, {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: false
      });

      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  })
);

/**
 * POST /api/v1/auth/enable-mfa
 * Enable MFA for user account
 */
router.post('/enable-mfa',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({
        error: 'MFA is already enabled',
        code: 'MFA_ALREADY_ENABLED'
      });
    }

    // Generate MFA secret
    const secret = speakeasy.generateSecret({
      name: `${user.username}@AirCrew SecureComm`,
      issuer: process.env.MFA_ISSUER || 'AirCrew Security Systems'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret (in production, encrypt this)
    user.mfaSecret = secret.base32;

    logAuthEvent('MFA_SETUP_INITIATED', user.id, {
      username: user.username,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'MFA setup initiated',
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  })
);

/**
 * POST /api/v1/auth/verify-mfa
 * Verify MFA setup and enable it
 */
router.post('/verify-mfa',
  authenticateToken,
  sanitizeInput,
  asyncHandler(async (req, res) => {
    const { mfaCode } = req.body;
    const user = users.find(u => u.id === req.user.id);

    if (!user || !user.mfaSecret) {
      return res.status(400).json({
        error: 'MFA setup not initiated',
        code: 'MFA_NOT_INITIATED'
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaCode,
      window: 2
    });

    if (!verified) {
      logAuthEvent('MFA_VERIFICATION_FAILED', user.id, {
        username: user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: false
      });

      return res.status(400).json({
        error: 'Invalid MFA code',
        code: 'INVALID_MFA_CODE'
      });
    }

    // Enable MFA
    user.mfaEnabled = true;

    logAuthEvent('MFA_ENABLED', user.id, {
      username: user.username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json({
      message: 'MFA enabled successfully',
      code: 'MFA_ENABLED'
    });
  })
);

/**
 * GET /api/v1/auth/profile
 * Get current user profile
 */
router.get('/profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        mfaEnabled: user.mfaEnabled,
        lastLogin: user.lastLogin,
        isActive: user.isActive
      }
    });
  })
);

module.exports = router;
