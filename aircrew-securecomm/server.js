const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { logger, auditLogger } = require('./src/utils/logger');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { securityMiddleware } = require('./src/middleware/security');
const authRoutes = require('./src/routes/auth');
const messageRoutes = require('./src/routes/messages');
const adminRoutes = require('./src/routes/admin');
const securityRoutes = require('./src/routes/security');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Headers and CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      reportUri: process.env.CSP_REPORT_URI || '/api/v1/security/csp-report'
    },
  },
  hsts: {
    maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://aircrew-securecomm.herokuapp.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request Logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditLogger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      timestamp: new Date().toISOString()
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

const authLimiter = rateLimit({
  windowMs: (process.env.LOGIN_RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.LOGIN_RATE_LIMIT_MAX || 5,
  message: {
    error: 'Too many login attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    auditLogger.warn('Authentication rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      timestamp: new Date().toISOString()
    });
    res.status(429).json({
      error: 'Too many login attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(securityMiddleware);

// Apply rate limiting
app.use('/api', generalLimiter);
app.use('/api/v1/auth', authLimiter);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/security', securityRoutes);

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
  });
}

// API Documentation (Development only)
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_API_DOCS === 'true') {
  app.get('/api-docs', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AirCrew SecureComm API Documentation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; }
          .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .method { font-weight: bold; color: #007acc; }
          .security { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>🛩️ AirCrew SecureComm API Documentation</h1>
        
        <div class="security">
          <h3>🔒 Security Notice</h3>
          <p>All endpoints require appropriate authentication and authorization. Rate limiting is enforced.</p>
        </div>
        
        <h2>Authentication Endpoints</h2>
        <div class="endpoint">
          <span class="method">POST</span> /api/v1/auth/login - User login with MFA
        </div>
        <div class="endpoint">
          <span class="method">POST</span> /api/v1/auth/logout - Secure logout with token blacklisting
        </div>
        <div class="endpoint">
          <span class="method">POST</span> /api/v1/auth/refresh - Refresh access token
        </div>
        
        <h2>Message Endpoints</h2>
        <div class="endpoint">
          <span class="method">GET</span> /api/v1/messages/:channel - Get channel messages (RBAC protected)
        </div>
        <div class="endpoint">
          <span class="method">POST</span> /api/v1/messages - Send message to channel (RBAC protected)
        </div>
        
        <h2>Admin Endpoints</h2>
        <div class="endpoint">
          <span class="method">GET</span> /api/v1/admin/audit-logs - View audit logs (Admin only)
        </div>
        <div class="endpoint">
          <span class="method">POST</span> /api/v1/admin/revoke-token - Revoke user tokens (Admin only)
        </div>
      </body>
      </html>
    `);
  });
}

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🛩️ AirCrew SecureComm server running on port ${PORT}`);
  logger.info(`🔒 Security features: Helmet, CORS, Rate Limiting, Input Validation`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.info(`📋 API Documentation: http://localhost:${PORT}/api-docs`);
  }
});

module.exports = app;
