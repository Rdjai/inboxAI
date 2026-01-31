const mongoose = require('mongoose');
require('dotenv').config();

async function checkModels() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inboxai');

    console.log('🔍 Checking model schemas...\n');

    // Check AuditLog model
    const AuditLog = require('./models/AuditLog');
    const auditLogSchema = AuditLog.schema;
    const auditLogActionEnum = auditLogSchema.path('action').enumValues;
    console.log('AuditLog Action Enum:', auditLogActionEnum);

    // Check Email model
    const Email = require('./models/Email');
    const emailSchema = Email.schema;
    const emailStatusEnum = emailSchema.path('status').enumValues;
    const emailCategoryEnum = emailSchema.path('category').enumValues;
    console.log('\nEmail Status Enum:', emailStatusEnum);
    console.log('Email Category Enum:', emailCategoryEnum);

    // Check User model
    const User = require('./models/User');
    const userSchema = User.schema;
    const userRoleEnum = userSchema.path('role').enumValues;
    console.log('\nUser Role Enum:', userRoleEnum);

    await mongoose.connection.close();
}

checkModels().catch(console.error);