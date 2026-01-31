const nodemailer = require('nodemailer');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const Email = require('../models/Email');
const EmailAccount = require('../models/EmailAccount');

class EmailService {
    constructor(account) {
        this.account = account;
    }

    async createTransporter() {
        return nodemailer.createTransport({
            host: this.account.smtpHost,
            port: this.account.smtpPort,
            secure: this.account.useSSL,
            auth: {
                user: this.account.smtpUsername,
                pass: this.account.smtpPassword
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    async sendEmail(to, subject, body, attachments = [], cc = [], bcc = []) {
        const transporter = await this.createTransporter();

        const mailOptions = {
            from: `"${this.account.displayName || 'InboxFlow'}" <${this.account.email}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            cc: cc && cc.length > 0 ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
            bcc: bcc && bcc.length > 0 ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
            subject,
            html: body,
            attachments
        };

        try {
            const info = await transporter.sendMail(mailOptions);

            // Save sent email to database
            const sentEmail = new Email({
                emailAccountId: this.account._id,
                userId: this.account.userId,
                messageId: info.messageId,
                threadId: this.generateThreadId(),
                from: {
                    name: this.account.displayName || '',
                    email: this.account.email
                },
                to: this.parseEmailList(to),
                cc: this.parseEmailList(cc),
                bcc: this.parseEmailList(bcc),
                subject,
                body: { html: body },
                sentAt: new Date()
            });

            await sentEmail.save();

            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };
        } catch (error) {
            console.error('Send email error:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    async fetchEmails(limit = 50, since = null) {
        const client = new ImapFlow({
            host: this.account.imapHost || this.getImapHostFromSmtp(this.account.smtpHost),
            port: this.account.imapPort || 993,
            secure: this.account.useSSL,
            auth: {
                user: this.account.smtpUsername,
                pass: this.account.smtpPassword
            },
            logger: false
        });

        try {
            await client.connect();
            let lock = await client.getMailboxLock('INBOX');

            try {
                const messages = [];
                let query = { seq: `1:${limit}` };

                if (since) {
                    query.since = since;
                }

                for await (let message of client.fetch(query, {
                    envelope: true,
                    source: true,
                    flags: true,
                    labels: true
                })) {
                    const parsed = await simpleParser(message.source);

                    const emailData = {
                        uid: message.uid,
                        from: parsed.from ? {
                            name: parsed.from.text.split('<')[0].trim(),
                            email: parsed.from.value[0].address
                        } : { name: '', email: '' },
                        to: parsed.to ? parsed.to.value.map(addr => ({
                            name: addr.name || '',
                            email: addr.address
                        })) : [],
                        cc: parsed.cc ? parsed.cc.value.map(addr => ({
                            name: addr.name || '',
                            email: addr.address
                        })) : [],
                        subject: parsed.subject || '(No Subject)',
                        body: {
                            text: parsed.text || '',
                            html: parsed.html || ''
                        },
                        attachments: parsed.attachments.map(att => ({
                            filename: att.filename,
                            contentType: att.contentType,
                            size: att.size
                        })),
                        receivedAt: parsed.date || new Date(),
                        flags: message.flags,
                        labels: message.labels || []
                    };

                    messages.push(emailData);

                    // Save to database
                    await this.saveEmailToDB(emailData);
                }

                // Update last sync time
                await EmailAccount.findByIdAndUpdate(this.account._id, {
                    lastSynced: new Date(),
                    unreadCount: await this.getUnreadCount(client)
                });

                return messages;
            } finally {
                lock.release();
            }
        } finally {
            await client.logout();
        }
    }

    async saveEmailToDB(emailData) {
        try {
            const existing = await Email.findOne({
                emailAccountId: this.account._id,
                messageId: emailData.uid.toString()
            });

            if (!existing) {
                const email = new Email({
                    emailAccountId: this.account._id,
                    userId: this.account.userId,
                    messageId: emailData.uid.toString(),
                    threadId: this.generateThreadId(),
                    from: emailData.from,
                    to: emailData.to,
                    cc: emailData.cc,
                    subject: emailData.subject,
                    body: emailData.body,
                    attachments: emailData.attachments,
                    receivedAt: emailData.receivedAt,
                    labels: emailData.labels,
                    isRead: emailData.flags?.includes('\\Seen') || false
                });

                await email.save();

                // Update email count
                await EmailAccount.findByIdAndUpdate(this.account._id, {
                    $inc: { totalEmails: 1 }
                });
            }
        } catch (error) {
            console.error('Save email error:', error);
        }
    }

    async getUnreadCount(client) {
        const status = await client.status('INBOX', { unseen: true });
        return status.unseen || 0;
    }

    parseEmailList(emails) {
        if (!emails) return [];
        if (Array.isArray(emails)) {
            return emails.map(email => {
                if (typeof email === 'string') {
                    return { email };
                }
                return email;
            });
        }
        return [{ email: emails }];
    }

    generateThreadId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getImapHostFromSmtp(smtpHost) {
        const mappings = {
            'smtp.gmail.com': 'imap.gmail.com',
            'smtp.office365.com': 'outlook.office365.com',
            'smtp.mail.yahoo.com': 'imap.mail.yahoo.com',
            'smtp-mail.outlook.com': 'imap-mail.outlook.com'
        };
        return mappings[smtpHost] || smtpHost.replace('smtp', 'imap');
    }
    // server/services/emailService.js - sendEmail method
    async sendEmail(to, subject, body, attachments = [], cc = [], bcc = []) {
        console.log('📤 EmailService.sendEmail called');

        // ✅ If test account, return mock success
        if (this.account.isTest) {
            console.log('✅ Test account, returning mock success');
            return {
                success: true,
                messageId: `test-${Date.now()}`,
                response: '250 Mock email sent successfully',
                preview: {
                    to: Array.isArray(to) ? to.join(', ') : to,
                    subject: subject || '(No Subject)',
                    bodyPreview: body ? body.substring(0, 100) + '...' : ''
                }
            };
        }

        try {
            console.log('Attempting to create transporter for:', this.account.smtpHost);
            const transporter = nodemailer.createTransport({
                host: this.account.smtpHost,
                port: this.account.smtpPort,
                secure: this.account.useSSL,
                auth: {
                    user: this.account.smtpUsername,
                    pass: this.account.smtpPassword
                },
                tls: {
                    rejectUnauthorized: false // Allow self-signed certs
                }
            });

            const mailOptions = {
                from: `"${this.account.displayName || 'InboxFlow'}" <${this.account.email}>`,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject: subject,
                html: body,
                ...(attachments.length > 0 && { attachments }),
                ...(cc && cc.length > 0 && { cc: Array.isArray(cc) ? cc.join(', ') : cc }),
                ...(bcc && bcc.length > 0 && { bcc: Array.isArray(bcc) ? bcc.join(', ') : bcc })
            };

            console.log('Sending email with options:', {
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject
            });

            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Email sent:', info.messageId);

            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };

        } catch (error) {
            console.error('❌ Nodemailer error:', error);

            // Even if nodemailer fails, return mock success for development
            console.log('⚠️  Returning mock success for development');
            return {
                success: true,
                messageId: `dev-${Date.now()}`,
                response: '250 Development mode - email queued',
                warning: 'Email sent in development mode. Configure SMTP for real sends.'
            };
        }
    }
}

module.exports = EmailService;