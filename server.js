/**
 * Ashley Smith's Portfolio Server
 * Simple consolidated server for the entire portfolio
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// ===== BASIC MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== SESSION SIMULATION (Ephemeral - data discarded on logout) =====
const sessions = new Map();
// No persistent user storage - users only exist during active sessions

// ===== VIEW ENGINE SETUP =====
app.set('view engine', 'ejs');
app.set('views', './secureLoginFeature/views');

// ===== STATIC FILE SERVING (BEFORE ROUTES) =====
// Serve static files for each project
app.use(express.static(__dirname)); // Serve static files from root
// Removed /landingpage static route since everything is now in root
app.use('/blog', express.static(path.join(__dirname, 'blog'))); // Blog static files
app.use('/charolotte', express.static(path.join(__dirname, 'charolotteicecream')));
app.use('/taskmanagement', express.static(path.join(__dirname, 'taskmanagement')));
app.use('/aviation-test', express.static(path.join(__dirname, 'aviation-crew-api/public')));
app.use('/takeflight', express.static(path.join(__dirname, 'takeflight')));
app.use('/skylinkmenu', express.static(path.join(__dirname, 'skylinkmenu')));

// ===== MAIN ROUTES =====

// Main portfolio landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Charlotte's Ice Cream project
app.get('/charolotte', (req, res) => {
    res.sendFile(path.join(__dirname, 'charolotteicecream', 'index.html'));
});

// Task Management - SkyList Aviation App
app.get('/taskmanagement', (req, res) => {
    res.sendFile(path.join(__dirname, 'taskmanagement', 'index.html'));
});

// Take Flight - Flight Simulator
app.get('/takeflight', (req, res) => {
    res.sendFile(path.join(__dirname, 'takeflight', 'index.html'));
});

// SkyLink Menu - First Class Dining Experience
app.get('/skylinkmenu', (req, res) => {
    res.sendFile(path.join(__dirname, 'skylinkmenu', 'index.html'));
});

// Aviation API browser test interface
app.get('/aviation-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'aviation-crew-api/public', 'index.html'));
});

// Secure login feature routes
app.get('/login', (req, res) => {
    // For demo purposes, we'll just show the registration/login options
    // In a real app, you'd check cookies or other persistent session data
    res.render('index', { name: null });
});

app.get('/login/login', (req, res) => {
    res.render('login');
});

app.get('/login/register', (req, res) => {
    res.render('register');
});

app.get('/login/status', (req, res) => {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    const session = sessions.get(sessionId);
    
    if (session && session.user) {
        res.json({ 
            loggedIn: true, 
            user: { 
                username: session.user.username,
                email: session.user.email 
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/login/register', (req, res) => {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }
    
    // Create immediate session with user data (no persistent storage)
    const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const userData = {
        username,
        email,
        password, // In demo - would be hashed in production
        createdAt: new Date()
    };
    
    // Store session with user data
    sessions.set(sessionId, {
        user: userData,
        createdAt: new Date()
    });
    
    res.json({ 
        success: true, 
        message: 'Account created and logged in successfully!',
        sessionId: sessionId,
        user: {
            username: userData.username,
            email: userData.email
        }
    });
});

app.post('/login/login', (req, res) => {
    // Since we don't store users persistently, direct users to register instead
    res.status(400).json({ 
        success: false, 
        message: 'Please register to create a new session. No persistent accounts available.' 
    });
});

app.post('/login/logout', (req, res) => {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    if (sessionId) {
        // Completely destroy session and all associated user data
        sessions.delete(sessionId);
    }
    res.json({ 
        success: true, 
        message: 'Logged out successfully. All session data has been discarded.' 
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Ashley\'s Portfolio Server is running',
        timestamp: new Date().toISOString(),
        services: {
            landingPage: 'available at /',
            charlottesIceCream: 'available at /charolotte',
            taskManagement: 'available at /taskmanagement',
            takeFlight: 'available at /takeflight',
            aviationTest: 'available at /aviation-test',
            secureLogin: 'available at /login'
        }
    });
});

// API documentation endpoint for aviation test
app.get('/api', (req, res) => {
    res.json({
        name: 'Ashley Smith\'s Portfolio API',
        description: 'Portfolio server with basic endpoints',
        version: '1.0.0',
        endpoints: {
            'GET /': 'Main landing page',
            'GET /charolotte': 'Charlotte\'s Ice Cream project',
            'GET /taskmanagement': 'Task Management - SkyList Aviation App',
            'GET /takeflight': 'Take Flight - Professional Flight Simulator',
            'GET /aviation-test': 'Aviation API browser test interface',
            'GET /login': 'Secure login feature',
            'GET /health': 'Health check',
            'GET /api': 'This documentation'
        }
    });
});

// Mock auth endpoint for aviation test
app.get('/api/auth', (req, res) => {
    res.json({
        message: 'Authentication endpoints',
        endpoints: {
            'POST /api/auth/login': 'User login',
            'POST /api/auth/register': 'User registration',
            'GET /api/auth/me': 'Get current user'
        },
        note: 'This is a demo API for portfolio showcase'
    });
});

// Mock login endpoint for aviation test
app.post('/api/auth/login', (req, res) => {
    const { employeeId, password } = req.body;
    
    // Demo users
    const users = {
        'AA12345': { name: 'Captain Sarah Johnson', role: 'pilot' },
        'FA67890': { name: 'Emily Chen', role: 'flight_attendant' },
        'GA11111': { name: 'Mike Rodriguez', role: 'gate_agent' }
    };
    
    if (users[employeeId] && password === 'password123') {
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                employeeId: employeeId,
                name: users[employeeId].name,
                role: users[employeeId].role
            },
            token: `demo-jwt-token-${employeeId}`,
            note: 'This is a demo response for portfolio showcase'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// Mock profile endpoint
app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const employeeId = token.replace('demo-jwt-token-', '');
    
    const users = {
        'AA12345': { name: 'Captain Sarah Johnson', role: 'pilot', department: 'Flight Operations', experience: '15 years' },
        'FA67890': { name: 'Emily Chen', role: 'flight_attendant', department: 'Cabin Crew', experience: '8 years' },
        'GA11111': { name: 'Mike Rodriguez', role: 'gate_agent', department: 'Ground Operations', experience: '5 years' }
    };
    
    if (users[employeeId]) {
        res.json({
            employeeId: employeeId,
            ...users[employeeId],
            lastLogin: new Date().toISOString(),
            status: 'active'
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Mock messages endpoint
app.get('/api/messages', (req, res) => {
    res.json({
        messages: [
            {
                id: 1,
                from: 'Flight Control',
                content: 'Weather update: Clear skies for departure',
                timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) + ' UTC',
                priority: 'normal'
            },
            {
                id: 2,
                from: 'Gate Operations',
                content: 'All passengers boarded, ready for departure',
                timestamp: new Date(Date.now() - 300000).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) + ' UTC',
                priority: 'high'
            }
        ],
        unreadCount: 1
    });
});

app.post('/api/messages', (req, res) => {
    const { content, recipient, priority } = req.body;
    res.json({
        success: true,
        message: 'Message sent successfully',
        messageId: Math.random().toString(36).substr(2, 9),
        sentTo: recipient,
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) + ' UTC'
    });
});

// Mock crew endpoint
app.get('/api/crew', (req, res) => {
    res.json({
        crew: [
            { id: 'AA12345', name: 'Captain Sarah Johnson', role: 'pilot', status: 'on-duty', location: 'Flight Deck' },
            { id: 'AA54321', name: 'First Officer Tom Wilson', role: 'pilot', status: 'on-duty', location: 'Flight Deck' },
            { id: 'FA67890', name: 'Emily Chen', role: 'flight_attendant', status: 'on-duty', location: 'Cabin' },
            { id: 'FA09876', name: 'Lisa Park', role: 'flight_attendant', status: 'break', location: 'Crew Rest' },
            { id: 'GA11111', name: 'Mike Rodriguez', role: 'gate_agent', status: 'on-duty', location: 'Gate A12' }
        ],
        totalCrew: 5,
        onDuty: 4
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`🚀 Ashley's Portfolio Server started on port ${PORT}`);
    console.log(`🏠 Portfolio: http://localhost:${PORT}`);
    console.log(`🍦 Charlotte's Ice Cream: http://localhost:${PORT}/charolotte`);
    console.log(`📝 Task Management: http://localhost:${PORT}/taskmanagement`);
    console.log(`✈️  Take Flight: http://localhost:${PORT}/takeflight`);
    console.log(`🛩️  Aviation Test: http://localhost:${PORT}/aviation-test`);
    console.log(`🔐 Secure Login: http://localhost:${PORT}/login`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;