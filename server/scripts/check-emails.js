// scripts/check-emails.js
const mongoose = require('mongoose');
require('dotenv').config();

async function checkEmails() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/processmail');
        console.log('✅ Connected to MongoDB');

        // Try to load Email model
        let Email;
        try {
            Email = require('../src/modules/emails/email.model');
            console.log('✅ Email model loaded');
        } catch (e) {
            console.log('⚠️ Creating Email schema directly...');
            const emailSchema = new mongoose.Schema({
                fromAddress: String,
                toAddress: String,
                subject: String,
                bodyText: String,
                status: String,
                category: String,
                createdAt: Date
            }, { timestamps: true });
            Email = mongoose.model('Email', emailSchema);
        }

        // Count emails
        const count = await Email.countDocuments();
        console.log(`📧 Total emails in database: ${count}`);

        if (count === 0) {
            console.log('\n💡 No emails found. Let\'s create some test emails...');

            // Create test emails
            const testEmails = [
                {
                    fromAddress: 'customer1@example.com',
                    toAddress: 'support@company.com',
                    subject: 'Product Issue - Need Help',
                    bodyText: 'The product I purchased is not working properly. It keeps crashing when I try to use feature X.',
                    status: 'NEW',
                    category: 'Issue',
                    createdAt: new Date()
                },
                {
                    fromAddress: 'customer2@example.com',
                    toAddress: 'support@company.com',
                    subject: 'Billing Inquiry',
                    bodyText: 'I was charged twice this month. Can you please refund the extra charge?',
                    status: 'DRAFTED',
                    category: 'Billing',
                    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
                },
                {
                    fromAddress: 'customer3@example.com',
                    toAddress: 'support@company.com',
                    subject: 'Feature Request',
                    bodyText: 'I love your product! Can you add a dark mode feature?',
                    status: 'REVIEWED',
                    category: 'Feedback',
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
                }
            ];

            await Email.insertMany(testEmails);
            console.log('✅ Created 3 test emails');

            // Verify
            const newCount = await Email.countDocuments();
            console.log(`📧 Now total emails: ${newCount}`);
        } else {
            // Show sample emails
            const emails = await Email.find().limit(3).sort({ createdAt: -1 });
            console.log('\n📨 Sample emails:');
            emails.forEach((email, i) => {
                console.log(`\nEmail ${i + 1}:`);
                console.log(`  From: ${email.fromAddress}`);
                console.log(`  Subject: ${email.subject}`);
                console.log(`  Status: ${email.status}`);
                console.log(`  Created: ${email.createdAt}`);
            });
        }

        await mongoose.disconnect();
        console.log('\n✅ Database check complete');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkEmails();