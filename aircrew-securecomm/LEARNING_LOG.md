# 📚 Learning Log - AirCrew SecureComm

## 🎯 Project Goals
As a beginner exploring cybersecurity, I wanted to understand how security controls work in real-world applications, especially in high-trust industries like aviation.

## 🧠 What I Learned

### Week 1: Basic Authentication
- **JWT fundamentals**: Understanding tokens, payloads, and signatures
- **Middleware patterns**: How Express.js middleware can enforce security
- **Password security**: Why we hash passwords (even though I'm using mock accounts)

### Week 2: Authorization & RBAC
- **Authentication vs Authorization**: Login vs permission to access resources
- **Role-based design**: How different aviation roles need different access levels
- **Route protection**: Middleware that checks user roles before allowing access

### Week 3: Security Headers & Input Validation
- **Helmet.js**: Easy way to add security headers like CSP, HSTS
- **Input sanitization**: Preventing XSS attacks through proper validation
- **Joi validation**: Structure validation for API inputs

### Week 4: Rate Limiting & Monitoring
- **Brute force protection**: Why rate limiting matters for login endpoints
- **Audit logging**: Tracking security events for monitoring
- **Error handling**: Not exposing sensitive information in error messages

## 🔍 Security Testing I Did

### Manual Testing
- Tried to access admin routes without proper role
- Tested login with wrong passwords (rate limiting works!)
- Submitted malicious input to test validation
- Checked if JWT tokens work correctly

### Tool Learning
- **Postman**: Testing API endpoints with different auth headers
- **OWASP ZAP**: Basic vulnerability scanning (still learning this!)
- **Browser DevTools**: Checking security headers in Network tab

## 🚧 What I Know I Don't Know Yet

### Areas for Future Learning
- **Real MFA**: Currently just simulating 2FA, want to implement TOTP
- **Database security**: Using in-memory storage, need to learn about SQL injection prevention
- **Advanced threat detection**: Understanding more sophisticated attack patterns
- **Compliance frameworks**: Learning about SOC 2, ISO 27001
- **Cryptography**: Understanding encryption beyond basic hashing

### Honest Limitations
- This is not production-ready (intentionally kept simple)
- Using mock data instead of real database
- Security controls are basic implementations
- Haven't implemented refresh token rotation yet

## 📖 Resources That Helped

### Documentation & Guides
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Great overview of common vulnerabilities
- [JWT.io](https://jwt.io/) - Understanding how JWTs work
- [Express Security Guide](https://expressjs.com/en/advanced/best-practice-security.html)
- MDN Web Security docs for understanding CORS, CSP

### YouTube Channels
- Traversy Media for Node.js security basics
- The Cyber Mentor for security mindset
- Web Dev Simplified for JWT explanations

### Practice Platforms
- TryHackMe for hands-on security learning
- OWASP WebGoat for vulnerable app testing

## 🎯 Next Steps

### Short Term (Next Month)
1. Implement real TOTP-based MFA using speakeasy
2. Add PostgreSQL integration for persistent storage
3. Learn about CSRF protection and implement it
4. Write unit tests for security middleware

### Medium Term (Next 3 Months)
1. Study refresh token rotation patterns
2. Learn about API versioning and documentation
3. Explore more advanced OWASP ZAP features
4. Practice with more security testing tools

### Long Term (Next 6 Months)
1. Study Zero Trust Architecture principles
2. Learn about end-to-end encryption
3. Explore compliance frameworks
4. Consider security certifications (Security+, etc.)

## 💭 Reflections

### What Surprised Me
- How much security is about thinking through attack scenarios
- How easy it is to add basic protections with the right middleware
- How important logging and monitoring are (not just the technical controls)

### What Was Challenging
- Understanding the balance between security and usability
- Learning when to use different types of authentication/authorization
- Figuring out what level of security is appropriate for a learning project

### What I'm Proud Of
- Building something that actually demonstrates security concepts
- Documenting my learning process honestly
- Not overselling my current skill level
- Creating something aviation-themed (combining my interests!)

---

*This log helps me track my learning journey and be honest about my current skill level while showing growth mindset and genuine curiosity about cybersecurity.*
