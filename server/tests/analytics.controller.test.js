const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWithMocks, createResponse, createNext } = require('./helpers');

function activityQuery(items = []) {
    return {
        sort() { return this; },
        limit() { return this; },
        populate() { return this; },
        then(resolve) { return Promise.resolve(items).then(resolve); }
    };
}

test('dashboard analytics combines aggregate results and calculates processing rate', async () => {
    let aggregateCall = 0;
    const Email = {
        countDocuments: async query => query.status ? 2 : 5,
        aggregate: async () => {
            aggregateCall++;
            if (aggregateCall === 1) return [{ avgTime: 30 * 60 * 1000 }];
            if (aggregateCall === 2) return [{ _id: 'Issue', count: 3 }];
            if (aggregateCall === 3) return [{ _id: 'NEW', count: 2 }, { _id: 'SENT', count: 3 }];
            return [{ _id: 'HIGH', count: 4 }, { _id: 'LOW', count: 1 }];
        }
    };
    const controller = loadWithMocks('src/controllers/analytics.controller.js', {
        '../models/email.model': Email,
        '../modules/audit/audit.model': { find: () => activityQuery([{ action: 'CREATED' }]) }
    });
    const res = createResponse();

    await controller.getDashboardStats({ query: {} }, res, createNext());

    assert.deepEqual(res.body.data.overview, {
        totalEmails: 5, unprocessedEmails: 2, processedEmails: 3, avgResponseTime: 30, processingRate: '60.0'
    });
    assert.equal(res.body.data.categories.Issue, 3);
    assert.equal(res.body.data.categories.Refund, 0);
    assert.deepEqual(res.body.data.priorities, { HIGH: 4, LOW: 1 });
});

test('average response time is zero when no sent email aggregate exists', async () => {
    const controller = loadWithMocks('src/controllers/analytics.controller.js', {
        '../models/email.model': { aggregate: async () => [] },
        '../modules/audit/audit.model': {}
    });

    assert.equal(await controller.calculateAvgResponseTime({}), 0);
});
