const nodemailer = require('nodemailer');
const EmailAccount = require('../models/emailAccount.model');
const logger = require('../utils/logger');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require('../config/env');

class MailService {
    constructor() {
        this.transporters = new Map(); // Cache SMTP transporters by accountId
    }

    // Get or create SMTP transporter for an account
    async getTransporterForAccount(accountId) {
        if (this.transporters.has(accountId)) {
            return this.transporters.get(accountId);
        }

        const account = await EmailAccount.findById(accountId);
        if (!account || !account.smtpConfig || !account.isActive) {
            throw new Error(`Email account ${accountId} not found or not configured`);
        }

        const smtpPort = Number(account.smtpConfig.port) || 587;
        let secure = Boolean(account.smtpConfig.secure);
        const oauthConfig = account.metadata?.oauth;

        // Normalize common SMTP TLS modes to avoid SSL "wrong version number" errors.
        if (smtpPort === 587 && secure) secure = false;
        if (smtpPort === 465 && !secure) secure = true;

        const authConfig = (oauthConfig?.provider === 'google' && oauthConfig?.refreshToken)
            ? {
                type: 'OAuth2',
                user: account.smtpConfig.auth.user,
                clientId: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                refreshToken: oauthConfig.refreshToken,
                accessToken: oauthConfig.accessToken
            }
            : {
                user: account.smtpConfig.auth.user,
                pass: account.smtpConfig.auth.pass
            };

        const transporter = nodemailer.createTransport({
            host: account.smtpConfig.host,
            port: smtpPort,
            secure,
            requireTLS: smtpPort === 587,
            auth: authConfig,
            // Additional Gmail-specific options
            ...(account.provider === 'gmail' && {
                tls: {
                    rejectUnauthorized: false
                }
            })
        });

        // Test connection
        try {
            await transporter.verify();
            logger.info(` SMTP connection verified for ${account.email}`);
        } catch (error) {
            logger.error(` SMTP connection failed for ${account.email}:`, error.message);
            throw new Error(`SMTP connection failed: ${error.message}`);
        }

        this.transporters.set(accountId, transporter);
        return transporter;
    }

    // Send email directly
    async sendEmail(accountId, mailOptions) {
        try {
            const transporter = await this.getTransporterForAccount(accountId);
            const account = await EmailAccount.findById(accountId);

            const emailToSend = {
                from: `"ProcessMail" <${account.email}>`,
                replyTo: account.email,
                ...mailOptions
            };

            logger.info(` Sending email via ${account.email}: ${mailOptions.subject}`);

            const info = await transporter.sendMail(emailToSend);

            logger.info(` Email sent successfully: ${info.messageId}`);

            return {
                success: true,
                messageId: info.messageId,
                response: info.response,
                envelope: info.envelope
            };
        } catch (error) {
            logger.error(` Failed to send email:`, error);

            // Remove transporter from cache on error
            this.transporters.delete(accountId);

            throw new Error(`Email sending failed: ${error.message}`);
        }
    }

    // Send email from ProcessMail system (uses default account)
    async sendProcessMailEmail(emailData) {
        try {
            // Find default email account
            const defaultAccount = await EmailAccount.findOne({
                userId: emailData.userId,
                isDefault: true,
                isActive: true
            });

            if (!defaultAccount) {
                throw new Error('No default email account found');
            }

            const mailOptions = {
                to: emailData.toAddress,
                subject: emailData.subject,
                text: emailData.bodyText,
                html: emailData.bodyHtml || this.convertTextToHtml(emailData.bodyText),
                // Add thread headers if replying
                ...(emailData.inReplyTo && {
                    inReplyTo: emailData.inReplyTo,
                    references: emailData.references || [emailData.inReplyTo]
                }),
                // Add attachments if any
                ...(emailData.attachments && {
                    attachments: emailData.attachments.map(att => ({
                        filename: att.filename,
                        path: att.path,
                        contentType: att.contentType
                    }))
                })
            };

            return await this.sendEmail(defaultAccount._id, mailOptions);
        } catch (error) {
            throw error;
        }
    }

    // Convert plain text to HTML for email
    convertTextToHtml(text) {
        return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        ${text.replace(/\n/g, '<br>')}
        <br><br>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <div style="font-size: 12px; color: #666;">
          Sent via <strong>ProcessMail</strong> - AI Email Assistant
        </div>
      </div>
    `;
    }

    // Clear transporter cache for an account
    clearTransporterCache(accountId) {
        this.transporters.delete(accountId);
    }

    // Test SMTP connection
    async testSMTPConnection(accountId) {
        try {
            const transporter = await this.getTransporterForAccount(accountId);
            return {
                success: true,
                message: 'SMTP connection successful'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

module.exports = new MailService();
