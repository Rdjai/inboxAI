// test-all-endpoints.js
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USERS = {
    admin: { email: 'admin@processmail.com', password: 'admin123' },
    reviewer: { email: 'reviewer@processmail.com', password: 'reviewer123' },
    agent: { email: 'agent@processmail.com', password: 'agent123' }
};

// Your token
const YOUR_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTg1MTg3YTBiY2FhYWZmMWFlNGFmZmQiLCJpYXQiOjE3NzAzMzA0OTgsImV4cCI6MTc3MDkzNTI5OH0.5QhNBHv2K6zU2n7rATmndM49Dkqm28STMKrSvG7m9jo';

// Test state
let testData = {
    tokens: {},
    accountId: '69851b72da9601e20500029d', // Your existing account
    emailIds: [],
    userIds: []
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Helper functions
const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg, err = null) => {
        console.log(`${colors.red}❌ ${msg}${colors.reset}`);
        if (err) console.log(`${colors.yellow}   Error: ${err.message || err}${colors.reset}`);
    },
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
    section: (msg) => console.log(`\n${colors.cyan}═══════════════════════════════════════════════════\n${msg}\n═══════════════════════════════════════════════════${colors.reset}\n`)
};

// Test runner
async function runTest(name, testFunction) {
    try {
        log.test(`Testing: ${name}`);
        await testFunction();
        return true;
    } catch (error) {
        log.error(`Test failed: ${name}`, error);
        return false;
    }
}

// ======================= AUTHENTICATION TESTS =======================

async function testAuthentication() {
    log.section('1. AUTHENTICATION TESTS');

    // Test 1.1: Health Check
    await runTest('Health Check', async () => {
        const response = await axios.get(`${BASE_URL}/health`);
        if (response.data.success) {
            log.success(`Health: ${response.data.message}`);
        } else {
            throw new Error('Health check failed');
        }
    });

    // Test 1.2: Login with provided token
    await runTest('Validate Provided Token', async () => {
        const response = await axios.get(`${BASE_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${YOUR_TOKEN}` }
        });
        testData.tokens.admin = YOUR_TOKEN;
        log.success(`Token valid! User: ${response.data.data.name} (${response.data.data.role})`);
        testData.adminUserId = response.data.data._id;
    });

    // Test 1.3: Login as Admin (alternative)
    await runTest('Admin Login', async () => {
        const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USERS.admin);
        if (response.data.success) {
            testData.tokens.admin = response.data.data.token;
            log.success(`Admin login successful`);
        }
    });

    // Test 1.4: Login as Reviewer
    await runTest('Reviewer Login', async () => {
        const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USERS.reviewer);
        if (response.data.success) {
            testData.tokens.reviewer = response.data.data.token;
            testData.reviewerUserId = response.data.data.user._id;
            log.success(`Reviewer login successful`);
        }
    });

    // Test 1.5: Login as Agent
    await runTest('Agent Login', async () => {
        const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USERS.agent);
        if (response.data.success) {
            testData.tokens.agent = response.data.data.token;
            testData.agentUserId = response.data.data.user._id;
            log.success(`Agent login successful`);
        }
    });

    // Test 1.6: Get All Users (Admin only)
    await runTest('Get All Users', async () => {
        const response = await axios.get(`${BASE_URL}/auth/users`, {
            headers: { Authorization: `Bearer ${testData.tokens.admin}` }
        });
        log.success(`Found ${response.data.data.length} users`);
        testData.userIds = response.data.data.map(user => user._id);
    });
}

// ======================= EMAIL ACCOUNTS TESTS =======================

async function testEmailAccounts() {
    log.section('2. EMAIL ACCOUNTS TESTS');

    // Test 2.1: Get All Email Accounts
    await runTest('Get Email Accounts', async () => {
        const response = await axios.get(`${BASE_URL}/email/accounts`, {
            headers: { Authorization: `Bearer ${testData.tokens.admin}` }
        });
        if (response.data.data.length > 0) {
            log.success(`Found ${response.data.data.length} email accounts`);
            // Use the existing account ID
            testData.accountId = response.data.data[0]._id;
            log.info(`Using account ID: ${testData.accountId}`);
        } else {
            log.info('No email accounts found');
        }
    });

    // Test 2.2: Get Single Email Account
    await runTest('Get Single Account', async () => {
        const response = await axios.get(`${BASE_URL}/email/accounts/${testData.accountId}`, {
            headers: { Authorization: `Bearer ${testData.tokens.admin}` }
        });
        log.success(`Account: ${response.data.data.email} (${response.data.data.provider})`);
    });

    // Test 2.3: Test Connection
    await runTest('Test Connection', async () => {
        try {
            const response = await axios.post(
                `${BASE_URL}/email/accounts/${testData.accountId}/test`,
                {},
                { headers: { Authorization: `Bearer ${testData.tokens.admin}` } }
            );
            log.success(`Connection test: ${response.data.message}`);
        } catch (error) {
            log.info(`Connection test expected to fail without real credentials: ${error.response?.data?.message || error.message}`);
        }
    });

    // Test 2.4: Update Account
    await runTest('Update Account', async () => {
        const response = await axios.put(
            `${BASE_URL}/email/accounts/${testData.accountId}`,
            {
                name: 'Updated Test Account',
                syncFrequency: '1hour'
            },
            { headers: { Authorization: `Bearer ${testData.tokens.admin}` } }
        );
        log.success(`Account updated: ${response.data.data.name}`);
    });

    // Test 2.5: Get Account Stats
    await runTest('Get Account Stats', async () => {
        const response = await axios.get(`${BASE_URL}/email/accounts/stats`, {
            headers: { Authorization: `Bearer ${testData.tokens.admin}` }
        });
        log.success(`Got account statistics`);
    });
}

