// client/src/pages/Inbox.jsx
import React, { useState, useEffect } from 'react';
import { useEmail } from '../context/EmailContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import EmailDetail from '../components/email/EmailDetail';

const Inbox = () => {
    const {
        accounts,
        emails,
        loading,
        error,
        selectedAccount,
        setSelectedAccount,
        fetchAccounts,
        fetchEmails,
        markEmail,
        deleteEmail
    } = useEmail();

    const { user } = useAuth();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedEmail, setSelectedEmail] = useState(null);

    // Load accounts on mount
    useEffect(() => {
        console.log('🔍 Inbox mounted - fetching accounts');
        fetchAccounts();
    }, []);

    // Load emails when account is selected
    useEffect(() => {
        console.log('🔍 Accounts changed or selected:', {
            accountsCount: accounts.length,
            selectedAccount,
            emailsCount: emails.length
        });

        if (selectedAccount && accounts.length > 0) {
            console.log('📥 Fetching emails for account:', selectedAccount);
            fetchEmails(selectedAccount);
        } else if (accounts.length > 0 && !selectedAccount) {
            console.log('🎯 Auto-selecting all accounts');
            setSelectedAccount('all');
        }
    }, [selectedAccount, accounts.length]);

    // Filter emails
    const filteredEmails = emails.filter(email => {
        if (filter === 'unread') return !email.isRead;
        if (filter === 'read') return email.isRead;
        if (filter === 'important') return email.priority === 'high' || email.category === 'urgent';
        return true;
    }).filter(email => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            email.subject?.toLowerCase().includes(searchLower) ||
            email.from?.name?.toLowerCase().includes(searchLower) ||
            email.from?.email?.toLowerCase().includes(searchLower) ||
            email.fromAddress?.toLowerCase().includes(searchLower) ||
            email.bodyText?.toLowerCase().includes(searchLower) ||
            email.body?.text?.toLowerCase().includes(searchLower) ||
            email.body?.toLowerCase().includes(searchLower)
        );
    });

    const handleRefresh = () => {
        if (selectedAccount) {
            fetchEmails(selectedAccount);
            toast.success('Refreshing emails...');
        }
    };

    if (loading && emails.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Loading emails...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
                    <p className="text-gray-600 mt-1">
                        {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
                        {filter !== 'all' && ` (${filter})`}
                    </p>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={handleRefresh}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>

                    <Link
                        to="/compose"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Compose
                    </Link>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Account Selector */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Account
                        </label>
                        <select
                            value={selectedAccount || ''}
                            onChange={(e) => {
                                console.log('Account selected:', e.target.value);
                                setSelectedAccount(e.target.value);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            disabled={accounts.length === 0}
                        >
                            {accounts.length === 0 ? (
                                <option value="">No accounts available</option>
                            ) : (
                                <>
                                    <option value="all">All accounts</option>
                                    {accounts.map((account) => (
                                        <option key={account._id} value={account._id}>
                                            {account.displayName || account.email}
                                            {account.isTest && ' (Demo)'}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                    </div>

                    {/* Filter */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter
                        </label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                            <option value="all">All emails</option>
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                            <option value="important">Important</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search emails..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {accounts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No email accounts yet</h3>
                    <p className="text-gray-500 mb-4">Add your first email account to see your inbox</p>
                    <Link
                        to="/accounts"
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Add Email Account
                    </Link>
                </div>
            ) : !selectedAccount ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an email account</h3>
                    <p className="text-gray-500">Choose an email account from the dropdown above to view emails</p>
                </div>
            ) : filteredEmails.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
                    <p className="text-gray-500">
                        {search ? `No emails match "${search}"` : `No ${filter === 'all' ? '' : filter + ' '}emails in this account`}
                    </p>
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="mt-4 text-blue-600 hover:text-blue-800"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Email List */}
                    <div className="divide-y divide-gray-200">
                        {filteredEmails.map((email) => (
                            <div
                                key={email._id}
                                className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${!email.isRead ? 'bg-blue-50' : ''}`}
                                onClick={() => setSelectedEmail(email)}
                            >
                                <div className="flex items-start">
                                    {/* Sender Avatar */}
                                    <div className="flex-shrink-0 mr-4">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 font-bold">
                                                {email.from?.name?.charAt(0) ||
                                                    email.from?.email?.charAt(0) ||
                                                    email.fromAddress?.charAt(0) ||
                                                    email.from?.charAt(0) ||
                                                    '?'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Email Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <p className={`font-medium truncate ${!email.isRead ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                                                        {email.from?.name || email.from?.email || email.fromAddress || 'Unknown Sender'}
                                                    </p>
                                                    {!email.isRead && (
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                    )}
                                                    {email.priority === 'high' && (
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded">
                                                            Important
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 mt-1">
                                                    {email.subject || '(No Subject)'}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                    {email.bodyText || email.body?.text || email.body || 'No preview available'}
                                                </p>
                                            </div>
                                            <div className="ml-4 flex-shrink-0">
                                                <span className="text-xs text-gray-500">
                                                    {new Date(email.receivedAt || email.createdAt).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Email Actions */}
                                        <div className="mt-3 flex items-center space-x-3">
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    markEmail(email._id, !email.isRead);
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                {email.isRead ? 'Mark unread' : 'Mark read'}
                                            </button>
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    deleteEmail(email._id);
                                                }}
                                                className="text-xs text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedEmail(email);
                                                }}
                                                className="text-xs text-green-600 hover:text-green-800"
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedEmail && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl h-[85vh] overflow-hidden">
                        <EmailDetail
                            email={selectedEmail}
                            onClose={() => setSelectedEmail(null)}
                        />
                    </div>
                </div>
            )}

            {/* Debug Panel (Remove in production) */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <h3 className="font-medium mb-2">📊 Debug Info:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                        <span className="text-gray-500">Accounts:</span>
                        <span className="ml-2 font-medium">{accounts.length}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Emails in state:</span>
                        <span className="ml-2 font-medium">{emails.length}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Filtered:</span>
                        <span className="ml-2 font-medium">{filteredEmails.length}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Selected:</span>
                        <span className="ml-2 font-medium">{selectedAccount ? 'Yes' : 'No'}</span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        console.log('=== DEBUG INFO ===');
                        console.log('Accounts:', accounts);
                        console.log('Selected Account:', selectedAccount);
                        console.log('Emails in state:', emails);
                        console.log('Filtered emails:', filteredEmails);
                        console.log('Filter:', filter);
                        console.log('Search:', search);
                    }}
                    className="mt-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                    Log to Console
                </button>
            </div>
        </div>
    );
};

export default Inbox;
