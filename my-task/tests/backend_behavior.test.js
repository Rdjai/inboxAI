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
    const state = { error: null };
    const next = (error) => {
        state.error = error;
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
            if (key === '$or') {
                return value.some((condition) => {
                    const [field, matcher] = Object.entries(condition)[0];
                    const candidate = String(email[field] || '');
                    return new RegExp(matcher.$regex, matcher.$options).test(candidate);
                });
            }

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                if ('$in' in value) {
                    return value.$in.some((entry) => sameValue(email[key], entry));
                }

                if ('$ne' in value) {
                    return !sameValue(email[key], value.$ne);
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

test('email schema retains mailbox ownership metadata', () => {
    const Email = require(resolveFromRoot('server/src/models/email.model.js'));
    const userId = '507f191e810c19729de860ea';
    const accountId = '507f191e810c19729de860eb';

    const email = new Email({
        userId,
        accountId,
        fromAddress: 'owner@example.com',
        toAddress: 'support@processmail.test',
        subject: 'Tenant metadata should persist',
        bodyText: 'Mailbox ownership fields should survive model serialization.'
    });

    const serialized = email.toObject({ depopulate: true });

    assert.equal(String(serialized.userId), userId);
    assert.equal(String(serialized.accountId), accountId);
});

test('email list only includes the requester mailbox and paginates within that scope', async () => {
    const requesterId = '507f191e810c19729de860ea';
    const foreignUserId = '507f191e810c19729de860ef';
    const emails = [
        {
            _id: '507f1f77bcf86cd799439011',
            userId: requesterId,
            status: 'NEW',
            category: 'Issue',
            priority: 'HIGH',
            fromAddress: 'vip@example.com',
            toAddress: 'support@processmail.test',
            subject: 'Owner newest',
            bodyText: 'Newest owner email',
            createdAt: new Date('2026-01-03T10:00:00.000Z')
        },
        {
            _id: '507f1f77bcf86cd799439012',
            userId: foreignUserId,
            status: 'NEW',
            category: 'Issue',
            priority: 'MEDIUM',
            fromAddress: 'other@example.com',
            toAddress: 'support@processmail.test',
            subject: 'Foreign mailbox email',
            bodyText: 'Foreign email should never appear',
            createdAt: new Date('2026-01-02T10:00:00.000Z')
        },
        {
            _id: '507f1f77bcf86cd799439013',
            userId: requesterId,
            status: 'APPROVED',
            category: 'Billing',
            priority: 'LOW',
            fromAddress: 'owner-older@example.com',
            toAddress: 'support@processmail.test',
            subject: 'Owner older',
            bodyText: 'Older owner email',
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
        user: { _id: requesterId },
        query: {
            page: 2,
            limit: 1,
            sortBy: 'createdAt',
            sortOrder: 'desc'
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
        ['Owner older']
    );
    assert.deepEqual(res.body.stats, {
        NEW: 1,
        APPROVED: 1
    });
});

test('email detail denies access to foreign mailbox records', async () => {
    const requesterId = '507f191e810c19729de860ea';
    const foreignUserId = '507f191e810c19729de860ef';
    const foreignEmail = {
        _id: '507f1f77bcf86cd799439099',
        userId: foreignUserId,
        subject: 'Foreign mailbox email',
        fromAddress: 'other@example.com',
        toAddress: 'support@processmail.test'
    };

    function createEmailLookup(value) {
        return {
            populate() {
                return this;
            },
            then(resolve, reject) {
                return Promise.resolve(value).then(resolve, reject);
            }
        };
    }

    const emailModel = {
        findById(id) {
            return createEmailLookup(id === foreignEmail._id ? foreignEmail : null);
        },
        findOne(query) {
            const ownedMatch = sameValue(query._id, foreignEmail._id) && sameValue(query.userId, requesterId);
            return createEmailLookup(ownedMatch ? null : foreignEmail);
        },
        schema: {
            path() {
                return false;
            }
        }
    };

    const emailController = loadWithMocks('server/src/controllers/email.controller.js', {
        'server/src/models/email.model.js': emailModel,
        'server/src/modules/threads/thread.model.js': { findOne: async () => null },
        'server/src/modules/audit/audit.model.js': {},
        'server/src/modules/modifications/modification.model.js': {},
        'server/src/queues/index.js': { queues: {}, addEmailToProcessing: async () => {} },
        'server/src/utils/logger.js': { info() {}, error() {} }
    });

    const req = {
        user: { _id: requesterId },
        params: { id: foreignEmail._id }
    };
    const res = createResponse();
    const next = createNext();

    await emailController.getEmailById(req, res, next);

    assert.equal(res.body, null);
    assert.ok(next.state.error);
    assert.equal(next.state.error.statusCode, 404);
});

test('dashboard analytics only count the requester mailbox', async () => {
    const requesterId = '507f191e810c19729de860ea';
    const foreignUserId = '507f191e810c19729de860ef';
    const emails = [
        {
            _id: '507f1f77bcf86cd799439101',
            userId: requesterId,
            status: 'NEW',
            category: 'Issue',
            priority: 'HIGH',
            createdAt: new Date('2026-01-03T10:00:00.000Z')
        },
        {
            _id: '507f1f77bcf86cd799439102',
            userId: requesterId,
            status: 'SENT',
            category: 'Billing',
            priority: 'LOW',
            sentAt: new Date('2026-01-03T12:00:00.000Z'),
            createdAt: new Date('2026-01-03T10:30:00.000Z')
        },
        {
            _id: '507f1f77bcf86cd799439103',
            userId: foreignUserId,
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
        user: { _id: requesterId },
        query: {}
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

test('role middleware blocks unauthorized roles', async () => {
    const { roleMiddleware } = require(resolveFromRoot('server/src/middleware/auth.middleware.js'));
    const middleware = roleMiddleware('admin');

    const req = {
        user: { role: 'agent' }
    };
    const res = createResponse();
    let nextCalled = false;

    await middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Insufficient permissions.'
    });
});

test('ai service falls back deterministically for empty payloads', async () => {
    const aiService = require(resolveFromRoot('server/src/services/ai.service.js'));

    const result = await aiService.processEmail({
        subject: '',
        bodyText: ''
    });

    assert.deepEqual(result.classification, {
        category: 'Other',
        confidence: 0.3
    });
    assert.match(result.draft, /^Thank you for contacting our support team\./);
    assert.match(result.draft, /Best regards,\nThe Support Team$/);
});