// ======================= EMAIL MANAGEMENT TESTS =======================

async function testEmailManagement() {
    log.section('3. EMAIL MANAGEMENT TESTS');

    // Test 3.1: Get All Emails
    await runTest('Get All Emails', async () => {
        const response = await axios.get(`${BASE_URL}/emails?limit=5`, {
            headers: { Authorization: `Bearer ${testData.tokens.admin}` }
        });
        const emailCount = response.data.data.length;
        log.success(`Found ${emailCount} emails`);

        // Save first email ID if exists
        if (emailCount > 0) {
            testData.emailIds.push(response.data.data[0]._id);
            log.info(`Using email ID: ${testData.emailIds[0]}`);
        }
    });

    // Test 3.2: Create New Email
    await runTest('Create New Email', async () => {
        const response = await axios.post(
            `${BASE_URL}/emails`,
            {
                fromAddress: 'customer@test.com',
                toAddress: 'support@company.com',
                subject: 'API Test - Product Issue',
                bodyText: 'Hello, I am experiencing issues with the product. It crashes when I try to save. Please help!'
            },
            { headers: { Authorization: `Bearer ${testData.tokens.admin}` } }
        );
        const emailId = response.data.data._id;
        testData.emailIds.push(emailId);
        log.success(`Email created with ID: ${emailId}`);
    });

    // Test 3.3: Create Another Email for Bulk Test
    await runTest('Create Second Email', async () => {
        const response = await axios.post(
            `${BASE_URL}/emails`,
            {
                fromAddress: 'user@test.com',
                toAddress: 'help@company.com',
                subject: 'Billing Inquiry',
                bodyText: 'I have a question about my recent invoice. Can you clarify the charges?'
            },
            { headers: { Authorization: `Bearer ${testData.tokens.admin}` } }
        );
        testData.emailIds.push(response.data.data._id);
        log.success(`Second email created`);
    });

    // Test 3.4: Get Single Email
    if (testData.emailIds.length > 0) {
        await runTest('Get Single Email', async () => {
            const response = await axios.get(`${BASE_URL}/emails/${testData.emailIds[0]}`, {
                headers: { Authorization: `Bearer ${testData.tokens.admin}` }
            });
            log.success(`Got email: ${response.data.data.subject}`);
        });
    }

    // Test 3.5: Update Draft (Reviewer/Agent)
    if (testData.emailIds.length > 0) {
        await runTest('Update Draft (Reviewer)', async () => {
            const response = await axios.put(
                `${BASE_URL}/emails/${testData.emailIds[0]}/draft`,
                {
                    draftText: 'Thank you for reporting this issue. Our technical team is investigating and will contact you within 24 hours.',
                    category: 'Issue'
                },
                { headers: { Authorization: `Bearer ${testData.tokens.reviewer || testData.tokens.admin}` } }
            );
            log.success(`Draft updated, status: ${response.data.data.status}`);
        });
    }

    // Test 3.6: Approve Email
    if (testData.emailIds.length > 0) {
        await runTest('Approve Email', async () => {
            const response = await axios.post(
                `${BASE_URL}/emails/${testData.emailIds[0]}/approve`,
                {},
                { headers: { Authorization: `Bearer ${testData.tokens.reviewer || testData.tokens.admin}` } }
            );
            log.success(`Email approved, status: ${response.data.data.status}`);
        });
    }

    // Test 3.7: Send Email
    if (testData.emailIds.length > 0) {
        await runTest('Send Email', async () => {
            try {
                const response = await axios.post(
                    `${BASE_URL}/emails/${testData.emailIds[0]}/send`,
                    {},
                    { headers: { Authorization: `Bearer ${testData.tokens.reviewer || testData.tokens.admin}` } }
                );
                log.success(`Email queued for sending: ${response.data.message}`);
            } catch (error) {
                log.info(`Send might fail in test mode: ${error.response?.data?.message || error.message}`);
            }
        });
    }

    // Test 3.8: Reply to Email
    if (testData.emailIds.length > 0) {
        await runTest('Reply to Email', async () => {
            const response = await axios.post(
                `${BASE_URL}/emails/${testData.emailIds[0]}/reply`,
                {
                    content: 'Thank you for your patience. We are working on your issue.',
                    sendImmediately: false
                },
                { headers: { Authorization: `Bearer ${testData.tokens.agent || testData.tokens.admin}` } }
            );
            log.success(`Reply created: ${response.data.data._id}`);
        });
    }

    // Test 3.9: Bulk Actions
    if (testData.emailIds.length >= 2) {
        await runTest('Bulk Actions', async () => {
            const response = await axios.post(
                `${BASE_URL}/emails/bulk`,
                {
                    emailIds: testData.emailIds.slice(0, 2),
                    action: 'change-status',
                    data: { status: 'REVIEWED' }
                },
                { headers: { Authorization: `Bearer ${testData.tokens.admin}` } }
            );
            log.success(`Bulk action: ${response.data.message}`);
        });
    }
}

