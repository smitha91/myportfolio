#!/usr/bin/env node

/**
 * Aviation Crew API Demo Script
 * 
 * Demonstrates the key features of the Aviation Crew Communication API
 * Tests authentication, messaging, and document features
 */

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:4000/api';
const TEST_USER = {
    employeeId: 'AB12345',
    password: 'SecurePass123!',
    name: 'Demo Test Pilot',
    role: 'pilot',
    department: 'flight-operations',
    clearanceLevel: 5,
    airline: 'Demo Airlines'
};

let authToken = null;

// API client setup
const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
});

// Helper functions
const log = (message, data = '') => {
    console.log(`\n🔹 ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
};

const logError = (message, error) => {
    console.log(`\n❌ ${message}`);
    if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(JSON.stringify(error.response.data, null, 2));
    } else {
        console.log(error.message);
    }
};

const logSuccess = (message, data = '') => {
    console.log(`\n✅ ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
};

// Demo functions
async function testHealthCheck() {
    try {
        const response = await axios.get('http://localhost:4000/health');
        logSuccess('Health Check Passed', response.data);
        return true;
    } catch (error) {
        logError('Health Check Failed', error);
        return false;
    }
}

async function testAuthentication() {
    try {
        // Try to register new user
        log('Attempting to register new demo user...');
        try {
            const registerResponse = await api.post('/auth/register', TEST_USER);
            logSuccess('User Registration Successful', {
                user: registerResponse.data.data.user.name,
                employeeId: registerResponse.data.data.user.employeeId
            });
        } catch (error) {
            if (error.response && error.response.status === 409) {
                log('User already exists, proceeding with login...');
            } else {
                throw error;
            }
        }

        // Login with demo user
        log('Attempting to login...');
        const loginResponse = await api.post('/auth/login', {
            employeeId: TEST_USER.employeeId,
            password: TEST_USER.password
        });

        authToken = loginResponse.data.data.accessToken;
        logSuccess('Login Successful', {
            user: loginResponse.data.data.user.name,
            role: loginResponse.data.data.user.role,
            tokenReceived: true
        });

        // Get user profile
        log('Fetching user profile...');
        const profileResponse = await api.get('/auth/profile');
        logSuccess('Profile Retrieved', {
            name: profileResponse.data.data.user.name,
            department: profileResponse.data.data.user.department,
            clearanceLevel: profileResponse.data.data.user.clearanceLevel
        });

        return true;
    } catch (error) {
        logError('Authentication Test Failed', error);
        return false;
    }
}

async function testMessaging() {
    try {
        log('Testing messaging functionality...');

        // Send a message
        const messageData = {
            recipientId: 'AA12345', // Demo recipient
            content: 'Demo message: Flight status update from automated test',
            priority: 'normal',
            category: 'operational',
            flightNumber: 'DM123',
            isEncrypted: false
        };

        const sendResponse = await api.post('/messages', messageData);
        logSuccess('Message Sent', {
            messageId: sendResponse.data.data.message.id,
            recipient: sendResponse.data.data.message.recipientName,
            encrypted: sendResponse.data.data.message.isEncrypted
        });

        // Get user messages
        log('Retrieving user messages...');
        const messagesResponse = await api.get('/messages?type=sent&limit=5');
        logSuccess('Messages Retrieved', {
            totalMessages: messagesResponse.data.data.messages.length,
            pagination: messagesResponse.data.data.pagination
        });

        // Get unread count
        const unreadResponse = await api.get('/messages/unread/count');
        logSuccess('Unread Count Retrieved', unreadResponse.data.data);

        return true;
    } catch (error) {
        logError('Messaging Test Failed', error);
        return false;
    }
}

async function testCrewManagement() {
    try {
        log('Testing crew management functionality...');

        // Get all crew members
        const crewResponse = await api.get('/crew?limit=5');
        logSuccess('Crew List Retrieved', {
            totalCrew: crewResponse.data.data.crew.length,
            pagination: crewResponse.data.data.pagination
        });

        // Search crew members
        const searchResponse = await api.get('/crew/search?q=Captain');
        logSuccess('Crew Search Completed', {
            searchResults: searchResponse.data.data.crew.length,
            query: 'Captain'
        });

        // Get crew by role
        const roleResponse = await api.get('/crew/role/pilot');
        logSuccess('Pilots Retrieved', {
            pilots: roleResponse.data.data.crew.length
        });

        // Get crew statistics (requires clearance level 3+)
        try {
            const statsResponse = await api.get('/crew/meta/stats');
            logSuccess('Crew Statistics Retrieved', {
                totalUsers: statsResponse.data.data.statistics.total,
                byRole: Object.keys(statsResponse.data.data.statistics.byRole).length + ' roles'
            });
        } catch (error) {
            if (error.response && error.response.status === 403) {
                log('Crew statistics require higher clearance (expected for demo)');
            } else {
                throw error;
            }
        }

        return true;
    } catch (error) {
        logError('Crew Management Test Failed', error);
        return false;
    }
}

async function testDocuments() {
    try {
        log('Testing document functionality...');

        // Get available documents
        const docsResponse = await api.get('/documents?limit=5');
        logSuccess('Documents Retrieved', {
            totalDocuments: docsResponse.data.data.documents.length,
            pagination: docsResponse.data.data.pagination
        });

        // Get document categories
        const categoriesResponse = await api.get('/documents/meta/categories');
        logSuccess('Document Categories Retrieved', {
            categories: categoriesResponse.data.data.categories.length + ' categories available'
        });

        // Search documents
        const searchResponse = await api.get('/documents?q=flight&limit=3');
        logSuccess('Document Search Completed', {
            searchResults: searchResponse.data.data.documents.length
        });

        return true;
    } catch (error) {
        logError('Document Test Failed', error);
        return false;
    }
}

async function runDemo() {
    console.log('🚁 Aviation Crew Communication API Demo');
    console.log('=========================================');

    const tests = [
        { name: 'Health Check', fn: testHealthCheck },
        { name: 'Authentication', fn: testAuthentication },
        { name: 'Messaging', fn: testMessaging },
        { name: 'Crew Management', fn: testCrewManagement },
        { name: 'Documents', fn: testDocuments }
    ];

    const results = [];

    for (const test of tests) {
        console.log(`\n📋 Running ${test.name} Test...`);
        const success = await test.fn();
        results.push({ name: test.name, success });
        
        if (!success && test.name === 'Health Check') {
            console.log('\n❌ Cannot continue without API server running.');
            console.log('Please start the server with: npm run dev');
            process.exit(1);
        }
    }

    // Summary
    console.log('\n📊 Demo Results Summary');
    console.log('=======================');
    results.forEach(result => {
        const status = result.success ? '✅ PASSED' : '❌ FAILED';
        console.log(`${status} - ${result.name}`);
    });

    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! The Aviation Crew API is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Check the server logs for more details.');
    }

    console.log('\n📚 Next Steps:');
    console.log('- Explore the API documentation at http://localhost:3000/api');
    console.log('- Check out QUICKSTART.md for detailed usage examples');
    console.log('- Review the code in the routes/ and middleware/ directories');
}

// Handle script execution
if (require.main === module) {
    runDemo().catch(error => {
        console.error('\n💥 Demo script failed:', error.message);
        process.exit(1);
    });
}

module.exports = { runDemo };
