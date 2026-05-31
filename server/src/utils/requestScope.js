const { AppError } = require('../middleware/errorHandler.middleware');

const MAILBOX_SCOPE_KEYS = ['mailboxId', 'accountId', 'emailAccountId'];

function firstDefinedScopeValue(...sources) {
    for (const source of sources) {
        if (!source || typeof source !== 'object') {
            continue;
        }

        for (const key of MAILBOX_SCOPE_KEYS) {
            const value = source[key];
            if (value !== undefined && value !== null && value !== '') {
                return value;
            }
        }
    }

    return null;
}

function getMailboxScopeId(req) {
    return firstDefinedScopeValue(
        req?.authenticatedUser,
        req?.user,
        req?.params,
        req?.query,
        req?.body
    );
}

function buildMailboxScopeQuery(req, options = {}) {
    const {
        required = true,
        field = 'accountId'
    } = options;

    const mailboxScopeId = getMailboxScopeId(req);
    if (!mailboxScopeId) {
        if (required) {
            throw new AppError('Mailbox scope is required', 400);
        }

        return {};
    }

    return {
        [field]: mailboxScopeId
    };
}

module.exports = {
    buildMailboxScopeQuery,
    getMailboxScopeId
};
