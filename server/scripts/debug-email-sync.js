// scripts/debug-email-sync.js
require('dotenv').config();
const mongoose = require('../src/config/database');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const util = require('util');

async function debugIMAP() {
    console.log('🔍 Debugging IMAP Connection...\n');

    const imapConfig = {
        user: 'jaykashyap283125@gmail.com',
        password: 'xntb ghjl rxeb ehti',
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
        debug: console.log // Enable verbose logging
    };

    const imap = new Imap(imapConfig);

    return new Promise((resolve, reject) => {
        imap.once('ready', () => {
            console.log('✅ IMAP Ready!');

            imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    console.error('❌ Open box error:', err);
                    imap.end();
                    reject(err);
                    return;
                }

                console.log(`📬 INBOX opened:`);
                console.log(`   Total messages: ${box.messages.total}`);
                console.log(`   Recent messages: ${box.messages.recent}`);
                console.log(`   Unseen messages: ${box.messages.unseen}`);

                // Fetch first 5 messages
                if (box.messages.total > 0) {
                    const fetch = imap.seq.fetch('1:5', {
                        bodies: ['HEADER', 'TEXT'],
                        struct: true
                    });

                    fetch.on('message', (msg, seqno) => {
                        console.log(`\n📧 Message #${seqno}:`);

                        msg.on('body', (stream, info) => {
                            let buffer = '';
                            stream.on('data', (chunk) => {
                                buffer += chunk.toString('utf8');
                            });

                            stream.on('end', () => {
                                if (info.which === 'HEADER') {
                                    console.log('   Headers received');
                                } else if (info.which === 'TEXT') {
                                    console.log('   Body received');
                                }
                            });
                        });

                        msg.once('attributes', (attrs) => {
                            console.log('   Attributes:', Object.keys(attrs));
                            if (attrs.date) console.log('   Date:', attrs.date);
                            if (attrs.subject) console.log('   Subject:', attrs.subject);
                            if (attrs.from) console.log('   From:', attrs.from.map(f => f.address).join(', '));
                        });
                    });

                    fetch.once('error', (err) => {
                        console.error('❌ Fetch error:', err);
                    });

                    fetch.once('end', () => {
                        console.log('\n✅ Fetch completed');
                        imap.end();
                        resolve();
                    });
                } else {
                    console.log('📭 Mailbox is empty');
                    imap.end();
                    resolve();
                }
            });
        });

        imap.once('error', (err) => {
            console.error('❌ IMAP Error:', err.message);
            console.error('   Code:', err.code);
            console.error('   Source:', err.source);
            reject(err);
        });

        imap.once('end', () => {
            console.log('\n🔚 IMAP Connection ended');
        });

        imap.connect();
    });
}

async function runDebug() {
    try {
        await debugIMAP();
    } catch (error) {
        console.error('\n❌ Debug failed:', error.message);

        // Check common issues
        console.log('\n🔍 Common IMAP Issues:');
        console.log('1. App password incorrect');
        console.log('2. IMAP not enabled in Gmail');
        console.log('3. Two-factor authentication required');
        console.log('4. Account access blocked (check https://accounts.google.com/DisplayUnlockCaptcha)');
        console.log('5. Network/firewall blocking port 993');

        console.log('\n💡 Steps to fix:');
        console.log('1. Go to Gmail → Settings → See all settings → Forwarding and POP/IMAP');
        console.log('2. Ensure "Enable IMAP" is checked');
        console.log('3. Visit: https://accounts.google.com/DisplayUnlockCaptcha and click Continue');
        console.log('4. Generate new app password at: https://myaccount.google.com/apppasswords');
        console.log('5. Wait 5 minutes after changes');
    }
}

runDebug();