// scripts/test-api-emails.js
const axios = require('axios');

async function testAPI() {
    const BASE_URL = 'http://localhost:3000/api';

    console.log('🔍 Testing API for emails...\n');

    try {
        // 1. Login first
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@processmail.com',
            password: 'admin123'
        });

        const token = loginRes.data.data.token;
        console.log('✅ Login successful');

        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Test emails endpoint
        console.log('\n2. Testing /api/emails endpoint...');
        const emailsRes = await axios.get(`${BASE_URL}/emails`, { headers });

        console.log('✅ API Response:');
        console.log('   Success:', emailsRes.data.success);
        console.log('   Message:', emailsRes.data.message || 'No message');
        console.log('   Total emails:', emailsRes.data.pagination?.total || 0);
        console.log('   Data length:', emailsRes.data.data?.length || 0);

        if (emailsRes.data.data && emailsRes.data.data.length > 0) {
            console.log('\n📧 Sample email from API:');
            const email = emailsRes.data.data[0];
            console.log('   ID:', email._id);
            console.log('   From:', email.fromAddress);
            console.log('   Subject:', email.subject);
            console.log('   Status:', email.status);
        } else {
            console.log('\n❌ No emails returned from API');

            // Try to create a test email via API
            console.log('\n3. Creating test email via API...');
            try {
                const createRes = await axios.post(`${BASE_URL}/emails`, {
                    fromAddress: 'test@customer.com',
                    toAddress: 'support@company.com',
                    subject: 'API Test Email',
                    bodyText: 'This is a test email created via API'
                }, { headers });

                console.log('✅ Test email created:', createRes.data.data._id);

                // Check again
                console.log('\n4. Checking emails again...');
                const newEmailsRes = await axios.get(`${BASE_URL}/emails`, { headers });
                console.log('   Now total emails:', newEmailsRes.data.pagination?.total || 0);

            } catch (createError) {
                console.log('❌ Failed to create test email:', createError.response?.data?.message || createError.message);
            }
        }

    } catch (error) {
        console.error('\n❌ API Test failed:');
        console.error('   Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Response:', error.response.data);
        }
    }
}

testAPI();