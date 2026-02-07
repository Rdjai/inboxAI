// scripts/test-email-fixed.js
require('dotenv').config();
const axios = require('axios');
const mongoose = require('../src/config/database');

// Your existing token
const YOUR_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTg1MTg3YTBiY2FhYWZmMWFlNGFmZmQiLCJpYXQiOjE3NzAzMzA0OTgsImV4cCI6MTc3MDkzNTI5OH0.5QhNBHv2K6zU2n7rATmndM49Dkqm28STMKrSvG7m9jo';

const BASE_URL = 'http://localhost:3000/api';

async function testEmailSending() {
    console.log('📧 Testing Email Sending...\n');

    try {
        // Connect to database first
        await mongoose.connectDB();
        console.log('✅ Connected to database');

        // 1. Test with existing token
        console.log('\n1. Testing with existing token...');
        const headers = {
            Authorization: `Bearer ${YOUR_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test profile first
        try {
            const profileRes = await axios.get(`${BASE_URL}/auth/profile`, { headers });
            console.log(`✅ Token valid! User: ${profileRes.data.data.name} (${profileRes.data.data.email})`);
        } catch (error) {
            console.log('❌ Token invalid, trying to login...');

            // Try to login
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                email: 'admin@processmail.com',
                password: 'admin123'
            });

            const newToken = loginRes.data.data.token;
            console.log('✅ Login successful, got new token');
            headers.Authorization = `Bearer ${newToken}`;
        }

        // 2. Check email accounts
        console.log('\n2. Checking email accounts...');
        let accountId;
        try {
            const accountsRes = await axios.get(`${BASE_URL}/email/accounts`, { headers });
            if (accountsRes.data.data.length > 0) {
                accountId = accountsRes.data.data[0]._id;
                console.log(`✅ Found email account: ${accountsRes.data.data[0].email}`);
                console.log(`   Account ID: ${accountId}`);
            } else {
                console.log('⚠️ No email accounts found, creating one...');

                // Create a test email account
                const createRes = await axios.post(`${BASE_URL}/email/accounts`, {
                    name: 'Test Gmail',
                    email: 'jaykashyap283125@gmail.com',
                    provider: 'gmail',
                    imapConfig: {
                        host: 'imap.gmail.com',
                        port: 993,
                        secure: true,
                        auth: {
                            user: 'jaykashyap283125@gmail.com',
                            pass: process.env.GMAIL_APP_PASSWORD || 'YOUR_APP_PASSWORD'
                        }
                    },
                    smtpConfig: {
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: true,
                        auth: {
                            user: 'jaykashyap283125@gmail.com',
                            pass: process.env.GMAIL_APP_PASSWORD || 'YOUR_APP_PASSWORD'
                        }
                    },
                    isDefault: true,
                    isActive: true
                }, { headers });

                accountId = createRes.data.data._id;
                console.log(`✅ Created email account: ${createRes.data.data.email}`);
            }
        } catch (error) {
            console.log('⚠️ Email accounts endpoint error:', error.response?.data?.message || error.message);

            // Try direct database approach
            console.log('\nTrying direct approach...');
            const EmailAccount = require('../src/models/emailAccount.model');
            const accounts = await EmailAccount.find();
            if (accounts.length > 0) {
                accountId = accounts[0]._id;
                console.log(`✅ Found account in DB: ${accounts[0].email}`);
            }
        }

        // 3. Create a simple test endpoint
        console.log('\n3. Creating test endpoint...');

        // Check if test-send-email exists
        try {
            await axios.get(`${BASE_URL}/test-send-email`, { headers });
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('⚠️ /test-send-email not found, using alternative...');

                // Use email creation and sending flow
                console.log('\n4. Creating test email...');
                const emailRes = await axios.post(`${BASE_URL}/emails`, {
                    fromAddress: 'test@customer.com',
                    toAddress: 'jagannathkashyap38@gmail.com',
                    subject: 'Test from ProcessMail',
                    bodyText: 'Hello! This is a test email from ProcessMail system.'
                }, { headers });

                const emailId = emailRes.data.data._id;
                console.log(`✅ Created email with ID: ${emailId}`);

                // Try to send directly using nodemailer
                console.log('\n5. Sending email directly with nodemailer...');

                const nodemailer = require('nodemailer');

                // Create transporter with your Gmail credentials
                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: 'jaykashyap283125@gmail.com',
                        pass: process.env.GMAIL_APP_PASSWORD || 'xntb ghjl rxeb ehti'
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                });

                // Verify connection
                await transporter.verify();
                console.log('✅ SMTP connection verified');

                // Send mail
                const info = await transporter.sendMail({
                    from: '"ProcessMail Test" <jaykashyap283125@gmail.com>',
                    to: 'jagannathkashyap38@gmail.com',
                    subject: 'Direct Test from ProcessMail',
                    text: 'This email was sent directly via nodemailer from your ProcessMail backend.',
                    html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #3B82F6;">ProcessMail Direct Test</h2>
              <p>This email was sent directly from the backend using nodemailer.</p>
              <p><strong>From:</strong> jaykashyap283125@gmail.com</p>
              <p><strong>To:</strong> jagannathkashyap38@gmail.com</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <hr>
              <p style="color: #666; font-size: 12px;">
                If you receive this, email sending is working! 🎉
              </p>
            </div>
          `
                });

                console.log('✅ Email sent successfully!');
                console.log(`   Message ID: ${info.messageId}`);
                console.log(`   Response: ${info.response}`);

                // Update the email status in database
                const Email = require('../src/models/email.model');
                await Email.findByIdAndUpdate(emailId, {
                    status: 'SENT',
                    sentAt: new Date(),
                    draftText: 'This email was sent via direct nodemailer'
                });

                console.log('\n🎉 Email sending test completed successfully!');
                console.log('\n📋 Summary:');
                console.log('   From: jaykashyap283125@gmail.com');
                console.log('   To: jagannathkashyap38@gmail.com');
                console.log('   Method: Direct nodemailer');
                console.log('   Status: ✅ Success');

            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

    } catch (error) {
        console.error('\n❌ Test failed:');
        console.error('   Error:', error.message);

        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }

        console.log('\n💡 Troubleshooting tips:');
        console.log('   1. Check if backend is running: npm run dev');
        console.log('   2. Check MongoDB connection');
        console.log('   3. Verify Gmail app password');
        console.log('   4. Check server logs for errors');
    }
}

// Run the test
testEmailSending().catch(console.error);