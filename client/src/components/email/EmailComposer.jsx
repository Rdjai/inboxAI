import React, { useState, useEffect } from 'react';
import { emailAccountsAPI, emailsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EmailComposer = ({ onSend, onCancel }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        accountId: '',
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
        attachments: []
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await emailAccountsAPI.getAccounts();
            setAccounts(response.accounts || []);
            if (response.accounts?.length > 0) {
                setFormData(prev => ({ ...prev, accountId: response.accounts[0]._id }));
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

        setLoading(true);
        try {
            const data = {
                to: formData.to.split(',').map(email => email.trim()),
                subject: formData.subject,
                body: formData.body,
                ...(formData.cc && { cc: formData.cc.split(',').map(email => email.trim()) }),
                ...(formData.bcc && { bcc: formData.bcc.split(',').map(email => email.trim()) }),
                ...(formData.attachments.length > 0 && { attachments: formData.attachments })
            };

            await emailsAPI.sendEmail(formData.accountId, data);
            toast.success('Email sent successfully!');

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
                attachments: []
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

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Compose Email</h2>

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            To *
                        </label>
                        <input
                            type="text"
                            placeholder="email@example.com, another@example.com"
                            value={formData.to}
                            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
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
                </div>

                {/* Subject */}
                <div>
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

                {/* Body */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                    </label>
                    <textarea
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        rows="10"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <div className="flex justify-end space-x-3 pt-4 border-t">
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
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 flex items-center"
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
                                Send Email
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmailComposer;