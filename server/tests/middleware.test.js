const test = require('node:test');
const assert = require('node:assert/strict');
const Joi = require('joi');
const { createResponse, createNext } = require('./helpers');
const { roleMiddleware, permissionMiddleware } = require('../src/middleware/auth.middleware');
const { validate } = require('../src/middleware/validation.middleware');

test('role middleware rejects unauthenticated and unauthorized requests', () => {
    const middleware = roleMiddleware('admin');
    const unauthenticatedResponse = createResponse();
    middleware({}, unauthenticatedResponse, createNext());
    assert.equal(unauthenticatedResponse.statusCode, 401);
    assert.equal(unauthenticatedResponse.body.message, 'Authentication required.');

    const unauthorizedResponse = createResponse();
    middleware({ user: { role: 'agent' } }, unauthorizedResponse, createNext());
    assert.equal(unauthorizedResponse.statusCode, 403);
    assert.deepEqual(unauthorizedResponse.body.required, ['admin']);
});

test('role and permission middleware call next for allowed requests', () => {
    const roleNext = createNext();
    roleMiddleware('admin', 'reviewer')({ user: { role: 'reviewer' } }, createResponse(), roleNext);
    assert.equal(roleNext.state.called, true);

    const permissionNext = createNext();
    permissionMiddleware('email:approve')({ user: { role: 'reviewer' } }, createResponse(), permissionNext);
    assert.equal(permissionNext.state.called, true);
});

test('validation middleware normalizes accepted input and strips unknown fields', () => {
    const schema = Joi.object({
        email: Joi.string().email().trim().lowercase().required(),
        limit: Joi.number().integer().default(20)
    });
    const req = { body: { email: '  USER@Example.COM ', ignored: true } };
    const next = createNext();

    validate(schema)(req, createResponse(), next);

    assert.equal(next.state.called, true);
    assert.deepEqual(req.body, { email: 'user@example.com', limit: 20 });
});

test('validation middleware returns all field errors without calling next', () => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required()
    });
    const res = createResponse();
    const next = createNext();

    validate(schema)({ body: { email: 'invalid', password: 'short' } }, res, next);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body.errors.map(error => error.field).sort(), ['email', 'password']);
    assert.equal(next.state.called, false);
});
