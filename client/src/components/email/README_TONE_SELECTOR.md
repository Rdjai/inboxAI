# Reply Tone Selector Feature

## Overview
The Reply Tone Selector allows users to adjust the tone of their email messages to match different communication contexts. This feature is available in both the Email Composer and Email Detail (reply) views.

## Available Tones

### 1. **Formal** 👔
- **Description**: Professional and respectful
- **Use Case**: Official communications, senior management, external stakeholders
- **Characteristics**:
  - Uses formal greetings (Dear, Respected, Esteemed)
  - Formal closings (Sincerely, Respectfully, Best regards)
  - Removes contractions and casual language
  - Replaces exclamation marks with periods
  - Uses complete phrases instead of abbreviations

### 2. **Casual** 😊
- **Description**: Friendly and relaxed
- **Use Case**: Team members, close colleagues, informal communications
- **Characteristics**:
  - Uses casual greetings (Hi, Hey, Hello)
  - Casual closings (Thanks, Cheers, Take care)
  - Adds contractions (don't, can't, won't)
  - Simplified language
  - More conversational tone

### 3. **Professional** 💼
- **Description**: Business-appropriate
- **Use Case**: Standard business communications, clients, cross-team collaboration
- **Characteristics**:
  - Uses professional greetings (Hello, Good morning, Good afternoon)
  - Professional closings (Best regards, Kind regards, Thank you)
  - Balanced formality
  - Clear and concise language
  - Appropriate for most business contexts

## How to Use

### In Email Composer
1. Write your email message in the message field
2. Select your desired tone from the three options
3. Click the "Apply Tone" button
4. Your message will be automatically adjusted to match the selected tone
5. Review and edit as needed before sending

### In Email Detail (Replies)
1. Click "Reply to Email" or "Edit Draft"
2. Write your reply or edit the draft
3. Select your desired tone from the tone selector
4. Click "Apply Tone" to adjust the message
5. Review the adjusted message
6. Send or save your reply

### In Email Detail (Draft Editing)
1. Click "Edit Draft" on an existing email
2. The tone selector will appear above the draft editor
3. Select your desired tone and click "Apply Tone"
4. The draft will be adjusted accordingly
5. Click "Save" to save your changes

## Features

- **Visual Selection**: Easy-to-use card-based interface with icons
- **Real-time Application**: Instant tone adjustment with visual feedback
- **Smart Adjustments**: Intelligently modifies:
  - Greetings and closings
  - Common phrases and expressions
  - Punctuation and contractions
  - Formality level

- **Non-destructive**: You can always edit the adjusted text manually
- **Multiple Contexts**: Works in composer, replies, and draft editing

## Technical Implementation

### Components
- **ToneSelector.jsx**: The UI component for tone selection
- **toneAdjuster.js**: Utility functions for tone transformation

### Key Functions
- `adjustTone(text, tone)`: Applies tone adjustments to text
- `getToneSuggestions(text)`: Gets suggestions for all tones
- `detectTone(text)`: Detects the current tone of text

## Future Enhancements

Potential improvements for production:
1. **AI Integration**: Connect to an AI API (OpenAI, Anthropic) for more sophisticated tone adjustments
2. **Custom Tones**: Allow users to create and save custom tone profiles
3. **Tone Detection**: Automatically detect and suggest appropriate tones based on context
4. **Preview Mode**: Show before/after comparison before applying
5. **Tone History**: Remember user's preferred tones for different recipients
6. **Multi-language Support**: Extend tone adjustments to multiple languages

## Notes

- The current implementation uses client-side pattern matching
- For production use, consider integrating with an AI service for more natural tone adjustments
- The tone selector defaults to "Professional" as a balanced starting point
- Users can apply tone multiple times to refine the message
