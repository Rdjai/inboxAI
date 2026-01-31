// client/src/pages/Compose.jsx
import React, { useState, useEffect } from 'react';
import { useEmail } from '../context/EmailContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Compose = () => {
    const { accounts, sendEmail, loading } = useEmail();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        accountId: '',
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: ''
    });

    useEffect(() => {
        // Auto-select first account if available
        if (accounts.length > 0 && !formData.accountId) {
            setFormData(prev => ({ ...prev, accountId: accounts[0]._id }));
        }
    }, [accounts]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.accountId) {
            toast.error('Please select an email account');
            return;
        }

        if (!formData.to.trim()) {
            toast.error('Please enter recipient email address');
            return;
        }

        // Prepare email data
        const emailData = {
            to: formData.to.split(',').map(email => email.trim()).filter(email => email),
            subject: formData.subject || '(No Subject)',
            body: formData.body || '',
            ...(formData.cc && { cc: formData.cc.split(',').map(email => email.trim()).filter(email => email) }),
            ...(formData.bcc && { bcc: formData.bcc.split(',').map(email => email.trim()).filter(email => email) })
        };

        console.log('📤 Sending email:', {
            accountId: formData.accountId,
            to: emailData.to
        });

        try {
            const result = await sendEmail(formData.accountId, emailData);

            if (result.success) {
                toast.success('✅ Email sent successfully!');

                // Show info if it's a test account
                const selectedAccount = accounts.find(acc => acc._id === formData.accountId);
                if (selectedAccount?.isTest) {
                    toast('📝 Test mode: Email saved locally. Configure SMTP for real sends.', {
                        duration: 5000,
                        icon: 'ℹ️'
                    });
                }

                // Navigate to sent folder or back
                setTimeout(() => {
                    navigate('/sent');
                }, 1500);
            } else {
                toast.error(`Failed to send email: ${result.error}`);
            }
        } catch (error) {
            console.error('Send email error:', error);
            toast.error('Failed to send email');
        }
    };

    const handleCancel = () => {
        if (window.confirm('Discard this email?')) {
            navigate(-1);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Compose Email</h1>
                <p className="text-gray-600">Write and send a new email</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                {/* Account Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Account
                    </label>
                    <select
                        value={formData.accountId}
                        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        <option value="">Select an account</option>
                        {accounts.map(account => (
                            <option key={account._id} value={account._id}>
                                {account.displayName || account.email}
                                {account.isTest && ' (Test Mode)'}
                            </option>
                        ))}
                    </select>
                    {formData.accountId && accounts.find(a => a._id === formData.accountId)?.isTest && (
                        <p className="mt-2 text-sm text-yellow-600">
                            ⚠️ Test account - emails are saved locally but not actually sent
                        </p>
                    )}
                </div>

                {/* Recipients */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            To <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.to}
                            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                            placeholder="recipient@example.com"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Separate multiple emails with commas
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CC (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.cc}
                                onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                                placeholder="cc@example.com"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                BCC (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.bcc}
                                onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
                                placeholder="bcc@example.com"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Subject */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                    </label>
                    <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Email subject"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Body */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                    </label>
                    <textarea
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        rows="12"
                        placeholder="Write your message here..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 flex items-center"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send Email
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Development Info */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Development Mode</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>• Emails are saved locally but not actually sent via SMTP</p>
                            <p>• Configure real SMTP credentials in account settings for actual email sending</p>
                            <p>• You can view "sent" emails in the Sent folder</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Compose;