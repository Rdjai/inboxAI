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
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
}

function createNext() {
    const state = { error: null, called: false };
    const next = (error) => {
        state.called = true;
        state.error = error || null;
    };
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
                    if ('$gte' in value && candidate < new Date(value.$gte).getTime()) {
                        return false;
                    }

                    if ('$lte' in value && candidate > new Date(value.$lte).getTime()) {
                        return false;
                    }

                    return true;
                }
            }

            return sameValue(email[key], value);
        });
    });
}

function aggregateByField(emails, field) {
    return Object.entries(
        emails.reduce((acc, email) => {
            const key = email[field];
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {})
    ).map(([key, count]) => ({ _id: key, count }));
}

test('list query validation preserves mailbox scope', () => {
    const { validate, emailSchemas } = require(resolveFromRoot('server/src/middleware/validation.middleware.js'));
    const middleware = validate(emailSchemas.filter, 'query');

    const accountId = '507f191e810c19729de860eb';
    const req = {
        query: {
            page: '2',
            limit: '10',
            accountId
        }
    };
    const res = createResponse();
    const next = createNext();

    middleware(req, res, next);

    assert.equal(next.state.error, null);
    assert.equal(req.query.accountId, accountId);
    assert.equal(req.query.page, 2);
    assert.equal(req.query.limit, 10);
});

test('search query validation preserves mailbox scope', () => {
    const { validate, emailSchemas } = require(resolveFromRoot('server/src/middleware/validation.middleware.js'));
    const middleware = validate(emailSchemas.search, 'query');

    const accountId = '507f191e810c19729de860eb';
    const req = {
        query: {
            query: 'refund',
            searchType: 'regex',
            accountId
        }
    };
    const res = createResponse();
    const next = createNext();

    middleware(req, res, next);

    assert.equal(next.state.error, null);
    assert.equal(req.query.accountId, accountId);
    assert.equal(req.query.query, 'refund');
});

test('email list scopes pagination and stats to the requested mailbox', async () => {
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
            bodyText: 'Mailbox B email should not appear',
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
            const state = {
                filtered,
                sortSpec: { createdAt: -1 },
                skipCount: 0,
                limitCount: filtered.length
            };

            return {
                sort(sortSpec) {
                    state.sortSpec = sortSpec;
                    return this;
                },
                skip(skipCount) {
                    state.skipCount = skipCount;
                    return this;
                },
                limit(limitCount) {
                    state.limitCount = limitCount;
                    return this;
                },
                populate() {
                    return this;
                },
                lean() {
                    const entries = [...state.filtered].sort((left, right) => {
                        for (const [field, direction] of Object.entries(state.sortSpec)) {
                            const leftValue = left[field];
                            const rightValue = right[field];
                            if (leftValue < rightValue) {
                                return direction === -1 ? 1 : -1;
                            }

                            if (leftValue > rightValue) {
                                return direction === -1 ? -1 : 1;
                            }
                        }

                        return 0;
                    });

                    return Promise.resolve(
                        entries.slice(state.skipCount, state.skipCount + state.limitCount)
                    );
                }
            };
        },
        countDocuments(query) {
            return Promise.resolve(filterEmails(emails, query).length);
        },
        aggregate(pipeline) {
            const scopedEmails = filterEmails(emails, pipeline[0]?.$match);
            return Promise.resolve(aggregateByField(scopedEmails, 'status'));
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
    assert.deepEqual(
        res.body.data.map((email) => email.subject),
        ['Mailbox A older']
    );
    assert.deepEqual(res.body.stats, {
        NEW: 1,
        APPROVED: 1
    });
});

test('search requests keep the requested mailbox filter', async () => {
    const accountId = '507f191e810c19729de860eb';
    const captured = {
        buildArgs: null,
        searchArgs: null
    };

    const searchService = {
        buildSearchFilters(args) {
            captured.buildArgs = args;
            const filters = {};
            if (args.accountId) {
                filters.accountId = args.accountId;
            }
            return filters;
        },
        async searchEmails(args) {
            captured.searchArgs = args;
            return {
                success: true,
                data: [],
                meta: {
                    filters: args.filters
                }
            };
        }
    };

    const emailController = loadWithMocks('server/src/controllers/email.controller.js', {
        'server/src/models/email.model.js': {},
        'server/src/modules/threads/thread.model.js': {},
        'server/src/modules/audit/audit.model.js': {},
        'server/src/modules/modifications/modification.model.js': {},
        'server/src/services/search.service.js': searchService,
        'server/src/queues/index.js': { queues: {}, addEmailToProcessing: async () => {} },
        'server/src/utils/logger.js': { info() {}, error() {} }
    });

    const req = {
        query: {
            search: 'refund',
            searchType: 'regex',
            accountId,
            page: 1,
            limit: 20
        }
    };
    const res = createResponse();
    const next = createNext();

    await emailController.getAllEmails(req, res, next);

    assert.equal(next.state.error, null);
    assert.equal(captured.buildArgs.accountId, accountId);
    assert.equal(captured.searchArgs.filters.accountId, accountId);
    assert.equal(res.body.meta.filters.accountId, accountId);
});

test('dashboard analytics honor the requested mailbox', async () => {
    const accountId = '507f191e810c19729de860eb';
    const otherAccountId = '507f191e810c19729de860ec';
    const emails = [
        {
            _id: '507f1f77bcf86cd799439101',
            accountId,
            status: 'NEW',
            category: 'Issue',
            priority: 'HIGH',
            createdAt: new Date('2026-01-03T10:00:00.000Z')
        },
        {
            _id: '507f1f77bcf86cd799439102',
            accountId,
            status: 'SENT',
            category: 'Billing',
            priority: 'LOW',
            sentAt: new Date('2026-01-03T12:00:00.000Z'),
            createdAt: new Date('2026-01-03T10:30:00.000Z')
        },
        {
            _id: '507f1f77bcf86cd799439103',
            accountId: otherAccountId,
            status: 'NEW',
            category: 'Refund',
            priority: 'MEDIUM',
            createdAt: new Date('2026-01-02T10:00:00.000Z')
        }
    ];

    const emailModel = {
        countDocuments(query) {
            return Promise.resolve(filterEmails(emails, query).length);
        },
        aggregate(pipeline) {
            const scopedEmails = filterEmails(emails, pipeline[0]?.$match);
            const groupField = pipeline[1]?.$group?._id?.replace('$', '');
            return Promise.resolve(aggregateByField(scopedEmails, groupField));
        }
    };

    const auditLogModel = {
        find() {
            return {
                sort() {
                    return this;
                },
                limit() {
                    return this;
                },
                populate() {
                    return this;
                },
                then(resolve, reject) {
                    return Promise.resolve([]).then(resolve, reject);
                }
            };
        }
    };

    const analyticsController = loadWithMocks('server/src/controllers/analytics.controller.js', {
        'server/src/models/email.model.js': emailModel,
        'server/src/modules/audit/audit.model.js': auditLogModel
    });

    analyticsController.calculateAvgResponseTime = async (dateFilter) => {
        const scopedEmails = filterEmails(emails, dateFilter);
        const sentEmails = scopedEmails.filter((email) => email.status === 'SENT');
        if (sentEmails.length === 0) {
            return 0;
        }

        const durationMs = sentEmails[0].sentAt.getTime() - sentEmails[0].createdAt.getTime();
        return Math.round(durationMs / (1000 * 60));
    };

    const req = {
        query: { accountId }
    };
    const res = createResponse();
    const next = createNext();

    await analyticsController.getDashboardStats(req, res, next);

    assert.equal(next.state.error, null);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.overview.totalEmails, 2);
    assert.equal(res.body.data.overview.unprocessedEmails, 1);
    assert.equal(res.body.data.overview.processedEmails, 1);
    assert.equal(res.body.data.overview.avgResponseTime, 90);
    assert.equal(res.body.data.overview.processingRate, '50.0');
    assert.equal(res.body.data.categories.Refund, 0);
    assert.equal(res.body.data.status.NEW, 1);
    assert.equal(res.body.data.status.SENT, 1);
});

test('pagination normalization still caps oversized limits', () => {
    const { normalizePaginationParams } = require(resolveFromRoot('server/src/utils/pagination.js'));

    const result = normalizePaginationParams({ page: '3', limit: '1000' });

    assert.deepEqual(result, {
        page: 3,
        limit: 100,
        skip: 200,
        maxLimit: 100
    });
});

test('ai service falls back deterministically for empty payloads', async () => {
    const aiService = require(resolveFromRoot('server/src/services/ai.service.js'));

    const result = await aiService.processEmail({
        subject: '',
        bodyText: ''
    });

    assert.equal(result.classification.category, 'Other');
    assert.equal(result.classification.confidence, 0.3);
    assert.ok('sentiment' in result.classification);
    assert.ok('sentimentScore' in result.classification);
});
