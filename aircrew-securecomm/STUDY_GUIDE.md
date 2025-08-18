# Aircrew SecureComm Study Guide

## Purpose
A secure communication API for aviation crew, demonstrating authentication, role-based access, and secure messaging.

## Key Features
- JWT authentication
- Role-based access control
- Secure message handling
- Security middleware (rate limiting, helmet)
- Modular Express structure

## Structure
- `server.js`: Main server entry, mounts API routes
- `src/routes/`: Route handlers (auth, messages, admin, security)
- `src/middleware/`: Auth, error, and security middleware
- `public/`: Frontend demo interface
- `utils/`: Logger and helpers

## What It Demonstrates
- Building a secure REST API
- Middleware usage for security
- Modular route/controller design
- Real-world authentication flows

## Example Flow
1. User logs in via `/api/v1/auth/login`
2. Receives JWT, accesses protected endpoints
3. Can send/receive secure messages
4. Admins can view logs, manage users
