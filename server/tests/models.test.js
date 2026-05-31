const test = require('node:test');
const assert = require('node:assert/strict');
const Email = require('../src/models/email.model');
const EmailAccount = require('../src/models/emailAccount.model');
const User = require('../src/models/user.model');

test('email search artifacts normalize content and extract useful metadata', () => {
    const artifacts = Email.computeSearchArtifacts({
        subject: 'Invoice for Alice Smith',
        bodyText: 'Contact Alice Smith at alice@example.com or 415-555-1212 on 2026-06-01. The invoice is attached.',
        fromAddress: 'sender@example.com',
        toAddress: 'support@example.com'
    });

    assert.match(artifacts.searchableContent, /invoice for alice smith/);
    assert.ok(artifacts.keywords.includes('invoice'));
    assert.ok(!artifacts.keywords.includes('the'));
    assert.deepEqual(artifacts.extractedEntities.emails, ['alice@example.com']);
    assert.ok(artifacts.extractedEntities.people.includes('Alice Smith'));
    assert.deepEqual(artifacts.extractedEntities.dates, ['2026-06-01']);
});

test('email model validates required fields and email address format without MongoDB', () => {
    const email = new Email({ fromAddress: 'invalid', toAddress: 'support@example.com', subject: 'Test' });
    const error = email.validateSync();

    assert.ok(error.errors.fromAddress);
    assert.ok(error.errors.bodyText);
});

test('email account model rejects duplicate sharing permissions', () => {
    const account = new EmailAccount({
        userId: '507f191e810c19729de860ea',
        name: 'Support inbox',
        email: 'support@example.com',
        provider: 'imap',
        imapConfig: { host: 'imap.example.com', port: 993, auth: { user: 'support', pass: 'secret' } },
        smtpConfig: { host: 'smtp.example.com', port: 587, auth: { user: 'support', pass: 'secret' } },
        sharedWith: [{ userId: '507f191e810c19729de860eb', permissions: ['read', 'read'] }]
    });
    const error = account.validateSync();

    assert.match(error.errors['sharedWith.0.permissions'].message, /must not contain duplicates/);
});

test('user JSON representation excludes password', () => {
    const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'not-exposed',
        role: 'agent'
    });

    assert.equal(user.toJSON().password, undefined);
});
