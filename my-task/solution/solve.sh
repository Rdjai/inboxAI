#!/bin/bash
set -euo pipefail

if [ -d "/workspace/server" ]; then
    cd /workspace
elif [ -d "/app/inboxAI/server" ]; then
    cd /app/inboxAI
elif [ -d "./server" ]; then
    cd "$(pwd)"
else
    echo "ERROR: cannot find repo root"
    exit 1
fi

node <<'NODE'
const fs = require('fs');

function update(file, transform) {
    const before = fs.readFileSync(file, 'utf8');
    const after = transform(before);
    if (after !== before) {
        fs.writeFileSync(file, after);
        console.log(`${file}: fixed`);
    } else {
        console.log(`${file}: already fixed`);
    }
}

update('server/src/models/email.model.js', (text) => {
    if (text.includes('    accountId: {') && text.includes('    userId: {')) {
        return text;
    }

    const marker = /const emailSchema = new mongoose\.Schema\(\{\r?\n/;
    if (!marker.test(text)) throw new Error('email model schema marker not found');
    const eol = text.includes('\r\n') ? '\r\n' : '\n';

    const fields = `const emailSchema = new mongoose.Schema({
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailAccount',
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
`.replace(/\n/g, eol);
    return text.replace(marker, fields);
});

update('server/src/controllers/email.controller.js', (text) => {
    if (!text.includes('const query = { accountId: req.user.accountId };')) {
        text = text.replace('const query = {};', 'const query = { accountId: req.user.accountId };');
    }

    if (!/let emailQuery = Email\.findOne\(\{\r?\n\s+_id: req\.params\.id,\r?\n\s+accountId: req\.user\.accountId\r?\n\s+\}\)/.test(text)) {
        text = text.replace(
            'let emailQuery = Email.findById(req.params.id)',
            `let emailQuery = Email.findOne({
                _id: req.params.id,
                accountId: req.user.accountId
            })`
        );
    }

    return text;
});

update('server/src/controllers/analytics.controller.js', (text) => {
    const dashboardStart = text.indexOf('async getDashboardStats');
    const dashboardEnd = text.indexOf('async getCategoryAnalytics', dashboardStart);
    if (dashboardStart === -1 || dashboardEnd === -1) {
        throw new Error('dashboard analytics method markers not found');
    }

    const dashboard = text.slice(dashboardStart, dashboardEnd);
    if (dashboard.includes('const dateFilter = { accountId: req.user.accountId };')) {
        return text;
    }
    if (!dashboard.includes('const dateFilter = {};')) {
        throw new Error('dashboard date filter marker not found');
    }

    return text.slice(0, dashboardStart) +
        dashboard.replace('const dateFilter = {};', 'const dateFilter = { accountId: req.user.accountId };') +
        text.slice(dashboardEnd);
});
NODE
