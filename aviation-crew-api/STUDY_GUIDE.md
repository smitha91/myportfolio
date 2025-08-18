# Aviation Crew API Study Guide

## Purpose
A RESTful API for managing aviation crew, documents, and messages, with secure authentication and role-based access.

## Key Features
- JWT authentication
- Crew, document, and message management
- Modular Express routes
- Security middleware (helmet, rate limiting)
- Public demo interface

## Structure
- `server.js`: Main server, mounts API routes
- `routes/`: Crew, auth, documents, messages
- `middleware/`: Auth, error, security, validation
- `utils/`: Encryption, JWT, logger
- `public/`: Demo/testing interface
- `data/`: Mock data

## What It Demonstrates
- REST API design
- Secure authentication
- CRUD operations for crew/docs/messages
- Modular code organization

## Example Flow
1. User logs in via `/api/auth/login`
2. Accesses crew, document, or message endpoints
3. Admins can manage users and documents