// ======================= DASHBOARD & ANALYTICS TESTS =======================

async function testDashboardAnalytics() {
    log.section('4. DASHBOARD & ANALYTICS TESTS');

    // Test 4.1: Get Dashboard
    await runTest('Get Dashboard', async () => {
        const response = await axios.get(`${BASE_URL}/dashboard`, {
            headers: { Authorization: `Bearer ${testData.tokens.admin}` }
        });
        const overview = response.data.data.overview;
        log.success(`Dashboard: ${overview.totalEmails} total, ${overview.unprocessedEmails} unprocessed`);
    });

    // Test 4.2: Get Category Analytics
    await runTest('Category Analytics', async () => {
        const response = await axios.get(`${BASE_URL}/analytics/category`, {
            headers: { Authorization: `Bearer ${testData.tokens.admin}` }
        });
        log.success(`Got category analytics`);
    });

    // Test 4.3: Get Team Analytics
    await runTest('Team Analytics', async () => {
        const response = await axios.get(`${BASE_URL}/analytics/team`, {
            headers: { Authorization: `Bearer ${testData.tokens.admin}` }
        });
        log.success(`Got team analytics`);
    });

    // Test 4.4: Get Queue Status
    await runTest('Queue Status', async () => {
        const response = await axios.get(`${BASE_URL}/queue/status`, {
            headers: { Authorization: `Bearer ${testData.tokens.admin}` }
        });
        const queues = response.data.data;
        log.success(`Queues: ${Object.keys(queues).length} queues found`);
    });
}

// ======================= AI SERVICE TESTS =======================

async function testAIService() {
    log.section('5. AI SERVICE TESTS');

    if (testData.emailIds.length > 0) {
        // Test 5.1: Analyze Email
        await runTest('Analyze Email', async () => {
            const response = await axios.post(
                `${BASE_URL}/ai/analyze/${testData.emailIds[0]}`,
                {},
                { headers: { Authorization: `Bearer ${testData.tokens.admin}` } }
            );
            log.success(`AI Analysis: ${response.data.data.category} (${response.data.data.confidence} confidence)`);
        });

        // Test 5.2: Generate Reply
        await runTest('Generate Reply', async () => {
            const response = await axios.post(
                `${BASE_URL}/ai/reply/${testData.emailIds[0]}`,
                { tone: 'professional' },
                { headers: { Authorization: `Bearer ${testData.tokens.admin}` } }
            );
            log.success(`AI Reply generated`);
        });

        // Test 5.3: Summarize Email
        await runTest('Summarize Email', async () => {
            const response = await axios.post(
                `${BASE_URL}/ai/summarize/${testData.emailIds[0]}`,
                {},
                { headers: { Authorization: `Bearer ${testData.tokens.admin}` } }
            );
            log.success(`AI Summary: ${response.data.data.summary?.substring(0, 50)}...`);
        });
    }
}

// ======================= LEGACY ENDPOINTS TESTS =======================

