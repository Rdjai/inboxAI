// src/pages/InboxPage.jsx (Fixed Version)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SyncLoader } from 'react-spinners';
import { emailsAPI, emailAccountsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useEmail } from '../context/EmailContext';
import {
    Search,
    Filter,
    Mail,
    Clock,
    User,
    AlertCircle,
    CheckCircle,
    XCircle,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from 'lucide-react';

const InboxPage = () => {
    const navigate = useNavigate();
    const { accounts, selectedAccount, setSelectedAccount } = useEmail();
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loaderRef = useRef(null);
    const latestRequestIdRef = useRef(0);
    const [syncResult, setSyncResult] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1
    });
    const [filters, setFilters] = useState({
        status: '',
        search: '',
    });

    const getAccountId = (account) => account?._id || account?.id || account?.accountId || null;

    const getSelectedAccountId = () => {
        if (!selectedAccount) return null;
        if (typeof selectedAccount === 'object') {
            return getAccountId(selectedAccount);
        }
        return selectedAccount;
    };

    const getEmailIdentity = (email) =>
        email?._id ||
        email?.id ||
        email?.messageId ||
        `${email?.fromAddress || ''}-${email?.subject || ''}-${email?.createdAt || ''}`;

    const dedupeEmails = (items = []) => {
        const unique = new Map();
        for (const email of items) {
            const identity = getEmailIdentity(email);
            if (!identity || unique.has(identity)) continue;
            unique.set(identity, email);
        }
        return Array.from(unique.values());
    };

    const hasMore = pagination.page < pagination.pages;

    const fetchEmails = useCallback(async ({ forceReplace = false } = {}) => {
        const requestId = ++latestRequestIdRef.current;
        const shouldAppend = pagination.page > 1 && !forceReplace;

        try {
            if (shouldAppend) {
                setIsLoadingMore(true);
            } else {
                setLoading(true);
            }
            const params = {
                page: pagination.page,
                limit: pagination.limit
            };

            if (filters.status) params.status = filters.status;
            if (filters.search && filters.search.trim()) params.search = filters.search.trim();

            const response = await emailsAPI.getAllEmails(params);
            const emailsData = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.emails)
                    ? response.emails
                    : [];

            // Ignore stale responses from older requests.
            if (requestId !== latestRequestIdRef.current) {
                return;
            }

            setEmails((prev) => (shouldAppend
                ? dedupeEmails([...prev, ...emailsData])
                : dedupeEmails(emailsData)));
            setPagination(prev => ({
                ...prev,
                ...(response?.pagination || {})
            }));
        } catch (error) {
            // Ignore stale request errors too; only surface active request failures.
            if (requestId !== latestRequestIdRef.current) {
                return;
            }
            console.error('Error fetching emails:', error);
            toast.error(error.message || 'Failed to fetch emails');
        } finally {
            if (requestId !== latestRequestIdRef.current) {
                return;
            }
            if (shouldAppend) {
                setIsLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    }, [pagination.page, pagination.limit, filters.status, filters.search]);

    useEffect(() => {
        fetchEmails();
    }, [fetchEmails]);

    const loadNextPage = useCallback(() => {
        if (loading || isLoadingMore || !hasMore) return;
        setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }, [loading, isLoadingMore, hasMore]);

    useEffect(() => {
        const node = loaderRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    loadNextPage();
                }
            },
            {
                root: null,
                rootMargin: '200px 0px',
                threshold: 0.1
            }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [loadNextPage]);
    const handleSyncGmail = async () => {
        try {
            setSyncing(true);
            let accountId = getSelectedAccountId();
            let availableAccounts = Array.isArray(accounts) ? accounts : [];

            const hasSelectedInState = availableAccounts.some((acc) => getAccountId(acc) === accountId);
            if (!accountId || (availableAccounts.length > 0 && !hasSelectedInState)) {
                accountId = getAccountId(availableAccounts[0]);
                if (accountId) {
                    setSelectedAccount(accountId);
                }
            }

            if (!accountId) {
                const accountsRes = await emailAccountsAPI.getAccounts();
                const payload = accountsRes?.data || accountsRes;
                availableAccounts = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.accounts)
                        ? payload.accounts
                        : Array.isArray(payload?.data)
                            ? payload.data
                            : [];

                accountId = getAccountId(availableAccounts.find((acc) => getAccountId(acc)));
                if (accountId) {
                    setSelectedAccount(accountId);
                }
            }

            if (!accountId) {
                throw new Error('Please add/select an email account before syncing');
            }

            const response = await emailAccountsAPI.syncManual({ accountId, limit: 50 });
            const payload = response?.data || response || {};
            setSyncResult({
                fetched: payload.fetched ?? 0,
                saved: payload.imported ?? payload.saved ?? 0
            });
            toast.success(response?.message || payload?.message || 'Emails synced successfully!');
            // Force a fresh first page fetch after sync to avoid append races.
            setPagination(prev => ({ ...prev, page: 1, pages: 1, total: 0 }));
            fetchEmails({ forceReplace: true });
        } catch (error) {
            toast.error('Sync failed: ' + (error.message || 'Unknown error'));
        } finally {
            setSyncing(false);
        }
    };
    const handleEmailClick = (emailId) => {
        navigate(`/email/${emailId}`);
    };

    const handleSearch = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
        setPagination(prev => ({ ...prev, page: 1, pages: 1, total: 0 }));
    };

    const handleStatusChange = (e) => {
        setFilters(prev => ({ ...prev, status: e.target.value }));
        setPagination(prev => ({ ...prev, page: 1, pages: 1, total: 0 }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'NEW': return 'bg-blue-100 text-blue-800';
            case 'SENT': return 'bg-green-100 text-green-800';
            case 'FAILED': return 'bg-red-100 text-red-800';
            case 'DRAFTED': return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = (now - date) / (1000 * 60 * 60);

        if (diffHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'NEW': return <AlertCircle className="h-4 w-4" />;
            case 'SENT': return <CheckCircle className="h-4 w-4" />;
            case 'FAILED': return <XCircle className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getSentimentTone = (sentiment) => {
        switch (sentiment) {
            case 'POSITIVE':
                return 'bg-green-100 text-green-800';
            case 'NEGATIVE':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const handleBulkAction = async (action, emailId) => {
        try {
            if (action === 'assign') {
                // Get current user ID from localStorage or context
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                await emailsAPI.bulkAction({
                    emailIds: [emailId],
                    action: 'assign',
                    data: { userId: user._id || 'current-user-id' }
                });
                alert('Email assigned to you');
                fetchEmails(); // Refresh the list
            }
        } catch (error) {
            console.error('Bulk action failed:', error);
            alert('Action failed');
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-6">

            {/* Header */}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Email Inbox</h1>
                    <p className="text-gray-600 mt-2">
                        Manage and respond to customer emails
                    </p>
                </div>

                <button
                    onClick={handleSyncGmail}
                    disabled={syncing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {syncing ? (
                        <>
                            <SyncLoader size={8} color="#ffffff" />
                            Syncing...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4" />
                            Sync Gmail
                        </>
                    )}
                </button>
            </div>

            {/* Sync Result Banner */}
            {syncResult && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-medium text-green-800">✅ Sync Complete</h3>
                            <p className="text-sm text-green-600">
                                Fetched {syncResult.fetched} emails, saved {syncResult.saved} new emails
                            </p>
                        </div>
                        <button
                            onClick={() => setSyncResult(null)}
                            className="text-green-600 hover:text-green-800"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search emails by subject, sender, or content..."
                            value={filters.search}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <select
                                value={filters.status}
                                onChange={handleStatusChange}
                                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                <option value="">All Status</option>
                                <option value="NEW">New</option>
                                <option value="CLASSIFIED">Classified</option>
                                <option value="DRAFTED">Drafted</option>
                                <option value="REVIEWED">Reviewed</option>
                                <option value="APPROVED">Approved</option>
                                <option value="SENT">Sent</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>

                        <button
                            onClick={() => fetchEmails({ forceReplace: true })}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    {
                        label: 'Total Emails',
                        value: pagination.total,
                        icon: Mail,
                        color: 'text-blue-500',
                        bgColor: 'bg-blue-50'
                    },
                    {
                        label: 'Pending Review',
                        value: emails.filter(e => e.status === 'DRAFTED').length,
                        icon: Clock,
                        color: 'text-yellow-500',
                        bgColor: 'bg-yellow-50'
                    },
                    {
                        label: 'Unassigned',
                        value: emails.filter(e => !e.assignedUserId).length,
                        icon: User,
                        color: 'text-red-500',
                        bgColor: 'bg-red-50'
                    },
                    {
                        label: 'Sent Today',
                        value: emails.filter(e =>
                            e.status === 'SENT' &&
                            e.sentAt &&
                            new Date(e.sentAt).toDateString() === new Date().toDateString()
                        ).length,
                        icon: CheckCircle,
                        color: 'text-green-500',
                        bgColor: 'bg-green-50'
                    }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{stat.label}</p>
                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-2 rounded-full ${stat.bgColor}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Email Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Customer Emails</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {pagination.total} emails found • Page {pagination.page} of {pagination.pages}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Show:</span>
                            <select
                                value={pagination.limit}
                                onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1, pages: 1, total: 0 }))}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading emails...</p>
                        </div>
                    ) : emails.length === 0 ? (
                        <div className="text-center py-12">
                            <Mail className="h-12 w-12 text-gray-400 mx-auto" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">No emails found</h3>
                            <p className="mt-2 text-gray-600">
                                {filters.search || filters.status
                                    ? 'Try changing your filters'
                                    : 'No emails available'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {emails.map((email, index) => {
                                        const emailIdentity = getEmailIdentity(email) || `email-row-${index}`;
                                        const emailIdForRoute = email._id || email.id;

                                        return (
                                        <tr
                                            key={emailIdentity}
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => emailIdForRoute && handleEmailClick(emailIdForRoute)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{email.fromAddress}</div>
                                                {email.assignedUserId && (
                                                    <div className="text-sm text-gray-500 flex items-center mt-1">
                                                        <User className="h-3 w-3 mr-1" />
                                                        <span className="truncate max-w-xs">
                                                            {email.assignedUserId?.name || 'Assigned'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 truncate max-w-xs">
                                                    {email.subject || '(No Subject)'}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {email.bodyText?.substring(0, 80)}...
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {email.category || 'Uncategorized'}
                                                </span>
                                                {email.confidence && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {Math.round(email.confidence * 100)}% confident
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSentimentTone(email.sentiment)}`}>
                                                    {(email.sentiment || 'NEUTRAL').toLowerCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                                                    <span className="mr-1.5">
                                                        {getStatusIcon(email.status)}
                                                    </span>
                                                    {email.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {formatDate(email.createdAt)}
                                                </div>
                                                {email.sentAt && (
                                                    <div className="text-xs text-gray-500">
                                                        Sent: {formatDate(email.sentAt)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => emailIdForRoute && handleEmailClick(emailIdForRoute)}
                                                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        View
                                                    </button>
                                                    {!email.assignedUserId && (
                                                        <button
                                                            onClick={() => emailIdForRoute && handleBulkAction('assign', emailIdForRoute)}
                                                            className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                        >
                                                            Assign
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination / Lazy Loading */}
                {!loading && emails.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-gray-600">
                            Showing 1 to {Math.min(emails.length, pagination.total)} of{' '}
                            {pagination.total} emails
                        </div>
                        <div className="text-sm text-gray-500">
                            Page {pagination.page} of {pagination.pages}
                        </div>
                    </div>
                )}

                {!loading && emails.length > 0 && (
                    <div ref={loaderRef} className="py-6 flex justify-center">
                        {isLoadingMore ? (
                            <div className="flex items-center gap-2 text-gray-600">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                Loading more emails...
                            </div>
                        ) : hasMore ? (
                            <button
                                onClick={loadNextPage}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm text-gray-700"
                            >
                                Load more
                            </button>
                        ) : (
                            <p className="text-sm text-gray-500">You have reached the end of the inbox.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InboxPage;
