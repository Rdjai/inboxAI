const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Email = require('../models/Email');
const AuditLog = require('../models/AuditLog');

const seedDatabase = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inboxai');
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Email.deleteMany({});
        await AuditLog.deleteMany({});

        // Create test users
        console.log('👥 Creating test users...');
        const users = await User.create([
            {
                email: 'admin@inboxai.com',
                name: 'Admin User',
                password: 'admin123',
                role: 'admin',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
            },
            {
                email: 'reviewer@inboxai.com',
                name: 'Reviewer User',
                password: 'reviewer123',
                role: 'reviewer',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reviewer'
            },
            {
                email: 'agent@inboxai.com',
                name: 'Agent User',
                password: 'agent123',
                role: 'agent',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=agent'
            }
        ]);

        console.log(`✅ Created ${users.length} users`);

        // Create test emails with different statuses
        console.log('📧 Creating test emails...');
        const testEmails = [
            {
                from: 'customer1@example.com',
                to: 'support@inboxai.com',
                subject: 'Product Not Working - Urgent Help Needed',
                body: `Hello Support Team,

I recently purchased your software and it's not working at all. The application crashes immediately when I try to open it. I've tried reinstalling multiple times but same issue.

This is very frustrating as I need this for an important deadline. Please help me resolve this immediately.

Thanks,
John`,
                category: 'issue',
                priority: 'urgent',
                status: 'reviewed', // Different status for testing
                confidence: 0.85,
                draft: `Dear John,

Thank you for reporting this critical issue. We understand how important this is for your work.

Our technical team is investigating this crash issue immediately. We suspect it might be related to a recent update.

In the meantime, could you please:
1. Try version 2.1.0 from our archives page
2. Check if your system meets the minimum requirements
3. Send us your system specs for better troubleshooting

We'll get back to you within 2 hours with a solution.

Best regards,
Technical Support`,
                assignedTo: users[2]._id
            },
            {
                from: 'customer2@example.com',
                to: 'support@inboxai.com',
                subject: 'Refund Request - Unsatisfied with Service',
                body: `I want my money back! The service is terrible and doesn't do what was promised. I've been trying to get it to work for 2 weeks with no success.

Please process my refund immediately.

Regards,
Sarah`,
                category: 'refund',
                priority: 'high',
                status: 'drafted',
                confidence: 0.92,
                draft: `Dear Sarah,

Thank you for contacting us about your refund request. We're sorry to hear about your experience.

Our billing department is reviewing your case according to our refund policy. This usually takes 3-5 business days.

Could you please provide your order number and purchase date to expedite the process?

Best regards,
Billing Department`,
                assignedTo: users[1]._id
            },
            {
                from: 'customer3@example.com',
                to: 'support@inboxai.com',
                subject: 'Invoice Question - March 2024',
                body: `Hi there,

I received an invoice for $299 but I believe I'm on the $99/month plan. Can you check this and explain the charges?

Thanks,
Mike`,
                category: 'billing',
                priority: 'medium',
                status: 'approved',
                confidence: 0.78,
                draft: `Hello Mike,

Thank you for your inquiry about your invoice.

We've reviewed your account and found that the $299 charge includes:
- $99 for monthly subscription
- $200 for additional storage (50GB upgrade)

You can downgrade your storage in account settings to return to $99/month.

Let us know if you need help with this.

Regards,
Billing Support`,
                assignedTo: users[2]._id,
                sentAt: new Date(Date.now() - 86400000) // Yesterday
            },
            {
                from: 'customer4@example.com',
                to: 'support@inboxai.com',
                subject: 'Great Product! Some suggestions...',
                body: `I love your product! It has really helped my workflow. I do have some suggestions for improvements:

1. Dark mode would be great
2. Keyboard shortcuts for common actions
3. Better mobile app

Keep up the good work!
Alex`,
                category: 'feedback',
                priority: 'low',
                status: 'sent',
                confidence: 0.65,
                draft: `Hi Alex,

Thank you so much for your positive feedback and great suggestions!

We're actually working on dark mode for our next release (coming in June). Keyboard shortcuts are on our roadmap for Q3, and we're redesigning the mobile app.

We'll add your suggestions to our feature requests.

Thanks for being a great customer!

Best,
Product Team`,
                assignedTo: users[0]._id,
                sentAt: new Date()
            },
            {
                from: 'customer5@example.com',
                to: 'sales@inboxai.com',
                subject: 'Interested in Enterprise Plan',
                body: `We're looking for an enterprise solution for our team of 50 people. Can you send me pricing and schedule a demo?

Best,
David (CTO, TechCorp)`,
                category: 'sales',
                priority: 'high',
                status: 'new',
                confidence: 0.88,
                draft: ''
            },
            {
                from: 'customer6@example.com',
                to: 'support@inboxai.com',
                subject: 'Bug Report - Feature X Not Working',
                body: `Hi, I found a bug in feature X. When I try to save, it gives an error. Please fix this soon.

Thanks,
Emma`,
                category: 'issue',
                priority: 'medium',
                status: 'classified',
                confidence: 0.76,
                draft: '',
                assignedTo: users[2]._id
            },
            {
                from: 'customer7@example.com',
                to: 'support@inboxai.com',
                subject: 'Complaint - Poor Customer Service',
                body: `I'm very disappointed with your customer service. I've been waiting for 3 days without any response to my ticket.

This is unacceptable!`,
                category: 'complaint',
                priority: 'urgent',
                status: 'failed',
                confidence: 0.91,
                draft: `Dear Customer,

We sincerely apologize for the delay in responding to your ticket. This is not the level of service we aim to provide.

We've escalated your issue to our senior support team who will contact you within the next hour.

Please accept our apologies for any inconvenience caused.

Best regards,
Customer Service Manager`,
                assignedTo: users[1]._id
            }
        ];

        const emails = await Email.create(testEmails);
        console.log(`✅ Created ${emails.length} test emails`);

        // Create audit logs for various actions
        console.log('📝 Creating audit logs...');
        const auditLogs = await AuditLog.create([
            // Email 0: Issue email
            {
                email: emails[0]._id,
                user: users[2]._id,
                action: 'classified',
                details: { category: 'issue', confidence: 0.85 }
            },
            {
                email: emails[0]._id,
                user: users[2]._id,
                action: 'drafted',
                details: { length: emails[0].draft.length }
            },
            {
                email: emails[0]._id,
                user: users[1]._id,
                action: 'reviewed',
                details: { reviewedBy: 'reviewer', changes: 'Added troubleshooting steps' }
            },

            // Email 1: Refund email
            {
                email: emails[1]._id,
                user: users[2]._id,
                action: 'classified',
                details: { category: 'refund', confidence: 0.92 }
            },
            {
                email: emails[1]._id,
                user: users[2]._id,
                action: 'drafted',
                details: { length: emails[1].draft.length }
            },

            // Email 2: Billing email
            {
                email: emails[2]._id,
                user: users[2]._id,
                action: 'classified',
                details: { category: 'billing', confidence: 0.78 }
            },
            {
                email: emails[2]._id,
                user: users[2]._id,
                action: 'drafted',
                details: { length: emails[2].draft.length }
            },
            {
                email: emails[2]._id,
                user: users[0]._id,
                action: 'approved',
                details: { approvedBy: 'admin' }
            },
            {
                email: emails[2]._id,
                user: users[0]._id,
                action: 'sent',
                details: { sentAt: emails[2].sentAt }
            },

            // Email 3: Feedback email
            {
                email: emails[3]._id,
                user: users[2]._id,
                action: 'classified',
                details: { category: 'feedback', confidence: 0.65 }
            },
            {
                email: emails[3]._id,
                user: users[2]._id,
                action: 'drafted',
                details: { length: emails[3].draft.length }
            },
            {
                email: emails[3]._id,
                user: users[0]._id,
                action: 'approved',
                details: { approvedBy: 'admin' }
            },
            {
                email: emails[3]._id,
                user: users[0]._id,
                action: 'sent',
                details: { sentAt: emails[3].sentAt }
            },

            // Email 4: Sales email (new)
            {
                email: emails[4]._id,
                action: 'created',
                details: { source: 'manual', priority: 'high' }
            },

            // Email 6: Complaint email (failed)
            {
                email: emails[6]._id,
                user: users[1]._id,
                action: 'classified',
                details: { category: 'complaint', confidence: 0.91 }
            },
            {
                email: emails[6]._id,
                user: users[1]._id,
                action: 'drafted',
                details: { length: emails[6].draft.length }
            },
            {
                email: emails[6]._id,
                action: 'failed',
                details: { error: 'Could not send email - SMTP server down' }
            }
        ]);

        console.log(`✅ Created ${auditLogs.length} audit logs`);

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Test Credentials:');
        console.log('='.repeat(50));
        console.log('Admin:');
        console.log('  Email: admin@inboxai.com');
        console.log('  Password: admin123');
        console.log('\nReviewer:');
        console.log('  Email: reviewer@inboxai.com');
        console.log('  Password: reviewer123');
        console.log('\nAgent:');
        console.log('  Email: agent@inboxai.com');
        console.log('  Password: agent123');
        console.log('='.repeat(50));

        console.log('\n📧 Test Data Summary:');
        console.log('='.repeat(50));
        console.log(`Users: ${users.length}`);
        console.log(`Emails: ${emails.length} (with different statuses)`);
        console.log(`Audit Logs: ${auditLogs.length}`);
        console.log('');
        console.log('Email Status Distribution:');
        const statusCount = {};
        emails.forEach(email => {
            statusCount[email.status] = (statusCount[email.status] || 0) + 1;
        });
        Object.entries(statusCount).forEach(([status, count]) => {
            console.log(`  ${status}: ${count} emails`);
        });
        console.log('');
        console.log('Email Categories:');
        const categoryCount = {};
        emails.forEach(email => {
            categoryCount[email.category] = (categoryCount[email.category] || 0) + 1;
        });
        Object.entries(categoryCount).forEach(([category, count]) => {
            console.log(`  ${category}: ${count} emails`);
        });
        console.log('='.repeat(50));

        console.log('\n🚀 You can now start the server and test the API!');
        console.log('\n💡 Test the API with:');
        console.log('  1. Login with any test user');
        console.log('  2. Try different endpoints:');
        console.log('     - GET /api/emails');
        console.log('     - GET /api/analytics/dashboard');
        console.log('     - Create new emails');
        console.log('     - Update drafts, approve, send');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        if (error.errors) {
            console.error('Validation errors:');
            Object.entries(error.errors).forEach(([field, err]) => {
                console.error(`  ${field}: ${err.message}`);
            });
        }
        process.exit(1);
    }
};

seedDatabase();