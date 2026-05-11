import React, { useState } from 'react';
import { X, HelpCircle, Zap, Clock, Users, FileText, Sparkles, Calendar } from 'lucide-react';

const ComposerQuickGuide = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('features');

    const features = [
        {
            icon: <Clock className="w-5 h-5" />,
            title: 'Auto-Save',
            description: 'Your drafts are automatically saved every 3 seconds. Never lose your work!',
            tip: 'Drafts are restored when you return to the composer.'
        },
        {
            icon: <Calendar className="w-5 h-5" />,
            title: 'Schedule Emails',
            description: 'Click the Schedule button to send emails at a specific date and time.',
            tip: 'Perfect for sending emails across time zones or during business hours.'
        },
        {
            icon: <Zap className="w-5 h-5" />,
            title: 'Quick Templates',
            description: 'Use pre-built templates for greetings, closings, and common phrases.',
            tip: 'Templates are inserted at your cursor position.'
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: 'Tone Selector',
            description: 'Adjust your email tone to be formal, casual, or professional.',
            tip: 'Write your message first, then apply the tone for best results.'
        },
        {
            icon: <Users className="w-5 h-5" />,
            title: 'CC/BCC Toggle',
            description: 'Show or hide CC and BCC fields to keep your interface clean.',
            tip: 'Click the eye icons next to the To field to toggle visibility.'
        },
        {
            icon: <FileText className="w-5 h-5" />,
            title: 'Word Counter',
            description: 'Track your email length with real-time word and character counts.',
            tip: 'Keep emails concise - aim for 50-125 words for best response rates.'
        }
    ];

    const shortcuts = [
        { key: 'Ctrl + Enter', action: 'Send email' },
        { key: 'Ctrl + S', action: 'Save draft' },
        { key: 'Esc', action: 'Cancel/Close' },
        { key: 'Tab', action: 'Navigate fields' }
    ];

    const tips = [
        'Use priority levels to help recipients understand urgency',
        'Validate email addresses before sending to avoid bounces',
        'Schedule emails for optimal send times (Tuesday-Thursday, 10 AM)',
        'Keep subject lines under 50 characters for better open rates',
        'Use templates to maintain consistent professional communication',
        'Apply tone selector after writing for natural-sounding adjustments',
        'Save drafts frequently when working on important emails',
        'Use BCC for mass emails to protect recipient privacy'
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <HelpCircle className="w-8 h-8" />
                            <div>
                                <h2 className="text-2xl font-bold">Email Composer Guide</h2>
                                <p className="text-blue-100 text-sm">Quick tips and features</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('features')}
                            className={`flex-1 px-6 py-3 font-medium transition-colors ${activeTab === 'features'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Features
                        </button>
                        <button
                            onClick={() => setActiveTab('shortcuts')}
                            className={`flex-1 px-6 py-3 font-medium transition-colors ${activeTab === 'shortcuts'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Shortcuts
                        </button>
                        <button
                            onClick={() => setActiveTab('tips')}
                            className={`flex-1 px-6 py-3 font-medium transition-colors ${activeTab === 'tips'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Best Practices
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {activeTab === 'features' && (
                        <div className="space-y-4">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                            {feature.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">
                                                {feature.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {feature.description}
                                            </p>
                                            <div className="flex items-start space-x-2">
                                                <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5" />
                                                <p className="text-xs text-gray-500 italic">
                                                    {feature.tip}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'shortcuts' && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 mb-4">
                                Use these keyboard shortcuts to compose emails faster:
                            </p>
                            {shortcuts.map((shortcut, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <span className="text-gray-900">{shortcut.action}</span>
                                    <kbd className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                                        {shortcut.key}
                                    </kbd>
                                </div>
                            ))}
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> Some shortcuts may vary based on your operating system.
                                    On Mac, use Cmd instead of Ctrl.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tips' && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 mb-4">
                                Follow these best practices for effective email communication:
                            </p>
                            {tips.map((tip, index) => (
                                <div
                                    key={index}
                                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm text-gray-700 flex-1">{tip}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">?</kbd> anytime to open this guide
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComposerQuickGuide;
