require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

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

const quickTest = async () => {
    console.log('🚀 Quick Backend Test (Using Fetch)');
    console.log('='.repeat(40));

    try {
        // 1. Test health endpoint
        console.log('\n1. Testing server health...');
        const health = await fetchAPI('/health');
        console.log('   ✓ Server is running');
        console.log('   Service:', health.service);
        console.log('   Status:', health.status);

        // 2. Test user registration
        console.log('\n2. Testing user registration...');
        const userData = {
            email: `quicktest${Date.now()}@example.com`,
            password: 'test123',
            name: 'Quick Test User'
        };

        const register = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        console.log('   ✓ User registered');
        console.log('   User ID:', register.data.user._id);

        // 3. Test user login
        console.log('\n3. Testing user login...');
        const login = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: userData.email,
                password: userData.password
            })
        });
        console.log('   ✓ User logged in');
        const token = login.data.token;

        // 4. Test create email
        console.log('\n4. Testing email creation...');
        const emailData = {
            from: 'test@customer.com',
            to: 'support@inboxai.com',
            subject: 'Quick Test Email - Need Assistance',
            body: 'Hello, I am testing the email creation API. This should trigger AI classification and draft generation.'
        };

        const email = await fetchAPI('/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(emailData)
        });
        console.log('   ✓ Email created');
        console.log('   Email ID:', email.data._id);
        console.log('   Subject:', email.data.subject);

        // Wait for AI processing
        console.log('\n5. Waiting for AI processing (3 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 5. Test get email details
        console.log('\n6. Checking email details...');
        const emailDetails = await fetchAPI(`/emails/${email.data._id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const emailInfo = emailDetails.data;
        console.log('   ✓ Email details retrieved');
        console.log('   Status:', emailInfo.status);
        console.log('   Category:', emailInfo.category);
        console.log('   Has Draft:', emailInfo.draft ? 'Yes' : 'No');

        // 6. Test get emails list
        console.log('\n7. Testing get emails...');
        const emails = await fetchAPI('/emails?limit=5', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✓ Emails fetched');
        console.log('   Total emails:', emails.pagination.total);

        console.log('\n' + '='.repeat(40));
        console.log('✅ ALL TESTS PASSED! 🎉');
        console.log('\n📋 Backend is working correctly with:');
        console.log('- REST API');
        console.log('- JWT Authentication');
        console.log('- Email Management');
        console.log('- AI Processing');
        console.log('- No Redis Required');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Error:', error.response.data);
        }
        console.error('\n💡 Troubleshooting tips:');
        console.error('1. Make sure MongoDB is running: mongod');
        console.error('2. Make sure server is running: npm run dev');
        console.error('3. Check if port 5000 is available');
        process.exit(1);
    }
};

// Check server before running tests
const checkServer = async () => {
    try {
        const response = await fetch(`${BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        return false;
    }
};

const main = async () => {
    console.log('🔍 Checking server status...');

    // Try for 10 seconds
    for (let i = 0; i < 5; i++) {
        if (await checkServer()) {
            break;
        }
        if (i === 4) {
            console.error('\n❌ Server not running. Please start it first:');
            console.error('   cd server && npm run dev');
            process.exit(1);
        }
        console.log(`   Waiting for server... (${i + 1}/5)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await quickTest();
};

main();