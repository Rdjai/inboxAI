import React, { useState, useEffect, useRef } from 'react';
import { emailAccountsAPI, emailsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import ToneSelector from './ToneSelector';
import { adjustTone } from '../../utils/toneAdjuster';
import ComposerQuickGuide from './ComposerQuickGuide';
import {
    Save,
    Clock,
    Sparkles,
    Eye,
    EyeOff,
    Users,
    Calendar,
    Zap,
    FileText,
    Smile,
    HelpCircle
} from 'lucide-react';

const EmailComposer = ({ onSend, onCancel, initialData = {} }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTone, setSelectedTone] = useState('professional');
    const [isApplyingTone, setIsApplyingTone] = useState(false);
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [savingDraft, setSavingDraft] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const autoSaveTimerRef = useRef(null);
    const textareaRef = useRef(null);

    const [formData, setFormData] = useState({
        accountId: initialData.accountId || '',
        to: initialData.to || '',
        cc: initialData.cc || '',
        bcc: initialData.bcc || '',
        subject: initialData.subject || '',
        body: initialData.body || '',
        attachments: initialData.attachments || [],
        scheduledTime: null,
        priority: 'normal'
    });

    useEffect(() => {
        fetchAccounts();

        // Load draft from localStorage
        const savedDraft = localStorage.getItem('emailDraft');
        if (savedDraft && !initialData.body) {
            try {
                const draft = JSON.parse(savedDraft);
                if (draft.timestamp && Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
                    setFormData(prev => ({ ...prev, ...draft.data }));
                    toast.success('Draft restored from previous session');
                }
            } catch (error) {
                console.error('Failed to restore draft:', error);
            }
        }

        // Keyboard shortcuts
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + Enter to send
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                document.querySelector('button[type="submit"]')?.click();
            }
            // Ctrl/Cmd + S to save draft
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSaveDraft();
            }
            // Escape to cancel
            if (e.key === 'Escape' && onCancel) {
                e.preventDefault();
                onCancel();
            }
            // ? to show guide
            if (e.key === '?' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                setShowGuide(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Update word and character count
    useEffect(() => {
        const text = formData.body;
        setCharCount(text.length);
        setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    }, [formData.body]);

    // Auto-save draft
    useEffect(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        if (formData.body || formData.subject || formData.to) {
            autoSaveTimerRef.current = setTimeout(() => {
                saveDraftToLocal();
            }, 3000); // Auto-save after 3 seconds of inactivity
        }
    }, [formData]);

    const fetchAccounts = async () => {
        try {
            const response = await emailAccountsAPI.getAccounts();
            const data = response?.data || response;
            const accountsData = data?.data || data?.accounts || data || [];
            setAccounts(accountsData);
            if (accountsData.length > 0) {
                setFormData(prev => ({ ...prev, accountId: accountsData[0]._id }));
            }
        } catch (error) {
            toast.error('Failed to load email accounts');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.accountId) {
            toast.error('Please select an email account');
            return;
        }

        if (!formData.to) {
            toast.error('Please enter recipient email');
            return;
        }

        if (!validateRecipients()) {
            return;
        }

        if (!formData.subject.trim()) {
            const confirm = window.confirm('Send email without a subject?');
            if (!confirm) return;
        }

        setLoading(true);
        try {
            const selectedAccount = accounts.find(acc => acc._id === formData.accountId);

            const payload = {
                fromAddress: selectedAccount?.email || selectedAccount?.address || selectedAccount?.fromAddress,
                toAddress: formData.to,
                subject: formData.subject || '(No Subject)',
                bodyText: formData.body,
                cc: formData.cc,
                bcc: formData.bcc,
                priority: formData.priority,
                scheduledTime: formData.scheduledTime
            };

            await emailsAPI.createEmail(payload);

            if (formData.scheduledTime) {
                toast.success('Email scheduled successfully!');
            } else {
                toast.success('Email sent successfully!');
            }

            // Clear draft from localStorage
            localStorage.removeItem('emailDraft');

            if (onSend) {
                onSend();
            }

            // Reset form
            setFormData({
                accountId: accounts[0]?._id || '',
                to: '',
                cc: '',
                bcc: '',
                subject: '',
                body: '',
                attachments: [],
                scheduledTime: null,
                priority: 'normal'
            });
        } catch (error) {
            toast.error(error.message || 'Failed to send email');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const newAttachments = files.map(file => ({
            filename: file.name,
            contentType: file.type,
            size: file.size,
            content: file
        }));
        setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...newAttachments]
        }));
    };

    const removeAttachment = (index) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const handleApplyTone = () => {
        if (!formData.body.trim()) {
            toast.error('Please write your message first');
            return;
        }

        setIsApplyingTone(true);
        try {
            const adjustedBody = adjustTone(formData.body, selectedTone);
            setFormData(prev => ({ ...prev, body: adjustedBody }));
            toast.success(`${selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1)} tone applied!`);
        } catch (error) {
            toast.error('Failed to apply tone');
        } finally {
            setIsApplyingTone(false);
        }
    };

    const saveDraftToLocal = () => {
        try {
            const draft = {
                data: formData,
                timestamp: Date.now()
            };
            localStorage.setItem('emailDraft', JSON.stringify(draft));
            setLastSaved(new Date());
        } catch (error) {
            console.error('Failed to save draft:', error);
        }
    };

    const handleSaveDraft = async () => {
        setSavingDraft(true);
        try {
            saveDraftToLocal();
            toast.success('Draft saved successfully!');
        } catch (error) {
            toast.error('Failed to save draft');
        } finally {
            setSavingDraft(false);
        }
    };

    const clearDraft = () => {
        localStorage.removeItem('emailDraft');
        setFormData({
            accountId: accounts[0]?._id || '',
            to: '',
            cc: '',
            bcc: '',
            subject: '',
            body: '',
            attachments: [],
            scheduledTime: null,
            priority: 'normal'
        });
        toast.success('Draft cleared');
    };

    const insertTemplate = (template) => {
        const templates = {
            greeting: 'Dear [Name],\n\nI hope this email finds you well.\n\n',
            closing: '\n\nBest regards,\n[Your Name]',
            followup: 'I wanted to follow up on my previous email regarding [subject]. ',
            meeting: 'I would like to schedule a meeting to discuss [topic]. Please let me know your availability.',
            thankyou: 'Thank you for your time and consideration. I look forward to hearing from you soon.'
        };

        const cursorPos = textareaRef.current?.selectionStart || formData.body.length;
        const newBody =
            formData.body.substring(0, cursorPos) +
            templates[template] +
            formData.body.substring(cursorPos);

        setFormData(prev => ({ ...prev, body: newBody }));
        toast.success('Template inserted');
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateRecipients = () => {
        const recipients = formData.to.split(',').map(e => e.trim()).filter(Boolean);
        const invalidEmails = recipients.filter(email => !validateEmail(email));

        if (invalidEmails.length > 0) {
            toast.error(`Invalid email(s): ${invalidEmails.join(', ')}`);
            return false;
        }
        return true;
    };

    return (
        <>
            {showGuide && <ComposerQuickGuide onClose={() => setShowGuide(false)} />}

            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Compose Email</h2>
                    <div className="flex items-center space-x-3">
                        {lastSaved && (
                            <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                Saved {lastSaved.toLocaleTimeString()}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowGuide(true)}
                            className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            title="Show help guide (Press ?)"
                        >
                            <HelpCircle className="w-4 h-4 mr-1" />
                            Help
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={savingDraft}
                            className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            title="Save draft (Ctrl+S)"
                        >
                            <Save className="w-4 h-4 mr-1" />
                            {savingDraft ? 'Saving...' : 'Save Draft'}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Account Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Account
                        </label>
                        <select
                            value={formData.accountId}
                            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Select an account</option>
                            {accounts.map(account => (
                                <option key={account._id} value={account._id}>
                                    {account.displayName || account.email} ({account.provider})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Recipients */}
                    <div className="space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    To *
                                </label>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCc(!showCc)}
                                        className="text-xs text-blue-600 hover:text-blue-700"
                                    >
                                        {showCc ? <EyeOff className="w-3 h-3 inline mr-1" /> : <Eye className="w-3 h-3 inline mr-1" />}
                                        Cc
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowBcc(!showBcc)}
                                        className="text-xs text-blue-600 hover:text-blue-700"
                                    >
                                        {showBcc ? <EyeOff className="w-3 h-3 inline mr-1" /> : <Eye className="w-3 h-3 inline mr-1" />}
                                        Bcc
                                    </button>
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder="email@example.com, another@example.com"
                                value={formData.to}
                                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
                        </div>

                        {showCc && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CC
                                </label>
                                <input
                                    type="text"
                                    placeholder="cc@example.com"
                                    value={formData.cc}
                                    onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        )}

                        {showBcc && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    BCC
                                </label>
                                <input
                                    type="text"
                                    placeholder="bcc@example.com"
                                    value={formData.bcc}
                                    onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Subject and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subject
                            </label>
                            <input
                                type="text"
                                placeholder="Email subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Quick Templates */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quick Templates
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => insertTemplate('greeting')}
                                className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center"
                            >
                                <Smile className="w-3 h-3 mr-1" />
                                Greeting
                            </button>
                            <button
                                type="button"
                                onClick={() => insertTemplate('closing')}
                                className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center"
                            >
                                <FileText className="w-3 h-3 mr-1" />
                                Closing
                            </button>
                            <button
                                type="button"
                                onClick={() => insertTemplate('followup')}
                                className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center"
                            >
                                <Zap className="w-3 h-3 mr-1" />
                                Follow-up
                            </button>
                            <button
                                type="button"
                                onClick={() => insertTemplate('meeting')}
                                className="px-3 py-1 text-xs bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 flex items-center"
                            >
                                <Calendar className="w-3 h-3 mr-1" />
                                Meeting Request
                            </button>
                            <button
                                type="button"
                                onClick={() => insertTemplate('thankyou')}
                                className="px-3 py-1 text-xs bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 flex items-center"
                            >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Thank You
                            </button>
                        </div>
                    </div>

                    {/* Tone Selector */}
                    <ToneSelector
                        selectedTone={selectedTone}
                        onToneChange={setSelectedTone}
                        onApplyTone={handleApplyTone}
                        isApplying={isApplyingTone}
                    />

                    {/* Body */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Message
                            </label>
                            <div className="text-xs text-gray-500">
                                {wordCount} words • {charCount} characters
                            </div>
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={formData.body}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                            rows="12"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                            placeholder="Type your message here..."
                        />
                    </div>

                    {/* Attachments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Attachments
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center justify-center p-4"
                            >
                                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span className="text-sm text-gray-600">
                                    Click to upload files or drag and drop
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    Max file size: 10MB
                                </span>
                            </label>
                        </div>

                        {formData.attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {formData.attachments.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="text-sm">{file.filename}</span>
                                            <span className="text-xs text-gray-500">
                                                ({(file.size / 1024).toFixed(2)} KB)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t">
                        <div className="flex space-x-2">
                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={clearDraft}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                disabled={loading}
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSchedule(!showSchedule)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                                disabled={loading}
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 flex items-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    {formData.scheduledTime ? 'Schedule Email' : 'Send Email'}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Schedule Section */}
                    {showSchedule && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Schedule Send Time
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.scheduledTime || ''}
                                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {formData.scheduledTime && (
                                <p className="text-xs text-gray-600 mt-2">
                                    Email will be sent on {new Date(formData.scheduledTime).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </form>
            </div>
            );
};

            export default EmailComposer;
