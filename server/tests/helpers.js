/**
 * Shared test utilities for behavioral tests.
 * All helpers return plain objects — no live DB connections required.
 */

const path = require('node:path');
const Module = require('node:module');

const serverRoot = path.resolve(__dirname, '..');

function loadWithMocks(relativePath, mocks = {}) {
    const targetPath = require.resolve(path.join(serverRoot, relativePath));
    delete require.cache[targetPath];

    const originalLoad = Module._load;
    Module._load = function patchedLoad(request, parent, isMain) {
        if (Object.prototype.hasOwnProperty.call(mocks, request)) {
            return mocks[request];
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
    const fn = (err) => { state.called = true; state.error = err || null; };
    fn.state = state;
    return fn;
}

function makeEmail(overrides = {}) {
    return {
        _id: overrides._id || '507f1f77bcf86cd799439011',
        accountId: overrides.accountId || '507f191e810c19729de860ea',
        userId: overrides.userId || '507f191e810c19729de860eb',
        status: overrides.status || 'NEW',
        category: overrides.category || 'Issue',
        priority: overrides.priority || 'MEDIUM',
        fromAddress: overrides.fromAddress || 'sender@example.com',
        toAddress: overrides.toAddress || 'support@processmail.test',
        subject: overrides.subject || 'Test email subject',
        bodyText: overrides.bodyText || 'Test email body',
        createdAt: overrides.createdAt || new Date('2026-01-01T10:00:00.000Z'),
        ...overrides
    };
}

function sameValue(left, right) {
    if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
    return String(left) === String(right);
}

function filterEmails(emails, query = {}) {
    return emails.filter(email =>
        Object.entries(query).every(([key, value]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                if ('$in' in value) return value.$in.some(v => sameValue(email[key], v));
                if ('$gte' in value || '$lte' in value) {
                    const t = new Date(email[key]).getTime();
                    if ('$gte' in value && t < new Date(value.$gte).getTime()) return false;
                    if ('$lte' in value && t > new Date(value.$lte).getTime()) return false;
                    return true;
                }
            }
            return sameValue(email[key], value);
        })
    );
}

function aggregateByField(emails, field) {
    const counts = {};
    for (const email of emails) {
        const val = email[field];
        if (val !== undefined) counts[val] = (counts[val] || 0) + 1;
    }
    return Object.entries(counts).map(([_id, count]) => ({ _id, count }));
}

function makeEmailModel(emails) {
    return {
        find(query) {
            const filtered = filterEmails(emails, query);
            const state = { filtered, sortSpec: { createdAt: -1 }, skipCount: 0, limitCount: filtered.length };
            return {
                sort(s) { state.sortSpec = s; return this; },
                skip(n) { state.skipCount = n; return this; },
                limit(n) { state.limitCount = n; return this; },
                populate() { return this; },
                lean() {
                    const sorted = [...state.filtered].sort((a, b) => {
                        for (const [field, dir] of Object.entries(state.sortSpec)) {
                            if (a[field] < b[field]) return dir === -1 ? 1 : -1;
                            if (a[field] > b[field]) return dir === -1 ? -1 : 1;
                        }
                        return 0;
                    });
                    return Promise.resolve(sorted.slice(state.skipCount, state.skipCount + state.limitCount));
                }
            };
        },
        countDocuments(query) {
            return Promise.resolve(filterEmails(emails, query).length);
        },
        aggregate(pipeline) {
            const scoped = filterEmails(emails, pipeline[0]?.$match);
            const groupField = pipeline[1]?.$group?._id?.replace('$', '');
            return Promise.resolve(aggregateByField(scoped, groupField));
        }
    };
}

module.exports = {
    loadWithMocks,
    createResponse,
    createNext,
    makeEmail,
    makeEmailModel,
    filterEmails,
    aggregateByField,
    sameValue
};
