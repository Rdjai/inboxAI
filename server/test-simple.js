const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testEmailId = '';
let testUserId = '';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
    console.log(`${color}${message}${colors.reset}`);
};

// Helper function for fetch requests
const fetchAPI = async (url, options = {}) => {
    const response = await fetch(`${BASE_URL}${url}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}`);
        error.response = { data, status: response.status };
        throw error;
    }

    return data;
};

const test = async (name, testFunction) => {
    try {
        log(`\n🧪 Testing: ${name}`, colors.blue);
        await testFunction();
        log(`✅ ${name}: PASSED`, colors.green);
        return true;
    } catch (error) {
        log(`❌ ${name}: FAILED - ${error.message}`, colors.red);
        if (error.response) {
            console.error('   Response:', error.response.data);
            console.error('   Status:', error.response.status);
        } else {
            console.error('   Error:', error.message);
        }
        return false;
    }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const cleanupDatabase = async () => {
    try {
        const models = ['User', 'Email', 'AuditLog', 'Attachment'];
        for (const modelName of models) {
            const Model = mongoose.model(modelName);
            await Model.deleteMany({});
        }
        log('🗑️  Database cleaned up', colors.yellow);
    } catch (error) {
        log('⚠️  Could not clean database:', colors.yellow);
    }
};

const runTests = async () => {
    log('🚀 Starting InboxAI Backend Tests (Using Fetch)', colors.cyan);
    log('='.repeat(50), colors.cyan);

    let passed = 0;
    let total = 0;

    await cleanupDatabase();

    // 1. Test Database Connection
    total++;
    const dbTest = await test('Database Connection', async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inboxai');
        const dbState = mongoose.connection.readyState;
        if (dbState !== 1) {
            throw new Error(`Database not connected. State: ${dbState}`);
        }
        console.log('   Database: MongoDB');
        console.log('   Connection: OK');
    });
    if (dbTest) passed++;

    // 2. Test Server Health
    total++;
    const healthTest = await test('Server Health Check', async () => {
        const data = await fetchAPI('/health');
        if (data.status !== 'OK') {
            throw new Error('Server health check failed');
        }
        console.log('   Server:', data.service);
        console.log('   Status:', data.status);
        console.log('   Port:', process.env.PORT || 5000);
    });
    if (healthTest) passed++;

    // 3. Test User Registration
    total++;
    const registerTest = await test('User Registration', async () => {
        const userData = {
            email: `test${Date.now()}@example.com`,
            password: 'test123456',
            name: 'Test User',
            role: 'agent'
        };

        const data = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (!data.success) {
            throw new Error('Registration failed');
        }

        authToken = data.data.token;
        testUserId = data.data.user._id;

        console.log('   User ID:', testUserId);
        console.log('   Email:', data.data.user.email);
        console.log('   Role:', data.data.user.role);
        console.log('   Token received: ✓');
    });
    if (registerTest) passed++;

    // 4. Test User Login
    total++;
    const loginTest = await test('User Login', async () => {
        const userData = {
            email: `login${Date.now()}@test.com`,
            password: 'password123',
            name: 'Login Test User'
        };

        await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        const loginData = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: userData.email,
                password: userData.password
            })
        });

        if (!loginData.success) {
            throw new Error('Login failed');
        }

        authToken = loginData.data.token;
        console.log('   Login successful');
        console.log('   New token received: ✓');
    });
    if (loginTest) passed++;

    // 5. Test Get Profile
    total++;
    const profileTest = await test('Get User Profile', async () => {
        const data = await fetchAPI('/auth/me', {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!data.success) {
            throw new Error('Failed to get profile');
        }

        const user = data.data.user;
        console.log('   User:', user.name);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Active:', user.isActive);
    });
    if (profileTest) passed++;

    // 6. Test Create Email
    total++;
    const createEmailTest = await test('Create Email', async () => {
        const emailData = {
            from: 'customer@example.com',
            to: 'support@inboxai.com',
            subject: 'Urgent: Product Not Working Properly',
            body: `Hello Support Team,

I just purchased your premium product yesterday and it's not working at all. The screen remains blank and none of the buttons respond. I've tried restarting the application multiple times but no luck.

This is very frustrating as I need this for an important project. Please help me resolve this issue immediately.

Best regards,
John Doe`,
            category: 'issue',
            priority: 'high'
        };

        const data = await fetchAPI('/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` },
            body: JSON.stringify(emailData)
        });

        if (!data.success) {
            throw new Error('Failed to create email');
        }

        testEmailId = data.data._id;
        console.log('   Email ID:', testEmailId);
        console.log('   Subject:', data.data.subject);
        console.log('   From:', data.data.from);
        console.log('   Status:', data.data.status);
        console.log('   Created:', new Date(data.data.createdAt).toLocaleTimeString());
    });
    if (createEmailTest) passed++;

    // 7. Test AI Processing
    total++;
    const aiProcessingTest = await test('AI Processing (Classification & Drafting)', async () => {
        log('   ⏳ Waiting 5 seconds for AI processing...', colors.yellow);
        await wait(5000);

        const data = await fetchAPI(`/emails/${testEmailId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!data.success) {
            throw new Error('Failed to fetch email');
        }

        const email = data.data;

        console.log('   Current Status:', email.status.toUpperCase());
        console.log('   AI Category:', email.category.toUpperCase());
        console.log('   Confidence:', `${(email.confidence * 100).toFixed(1)}%`);
        console.log('   Draft Generated:', email.draft ? '✓' : '✗');
        console.log('   Draft Length:', email.draft?.length || 0, 'characters');

        if (!email.draft || email.draft.length < 10) {
            console.log('   ⚠️  Draft might not be generated yet. Waiting more...');
            await wait(3000);

            const retryData = await fetchAPI(`/emails/${testEmailId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const retryEmail = retryData.data;
            console.log('   After retry - Draft:', retryEmail.draft ? '✓' : '✗');
            console.log('   After retry - Status:', retryEmail.status.toUpperCase());
        }
    });
    if (aiProcessingTest) passed++;

    // 8. Test Get All Emails
    total++;
    const getEmailsTest = await test('Get All Emails', async () => {
        const url = new URL(`${BASE_URL}/emails`);
        url.searchParams.append('limit', '10');
        url.searchParams.append('page', '1');

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await response.json();

        if (!data.success) {
            throw new Error('Failed to get emails');
        }

        const emails = data.data;
        const pagination = data.pagination;

        console.log('   Total Emails:', pagination.total);
        console.log('   Page:', pagination.page);
        console.log('   Per Page:', pagination.limit);
        console.log('   Total Pages:', pagination.totalPages);
        console.log('   Emails fetched:', emails.length);

        if (emails.length > 0) {
            console.log('   First email:');
            console.log('     Subject:', emails[0].subject);
            console.log('     Status:', emails[0].status);
            console.log('     Category:', emails[0].category);
        }
    });
    if (getEmailsTest) passed++;

    // 9. Test Update Email
    total++;
    const updateEmailTest = await test('Update Email Draft', async () => {
        const updateData = {
            draft: `Dear Customer,

Thank you for reporting this technical issue. We sincerely apologize for the inconvenience.

Our engineering team has been alerted and is actively investigating this problem. We expect to have an update for you within the next 2-4 hours.

In the meantime, could you please try these troubleshooting steps:
1. Clear your browser cache
2. Try using a different browser
3. Check your internet connection

If the issue persists, please let us know and we'll escalate it immediately.

Best regards,
Technical Support Team
InboxAI

--- EDITED BY TEST SCRIPT ---`
        };

        const data = await fetchAPI(`/emails/${testEmailId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${authToken}` },
            body: JSON.stringify(updateData)
        });

        if (!data.success) {
            throw new Error('Failed to update email');
        }

        console.log('   Update successful');
        console.log('   New Status:', data.data.status.toUpperCase());
        console.log('   Draft updated: ✓');
    });
    if (updateEmailTest) passed++;

    // 10. Test Approve Email
    total++;
    const approveEmailTest = await test('Approve Email', async () => {
        const data = await fetchAPI(`/emails/${testEmailId}/approve`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({})
        });

        if (!data.success) {
            throw new Error('Failed to approve email');
        }

        console.log('   Email approved: ✓');
        console.log('   New Status:', data.data.status.toUpperCase());

        const verifyData = await fetchAPI(`/emails/${testEmailId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('   Verified Status:', verifyData.data.status.toUpperCase());
    });
    if (approveEmailTest) passed++;

    // 11. Test Send Email
    total++;
    const sendEmailTest = await test('Queue Email for Sending', async () => {
        const data = await fetchAPI(`/emails/${testEmailId}/send`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({})
        });

        if (!data.success) {
            throw new Error('Failed to queue email for sending');
        }

        console.log('   Email queued for sending: ✓');
        console.log('   Message:', data.message);

        log('   ⏳ Waiting 3 seconds for sending simulation...', colors.yellow);
        await wait(3000);

        const verifyData = await fetchAPI(`/emails/${testEmailId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const email = verifyData.data;
        console.log('   Final Status:', email.status.toUpperCase());
        console.log('   Sent At:', email.sentAt ? new Date(email.sentAt).toLocaleTimeString() : 'Not sent yet');
    });
    if (sendEmailTest) passed++;

    // 12. Test Reply to Email
    total++;
    const replyEmailTest = await test('Reply to Email', async () => {
        const newEmailData = {
            from: 'another@customer.com',
            to: 'support@inboxai.com',
            subject: 'Billing Question',
            body: 'I have a question about my latest invoice. Can you explain the charges?',
            category: 'billing'
        };

        const newEmail = await fetchAPI('/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` },
            body: JSON.stringify(newEmailData)
        });

        const replyToEmailId = newEmail.data._id;

        await wait(2000);

        const replyData = {
            reply: `Dear Customer,

Thank you for your inquiry about your invoice. Our billing department will review your account and get back to you within 24 hours.

If you have the invoice number handy, please include it in your response for faster processing.

Best regards,
Billing Support
InboxAI`,
            sendNow: false
        };

        const data = await fetchAPI(`/emails/${replyToEmailId}/reply`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` },
            body: JSON.stringify(replyData)
        });

        if (!data.success) {
            throw new Error('Failed to create reply');
        }

        const replyEmail = data.data;
        console.log('   Reply created: ✓');
        console.log('   Reply Email ID:', replyEmail._id);
        console.log('   Subject:', replyEmail.subject);
        console.log('   Status:', replyEmail.status.toUpperCase());
        console.log('   Thread ID:', replyEmail.threadId ? 'Yes' : 'No');
    });
    if (replyEmailTest) passed++;

    // 13. Test Analytics Dashboard
    total++;
    const analyticsTest = await test('Analytics Dashboard', async () => {
        const data = await fetchAPI('/analytics/dashboard', {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!data.success) {
            throw new Error('Failed to get analytics');
        }

        const analytics = data.data;

        console.log('   Total Emails:', analytics.totals.all);
        console.log('   Today\'s Emails:', analytics.totals.today);
        console.log('   Pending Emails:', analytics.totals.pending);

        console.log('   Categories:');
        analytics.categories.forEach(cat => {
            console.log(`     ${cat._id}: ${cat.count}`);
        });

        console.log('   Avg Response Time:', analytics.performance.avgResponseTime, 'hours');
    });
    if (analyticsTest) passed++;

    // 14. Test Activity Log
    total++;
    const activityTest = await test('Activity Log', async () => {
        const data = await fetchAPI('/analytics/activity', {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!data.success) {
            throw new Error('Failed to get activity log');
        }

        const activities = data.data;

        console.log('   Activities fetched:', activities.length);

        if (activities.length > 0) {
            console.log('   Recent activities:');
            activities.slice(0, 3).forEach((activity, index) => {
                console.log(`     ${index + 1}. ${activity.action} on email`);
            });
        }
    });
    if (activityTest) passed++;

    // Summary
    log('\n' + '='.repeat(50), colors.cyan);
    log('📊 TEST SUMMARY', colors.cyan);
    log('='.repeat(50), colors.cyan);
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);

    const percentage = (passed / total) * 100;
    if (percentage === 100) {
        log(`✅ Success Rate: ${percentage.toFixed(1)}% - ALL TESTS PASSED!`, colors.green);
    } else if (percentage >= 80) {
        log(`⚠️  Success Rate: ${percentage.toFixed(1)}% - Most tests passed`, colors.yellow);
    } else {
        log(`❌ Success Rate: ${percentage.toFixed(1)}% - Needs improvement`, colors.red);
    }

    // Cleanup
    log('\n🧹 Cleaning up test data...', colors.yellow);
    await cleanupDatabase();
    await mongoose.connection.close();
    log('🔌 Database connection closed', colors.yellow);

    process.exit(passed === total ? 0 : 1);
};

// Error handling
process.on('unhandledRejection', (error) => {
    log(`\n❌ Unhandled rejection: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    log(`\n❌ Uncaught exception: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});

// Check if server is running
const checkServer = async () => {
    try {
        await fetchAPI('/health');
        return true;
    } catch (error) {
        return false;
    }
};

// Main execution
const main = async () => {
    log('🔍 Checking server status...', colors.cyan);

    let serverReady = false;
    for (let i = 0; i < 5; i++) {
        try {
            await fetchAPI('/health');
            serverReady = true;
            break;
        } catch (error) {
            if (i < 4) {
                log(`   Attempt ${i + 1}/5: Server not ready, retrying in 2 seconds...`, colors.yellow);
                await wait(2000);
            }
        }
    }

    if (!serverReady) {
        log('\n❌ Could not connect to server. Please make sure:', colors.red);
        log('   1. Server is running: cd server && npm run dev', colors.yellow);
        log('   2. MongoDB is running: mongod', colors.yellow);
        log('   3. Server is on http://localhost:5000', colors.yellow);
        process.exit(1);
    }

    await runTests();
};

main();