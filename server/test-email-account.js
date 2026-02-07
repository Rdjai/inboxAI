// test-email-account.js
const axios = require('axios');

async function testEmailAccountAPI() {
    const baseURL = 'http://localhost:3000/api';

    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
        email: 'admin@processmail.com',
        password: 'admin123'
    });

    const token = loginRes.data.data.token;
    console.log('✅ Login successful\n');

    const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. Get email accounts
    console.log('2. Getting email accounts...');
    try {
        const accountsRes = await axios.get(`${baseURL}/email/accounts`, { headers });
        console.log('✅ Email accounts:', accountsRes.data.data.length);
    } catch (error) {
        console.log('❌ No email accounts yet');
    }

    // 3. Create a test email account (mock)
    console.log('\n3. Creating test email account...');
    const testAccount = {
        name: 'Test Support',
        email: 'support@testcompany.com',
        provider: 'gmail',
        imapConfig: {
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            auth: {
                user: 'support@testcompany.com',
                pass: 'testpassword123'
            }
        },
        smtpConfig: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: true,
            auth: {
                user: 'support@testcompany.com',
                pass: 'testpassword123'
            }
        }
    };

    try {
        const createRes = await axios.post(`${baseURL}/email/accounts`, testAccount, { headers });
        console.log('✅ Test account created (connection will fail but account is saved)');
    } catch (error) {
        console.log('⚠️ Account creation failed (expected without real credentials):', error.response?.data?.message);
    }

    // 4. Get analytics
    console.log('\n4. Testing analytics endpoints...');
    const analyticsRes = await axios.get(`${baseURL}/analytics/overview`, { headers });
    console.log('✅ Analytics overview:', analyticsRes.data.data.overview);

    console.log('\n🎉 Email Account API test completed!');
}

testEmailAccountAPI().catch(console.error);