import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { emailAccountsAPI, emailsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const EmailContext = createContext({});

export const useEmail = () => useContext(EmailContext);

export const EmailProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]);
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [error, setError] = useState(null);

    const { isAuthenticated, isLoading: authLoading } = useAuth();

    // Load accounts only when authenticated
    useEffect(() => {
        console.log('📧 EmailProvider useEffect - Auth state:', {
            isAuthenticated,
            authLoading,
            token: localStorage.getItem('token')
        });

        if (isAuthenticated && !authLoading) {
            console.log('🔄 Fetching accounts - user authenticated');
            fetchAccounts();
        } else if (!authLoading) {
            console.log('👤 User not authenticated, clearing email data');
            setAccounts([]);
            setEmails([]);
            setSelectedAccount(null);
            setAccountsLoading(false);
        }
    }, [isAuthenticated, authLoading]);

    const fetchAccounts = useCallback(async () => {
        console.log('📧 fetchAccounts called - isAuthenticated:', isAuthenticated);

        if (!isAuthenticated) {
            console.log('⛔ Skipping fetchAccounts - user not authenticated');
            setAccountsLoading(false);
            return [];
        }

        try {
            setAccountsLoading(true);
            setError(null);
            console.log('📧 Fetching accounts from API...');

            const response = await emailAccountsAPI.getAccounts();
            console.log('📧 Accounts API response:', response);

            let accountsData = [];

            if (response) {
                if (response.success && response.accounts) {
                    accountsData = response.accounts;
                } else if (response.success && response.data) {
                    accountsData = response.data;
                } else if (Array.isArray(response.accounts)) {
                    accountsData = response.accounts;
                } else if (Array.isArray(response.data)) {
                    accountsData = response.data;
                } else if (Array.isArray(response)) {
                    accountsData = response;
                } else if (response.account) {
                    accountsData = [response.account];
                }
            }

            console.log('📧 Processed accounts data:', accountsData);
            setAccounts(accountsData);

            // Auto-select first account if none selected and we have accounts
            if (accountsData.length > 0 && !selectedAccount) {
                setSelectedAccount(accountsData[0]._id);
            }

            return accountsData;

        } catch (error) {
            console.error('❌ Failed to fetch accounts:', error);
            setError(error.message || 'Failed to load email accounts');

            // Only show error if it's not a 401 (unauthorized)
            if (error.status !== 401 && error.message !== 'Please authenticate') {
                if (typeof toast !== 'undefined' && toast.error) {
                    toast.error('Failed to load email accounts');
                }
            }

            return [];

        } finally {
            setAccountsLoading(false);
        }
    }, [isAuthenticated, selectedAccount]);

    const addAccount = async (accountData) => {
        console.log('📤 addAccount called with:', accountData);

        if (!isAuthenticated) {
            const errorMsg = 'Please login to add email accounts';
            if (typeof toast !== 'undefined' && toast.error) {
                toast.error(`❌ ${errorMsg}`);
            }
            return {
                success: false,
                error: errorMsg
            };
        }

        try {
            setLoading(true);
            console.log('📤 Adding account to API:', accountData);

            const response = await emailAccountsAPI.createAccount(accountData);
            console.log('📤 Add account API response:', response);

            let newAccount;

            // Handle different response formats
            if (response.account) {
                newAccount = response.account;
            } else if (response.data) {
                newAccount = response.data;
            } else if (response.success && response.account) {
                newAccount = response.account;
            } else {
                // Fallback mock account for development
                newAccount = {
                    _id: Date.now().toString(),
                    ...accountData,
                    isActive: true,
                    unreadCount: 0,
                    lastSynced: new Date().toISOString()
                };
            }

            console.log('📤 New account created:', newAccount);

            // Update state
            setAccounts(prev => [...prev, newAccount]);
            setSelectedAccount(newAccount._id);

            if (typeof toast !== 'undefined' && toast.success) {
                toast.success('✅ Email account added successfully!');
            }

            return {
                success: true,
                data: newAccount,
                message: 'Account added successfully'
            };

        } catch (error) {
            console.error('❌ Add account error:', error);
            const errorMsg = error.message || 'Failed to add account';
            if (typeof toast !== 'undefined' && toast.error) {
                toast.error(`❌ ${errorMsg}`);
            }
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoading(false);
        }
    };

    const deleteAccount = async (accountId) => {
        console.log('🗑️ deleteAccount called for:', accountId);

        if (!isAuthenticated) {
            const errorMsg = 'Please login to delete accounts';
            if (typeof toast !== 'undefined' && toast.error) {
                toast.error(`❌ ${errorMsg}`);
            }
            return { success: false, error: errorMsg };
        }

        try {
            console.log('🗑️ Deleting account via API:', accountId);

            await emailAccountsAPI.deleteAccount(accountId);

            // Update local state
            setAccounts(prev => prev.filter(account => account._id !== accountId));

            // Update selected account if needed
            if (selectedAccount === accountId) {
                const remainingAccounts = accounts.filter(acc => acc._id !== accountId);
                if (remainingAccounts.length > 0) {
                    setSelectedAccount(remainingAccounts[0]._id);
                } else {
                    setSelectedAccount(null);
                }
            }

            if (typeof toast !== 'undefined' && toast.success) {
                toast.success('✅ Account deleted successfully!');
            }

            return { success: true };

        } catch (error) {
            console.error('❌ Delete account error:', error);
            const errorMsg = error.message || 'Failed to delete account';

            if (typeof toast !== 'undefined' && toast.error) {
                toast.error(`❌ ${errorMsg}`);
            }

            return {
                success: false,
                error: errorMsg
            };
        }
    };

    const syncAccount = async (accountId, limit = 50) => {
        if (!isAuthenticated) {
            if (typeof toast !== 'undefined' && toast.error) {
                toast.error('Please login to sync emails');
            }
            return { success: false, error: 'Not authenticated' };
        }

        try {
            setLoading(true);
            await emailAccountsAPI.syncAccount(accountId, limit);
            if (typeof toast !== 'undefined' && toast.success) {
                toast.success('✅ Emails synced successfully!');
            }
            return { success: true };
        } catch (error) {
            console.error('❌ Sync error:', error);
            const errorMsg = error.message || 'Failed to sync emails';
            if (typeof toast !== 'undefined' && toast.error) {
                toast.error(errorMsg);
            }
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    const fetchEmails = async (accountId, params = {}) => {
    if (!isAuthenticated) {
        console.log('??? Skipping fetchEmails - not authenticated');
        return [];
    }

    try {
        setLoading(true);
        console.log('???? fetchEmails called for account:', accountId, 'params:', params);

        const response = accountId === 'all'
            ? await emailsAPI.getAllEmails(params)
            : await emailsAPI.getEmails(accountId, params);

        const emailsData = response.emails || response.data || response || [];

        console.log('???? Emails fetched:', Array.isArray(emailsData) ? emailsData.length : 0);
        setEmails(Array.isArray(emailsData) ? emailsData : []);

        return Array.isArray(emailsData) ? emailsData : [];

    } catch (error) {
        console.error('??? fetchEmails error:', error);
        if (typeof toast !== 'undefined' && toast.error) {
            toast.error('Failed to load emails');
        }
        return [];
    } finally {
        setLoading(false);
    }
};

    const sendEmail = async (accountId, emailData) => {
        if (!isAuthenticated) {
            const errorMsg = 'Please login to send emails';
            if (typeof toast !== 'undefined' && toast.error) {
                toast.error(`❌ ${errorMsg}`);
            }
            return {
                success: false,
                error: errorMsg
            };
        }

        console.log('📤 Sending email (mock):', { accountId, emailData });

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (typeof toast !== 'undefined' && toast.success) {
            toast.success('✅ Email sent successfully (development mode)');
        }

        return {
            success: true,
            data: {
                messageId: `dev-${Date.now()}`,
                preview: `To: ${emailData.to}, Subject: ${emailData.subject}`
            }
        };
    };

    const markEmail = async (emailId, read = true) => {
        if (!isAuthenticated) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            console.log('📌 Marking email:', emailId, 'as read:', read);

            if (read) {
                await emailsAPI.markAsRead(emailId);
            } else {
                await emailsAPI.markAsUnread(emailId);
            }

            // Update local state
            setEmails(prev => prev.map(email =>
                email._id === emailId ? { ...email, isRead: read } : email
            ));

            return { success: true };

        } catch (error) {
            console.error('❌ Mark email error:', error);
            const errorMsg = error.message || 'Failed to update email';
            if (typeof toast !== 'undefined' && toast.error) {
                toast.error(errorMsg);
            }
            return { success: false, error: errorMsg };
        }
    };

    const deleteEmail = async (emailId) => {
        if (!isAuthenticated) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            console.log('🗑️ Deleting email:', emailId);

            await emailsAPI.deleteEmail(emailId);

            // Update local state
            setEmails(prev => prev.filter(email => email._id !== emailId));

            if (typeof toast !== 'undefined' && toast.success) {
                toast.success('✅ Email deleted successfully!');
            }
            return { success: true };

        } catch (error) {
            console.error('❌ Delete email error:', error);
            const errorMsg = error.message || 'Failed to delete email';
            if (typeof toast !== 'undefined' && toast.error) {
                toast.error(errorMsg);
            }
            return { success: false, error: errorMsg };
        }
    };

    const value = {
        accounts,
        emails,
        loading: loading || accountsLoading,
        accountsLoading,
        error,
        selectedAccount,
        setSelectedAccount,
        fetchAccounts,
        addAccount,
        deleteAccount,
        syncAccount,
        fetchEmails,
        sendEmail,
        markEmail,
        deleteEmail,
        refreshAccounts: fetchAccounts,
        isAuthenticated,
    };

    console.log('📧 EmailProvider value:', {
        accountsCount: accounts.length,
        loading: loading || accountsLoading,
        selectedAccount,
        isAuthenticated
    });

    return (
        <EmailContext.Provider value={value}>
            {children}
        </EmailContext.Provider>
    );
};