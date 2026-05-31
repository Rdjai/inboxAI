const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const root = path.resolve(__dirname, '..', '..');
const resolve = (file) => path.join(root, file);

function loadWithMocks(file, mocks) {
    const target = require.resolve(resolve(file));
    delete require.cache[target];
    const resolved = new Map(Object.entries(mocks).map(([name, value]) => [
        name.startsWith('server/') ? require.resolve(resolve(name)) : name, value
    ]));
    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (resolved.has(request)) return resolved.get(request);
        const name = Module._resolveFilename(request, parent, isMain);
        return resolved.has(name) ? resolved.get(name) : originalLoad.apply(this, arguments);
    };
    try {
        return require(target);
    } finally {
        Module._load = originalLoad;
    }
}

function response() {
    return {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; }
    };
}

function next() {
    const state = { error: null };
    const callback = (error) => { state.error = error || null; };
    callback.state = state;
    return callback;
}

function matches(email, query = {}) {
    return Object.entries(query).every(([key, value]) => {
        if (value && value.$in) return value.$in.includes(email[key]);
        if (value && value.$ne !== undefined) return email[key] !== value.$ne;
        return String(email[key]) === String(value);
    });
}

function baseMocks(emailModel) {
    return {
        'server/src/models/email.model.js': emailModel,
        'server/src/modules/threads/thread.model.js': {},
        'server/src/modules/audit/audit.model.js': {},
        'server/src/modules/modifications/modification.model.js': {},
        'server/src/queues/index.js': { queues: {}, addEmailToProcessing: async () => {} },
        'server/src/utils/logger.js': { info() {}, error() {} }
    };
}

test('email schema retains mailbox ownership metadata', () => {
    const Email = require(resolve('server/src/models/email.model.js'));
    assert.ok(Email.schema.path('accountId'));
    assert.ok(Email.schema.path('userId'));
});

test('email list only includes the requester mailbox and paginates within that scope', async () => {
    const accountId = '507f191e810c19729de860eb';
    const emails = [
        { accountId, subject: 'owned newest', status: 'NEW', createdAt: new Date('2026-01-03') },
        { accountId: 'other', subject: 'foreign', status: 'NEW', createdAt: new Date('2026-01-02') },
        { accountId, subject: 'owned oldest', status: 'SENT', createdAt: new Date('2026-01-01') }
    ];
    const model = {
        find(query) {
            let rows = emails.filter((email) => matches(email, query));
            return {
                sort() { rows.sort((a, b) => b.createdAt - a.createdAt); return this; },
                skip(count) { rows = rows.slice(count); return this; },
                limit(count) { rows = rows.slice(0, count); return this; },
                populate() { return this; },
                lean() { return Promise.resolve(rows); }
            };
        },
        countDocuments(query) { return Promise.resolve(emails.filter((email) => matches(email, query)).length); },
        aggregate(pipeline) {
            const rows = emails.filter((email) => matches(email, pipeline[0].$match));
            return Promise.resolve([...new Set(rows.map((email) => email.status))]
                .map((_id) => ({ _id, count: rows.filter((email) => email.status === _id).length })));
        }
    };
    const controller = loadWithMocks('server/src/controllers/email.controller.js', baseMocks(model));
    const res = response();
    const done = next();
    await controller.getAllEmails({ user: { accountId }, query: { page: 2, limit: 1 } }, res, done);
    assert.equal(done.state.error, null);
    assert.equal(res.body.pagination.total, 2);
    assert.deepEqual(res.body.data.map((email) => email.subject), ['owned oldest']);
});

test('email detail denies access to foreign mailbox records', async () => {
    let capturedQuery;
    const model = {
        schema: { path() { return false; } },
        findOne(query) {
            capturedQuery = query;
            return { populate() { return this; }, then(resolveThen) { return Promise.resolve(null).then(resolveThen); } };
        }
    };
    const controller = loadWithMocks('server/src/controllers/email.controller.js', baseMocks(model));
    const res = response();
    const done = next();
    await controller.getEmailById({ user: { accountId: 'mine' }, params: { id: 'foreign-id' } }, res, done);
    assert.deepEqual(capturedQuery, { _id: 'foreign-id', accountId: 'mine' });
    assert.equal(done.state.error.statusCode, 404);
});

test('dashboard analytics only count the requester mailbox', async () => {
    const accountId = 'mine';
    const emails = [
        { accountId, status: 'NEW', category: 'Issue', priority: 'HIGH' },
        { accountId, status: 'SENT', category: 'Billing', priority: 'LOW' },
        { accountId: 'other', status: 'NEW', category: 'Refund', priority: 'LOW' }
    ];
    const model = {
        countDocuments(query) { return Promise.resolve(emails.filter((email) => matches(email, query)).length); },
        aggregate(pipeline) {
            const rows = emails.filter((email) => matches(email, pipeline[0].$match));
            const field = pipeline[1]?.$group?._id?.slice(1);
            if (!field) return Promise.resolve([]);
            return Promise.resolve([...new Set(rows.map((email) => email[field]))]
                .map((_id) => ({ _id, count: rows.filter((email) => email[field] === _id).length })));
        }
    };
    const audit = { find() { return { sort() { return this; }, limit() { return this; }, populate() { return this; }, then(done) { return Promise.resolve([]).then(done); } }; } };
    const controller = loadWithMocks('server/src/controllers/analytics.controller.js', {
        'server/src/models/email.model.js': model,
        'server/src/modules/audit/audit.model.js': audit
    });
    const res = response();
    await controller.getDashboardStats({ user: { accountId }, query: {} }, res, next());
    assert.equal(res.body.data.overview.totalEmails, 2);
    assert.equal(res.body.data.categories.Refund, 0);
});

test('role middleware blocks unauthorized roles', () => {
    const { roleMiddleware } = loadWithMocks('server/src/middleware/auth.middleware.js', {
        jsonwebtoken: {},
        'server/src/config/env.js': {},
        'server/src/models/user.model.js': {},
        'server/src/utils/logger.js': { error() {} }
    });
    const res = response();
    roleMiddleware('admin')({ user: { role: 'agent' } }, res, next());
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, 'Insufficient permissions.');
});

test('ai service falls back deterministically for empty payloads', async () => {
    const service = loadWithMocks('server/src/services/ai.service.js', {
        'server/src/utils/logger.js': { error() {} }
    });
    const result = await service.processEmail({ subject: '', bodyText: '' });
    assert.equal(result.classification.category, 'Other');
    assert.equal(result.classification.confidence, 0.3);
});
