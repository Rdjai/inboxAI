import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { emailAccountsAPI, emailsAPI, disconnectSocket, subscribeSocketEvent } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Create context
const EmailContext = createContext(null);

// Custom hook - must be exported separately
export const useEmail = () => {
    const context = useContext(EmailContext);
    if (!context) {
        throw new Error('useEmail must be used within EmailProvider');
    }
    return context;
};

// Provider component - must be exported separately
export const EmailProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]);
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [error, setError] = useState(null);
    
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const extractData = (response) => {
        if (!response) return null;
        if (response.data) return response.data;
        if (response.success && response.data) return response.data;
        return response;
    };

    const normalizeEmail = (email) => {
        if (!email) return email;

        const fromAddress = email.fromAddress || email.from?.email || email.from;
        const toAddress = email.toAddress || email.to?.email || email.to;
        const bodyText = email.bodyText || email.body?.text || email.body;
        const draftText = email.draftText || email.draft;
        const priority = email.priority ? String(email.priority).toLowerCase() : 'low';
        const status = email.status ? String(email.status).toLowerCase() : email.state;

        const isRead = email.isRead ?? email.read ?? (email.status ? String(email.status).toLowerCase() !== 'new' : false);

        return {
            ...email,
            fromAddress,
            toAddress,
            bodyText,
            draftText,
            status,
            priority,
            from: email.from || fromAddress,
            to: email.to || toAddress,
            body: email.body || bodyText,
            draft: email.draft || draftText,
            receivedAt: email.receivedAt || email.createdAt,
            isRead,
        };
    };

    // Load accounts only when authenticated
    useEffect(() => {
        console.log('📧 [EmailProvider] Auth state changed:', {
            isAuthenticated,
            authLoading,
            token: localStorage.getItem('token') ? 'exists' : 'missing'
        });
        
        if (isAuthenticated && !authLoading) {
            console.log('🔄 [EmailProvider] Fetching accounts...');
            fetchAccounts();
        } else if (!authLoading) {
            console.log('👤 [EmailProvider] User not authenticated, clearing data');
            disconnectSocket();
            setAccounts([]);
            setEmails([]);
            setSelectedAccount(null);
            setAccountsLoading(false);
        }
    }, [isAuthenticated, authLoading]);

    useEffect(() => {
        if (!isAuthenticated || authLoading) {
            return;
        }

        const handleEmailUpdated = (payload) => {
            const updatedEmail = normalizeEmail(payload?.email || payload);
            if (!updatedEmail?._id) return;

            setEmails(prev => {
                const index = prev.findIndex(e => e._id === updatedEmail._id);
                if (index === -1) return [updatedEmail, ...prev];
                const next = [...prev];
                next[index] = { ...prev[index], ...updatedEmail };
                return next;
            });
        };

        return subscribeSocketEvent('email:updated', handleEmailUpdated, localStorage.getItem('token'));
    }, [isAuthenticated, authLoading]);

    const fetchAccounts = useCallback(async () => {
        console.log('📧 [fetchAccounts] Called, isAuthenticated:', isAuthenticated);
        
        if (!isAuthenticated) {
            console.log('⛔ [fetchAccounts] User not authenticated, skipping');
            setAccountsLoading(false);
            return [];
        }

        try {
            setAccountsLoading(true);
            setError(null);
            
            console.log('📧 [fetchAccounts] Calling API...');
            const response = await emailAccountsAPI.getAccounts();
            console.log('📧 [fetchAccounts] API response:', response);

            let accountsData = [];
            const data = extractData(response);
            if (Array.isArray(data)) {
                accountsData = data;
            } else if (data?.accounts) {
                accountsData = data.accounts;
            } else if (data?.data && Array.isArray(data.data)) {
                accountsData = data.data;
            }

            console.log('✅ [fetchAccounts] Processed accounts:', accountsData.length);
            setAccounts(accountsData);

            // Auto-select first account
            if (accountsData.length > 0 && !selectedAccount) {
                setSelectedAccount(accountsData[0]._id);
            }

            return accountsData;

        } catch (error) {
            console.error('❌ [fetchAccounts] Error:', error);
            setError(error.message || 'Failed to load email accounts');
            
            // Only show error if it's not a 401
            if (error.status !== 401) {
                toast.error('Failed to load email accounts');
            }
            
            return [];

        } finally {
            setAccountsLoading(false);
        }
    }, [isAuthenticated, selectedAccount]);

    const addAccount = async (accountData) => {
        console.log('📤 [addAccount] Starting with data:', accountData);
        console.log('📤 [addAccount] Current token:', localStorage.getItem('token') ? 'exists' : 'missing');
        console.log('📤 [addAccount] isAuthenticated:', isAuthenticated);
        
        if (!isAuthenticated) {
            const errorMsg = 'Please login to add email accounts';
            toast.error(`❌ ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        }

        try {
            setLoading(true);
            console.log('📤 [addAccount] Calling createAccount API...');
            
            const response = await emailAccountsAPI.createAccount(accountData);
            console.log('📤 [addAccount] API response:', response);

            let newAccount;
            const data = extractData(response);
            if (data?.account) {
                newAccount = data.account;
            } else if (data) {
                newAccount = data;
            } else {
                // Fallback for development
                newAccount = {
                    _id: Date.now().toString(),
                    ...accountData,
                    isActive: true,
                    unreadCount: 0,
                    lastSynced: new Date().toISOString()
                };
            }

            console.log('✅ [addAccount] New account:', newAccount);

            // Update state
            setAccounts(prev => [...prev, newAccount]);
            setSelectedAccount(newAccount._id);

            toast.success('✅ Email account added successfully!');
            
            return {
                success: true,
                data: newAccount,
                message: 'Account added successfully'
            };

        } catch (error) {
            console.error('❌ [addAccount] Error:', {
                message: error.message,
                status: error.status,
                response: error.response
            });
            
            const errorMsg = error.message || 'Failed to add account';
            
            // Don't show toast for 401 - let auth system handle it
            if (error.status !== 401) {
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
        console.log('🗑️ [deleteAccount] Deleting:', accountId);
        
        if (!isAuthenticated) {
            toast.error('Please login to delete accounts');
            return { success: false, error: 'Not authenticated' };
        }

        try {
            await emailAccountsAPI.deleteAccount(accountId);

            // Update state
            setAccounts(prev => prev.filter(account => account._id !== accountId));

            // Update selected account if needed
            if (selectedAccount === accountId) {
                const remainingAccounts = accounts.filter(acc => acc._id !== accountId);
                setSelectedAccount(remainingAccounts.length > 0 ? remainingAccounts[0]._id : null);
            }

            toast.success('✅ Account deleted successfully!');
            return { success: true };

        } catch (error) {
            console.error('❌ [deleteAccount] Error:', error);
            toast.error(error.message || 'Failed to delete account');
            return { success: false, error: error.message };
        }
    };

    const fetchEmails = async (accountId, params = {}) => {
        console.log('📥 [fetchEmails] For account:', accountId);
        
        if (!isAuthenticated) {
            console.log('⛔ [fetchEmails] Not authenticated');
            return [];
        }

        try {
            setLoading(true);
            const query = { ...params };
            if (accountId && accountId !== 'all') {
                query.accountId = accountId;
            }

            const response = await emailsAPI.getAllEmails(query);
            
            let emailsData = [];
            const data = extractData(response);
            if (Array.isArray(data)) {
                emailsData = data;
            } else if (data?.emails) {
                emailsData = data.emails;
            } else if (data?.data && Array.isArray(data.data)) {
                emailsData = data.data;
            }

            emailsData = emailsData.map(normalizeEmail);
            
            console.log('✅ [fetchEmails] Setting emails:', emailsData.length);
            setEmails(emailsData);
            
            return emailsData;

        } catch (error) {
            console.error('❌ [fetchEmails] Error:', error);
            toast.error('Failed to load emails');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const sendEmail = async (idOrAccountId, emailData) => {
        console.log('📤 [sendEmail] Sending email...');
        
        if (!isAuthenticated) {
            toast.error('Please login to send emails');
            return { success: false, error: 'Not authenticated' };
        }

        try {
            // If emailData is provided, create new email(s) from compose flow
            if (emailData) {
                const account = accounts.find(acc => acc._id === idOrAccountId);
                const fromAddress = account?.email || account?.address || account?.fromAddress;
                const recipients = Array.isArray(emailData.to)
                    ? emailData.to.map((item) => String(item).trim()).filter(Boolean)
                    : [String(emailData.to || '').trim()].filter(Boolean);

                if (!fromAddress) {
                    throw new Error('Selected account is missing a from address');
                }

                if (recipients.length === 0) {
                    throw new Error('Recipient address is required');
                }

                const requests = recipients.map((toAddress) => emailsAPI.createEmail({
                    fromAddress,
                    toAddress,
                    subject: emailData.subject || '(No Subject)',
                    bodyText: emailData.body || emailData.bodyText || ''
                }));

                const responses = await Promise.all(requests);
                toast.success(`✅ ${responses.length} email(s) queued for processing!`);
                return { success: true, data: responses };
            }

            // Otherwise, send an approved email by id
            const response = await emailsAPI.sendEmail(idOrAccountId);
            setEmails(prev => prev.map(e => e._id === idOrAccountId ? { ...e, status: 'sent', sentAt: new Date().toISOString() } : e));
            toast.success('✅ Email sent successfully!');
            return { success: true, data: response };

        } catch (error) {
            console.error('❌ [sendEmail] Error:', error);
            toast.error(error.message || 'Failed to send email');
            return { success: false, error: error.message };
        }
    };

    const updateEmail = async (emailId, data) => {
        try {
            const payload = {
                draftText: data.draft ?? data.draftText ?? data.body,
                category: data.category
            };

            const response = await emailsAPI.updateDraft(emailId, payload);
            const updated = normalizeEmail(extractData(response));

            setEmails(prev => prev.map(e => e._id === emailId ? { ...e, ...updated } : e));

            toast.success('✅ Draft updated');
            return { success: true, data: updated };
        } catch (error) {
            console.error('❌ [updateEmail] Error:', error);
            toast.error(error.message || 'Failed to update draft');
            return { success: false, error: error.message };
        }
    };

    const approveEmail = async (emailId) => {
        try {
            const response = await emailsAPI.approveEmail(emailId);
            const updated = normalizeEmail(extractData(response));
            setEmails(prev => prev.map(e => e._id === emailId ? { ...e, ...updated } : e));
            toast.success('✅ Email approved');
            return { success: true, data: updated };
        } catch (error) {
            console.error('❌ [approveEmail] Error:', error);
            toast.error(error.message || 'Failed to approve email');
            return { success: false, error: error.message };
        }
    };

    const replyToEmail = async (emailId, content, sendImmediately = false, attachments = []) => {
        try {
            const response = await emailsAPI.replyToEmail(emailId, {
                content,
                sendImmediately,
                attachments
            });
            const created = normalizeEmail(extractData(response));
            if (created?._id) {
                setEmails(prev => [created, ...prev]);
            }
            toast.success('✅ Reply created successfully');
            return { success: true, data: created };
        } catch (error) {
            console.error('❌ [replyToEmail] Error:', error);
            toast.error(error.message || 'Failed to create reply');
            return { success: false, error: error.message };
        }
    };

    const forwardEmail = async (emailId, toAddress, message = '', attachments = []) => {
        try {
            const response = await emailsAPI.forwardEmail(emailId, {
                toAddress,
                message,
                attachments
            });
            const created = normalizeEmail(extractData(response));
            if (created?._id) {
                setEmails(prev => [created, ...prev]);
            }
            toast.success('✅ Email forwarded successfully');
            return { success: true, data: created };
        } catch (error) {
            console.error('❌ [forwardEmail] Error:', error);
            toast.error(error.message || 'Failed to forward email');
            return { success: false, error: error.message };
        }
    };

    const syncAccount = async (accountId, limit = 50) => {
        console.log('🔄 [syncAccount] Syncing:', accountId);
        
        if (!isAuthenticated) {
            toast.error('Please login to sync emails');
            return { success: false, error: 'Not authenticated' };
        }

        try {
            setLoading(true);
            await emailAccountsAPI.syncAccount(accountId, limit);
            toast.success('✅ Emails synced successfully!');
            return { success: true };

        } catch (error) {
            console.error('❌ [syncAccount] Error:', error);
            toast.error(error.message || 'Failed to sync emails');
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const fixGmailSettings = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to update Gmail settings');
            return { success: false, error: 'Not authenticated' };
        }

        try {
            setLoading(true);
            const response = await emailAccountsAPI.fixGmailSettings();
            toast.success('✅ Gmail settings updated');
            await fetchAccounts();
            return { success: true, data: response };
        } catch (error) {
            console.error('❌ [fixGmailSettings] Error:', error);
            toast.error(error.message || 'Failed to update Gmail settings');
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const markEmail = async (emailId, read = true) => {
        try {
            console.log('📌 [markEmail] Marking:', emailId, 'as read:', read);
            
            if (read) {
                await emailsAPI.markAsRead(emailId);
            } else {
                await emailsAPI.markAsUnread(emailId);
            }

            // Update local state
            setEmails(prev => prev.map(email =>
                (email._id === emailId || email.id === emailId)
                    ? { ...email, isRead: read, readAt: read ? new Date().toISOString() : null }
                    : email
            ));

            return { success: true };

        } catch (error) {
            console.error('❌ [markEmail] Error:', error);
            toast.error(error.message || 'Failed to update email');
            return { success: false, error: error.message };
        }
    };

    const deleteEmail = async (emailId) => {
        try {
            console.log('🗑️ [deleteEmail] Deleting:', emailId);
            
            await emailsAPI.deleteEmail(emailId);

            // Update local state
            setEmails(prev => prev.filter(email => email._id !== emailId));

            toast.success('✅ Email deleted successfully!');
            return { success: true };

        } catch (error) {
            console.error('❌ [deleteEmail] Error:', error);
            toast.error(error.message || 'Failed to delete email');
            return { success: false, error: error.message };
        }
    };

    const unreadCount = useMemo(
        () => emails.reduce((count, email) => count + (email?.isRead ? 0 : 1), 0),
        [emails]
    );

    // Context value
    const value = {
        accounts,
        emails,
        unreadCount,
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
        updateEmail,
        approveEmail,
        replyToEmail,
        forwardEmail,
        markEmail,
        deleteEmail,
        fixGmailSettings,
        refreshAccounts: fetchAccounts,
    };

    console.log('📧 [EmailProvider] Rendering with:', {
        accountsCount: accounts.length,
        selectedAccount,
        loading: loading || accountsLoading
    });

    return (
        <EmailContext.Provider value={value}>
            {children}
        </EmailContext.Provider>
    );
};

// Export both as named exports
export { EmailContext };
