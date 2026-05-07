// src/services/imap.service.js
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const logger = require('../utils/logger');

class ImapService {
    constructor(config) {
        this.config = {
            host: config.host,
            port: config.port || 993,
            user: config.auth?.user,
            password: config.auth?.pass,
            tls: config.secure !== false,
            tlsOptions: { rejectUnauthorized: false },
            autotls: 'always'
        };

        this.imap = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.imap = new Imap(this.config);

            this.imap.once('ready', () => {
                logger.debug(`IMAP connected to ${this.config.host}`);
                resolve();
            });

            this.imap.once('error', (err) => {
                logger.error(`IMAP connection error: ${err.message}`);
                reject(err);
            });

            this.imap.connect();
        });
    }

    async testConnection() {
        try {
            await this.connect();
            await this.openInbox();
            const boxInfo = await this.getMailboxInfo();
            await this.disconnect();

            return {
                success: true,
                message: 'Connection successful',
                mailboxInfo: boxInfo
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                mailboxInfo: null
            };
        }
    }

    async openInbox(mailbox = 'INBOX') {
        return new Promise((resolve, reject) => {
            this.imap.openBox(mailbox, false, (err, box) => {
                if (err) reject(err);
                else resolve(box);
            });
        });
    }

    async getMailboxInfo() {
        return new Promise((resolve, reject) => {
            this.imap.status('INBOX', (err, status) => {
                if (err) reject(err);
                else resolve(status);
            });
        });
    }

    async fetchRecentEmails(limit = 50) {
        return new Promise((resolve, reject) => {
            this.imap.openBox('INBOX', false, (err, box) => {
                if (err) return reject(err);

                const totalMessages = box.messages.total;
                const start = Math.max(1, totalMessages - limit + 1);
                const end = totalMessages;

                if (start > end) {
                    return resolve([]);
                }

                const emails = [];
                const fetch = this.imap.seq.fetch(`${start}:${end}`, {
                    bodies: '',
                    struct: true
                });

                fetch.on('message', (msg, seqno) => {
                    const email = { seqno };

                    msg.on('body', (stream) => {
                        simpleParser(stream, (err, parsed) => {
                            if (!err) {
                                email.messageId = parsed.messageId;
                                email.from = parsed.from?.text || '';
                                email.to = parsed.to?.text || '';
                                email.subject = parsed.subject || '(No Subject)';
                                email.date = parsed.date || new Date();
                                email.body = parsed.text || '';
                                email.html = parsed.html || '';
                                email.attachments = parsed.attachments || [];
                                emails.push(email);
                            }
                        });
                    });
                });

                fetch.once('error', (err) => reject(err));
                fetch.once('end', () => {
                    emails.reverse(); // Newest first
                    resolve(emails);
                });
            });
        });
    }

    async disconnect() {
        if (this.imap) {
            this.imap.end();
            this.imap = null;
        }
    }
}

module.exports = ImapService;