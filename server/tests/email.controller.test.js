const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWithMocks, createResponse, createNext, makeEmail, makeEmailModel } = require('./helpers');

function loadEmailController({ Email = {}, AuditLog = {}, queueService = {} } = {}) {
    return loadWithMocks('src/controllers/email.controller.js', {
        '../models/email.model': Email,
        '../modules/threads/thread.model': {},
        '../modules/audit/audit.model': AuditLog,
        '../modules/modifications/modification.model': {},
        '../services/search.service': {},
        '../queues/index': queueService,
        '../utils/logger': { info() {}, error() {} }
    });
}

test('email list applies filters, pagination, sorting, and optional status stats', async () => {
    const emails = [
        makeEmail({ _id: '1', subject: 'Newest issue', status: 'NEW', priority: 'HIGH', createdAt: new Date('2026-01-03') }),
        makeEmail({ _id: '2', subject: 'Older issue', status: 'NEW', priority: 'HIGH', createdAt: new Date('2026-01-01') }),
        makeEmail({ _id: '3', subject: 'Different priority', status: 'NEW', priority: 'LOW', createdAt: new Date('2026-01-02') })
    ];
    const controller = loadEmailController({ Email: makeEmailModel(emails) });
    const res = createResponse();

    await controller.getAllEmails({
        query: { status: 'NEW', priority: 'HIGH', page: '1', limit: '1', includeStats: 'true' }
    }, res, createNext());

    assert.deepEqual(res.body.data.map(email => email.subject), ['Newest issue']);
    assert.deepEqual(res.body.stats, { NEW: 2 });
    assert.deepEqual(res.body.pagination, {
        page: 1, limit: 1, total: 2, pages: 2, totalPages: 2, hasPrevPage: false, hasNextPage: true
    });
});

test('approve email persists status, records audit entry, and emits socket update', async () => {
    const email = makeEmail({ status: 'REVIEWED', save: async () => {} });
    const auditEntries = [];
    const emitted = [];
    global.socketService = { emitEmailUpdate: (...args) => emitted.push(args) };
    const controller = loadEmailController({
        Email: { findById: async () => email },
        AuditLog: { create: async entry => auditEntries.push(entry) }
    });
    const res = createResponse();

    await controller.approveEmail({ params: { id: 'email-1' }, user: { _id: 'user-1' } }, res, createNext());

    delete global.socketService;
    assert.equal(email.status, 'APPROVED');
    assert.equal(auditEntries[0].action, 'APPROVED');
    assert.deepEqual(emitted, [['email-1', { type: 'approved', data: { status: 'APPROVED' } }]]);
});

test('send email rejects a draft before touching a queue', async () => {
    const controller = loadEmailController({
        Email: { findById: async () => makeEmail({ status: 'DRAFTED' }) }
    });
    const next = createNext();

    await controller.sendEmail({ params: { id: 'email-1' }, user: { _id: 'user-1' } }, createResponse(), next);

    assert.equal(next.state.error.statusCode, 400);
    assert.equal(next.state.error.message, 'Email must be approved before sending');
});

test('mark as unread clears read timestamp and saves the email', async () => {
    let saves = 0;
    const email = makeEmail({ isRead: true, readAt: new Date(), save: async () => { saves++; } });
    const controller = loadEmailController({ Email: { findById: async () => email } });
    const res = createResponse();

    await controller.markAsUnread({ params: { id: 'email-1' } }, res, createNext());

    assert.equal(saves, 1);
    assert.equal(email.isRead, false);
    assert.equal(email.readAt, null);
    assert.deepEqual(res.body.data, { id: email._id, isRead: false, readAt: null });
});
