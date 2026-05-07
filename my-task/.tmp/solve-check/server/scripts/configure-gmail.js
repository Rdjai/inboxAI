// scripts/configure-gmail.js
require('dotenv').config();
const mongoose = require('../src/config/database');
const EmailAccount = require('../src/models/emailAccount.model');
const User = require('../src/models/user.model');

async function configureGmailAccount() {
    try {
        await mongoose.connectDB();

        // Get admin user
        const admin = await User.findOne({ email: 'admin@processmail.com' });
        if (!admin) {
            console.error('Admin user not found. Run seed script first.');
            process.exit(1);
        }

        console.log('🔧 Configuring Gmail Account for:', admin.email);

        // Check if account already exists
        const existingAccount = await EmailAccount.findOne({
            userId: admin._id,
            email: 'jaykashyap283125@gmail.com'
        });

        if (existingAccount) {
            console.log('⚠️ Account already exists. Updating...');

            // Update existing account
            existingAccount.imapConfig = {
                host: 'imap.gmail.com',
                port: 993,
                secure: true,
                auth: {
                    user: 'jaykashyap283125@gmail.com',
                    pass: process.env.GMAIL_APP_PASSWORD || 'xntb ghjl rxeb ehti'
                }
            };

            existingAccount.smtpConfig = {
                host: 'smtp.gmail.com',
                port: 587,
                secure: true,
                auth: {
                    user: 'jaykashyap283125@gmail.com',
                    pass: process.env.GMAIL_APP_PASSWORD || 'xntb ghjl rxeb ehti'
                }
            };

            existingAccount.isDefault = true;
            existingAccount.isActive = true;

            await existingAccount.save();
            console.log('✅ Gmail account updated successfully');
        } else {
            // Create new account
            const account = new EmailAccount({
                userId: admin._id,
                name: 'Jay Kashyap Gmail',
                email: 'jaykashyap283125@gmail.com',
                provider: 'gmail',
                imapConfig: {
                    host: 'imap.gmail.com',
                    port: 993,
                    secure: true,
                    auth: {
                        user: 'jaykashyap283125@gmail.com',
                        pass: process.env.GMAIL_APP_PASSWORD || 'xntb ghjl rxeb ehti'
                    }
                },
                smtpConfig: {
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: true,
                    auth: {
                        user: 'jaykashyap283125@gmail.com',
                        pass: process.env.GMAIL_APP_PASSWORD || 'xntb ghjl rxeb ehti'
                    }
                },
                isDefault: true,
                isActive: true,
                syncFrequency: '30min',
                labels: [
                    { name: 'Inbox', color: '#3B82F6', type: 'system' },
                    { name: 'Sent', color: '#10B981', type: 'system' },
                    { name: 'Drafts', color: '#F59E0B', type: 'system' },
                    { name: 'Trash', color: '#EF4444', type: 'system' }
                ]
            });

            await account.save();
            console.log('✅ Gmail account created successfully');
        }

        console.log('\n📋 Configuration Summary:');
        console.log('   From: jaykashyap283125@gmail.com');
        console.log('   To: jagannathkashyap38@gmail.com (test recipient)');
        console.log('   Admin User:', admin.email);

        console.log('\n🎉 Configuration complete!');
        console.log('\nTo test:');
        console.log('1. Send POST request to:');
        console.log('   http://localhost:3000/api/test-send-email');
        console.log('   Headers: Authorization: Bearer YOUR_TOKEN');
        console.log('   Body: { "to": "jagannathkashyap38@gmail.com", "subject": "Test", "body": "Hello!" }');

        process.exit(0);
    } catch (error) {
        console.error('❌ Configuration failed:', error);
        process.exit(1);
    }
}

configureGmailAccount();