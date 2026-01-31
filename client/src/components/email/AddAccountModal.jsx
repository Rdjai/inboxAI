import React, { useState } from 'react';
import { useEmail } from '../../context/EmailContext';
import toast from 'react-hot-toast';

const AddAccountModal = ({ onClose, onSuccess }) => {
    const { addAccount } = useEmail();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        displayName: '',
        provider: 'gmail',
        smtpHost: '',
        smtpPort: '',
        smtpUsername: '',
        smtpPassword: '',
        useSSL: true,
    });

    const providerConfigs = {
        gmail: {
            smtpHost: 'smtp.gmail.com',
            smtpPort: '587',
            imapHost: 'imap.gmail.com',
            imapPort: '993',
            useSSL: true,
            instructions: 'For Gmail, you need to generate an App Password if you have 2FA enabled.'
        },
        outlook: {
            smtpHost: 'smtp.office365.com',
            smtpPort: '587',
            imapHost: 'outlook.office365.com',
            imapPort: '993',
            useSSL: true,
            instructions: 'Use your Microsoft account password.'
        },
        yahoo: {
            smtpHost: 'smtp.mail.yahoo.com',
            smtpPort: '465',
            imapHost: 'imap.mail.yahoo.com',
            imapPort: '993',
            useSSL: true,
            instructions: 'You may need to generate an App Password in Yahoo account settings.'
        },
        custom: {
            smtpHost: '',
            smtpPort: '',
            imapHost: '',
            imapPort: '',
            useSSL: true,
            instructions: 'Enter your custom email server details.'
        }
    };

    const handleProviderChange = (provider) => {
        setFormData({
            ...formData,
            provider,
            ...providerConfigs[provider]
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const accountData = {
                ...formData,
                smtpPort: parseInt(formData.smtpPort),
                displayName: formData.displayName || formData.email.split('@')[0],
                smtpHost: 'smtp.example.com',
                smtpUsername: 'test@example.com',
                smtpPassword: 'testpassword',
                useSSL: true,
                isTest: true
            };

            const result = await addAccount(accountData);
            if (result.success) {
                toast.success('Demo email account added successfully!');
                onSuccess?.();
            }
        } catch (error) {
            console.error('Add account error:', error);
            toast.error('Failed to add account');
        } finally {
            setLoading(false);
        }
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     setLoading(true);

    //     try {
    //         const accountData = {
    //             ...formData,
    //             smtpPort: parseInt(formData.smtpPort),
    //             displayName: formData.displayName || formData.email.split('@')[0],
    //             imapHost: formData.imapHost || providerConfigs[formData.provider].imapHost,
    //             imapPort: formData.imapPort || providerConfigs[formData.provider].imapPort,
    //         };

    //         const result = await addAccount(accountData);
    //         if (result.success) {
    //             toast.success('Email account added successfully!');
    //             onSuccess?.();
    //         }
    //     } catch (error) {
    //         console.error('Add account error:', error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Add Email Account</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Step 1: Provider Selection */}
                        {step === 1 && (
                            <>
                                <h3 className="font-medium text-gray-900 mb-4">Select Email Provider</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {['gmail', 'outlook', 'yahoo', 'custom'].map((provider) => (
                                        <button
                                            key={provider}
                                            type="button"
                                            onClick={() => {
                                                handleProviderChange(provider);
                                                setStep(2);
                                            }}
                                            className={`p-4 rounded-lg border-2 text-left transition-all ${formData.provider === provider
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="font-medium capitalize mb-1">{provider}</div>
                                            <div className="text-xs text-gray-500">
                                                {provider === 'gmail' && 'Google Mail'}
                                                {provider === 'outlook' && 'Microsoft Outlook'}
                                                {provider === 'yahoo' && 'Yahoo Mail'}
                                                {provider === 'custom' && 'Custom IMAP/SMTP'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Step 2: Account Details */}
                        {step === 2 && (
                            <>
                                <div className="flex items-center space-x-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        ← Back
                                    </button>
                                    <span className="text-gray-500">Step 2 of 2</span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                            placeholder="your@email.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Display Name (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                            placeholder="Your Name"
                                        />
                                    </div>

                                    {formData.provider === 'custom' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    SMTP Host
                                                </label>
                                                <input
                                                    type="text"
                                                    required={formData.provider === 'custom'}
                                                    value={formData.smtpHost}
                                                    onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                                    placeholder="smtp.yourdomain.com"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    SMTP Port
                                                </label>
                                                <input
                                                    type="number"
                                                    required={formData.provider === 'custom'}
                                                    value={formData.smtpPort}
                                                    onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                                    placeholder="587"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.smtpUsername}
                                            onChange={(e) => setFormData({ ...formData, smtpUsername: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                            placeholder={formData.provider === 'gmail' ? 'your@gmail.com' : 'Your username'}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password / App Password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={formData.smtpPassword}
                                            onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                            placeholder="••••••••"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {providerConfigs[formData.provider].instructions}
                                        </p>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="useSSL"
                                            checked={formData.useSSL}
                                            onChange={(e) => setFormData({ ...formData, useSSL: e.target.checked })}
                                            className="rounded"
                                        />
                                        <label htmlFor="useSSL" className="ml-2 text-sm text-gray-700">
                                            Use SSL/TLS
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Account'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddAccountModal;