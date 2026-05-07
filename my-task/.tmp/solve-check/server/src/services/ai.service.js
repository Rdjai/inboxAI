const { EMAIL_CATEGORIES } = require('../utils/constants');
const logger = require('../utils/logger');

class LLMService {
    constructor() {
        this.keywordPatterns = {
            Complaint: ['angry', 'unhappy', 'disappointed', 'terrible', 'worst', 'never again', 'waste', 'useless'],
            Issue: ['broken', 'not working', 'error', 'bug', 'crash', 'problem', 'issue', 'fix'],
            Refund: ['refund', 'money back', 'return', 'cancel', 'chargeback', 'compensation'],
            Billing: ['invoice', 'payment', 'charge', 'bill', 'price', 'cost', 'subscription'],
            Feedback: ['suggestion', 'feedback', 'improve', 'idea', 'feature request', 'could be better'],
            Sales: ['buy', 'purchase', 'price', 'demo', 'trial', 'sales', 'quote', 'pricing']
        };

        this.draftTemplates = {
            Complaint: `Thank you for bringing this to our attention. We sincerely apologize for the inconvenience you've experienced. Our team is looking into this matter and we will get back to you within 24 hours with a resolution.`,
            Issue: `We're sorry to hear you're experiencing issues. Our technical team has been notified and will investigate this promptly. Please try clearing your cache and restarting the application in the meantime.`,
            Refund: `Thank you for contacting us regarding a refund. We've received your request and it's being reviewed by our billing department. We'll provide an update within 1-2 business days.`,
            Billing: `Thank you for your billing inquiry. Our records show your payment was processed successfully. If you have specific questions about charges or invoices, please provide the transaction ID for faster assistance.`,
            Feedback: `Thank you for your valuable feedback! We appreciate you taking the time to share your thoughts. Our product team reviews all suggestions regularly.`,
            Sales: `Thank you for your interest in our products! A sales representative will contact you within 24 hours to discuss your needs and provide pricing information.`,
            Other: `Thank you for contacting our support team. We've received your message and will respond with assistance as soon as possible.`
        };
    }

    async classifyEmail(subject, body) {
        try {
            const text = `${subject} ${body}`.toLowerCase();
            let maxScore = 0;
            let bestCategory = 'Other';

            for (const [category, keywords] of Object.entries(this.keywordPatterns)) {
                let score = 0;
                for (const keyword of keywords) {
                    if (text.includes(keyword.toLowerCase())) {
                        score += 2;

                        const occurrences = (text.match(new RegExp(keyword, 'gi')) || []).length;
                        score += Math.min(occurrences - 1, 3);
                    }
                }

                if (score > maxScore) {
                    maxScore = score;
                    bestCategory = category;
                }
            }

            const confidence = Math.min(maxScore / 20, 0.95);

            if (maxScore < 2) {
                return {
                    category: 'Other',
                    confidence: 0.3
                };
            }

            return {
                category: bestCategory,
                confidence: confidence
            };
        } catch (error) {
            logger.error('Classification error:', error);
            return {
                category: 'Other',
                confidence: 0.1
            };
        }
    }

    async generateDraft(category, originalText) {
        try {
            const template = this.draftTemplates[category] || this.draftTemplates.Other;

            let draft = template;

            const nameMatch = originalText.match(/Dear\s+(\w+)|Hi\s+(\w+)|Hello\s+(\w+)/i);
            if (nameMatch) {
                const name = nameMatch[1] || nameMatch[2] || nameMatch[3];
                draft = draft.replace('Thank you', `Dear ${name},\n\nThank you`);
            }

            draft += `\n\nBest regards,\nThe Support Team`;

            return draft;
        } catch (error) {
            logger.error('Draft generation error:', error);
            return `Thank you for contacting our support team. We will respond to your inquiry shortly.\n\nBest regards,\nThe Support Team`;
        }
    }

    async processEmail(emailData) {
        const classification = await this.classifyEmail(emailData.subject, emailData.bodyText);
        const draft = await this.generateDraft(classification.category, emailData.bodyText);

        return {
            classification,
            draft
        };
    }
}

module.exports = new LLMService();