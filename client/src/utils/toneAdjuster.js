/**
 * Adjusts email text based on the selected tone
 * This is a client-side implementation. For production, consider using an AI API.
 */

const TONE_PATTERNS = {
    formal: {
        greetings: ['Dear', 'Respected', 'Esteemed'],
        closings: ['Sincerely', 'Respectfully', 'Best regards', 'Yours faithfully'],
        phrases: {
            'thanks': 'I would like to express my gratitude',
            'please': 'I kindly request',
            'sorry': 'I sincerely apologize',
            'let me know': 'please inform me',
            'asap': 'at your earliest convenience',
            'ok': 'acceptable',
            'got it': 'understood',
            'yeah': 'yes',
            'nope': 'no'
        }
    },
    casual: {
        greetings: ['Hi', 'Hey', 'Hello'],
        closings: ['Thanks', 'Cheers', 'Take care', 'Talk soon'],
        phrases: {
            'I would like to express my gratitude': 'thanks',
            'I kindly request': 'please',
            'I sincerely apologize': 'sorry',
            'please inform me': 'let me know',
            'at your earliest convenience': 'soon',
            'understood': 'got it',
            'acceptable': 'sounds good'
        }
    },
    professional: {
        greetings: ['Hello', 'Good morning', 'Good afternoon'],
        closings: ['Best regards', 'Kind regards', 'Thank you', 'Best'],
        phrases: {
            'thanks': 'Thank you',
            'please': 'Please',
            'sorry': 'I apologize',
            'let me know': 'please let me know',
            'asap': 'as soon as possible',
            'ok': 'understood',
            'yeah': 'yes',
            'nope': 'no',
            'got it': 'understood'
        }
    }
};

/**
 * Apply tone adjustments to email text
 * @param {string} text - The original email text
 * @param {string} tone - The desired tone (formal/casual/professional)
 * @returns {string} - The adjusted email text
 */
export const adjustTone = (text, tone) => {
    if (!text || !tone || !TONE_PATTERNS[tone]) {
        return text;
    }

    let adjustedText = text;
    const patterns = TONE_PATTERNS[tone];

    // Replace common phrases
    Object.entries(patterns.phrases).forEach(([from, to]) => {
        const regex = new RegExp(`\\b${from}\\b`, 'gi');
        adjustedText = adjustedText.replace(regex, to);
    });

    // Adjust greeting if present at the start
    const greetingMatch = adjustedText.match(/^(Hi|Hey|Hello|Dear|Respected|Esteemed|Good morning|Good afternoon)/i);
    if (greetingMatch) {
        const randomGreeting = patterns.greetings[Math.floor(Math.random() * patterns.greetings.length)];
        adjustedText = adjustedText.replace(greetingMatch[0], randomGreeting);
    }

    // Adjust closing if present at the end
    const closingMatch = adjustedText.match(/(Thanks|Cheers|Take care|Talk soon|Sincerely|Respectfully|Best regards|Yours faithfully|Kind regards|Thank you|Best)[,.]?\s*$/i);
    if (closingMatch) {
        const randomClosing = patterns.closings[Math.floor(Math.random() * patterns.closings.length)];
        adjustedText = adjustedText.replace(closingMatch[1], randomClosing);
    }

    // Adjust punctuation based on tone
    if (tone === 'formal') {
        // Remove exclamation marks in formal tone
        adjustedText = adjustedText.replace(/!/g, '.');
        // Ensure proper capitalization
        adjustedText = adjustedText.replace(/\bi\b/g, 'I');
    } else if (tone === 'casual') {
        // Add more contractions in casual tone
        adjustedText = adjustedText.replace(/\bdo not\b/gi, "don't");
        adjustedText = adjustedText.replace(/\bcannot\b/gi, "can't");
        adjustedText = adjustedText.replace(/\bwill not\b/gi, "won't");
        adjustedText = adjustedText.replace(/\bI am\b/g, "I'm");
        adjustedText = adjustedText.replace(/\byou are\b/gi, "you're");
    }

    return adjustedText;
};

/**
 * Get tone suggestions for email content
 * @param {string} text - The email text to analyze
 * @returns {object} - Suggestions for each tone
 */
export const getToneSuggestions = (text) => {
    return {
        formal: adjustTone(text, 'formal'),
        casual: adjustTone(text, 'casual'),
        professional: adjustTone(text, 'professional')
    };
};

/**
 * Detect the current tone of the text
 * @param {string} text - The email text to analyze
 * @returns {string} - Detected tone (formal/casual/professional)
 */
export const detectTone = (text) => {
    if (!text) return 'professional';

    const lowerText = text.toLowerCase();

    // Count formal indicators
    const formalIndicators = ['dear', 'sincerely', 'respectfully', 'kindly', 'grateful', 'apologize'];
    const formalCount = formalIndicators.filter(word => lowerText.includes(word)).length;

    // Count casual indicators
    const casualIndicators = ['hey', 'thanks', 'cheers', 'yeah', 'nope', 'got it', 'asap'];
    const casualCount = casualIndicators.filter(word => lowerText.includes(word)).length;

    // Count professional indicators
    const professionalIndicators = ['hello', 'thank you', 'please', 'best regards', 'understood'];
    const professionalCount = professionalIndicators.filter(word => lowerText.includes(word)).length;

    // Determine tone based on counts
    if (formalCount > casualCount && formalCount > professionalCount) {
        return 'formal';
    } else if (casualCount > formalCount && casualCount > professionalCount) {
        return 'casual';
    } else {
        return 'professional';
    }
};
