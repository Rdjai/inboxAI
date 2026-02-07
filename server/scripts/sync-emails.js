// scripts/test-imap-sync.js
require('dotenv').config();
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const mongoose = require('../src/config/database');
const Email = require('../src/modules/emails/email.model');

async function testIMAPAndSync() {
    console.log('📧 Testing Gmail IMAP Sync...\n');

    // Your Gmail credentials
    const imapConfig = {
        user: 'jaykashyap283125@gmail.com',
        password: 'xntb ghjl rxeb ehti', // Your app password
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 30000
    };

    console.log('🔌 Connecting to Gmail IMAP...');

    const imap = new Imap(imapConfig);

    return new Promise((resolve, reject) => {
        imap.once('ready', async () => {
            console.log('✅ Connected to Gmail IMAP');

            imap.openBox('INBOX', false, async (err, box) => {
                if (err) {
                    console.error('❌ Error opening inbox:', err);
                    imap.end();
                    reject(err);
                    return;
                }

                console.log(`📬 INBOX Info:`);
                console.log(`   Total messages: ${box.messages.total}`);
                console.log(`   Recent messages: ${box.messages.recent}`);
                console.log(`   Unseen messages: ${box.messages.unseen}`);

                if (box.messages.total === 0) {
                    console.log('📭 Mailbox is empty');
                    imap.end();
                    resolve();
                    return;
                }

                // Fetch last 10 emails
                const limit = 10;
                const start = Math.max(1, box.messages.total - limit + 1);
                const end = box.messages.total;

                console.log(`\n📥 Fetching messages ${start} to ${end}...`);

                const fetch = imap.seq.fetch(`${start}:${end}`, {
                    bodies: '',
                    struct: true
                });

                const emails = [];

                fetch.on('message', (msg, seqno) => {
                    console.log(`   Processing message #${seqno}...`);

                    const email = { seqno };

                    msg.on('body', (stream) => {
                        simpleParser(stream, async (err, parsed) => {
                            if (err) {
                                console.error(`   Error parsing email ${seqno}:`, err);
                                return;
                            }

                            email.messageId = parsed.messageId;
                            email.from = parsed.from?.text || '';
                            email.to = parsed.to?.text || '';
                            email.subject = parsed.subject || '(No Subject)';
                            email.date = parsed.date || new Date();
                            email.body = parsed.text || '';
                            email.html = parsed.html || '';
                            email.attachments = parsed.attachments || [];

                            emails.push(email);

                            console.log(`   ✅ Fetched: "${email.subject.substring(0, 50)}..."`);
                        });
                    });
                });

                fetch.once('error', (err) => {
                    console.error('❌ Fetch error:', err);
                    imap.end();
                    reject(err);
                });

                fetch.once('end', async () => {
                    console.log(`\n✅ Fetched ${emails.length} emails`);
                    imap.end();

                    // Connect to MongoDB
                    await mongoose.connectDB();
                    console.log('✅ Connected to MongoDB');

                    // Save emails to database
                    let savedCount = 0;
                    for (const emailData of emails.reverse()) { // Newest first
                        try {
                            // Check if email already exists
                            const existing = await Email.findOne({
                                messageId: emailData.messageId
                            });

                            if (!existing && emailData.messageId) {
                                const email = new Email({
                                    fromAddress: emailData.from,
                                    toAddress: 'jaykashyap283125@gmail.com', // Your email
                                    subject: emailData.subject,
                                    bodyText: emailData.body,
                                    bodyHtml: emailData.html,
                                    messageId: emailData.messageId,
                                    date: emailData.date,
                                    status: 'NEW',
                                    metadata: {
                                        fetchedAt: new Date(),
                                        hasAttachments: emailData.attachments.length > 0
                                    }
                                });

                                await email.save();
                                savedCount++;
                                console.log(`   💾 Saved: "${email.subject.substring(0, 50)}..."`);
                            }
                        } catch (saveError) {
                            console.error(`   ❌ Error saving email:`, saveError.message);
                        }
                    }

                    console.log(`\n🎉 Sync Complete!`);
                    console.log(`   Total fetched: ${emails.length}`);
                    console.log(`   Saved to DB: ${savedCount}`);
                    console.log(`   Skipped (already exist): ${emails.length - savedCount}`);

                    // Show what's in DB now
                    const totalInDB = await Email.countDocuments();
                    console.log(`\n📊 Database now has: ${totalInDB} emails total`);

                    await mongoose.disconnect();
                    resolve();
                });
            });
        });

        imap.once('error', (err) => {
            console.error('❌ IMAP Connection Error:', err.message);
            console.error('   Code:', err.code);
            console.error('   Source:', err.source);

            // Check common issues
            console.log('\n🔍 Troubleshooting:');
            console.log('1. Check if app password is correct');
            console.log('2. Enable IMAP in Gmail: Settings → See all settings → Forwarding and POP/IMAP → Enable IMAP');
            console.log('3. Visit: https://accounts.google.com/DisplayUnlockCaptcha and click Continue');
            console.log('4. Ensure 2-Step Verification is enabled');

            reject(err);
        });

        imap.once('end', () => {
            console.log('\n🔚 IMAP Connection closed');
        });

        imap.connect();
    });
}

// Run the test
testIMAPAndSync().catch(console.error);