const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWithMocks } = require('./helpers');
const aiService = require('../src/services/ai.service');

test('AI service deterministically falls back for content without category signals', async () => {
    const result = await aiService.processEmail({ subject: '', bodyText: '' });

    assert.deepEqual(result.classification, {
        category: 'Other', confidence: 0.3, sentiment: 'NEUTRAL', sentimentScore: 0
    });
    assert.match(result.draft, /Our support team will continue assisting/);
});

test('AI service classifies refund sentiment and personalizes generated drafts', async () => {
    const classification = await aiService.classifyEmail('Refund needed', 'I am upset and want my money back');
    const draft = await aiService.generateDraft('Refund', 'Hello Priya, please help');

    assert.equal(classification.category, 'Refund');
    assert.equal(classification.sentiment, 'NEGATIVE');
    assert.match(draft, /^Dear Priya,/);
});

test('IMAP service returns static password config without OAuth refresh', async () => {
    const ImapService = require('../src/services/imap.service');
    const service = new ImapService({
        host: 'imap.example.com',
        auth: { user: 'support@example.com', pass: 'secret' }
    });

    const config = await service.getImapConfig();

    assert.equal(config.host, 'imap.example.com');
    assert.equal(config.password, 'secret');
    assert.equal(config.tls, true);
});

test('IMAP service refreshes Google OAuth config and emits xoauth2 credentials', async () => {
    let request;
    const ImapService = loadWithMocks('src/services/imap.service.js', {
        axios: { post: async (...args) => { request = args; return { data: { access_token: 'access-token' } }; } }
    });
    const service = new ImapService({
        host: 'imap.gmail.com',
        auth: { user: 'support@example.com', pass: 'unused' },
        oauth: { provider: 'google', refreshToken: 'refresh', clientId: 'client', clientSecret: 'secret' }
    });

    const config = await service.getImapConfig();
    const decoded = Buffer.from(config.xoauth2, 'base64').toString('utf8');

    assert.equal(request[0], 'https://oauth2.googleapis.com/token');
    assert.equal(config.password, undefined);
    assert.match(decoded, /user=support@example.com/);
    assert.match(decoded, /auth=Bearer access-token/);
});

test('IMAP service resolves an empty inbox without attempting a fetch', async () => {
    const ImapService = require('../src/services/imap.service');
    const service = new ImapService({ host: 'imap.example.com', auth: {} });
    service.imap = {
        openBox(mailbox, readOnly, callback) {
            callback(null, { messages: { total: 0 } });
        },
        seq: {
            fetch() {
                throw new Error('fetch should not be called for an empty inbox');
            }
        }
    };

    assert.deepEqual(await service.fetchRecentEmails(), []);
});