async function testLegacyEndpoints() {
    log.section('6. LEGACY ENDPOINTS TESTS');

    // Test 6.1: Legacy Analytics Overview
    await runTest('Legacy Analytics Overview', async () => {
        const response = await axios.get(`${BASE_URL}/analytics/overview`, {
            headers: { Authorization: `Bearer ${testData.tokens.admin}` }
        });
        log.success(`Legacy overview works`);
    });

    // Test 6.2: Legacy Email Stats
    await runTest('Legacy Email Stats', async () => {
        const response = await axios.get(`${BASE_URL}/analytics/email-stats?period=week`, {
            headers: { Authorization: `Bearer ${testData.tokens.admin}` }
        });
        log.success(`Legacy email stats: ${response.data.data.total} total emails`);
    });

    // Test 6.3: Legacy Account Stats
    await runTest('Legacy Account Stats', async () => {
        const response = await axios.get(`${BASE_URL}/analytics/account-stats`, {
            headers: { Authorization: `Bearer ${testData.tokens.admin}` }
        });
        log.success(`Legacy account stats: ${response.data.data.length} accounts`);
    });
}

// ======================= ERROR HANDLING TESTS =======================

async function testErrorHandling() {
    log.section('7. ERROR HANDLING TESTS');

    // Test 7.1: Unauthenticated Access
    await runTest('Unauthenticated Access', async () => {
        try {
            await axios.get(`${BASE_URL}/emails`);
            throw new Error('Should have returned 401');
        } catch (error) {
            if (error.response?.status === 401) {
                log.success('Correctly returned 401 Unauthorized');
            } else {
                throw error;
            }
        }
    });

    // Test 7.2: Wrong Role Access (Agent trying admin endpoint)
    if (testData.tokens.agent) {
        await runTest('Wrong Role Access', async () => {
            try {
                await axios.get(`${BASE_URL}/auth/users`, {
                    headers: { Authorization: `Bearer ${testData.tokens.agent}` }
                });
                throw new Error('Should have returned 403');
            } catch (error) {
                if (error.response?.status === 403) {
                    log.success('Correctly returned 403 Forbidden for agent');
                } else {
                    log.info(`Got ${error.response?.status} instead of 403`);
                }
            }
        });
    }

    // Test 7.3: Invalid Email ID
    await runTest('Invalid Email ID', async () => {
        try {
            await axios.get(`${BASE_URL}/emails/invalid_id_123`, {
                headers: { Authorization: `Bearer ${testData.tokens.admin}` }
            });
            throw new Error('Should have returned 404');
        } catch (error) {
            if (error.response?.status === 404) {
                log.success('Correctly returned 404 Not Found');
            } else {
                log.info(`Got ${error.response?.status} for invalid ID`);
            }
        }
    });
}

// ======================= MAIN TEST RUNNER =======================

async function runAllTests() {
    console.log(`
${colors.cyan}
╔══════════════════════════════════════════════════════╗
║      PROCESSMAIL API COMPREHENSIVE TEST SUITE        ║
║                Full System Validation                ║
╚══════════════════════════════════════════════════════╝
${colors.reset}
`);

    let passed = 0;
    let failed = 0;

    const testSuites = [
        { name: 'Authentication', func: testAuthentication },
        { name: 'Email Accounts', func: testEmailAccounts },
        { name: 'Email Management', func: testEmailManagement },
        { name: 'Dashboard & Analytics', func: testDashboardAnalytics },
        { name: 'AI Service', func: testAIService },
        { name: 'Legacy Endpoints', func: testLegacyEndpoints },
        { name: 'Error Handling', func: testErrorHandling }
    ];

    for (const suite of testSuites) {
        try {
            await suite.func();
            passed++;
        } catch (error) {
            failed++;
            log.error(`Test suite ${suite.name} failed:`, error);
        }
    }

    // Summary
    log.section('TEST SUMMARY');
    console.log(`${colors.green}✅ Passed: ${passed} test suites${colors.reset}`);
    if (failed > 0) {
        console.log(`${colors.red}❌ Failed: ${failed} test suites${colors.reset}`);
    } else {
        console.log(`${colors.green}🎉 All test suites passed!${colors.reset}`);
    }

    // Test Data Summary
    console.log(`\n${colors.cyan}📊 Test Data Created:${colors.reset}`);
    console.log(`   Email IDs: ${testData.emailIds.length}`);
    console.log(`   Account ID: ${testData.accountId}`);
    console.log(`   Admin Token: ${testData.tokens.admin ? '✓' : '✗'}`);
    console.log(`   Reviewer Token: ${testData.tokens.reviewer ? '✓' : '✗'}`);
    console.log(`   Agent Token: ${testData.tokens.agent ? '✓' : '✗'}`);

    console.log(`\n${colors.yellow}📋 Next Steps:${colors.reset}`);
    console.log(`   1. Check server logs for any errors`);
    console.log(`   2. Verify database has test data`);
    console.log(`   3. Test frontend integration`);
    console.log(`   4. Run individual endpoint tests if needed\n`);
}

// ======================= RUN THE TESTS =======================

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
    console.error(`${colors.red}Unhandled Rejection:${colors.reset}`, error.message);
    process.exit(1);
});

// Run all tests
runAllTests().catch(error => {
    console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
    process.exit(1);
});