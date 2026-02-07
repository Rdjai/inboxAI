// scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const Email = require('../src/models/email.model');
const { ROLES, EMAIL_STATUS, EMAIL_CATEGORIES, PRIORITY } = require('../src/utils/constants');

async function seedDatabase() {
    try {
        // Connect to database
        await mongoose.connect("mongodb://localhost:27017/processmail", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to database');

        // Clear existing data
        await User.deleteMany({});
        await Email.deleteMany({});
        console.log('Cleared existing data');

        // Create admin user
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@inboxai.com',
            password: 'admin123',
            role: ROLES.ADMIN,
            isActive: true
        });

        // Create reviewer user
        const reviewer = await User.create({
            name: 'Reviewer User',
            email: 'reviewer@inboxai.com',
            password: 'reviewer123',
            role: ROLES.REVIEWER,
            isActive: true
        });

        // Create agent user
        const agent = await User.create({
            name: 'Agent User',
            email: 'agent@inboxai.com',
            password: 'agent123',
            role: ROLES.AGENT,
            isActive: true
        });

        // Create sample emails
        const sampleEmails = [
            {
                fromAddress: 'customer1@gmail.com',
                toAddress: 'support@company.com',
                subject: 'Product not working properly',
                bodyText: 'The product I purchased last week stopped working. It was working fine for the first few days but now it just shows an error message.',
                category: EMAIL_CATEGORIES[1], // Issue
                confidence: 0.85,
                draftText: 'We\'re sorry to hear you\'re experiencing issues with our product. Our technical team will contact you within 24 hours to help resolve this.',
                status: EMAIL_STATUS.DRAFTED,
                assignedUserId: agent._id,
                priority: PRIORITY.HIGH
            },
            {
                fromAddress: 'customer2@yahoo.com',
                toAddress: 'support@company.com',
                subject: 'Refund request for defective item',
                bodyText: 'I received a defective product and would like to request a full refund. The item arrived damaged and is unusable.',
                category: EMAIL_CATEGORIES[2], // Refund
                confidence: 0.92,
                draftText: 'Thank you for your refund request. Our billing department will review your case and respond within 2 business days.',
                status: EMAIL_STATUS.REVIEWED,
                assignedUserId: reviewer._id,
                priority: PRIORITY.URGENT
            },
            {
                fromAddress: 'customer3@outlook.com',
                toAddress: 'support@company.com',
                subject: 'Billing question about subscription',
                bodyText: 'I was charged twice this month for my subscription. Can you please check and refund the extra charge?',
                category: EMAIL_CATEGORIES[3], // Billing
                confidence: 0.78,
                draftText: 'Thank you for your billing inquiry. We\'ve received your request and will investigate the double charge.',
                status: EMAIL_STATUS.APPROVED,
                assignedUserId: admin._id,
                priority: PRIORITY.MEDIUM
            },
            {
                fromAddress: 'customer4@gmail.com',
                toAddress: 'support@company.com',
                subject: 'Great product!',
                bodyText: 'I just wanted to say I love your product! It has made my work so much easier. Keep up the good work!',
                category: EMAIL_CATEGORIES[4], // Feedback
                confidence: 0.65,
                draftText: 'Thank you for your positive feedback! We\'re thrilled to hear our product is helping you. We appreciate your support!',
                status: EMAIL_STATUS.SENT,
                assignedUserId: agent._id,
                priority: PRIORITY.LOW,
                sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            }
        ];

        await Email.insertMany(sampleEmails);

        console.log('✅ Database seeded successfully');
        console.log('👥 Users created:');
        console.log(`   Admin: admin@inboxai.com / admin123`);
        console.log(`   Reviewer: reviewer@inboxai.com / reviewer123`);
        console.log(`   Agent: agent@inboxai.com / agent123`);
        console.log('📧 Sample emails created: 4');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
