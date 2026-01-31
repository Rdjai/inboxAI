class AIService {
    constructor() {
        this.categoryKeywords = {
            complaint: ['angry', 'unhappy', 'disappointed', 'terrible', 'bad', 'poor', 'worst', 'awful', 'hate', 'never again'],
            issue: ['broken', 'not working', 'error', 'bug', 'crash', 'problem', 'issue', 'fail', 'not responding'],
            refund: ['refund', 'money back', 'return', 'cancel', 'chargeback', 'repayment', 'compensation'],
            billing: ['invoice', 'payment', 'charge', 'bill', 'price', 'cost', 'fee', 'subscription', 'overcharge'],
            feedback: ['suggestion', 'idea', 'improve', 'feature', 'feedback', 'recommendation', 'enhancement'],
            sales: ['buy', 'purchase', 'price', 'demo', 'trial', 'sales', 'quote', 'pricing', 'discount']
        };
    }

    async classifyEmail(subject, body) {
        const text = `${subject} ${body}`.toLowerCase();
        let maxScore = 0;
        let bestCategory = 'other';

        // Simple keyword matching
        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            let score = 0;
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    score += 2;
                }
            }

            // Check for exact phrases
            const phrases = [
                ['how much', 'cost', 'price'],
                ['not working', 'broken', 'issue'],
                ['want refund', 'money back'],
                ['terrible', 'worst', 'awful'],
                ['suggestion', 'improvement', 'feature request']
            ];

            phrases.forEach(phraseGroup => {
                if (phraseGroup.every(word => text.includes(word))) {
                    score += 5;
                }
            });

            if (score > maxScore) {
                maxScore = score;
                bestCategory = category;
            }
        }

        // Calculate confidence (0-1)
        const confidence = Math.min(maxScore / 10, 0.95);

        return {
            category: bestCategory,
            confidence: confidence || 0.3
        };
    }

    async generateDraft(category, originalText, tone = 'professional') {
        const templates = {
            complaint: `Dear Customer,

Thank you for bringing this matter to our attention. We sincerely apologize for the inconvenience you've experienced with our service.

Our team is currently investigating this issue and we will get back to you within 24 hours with a resolution. Your satisfaction is our top priority.

In the meantime, if you have any additional details or context that could help us resolve this faster, please don't hesitate to share them.

Best regards,
Customer Support Team
InboxAI`,

            issue: `Hello,

Thank you for reporting this issue. We understand how frustrating technical problems can be, and we're already looking into it.

Our technical team has been notified and is working to identify the root cause. We'll update you as soon as we have more information.

To help us troubleshoot more efficiently, could you please provide:
1. When exactly did this issue start occurring?
2. Are there any specific error messages you're seeing?
3. What steps were you taking when the problem occurred?

We appreciate your patience while we work to resolve this.

Best regards,
Technical Support
InboxAI`,

            refund: `Dear Customer,

Thank you for reaching out regarding your refund request. We have received your inquiry and our billing department is currently reviewing your case.

According to our refund policy, all requests are processed within 3-5 business days after review. You will receive an email confirmation once the review is complete.

If you have any supporting documents (receipts, order numbers, etc.) that could expedite the process, please reply to this email with them attached.

Thank you for your patience.

Sincerely,
Billing Department
InboxAI`,

            billing: `Hello,

Thank you for your inquiry about your billing. We've received your question and are reviewing your account details now.

You should receive a detailed response within 24 hours. If this is regarding a specific charge on your invoice, please include the invoice number and date in your response for faster processing.

For immediate billing assistance, you can also visit our billing portal at [Your Billing Portal URL].

Best regards,
Billing Support
InboxAI`,

            feedback: `Hi there,

Thank you so much for taking the time to share your feedback with us! We truly value input from our customers and will share your suggestions with our product team for consideration in future updates.

If you'd like to elaborate further or have additional ideas, we'd love to hear them. Customer feedback like yours helps us improve our services for everyone.

Thanks again for helping us build a better product!

Warm regards,
Product Team
InboxAI`,

            sales: `Dear Customer,

Thank you for your interest in our products/services! We're excited to learn more about your needs and how we can help.

One of our sales representatives will contact you within the next business day to discuss your requirements and provide you with more information.

In the meantime, you might find our product brochure helpful: [Link to Brochure]
You can also schedule a demo at your convenience: [Demo Scheduling Link]

Looking forward to speaking with you soon!

Best regards,
Sales Team
InboxAI`,

            other: `Hello,

Thank you for contacting us. We've received your message and will get back to you as soon as possible.

Our standard response time is within 24 hours during business days. If your matter is urgent, please reply with "URGENT" in the subject line.

Best regards,
Support Team
InboxAI`
        };

        const baseTemplate = templates[category] || templates.other;

        // Add tone variations
        if (tone === 'friendly') {
            return baseTemplate.replace(/Best regards,/g, 'Cheers,')
                .replace(/Sincerely,/g, 'Best,')
                .replace(/Dear Customer,/g, 'Hi there,');
        }

        if (tone === 'formal') {
            return baseTemplate.replace(/Hello,/g, 'Dear Valued Customer,')
                .replace(/Hi there,/g, 'To Whom It May Concern,')
                .replace(/Best regards,/g, 'Respectfully yours,');
        }

        return baseTemplate;
    }

    async extractKeyInfo(text) {
        // Simple extraction for demo
        const info = {
            urgency: 'normal',
            sentiment: 'neutral',
            mentions: []
        };

        const urgentWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical'];
        const positiveWords = ['great', 'awesome', 'excellent', 'thank you', 'love', 'happy'];
        const negativeWords = ['terrible', 'awful', 'bad', 'hate', 'angry', 'frustrated'];

        const lowerText = text.toLowerCase();

        if (urgentWords.some(word => lowerText.includes(word))) {
            info.urgency = 'high';
        }

        if (positiveWords.some(word => lowerText.includes(word))) {
            info.sentiment = 'positive';
        } else if (negativeWords.some(word => lowerText.includes(word))) {
            info.sentiment = 'negative';
        }

        // Extract possible names (very basic)
        const nameRegex = /(?:my name is|i am|this is) ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i;
        const nameMatch = text.match(nameRegex);
        if (nameMatch) {
            info.mentions.push(`Customer name: ${nameMatch[1]}`);
        }

        const numberRegex = /(?:order|account|invoice|ticket) (?:number|#|no\.?)?[: ]*(\w+)/gi;
        let numberMatch;
        while ((numberMatch = numberRegex.exec(text)) !== null) {
            info.mentions.push(`Reference: ${numberMatch[1]}`);
        }

        return info;
    }
}

module.exports = new AIService();