// scripts/check-synced-emails.js
require('dotenv').config();
const mongoose = require('../src/config/database');
const Email = require('../src/models/email.model');
const EmailAccount = require('../src/models/emailAccount.model');

async function checkSyncedEmails() {
    console.log('🔍 Checking Synced Emails in Database...\n');

    try {
        await mongoose.connectDB();

        // 1. Check email accounts
        const accounts = await EmailAccount.find();
        console.log(`📧 Found ${accounts.length} email accounts:`);
        accounts.forEach(account => {
            console.log(`   - ${account.email} (${account.provider})`);
            console.log(`     ID: ${account._id}, Last Sync: ${account.lastSyncedAt || 'Never'}`);
        });

        // 2. Check emails in database
        const emails = await Email.find().sort({ createdAt: -1 }).limit(20);
        console.log(`\n📨 Found ${emails.length} emails in database:`);

        if (emails.length === 0) {
            console.log('   No emails found in database.');
            console.log('\n💡 Emails are not being synced. Possible reasons:');
            console.log('   1. Sync not triggered');
            console.log('   2. IMAP connection failing');
            console.log('   3. Email account not properly configured');
            console.log('   4. Background worker not running');
        } else {
            emails.forEach((email, index) => {
                console.log(`\n📧 Email ${index + 1}:`);
                console.log(`   ID: ${email._id}`);
                console.log(`   From: ${email.fromAddress}`);
                console.log(`   To: ${email.toAddress}`);
                console.log(`   Subject: ${email.subject}`);
                console.log(`   Status: ${email.status}`);
                console.log(`   Created: ${email.createdAt}`);
                console.log(`   Account ID: ${email.accountId || 'None'}`);
            });
        }

        // 3. Check sync statistics
        console.log('\n📊 Sync Statistics:');
        const emailStats = await Email.aggregate([
            {
                $group: {
                    _id: '$accountId',
                    count: { $sum: 1 },
                    byStatus: {
                        $push: '$status'
                    }
                }
            }
        ]);

        emailStats.forEach(stat => {
            console.log(`   Account ${stat._id}: ${stat.count} emails`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkSyncedEmails();