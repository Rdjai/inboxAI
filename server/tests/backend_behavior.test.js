const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const repoRoot = path.resolve(__dirname, '..', '..');

function resolveFromRoot(relativePath) {
    return path.join(repoRoot, relativePath);
}

function loadWithMocks(relativePath, mockFactories = {}) {
    const targetPath = require.resolve(resolveFromRoot(relativePath));
    delete require.cache[targetPath];

    const resolvedMocks = new Map(
        Object.entries(mockFactories).map(([mockPath, mockValue]) => [
            require.resolve(resolveFromRoot(mockPath)),
            mockValue
        ])
    );

    const originalLoad = Module._load;
    Module._load = function patchedLoad(request, parent, isMain) {
        const resolvedRequest = Module._resolveFilename(request, parent, isMain);
        if (resolvedMocks.has(resolvedRequest)) {
            return resolvedMocks.get(resolvedRequest);
        }
        return originalLoad.apply(this, arguments);
    };

    try {
        return require(targetPath);
    } finally {
        Module._load = originalLoad;
    }
}

function createResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; }
    };
}

function createNext() {
    const state = { error: null, called: false };
    const next = (error) => { state.called = true; state.error = error || null; };
    next.state = state;
    return next;
}

function sameValue(left, right) {
    if (left instanceof Date && right instanceof Date) {
        return left.getTime() === right.getTime();
    }
    return String(left) === String(right);
}

function filterEmails(emails, query = {}) {
    return emails.filter((email) => {
        return Object.entries(query).every(([key, value]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                if ('$in' in value) {
                    return value.$in.some((entry) => sameValue(email[key], entry));
                }
                if ('$gte' in value || '$lte' in value) {
                    const candidate = new Date(email[key]).getTime();
                    if ('$gte' in value && candidate < new Date(value.$gte).getTime()) return false;
                    if ('$lte' in value && candidate > new Date(value.$lte).getTime()) return false;
                    return true;
                }
            }
            return sameValue(email[key], value);
        });
    });
}

function aggregateByField(emails, field) {
    const counts = {};
    for (const email of emails) {
        const val = email[field];
        if (val !== undefined) {
            counts[val] = (counts[val] || 0) + 1;
        }
    }
    return Object.entries(counts).map(([_id, count]) => ({ _id, count }));
}

// ─── Test 1 ────────────────────────────────────────────────────────────────
test('email schema retains mailbox ownership metadata', () => {
    const Email = require(resolveFromRoot('server/src/models/email.model.js'));
    assert.ok(Email.schema.path('accountId'), 'accountId field must exist on email schema');
    assert.ok(Email.schema.path('userId'), 'userId field must exist on email schema');
});

// ─── Test 2 ────────────────────────────────────────────────────────────────
test('email list only includes the requester mailbox and paginates within that scope', async () => {
    const accountId = '507f191e810c19729de860eb';
    const otherAccountId = '507f191e810c19729de860ec';

    const emails = [
        {
            _id: '507f1f77bcf86cd799439011',
            accountId,
            status: 'NEW',
            category: 'Issue',
            priority: 'HIGH',
            fromAddress: 'vip@example.com',
            toAddress: 'support@processmail.test',
            subject: 'Mailbox A newest',
            bodyText: 'Newest mailbox A email',
            createdAt: new Date('2026-01-03T10:00:00.000Z')
        },
        {
            _id: '507f1f77bcf86cd799439012',
            accountId: otherAccountId,
            status: 'NEW',
            category: 'Issue',
            priority: 'MEDIUM',
            fromAddress: 'other@example.com',
            toAddress: 'support@processmail.test',
            subject: 'Mailbox B email',
            bodyText: 'Should not appear',
            createdAt: new Date('2026-01-02T10:00:00.000Z')
        },
        {
            _id: '507f1f77bcf86cd799439013',
            accountId,
            status: 'APPROVED',
            category: 'Billing',
            priority: 'LOW',
            fromAddress: 'older@example.com',
            toAddress: 'support@processmail.test',
            subject: 'Mailbox A older',
            bodyText: 'Older mailbox A email',
            createdAt: new Date('2026-01-01T10:00:00.000Z')
        }
    ];

    const emailModel = {
        find(query) {
            const filtered = filterEmails(emails, query);
            const state = { filtered, sortSpec: { createdAt: -1 }, skipCount: 0, limitCount: filtered.length };
            return {
                sort(s) { state.sortSpec = s; return this; },
                skip(n) { state.skipCount = n; return this; },
                limit(n) { state.limitCount = n; return this; },
                populate() { return this; },
                lean() {
                    const entries = [...state.filtered].sort((a, b) => {
                        for (const [field, dir] of Object.entries(state.sortSpec)) {
                            if (a[field] < b[field]) return dir === -1 ? 1 : -1;
                            if (a[field] > b[field]) return dir === -1 ? -1 : 1;
                        }
                        return 0;
                    });
                    return Promise.resolve(entries.slice(state.skipCount, state.skipCount + state.limitCount));
                }
            };
        },
        countDocuments(query) {
            return Promise.resolve(filterEmails(emails, query).length);
        },
        aggregate(pipeline) {
            const scoped = filterEmails(emails, pipeline[0]?.$match);
            return Promise.resolve(aggregateByField(scoped, 'status'));
        }
    };

    const emailController = loadWithMocks('server/src/controllers/email.controller.js', {
        'server/src/models/email.model.js': emailModel,
        'server/src/modules/threads/thread.model.js': {},
        'server/src/modules/audit/audit.model.js': {},
        'server/src/modules/modifications/modification.model.js': {},
        'server/src/queues/index.js': { queues: {}, addEmailToProcessing: async () => {} },
        'server/src/utils/logger.js': { info() {}, error() {} }
    });

    const req = {
        query: {
            accountId,
            page: 2,
            limit: 1,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            includeStats: 'true'
        }
    };
    const res = createResponse();
    const next = createNext();

    await emailController.getAllEmails(req, res, next);

    assert.equal(next.state.error, null);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.pagination.total, 2);
    assert.equal(res.body.pagination.pages, 2);
    assert.deepEqual(res.body.data.map((e) => e.subject), ['Mailbox A older']);
    assert.deepEqual(res.body.stats, { NEW: 1, APPROVED: 1 });
});

// ─── Test 3 ────────────────────────────────────────────────────────────────
test('dashboard analytics only count the requester mailbox', async () => {
    const accountId = '507f191e810c19729de860eb';
    const otherAccountId = '507f191e810c19729de860ec';

    const emails = [
        { _id: '507f1f77bcf86cd799439101', accountId, status: 'NEW', category: 'Issue', priority: 'HIGH', createdAt: new Date('2026-01-03T10:00:00.000Z') },
        { _id: '507f1f77bcf86cd799439102', accountId, status: 'SENT', category: 'Billing', priority: 'LOW', createdAt: new Date('2026-01-03T10:00:00.000Z') },
        { _id: '507f1f77bcf86cd799439103', accountId: otherAccountId, status: 'NEW', category: 'Refund', priority: 'MEDIUM', createdAt: new Date('2026-01-02T10:00:00.000Z') }
    ];

    const emailModel = {
        countDocuments(query) {
            return Promise.resolve(filterEmails(emails, query).length);
        },
        aggregate(pipeline) {
            const scoped = filterEmails(emails, pipeline[0]?.$match);
            const groupField = pipeline[1]?.$group?._id?.replace('$', '');
            return Promise.resolve(aggregateByField(scoped, groupField));
        }
    };

    const auditLogModel = {
        find() {
            return {
                sort() { return this; },
                limit() { return this; },
                populate() { return this; },
                then(resolve) { return Promise.resolve([]).then(resolve); }
            };
        }
    };

    const analyticsController = loadWithMocks('server/src/controllers/analytics.controller.js', {
        'server/src/models/email.model.js': emailModel,
        'server/src/modules/audit/audit.model.js': auditLogModel
    });

    const req = { query: { accountId } };
    const res = createResponse();
    const next = createNext();

    await analyticsController.getDashboardStats(req, res, next);

    assert.equal(next.state.error, null);
    assert.equal(res.statusCode, 200);
    // If accountId filter is dropped: totalEmails = 3. After fix: totalEmails = 2.
    assert.equal(res.body.data.overview.totalEmails, 2);
    assert.equal(res.body.data.overview.unprocessedEmails, 1);
    assert.equal(res.body.data.status.NEW, 1);
    assert.equal(res.body.data.status.SENT, 1);
    // Other mailbox's Refund category must not appear
    assert.equal(res.body.data.categories.Refund || 0, 0);
});

// ─── Test 4 ────────────────────────────────────────────────────────────────
test('role middleware blocks unauthorized roles', () => {
    const { roleMiddleware } = require(resolveFromRoot('server/src/middleware/auth.middleware.js'));
    const middleware = roleMiddleware('admin');

    const req = { user: { role: 'agent' } };
    const res = createResponse();
    const next = createNext();

    middleware(req, res, next);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Insufficient permissions.');
    assert.ok(Array.isArray(res.body.required));
    assert.ok(res.body.required.includes('admin'));
});

// ─── Test 5 ────────────────────────────────────────────────────────────────
test('ai service falls back deterministically for empty payloads', async () => {
    const aiService = require(resolveFromRoot('server/src/services/ai.service.js'));

    const result = await aiService.processEmail({ subject: '', bodyText: '' });

    assert.equal(result.classification.category, 'Other');
    assert.equal(result.classification.confidence, 0.3);
    assert.ok('sentiment' in result.classification);
    assert.ok('sentimentScore' in result.classification);
});

// ─── Test 6 ────────────────────────────────────────────────────────────────
test('search results are scoped to the requester mailbox', async () => {
    const accountId = '507f191e810c19729de860eb';
    const otherAccountId = '507f191e810c19729de860ec';

    const emails = [
        {
            _id: '507f1f77bcf86cd799439201',
            accountId,
            status: 'NEW',
            category: 'Refund',
            priority: 'HIGH',
            fromAddress: 'customer@example.com',
            toAddress: 'support@processmail.test',
            subject: 'Refund request mailbox A',
            bodyText: 'Please refund my order',
            createdAt: new Date('2026-01-03T10:00:00.000Z')
        },
        {
            _id: '507f1f77bcf86cd799439202',
            accountId: otherAccountId,
            status: 'NEW',
            category: 'Refund',
            priority: 'MEDIUM',
            fromAddress: 'other@example.com',
            toAddress: 'support@processmail.test',
            subject: 'Refund request mailbox B',
            bodyText: 'Please refund my order too',
            createdAt: new Date('2026-01-02T10:00:00.000Z')
        },
        {
            _id: '507f1f77bcf86cd799439203',
            accountId,
            status: 'SENT',
            category: 'Billing',
            priority: 'LOW',
            fromAddress: 'billing@example.com',
            toAddress: 'support@processmail.test',
            subject: 'Invoice query mailbox A',
            bodyText: 'Question about invoice',
            createdAt: new Date('2026-01-01T10:00:00.000Z')
        }
    ];

    // Track what filters searchService receives
    let capturedFilters = null;

    const searchServiceMock = {
        buildSearchFilters(params) {
            // Return filters based on params — accountId must be present after fix
            const f = {};
            if (params.accountId) f.accountId = params.accountId;
            if (params.status) f.status = params.status;
            return f;
        },
        async searchEmails({ filters, page, limit }) {
            capturedFilters = filters;
            // Filter emails using whatever accountId was passed in filters
            const scoped = filterEmails(emails, filters);
            const skip = (page - 1) * limit;
            const data = scoped.slice(skip, skip + limit);
            return {
                success: true,
                data,
                pagination: { total: scoped.length, page, limit, pages: Math.ceil(scoped.length / limit) }
            };
        }
    };

    const emailController = loadWithMocks('server/src/controllers/email.controller.js', {
        'server/src/models/email.model.js': {},
        'server/src/services/search.service.js': searchServiceMock,
        'server/src/modules/threads/thread.model.js': {},
        'server/src/modules/audit/audit.model.js': {},
        'server/src/modules/modifications/modification.model.js': {},
        'server/src/queues/index.js': { queues: {}, addEmailToProcessing: async () => {} },
        'server/src/utils/logger.js': { info() {}, error() {} }
    });

    const req = {
        query: {
            accountId,
            search: 'refund',
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        }
    };
    const res = createResponse();
    const next = createNext();

    await emailController.getAllEmails(req, res, next);

    assert.equal(next.state.error, null);
    assert.equal(res.statusCode, 200);
    // If accountId is not passed to searchService filters: total = 2
    // After fix: accountId in filters scopes to 1 result
    assert.equal(res.body.pagination.total, 1);
    assert.equal(res.body.data[0].subject, 'Refund request mailbox A');
    // Confirm accountId reached the search service
    assert.equal(capturedFilters.accountId, accountId);
});
