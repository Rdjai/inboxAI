// client/src/pages/EmailAccounts.jsx
import React, { useState, useEffect } from 'react';
import { useEmail } from '../context/EmailContext';
import AddAccountModal from '../components/email/AddAccountModal';
import toast from 'react-hot-toast';

const EmailAccounts = () => {
    const { accounts, loading, error, fetchAccounts, addAccount, deleteAccount } = useEmail();
    const [showAddModal, setShowAddModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Load accounts on component mount
    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleAddAccount = async (accountData) => {
        try {
            const result = await addAccount(accountData);
            if (result.success) {
                // Success is already handled in context
                setShowAddModal(false);
                // Optionally refresh the list
                await fetchAccounts();
            }
        } catch (error) {
            console.error('Failed to add account:', error);
        }
    };

    const handleDelete = async (accountId) => {
        if (!window.confirm('Are you sure you want to delete this email account?')) {
            return;
        }

        try {
            await deleteAccount(accountId);
            // State is already updated in context
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchAccounts();
            toast.success('Accounts refreshed!');
        } catch (error) {
            console.error('Failed to refresh:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    if (loading && accounts.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Email Accounts</h1>
                    <p className="text-gray-600 mt-1">
                        Manage your connected email accounts
                    </p>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center"
                    >
                        {isRefreshing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Email Account
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Add Account Modal */}
            {showAddModal && (
                <AddAccountModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={(accountData) => handleAddAccount(accountData)}
                />
            )}

            {/* Accounts List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                {accounts.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No email accounts yet</h3>
                        <p className="text-gray-500 mb-4">Add your first email account to get started</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Add Email Account
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Your Email Accounts ({accounts.length})
                            </h2>
                            <div className="text-sm text-gray-500">
                                Showing all accounts
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {accounts.map((account) => (
                                <div key={account._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                                                <span className="text-blue-600 font-bold text-xl">
                                                    {account.email?.charAt(0).toUpperCase() || '@'}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    {account.displayName || account.email}
                                                </h3>
                                                <p className="text-sm text-gray-500">{account.email}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${account.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {account.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <div className="flex justify-between">
                                            <span>Provider:</span>
                                            <span className="font-medium capitalize">{account.provider || 'custom'}</span>
                                        </div>
                                        {account.unreadCount !== undefined && (
                                            <div className="flex justify-between">
                                                <span>Unread:</span>
                                                <span className="font-medium">{account.unreadCount} emails</span>
                                            </div>
                                        )}
                                        {account.lastSynced && (
                                            <div className="flex justify-between">
                                                <span>Last Synced:</span>
                                                <span className="font-medium">
                                                    {new Date(account.lastSynced).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex space-x-2">
                                        <button className="flex-1 bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100 text-sm font-medium">
                                            View Emails
                                        </button>
                                        <button
                                            onClick={() => handleDelete(account._id)}
                                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Debug Info (Remove in production) */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <h3 className="font-medium mb-2">Debug Information:</h3>
                <p>Accounts in state: {accounts.length}</p>
                <p>Loading: {loading.toString()}</p>
                <p>Error: {error || 'None'}</p>
                <button
                    onClick={() => console.log('Accounts state:', accounts)}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                >
                    Log State to Console
                </button>
            </div>
        </div>
    );
};

export default EmailAccounts;