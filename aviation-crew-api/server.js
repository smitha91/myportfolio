/**
 * Aviation Crew Communication API Server
 * 
 * A secure Node.js/Express API for aviation crew communication
 * Features: JWT authentication, role-based access, message encryption
 * 
 * Author: Ashley Smith
 */

// ===== IMPORT DEPENDENCIES =====
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// ===== IMPORT CUSTOM MODULES =====
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const documentRoutes = require('./routes/documents');
const crewRoutes = require('./routes/crew');
const { globalErrorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

// ===== CREATE EXPRESS APP =====
const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// ===== SECURITY MIDDLEWARE =====
// Set security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Configure CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - prevent abuse
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes default
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// ===== STATIC FILES =====
app.use(express.static('public'));

// ===== PARSING MIDDLEWARE =====
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// ===== LOGGING MIDDLEWARE =====
// HTTP request logging
app.use(morgan('combined', { 
    stream: { write: message => logger.info(message.trim()) }
}));

// ===== API ROUTES =====
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Aviation Crew API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// API documentation endpoint
app.get(`${API_PREFIX}`, (req, res) => {
    res.json({
        message: 'Aviation Crew Communication API',
        version: '1.0.0',
        documentation: {
            authentication: `${API_PREFIX}/auth`,
            messages: `${API_PREFIX}/messages`,
            documents: `${API_PREFIX}/documents`,
            crew: `${API_PREFIX}/crew`
        },
        security_features: [
            'JWT Authentication',
            'Role-based Access Control',
            'Message Encryption',
            'Rate Limiting',
            'Input Validation'
        ],
        supported_roles: ['pilot', 'flight_attendant', 'gate_agent']
    });
});

// Root route - serve the test page
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: './public' });
});

// Mount API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/messages`, messageRoutes);
app.use(`${API_PREFIX}/documents`, documentRoutes);
app.use(`${API_PREFIX}/crew`, crewRoutes);

// ===== 404 HANDLER =====
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `The requested endpoint ${req.originalUrl} does not exist`,
        availableRoutes: [
            `${API_PREFIX}/auth`,
            `${API_PREFIX}/messages`,
            `${API_PREFIX}/documents`,
            `${API_PREFIX}/crew`
        ]
    });
});

// ===== ERROR HANDLING MIDDLEWARE =====
app.use(globalErrorHandler);

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// ===== START SERVER =====
const server = app.listen(PORT, () => {
    logger.info(`🚀 Aviation Crew API Server started on port ${PORT}`);
    logger.info(`📋 API Documentation: http://localhost:${PORT}${API_PREFIX}`);
    logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
    logger.info(`🔒 Security: JWT Auth, Role-based Access, Encryption Enabled`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
    } else {
        logger.error('❌ Server error:', error);
        process.exit(1);
    }
});

module.exports = app;
