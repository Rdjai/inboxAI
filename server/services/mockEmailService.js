// server/services/mockEmailService.js
class MockEmailService {
    constructor(account) {
        this.account = account;
    }

    async fetchEmails(limit = 1) {
        // Always return success for testing
        console.log('Mock: Simulating email connection test for', this.account.email);
        return [];
    }

    async sendEmail(to, subject, body, attachments = []) {
        console.log('Mock: Simulating email send to', to);
        return { success: true, messageId: 'mock-' + Date.now() };
    }
}

module.exports = MockEmailService;