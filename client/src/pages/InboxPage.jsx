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
    RefreshCw,
    Sparkles,
    ArrowUpRight,
    Inbox as InboxIcon,
    Tag,
    MessageSquareText,
    SendHorizontal,
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
        if (!selectedAccount || selectedAccount === 'all') return null;
        if (typeof selectedAccount === 'object') {
            return getAccountId(selectedAccount);
        }
        return selectedAccount;
    };

    const getSelectedAccountLabel = () => {
        if (!selectedAccount || selectedAccount === 'all') {
            return 'All inboxes';
        }

        const match = accounts.find((account) => getAccountId(account) === getSelectedAccountId());
        return match?.displayName || match?.email || 'Selected inbox';
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
    const isInitialLoad = loading && emails.length === 0;
    const isRefreshingList = loading && emails.length > 0;

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

            const selectedAccountId = getSelectedAccountId();
            if (selectedAccountId) {
                params.accountId = selectedAccountId;
            }

            const response = await emailsAPI.getAllEmails(params);
            const emailsData = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.emails)
                    ? response.emails
                    : [];

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
    }, [pagination.page, pagination.limit, filters.status, filters.search, selectedAccount]);

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
            toast.success(response?.message || payload?.message || 'Emails synced successfully');
            setPagination(prev => ({ ...prev, page: 1, pages: 1, total: 0 }));
            fetchEmails({ forceReplace: true });
        } catch (error) {
            toast.error('Sync failed: ' + (error.message || 'Unknown error'));
        } finally {
            setSyncing(false);
        }
    };

    const handleEmailClick = (emailId) => {
        navigate(`/app/email/${emailId}`);
    };

    const handleSearch = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
        setPagination(prev => ({ ...prev, page: 1, pages: 1, total: 0 }));
    };

    const handleStatusChange = (e) => {
        setFilters(prev => ({ ...prev, status: e.target.value }));
        setPagination(prev => ({ ...prev, page: 1, pages: 1, total: 0 }));
    };

    const handleAccountChange = (e) => {
        const value = e.target.value;
        setSelectedAccount(value || 'all');
        setPagination(prev => ({ ...prev, page: 1, pages: 1, total: 0 }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'NEW': return 'bg-sky-100 text-sky-800 ring-sky-200';
            case 'SENT': return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
            case 'FAILED': return 'bg-rose-100 text-rose-800 ring-rose-200';
            case 'DRAFTED': return 'bg-amber-100 text-amber-800 ring-amber-200';
            case 'APPROVED': return 'bg-violet-100 text-violet-800 ring-violet-200';
            case 'REVIEWED': return 'bg-cyan-100 text-cyan-800 ring-cyan-200';
            default: return 'bg-slate-100 text-slate-700 ring-slate-200';
        }
    };

    const getSentimentTone = (sentiment) => {
        switch (sentiment) {
            case 'POSITIVE':
                return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
            case 'NEGATIVE':
                return 'bg-rose-50 text-rose-700 ring-rose-200';
            default:
                return 'bg-slate-100 text-slate-700 ring-slate-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'NEW': return <AlertCircle className="h-3.5 w-3.5" />;
            case 'SENT': return <CheckCircle className="h-3.5 w-3.5" />;
            case 'FAILED': return <XCircle className="h-3.5 w-3.5" />;
            default: return <Clock className="h-3.5 w-3.5" />;
        }
    };

    const handleBulkAction = async (action, emailId) => {
        try {
            if (action === 'assign') {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                await emailsAPI.bulkAction({
                    emailIds: [emailId],
                    action: 'assign',
                    data: { userId: user._id || 'current-user-id' }
                });
                toast.success('Email assigned to you');
                fetchEmails({ forceReplace: true });
            }
        } catch (error) {
            console.error('Bulk action failed:', error);
            toast.error('Action failed');
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

    const getPreviewText = (email) =>
        email.bodyText ||
        email.body?.text ||
        email.body ||
        'No preview available.';

    const getSenderLabel = (email) =>
        email.from?.name ||
        email.from?.email ||
        email.fromAddress ||
        'Unknown sender';

    const getAvatarLabel = (email) => getSenderLabel(email).trim().charAt(0).toUpperCase() || '?';

    const statCards = [
        {
            label: 'Total emails',
            value: pagination.total,
            icon: Mail,
            accent: 'from-sky-500/20 via-sky-500/5 to-transparent',
            iconClass: 'bg-sky-500 text-white'
        },
        {
            label: 'Pending review',
            value: emails.filter(e => e.status === 'DRAFTED').length,
            icon: MessageSquareText,
            accent: 'from-amber-500/20 via-amber-500/5 to-transparent',
            iconClass: 'bg-amber-500 text-white'
        },
        {
            label: 'Unassigned',
            value: emails.filter(e => !e.assignedUserId).length,
            icon: User,
            accent: 'from-rose-500/20 via-rose-500/5 to-transparent',
            iconClass: 'bg-rose-500 text-white'
        },
        {
            label: 'Sent today',
            value: emails.filter(e =>
                e.status === 'SENT' &&
                e.sentAt &&
                new Date(e.sentAt).toDateString() === new Date().toDateString()
            ).length,
            icon: SendHorizontal,
            accent: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
            iconClass: 'bg-emerald-500 text-white'
        }
    ];

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.22)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(135deg,_rgba(248,250,252,0.98),_rgba(255,255,255,0.9))]" />
                <div className="relative flex flex-col gap-6 p-6 md:p-8 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            Conversation workspace
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                            Card-based inbox for faster triage
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 md:text-base">
                            Review incoming mail in a dense card feed with status, sentiment, ownership, and quick actions visible without opening each thread.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                        <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Focused inbox</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{getSelectedAccountLabel()}</p>
                            <p className="mt-1 text-sm text-slate-500">
                                Page {pagination.page} of {pagination.pages}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/70 bg-slate-950 p-4 text-white shadow-lg shadow-slate-950/10">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Latest sync</p>
                            <p className="mt-2 text-lg font-semibold">
                                {syncResult ? `${syncResult.saved} new emails saved` : 'Inbox ready'}
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                                {syncResult ? `${syncResult.fetched} fetched from provider` : 'Run a sync to pull recent messages'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {syncResult && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm text-emerald-800 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="font-semibold">Sync complete</p>
                            <p className="mt-1 text-emerald-700">
                                Pulled {syncResult.fetched} emails and saved {syncResult.saved} new records.
                            </p>
                        </div>
                        <button
                            onClick={() => setSyncResult(null)}
                            className="rounded-full px-2 py-1 text-emerald-700 transition hover:bg-emerald-100"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.28)]"
                    >
                        <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-r ${stat.accent}`} />
                        <div className="relative flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm text-slate-500">{stat.label}</p>
                                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
                            </div>
                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.iconClass}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-24px_rgba(15,23,42,0.22)] md:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_220px_220px_220px]">
                        <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Search
                            </span>
                            <span className="relative block">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search subject, sender, or content"
                                    value={filters.search}
                                    onChange={handleSearch}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                                />
                            </span>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Status
                            </span>
                            <span className="relative block">
                                <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={filters.status}
                                    onChange={handleStatusChange}
                                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                                >
                                    <option value="">All statuses</option>
                                    <option value="NEW">New</option>
                                    <option value="CLASSIFIED">Classified</option>
                                    <option value="DRAFTED">Drafted</option>
                                    <option value="REVIEWED">Reviewed</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="SENT">Sent</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                            </span>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Account
                            </span>
                            <select
                                value={selectedAccount || 'all'}
                                onChange={handleAccountChange}
                                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                            >
                                <option value="all">All inboxes</option>
                                {accounts.map((account) => (
                                    <option key={getAccountId(account)} value={getAccountId(account)}>
                                        {account.displayName || account.email}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Density
                            </span>
                            <select
                                value={pagination.limit}
                                onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value, 10), page: 1, pages: 1, total: 0 }))}
                                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                            >
                                <option value="10">10 cards</option>
                                <option value="20">20 cards</option>
                                <option value="50">50 cards</option>
                                <option value="100">100 cards</option>
                            </select>
                        </label>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={() => fetchEmails({ forceReplace: true })}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Refreshing' : 'Refresh'}
                        </button>
                        <button
                            onClick={handleSyncGmail}
                            disabled={syncing}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {syncing ? (
                                <>
                                    <SyncLoader size={6} color="#ffffff" />
                                    Syncing
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4" />
                                    Sync Gmail
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.2)]">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-950">Email feed</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {pagination.total} emails found across {selectedAccount === 'all' || !selectedAccount ? 'all connected inboxes' : 'the selected inbox'}.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        <InboxIcon className="h-3.5 w-3.5" />
                        Showing {emails.length} loaded cards
                    </div>
                </div>

                <div className="p-5 md:p-6">
                    {isRefreshingList && (
                        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-800">
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-b-sky-600" />
                                <span>Refreshing inbox results...</span>
                            </div>
                            <span className="text-xs font-medium uppercase tracking-[0.14em] text-sky-700">
                                Fetching
                            </span>
                        </div>
                    )}

                    <div className="relative">
                    {isInitialLoad ? (
                        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
                            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-sky-500" />
                            <p className="mt-4 text-sm text-slate-500">Loading inbox cards...</p>
                        </div>
                    ) : emails.length === 0 ? (
                        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                            <Mail className="h-12 w-12 text-slate-300" />
                            <h3 className="mt-4 text-lg font-semibold text-slate-900">No emails found</h3>
                            <p className="mt-2 max-w-md text-sm text-slate-500">
                                {filters.search || filters.status
                                    ? 'Try changing your filters or search terms.'
                                    : 'Your inbox is empty right now.'}
                            </p>
                        </div>
                    ) : (
                        <>
                        <div className={`grid grid-cols-1 gap-4 transition-opacity xl:grid-cols-2 ${isRefreshingList ? 'opacity-60' : 'opacity-100'}`}>
                            {emails.map((email, index) => {
                                const emailIdentity = getEmailIdentity(email) || `email-card-${index}`;
                                const emailIdForRoute = email._id || email.id;

                                return (
                                    <article
                                        key={emailIdentity}
                                        className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_-24px_rgba(15,23,42,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_45px_-24px_rgba(15,23,42,0.35)]"
                                    >
                                        <div
                                            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-sky-500/[0.08] via-transparent to-amber-500/[0.08]"
                                            aria-hidden="true"
                                        />

                                        <div className="relative">
                                            <div className="flex items-start justify-between gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => emailIdForRoute && handleEmailClick(emailIdForRoute)}
                                                    className="flex min-w-0 flex-1 items-start gap-4 text-left"
                                                >
                                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-base font-semibold text-white shadow-sm">
                                                        {getAvatarLabel(email)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="truncate text-base font-semibold text-slate-950">
                                                                {getSenderLabel(email)}
                                                            </p>
                                                            {!email.assignedUserId && (
                                                                <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                                                                    Unassigned
                                                                </span>
                                                            )}
                                                            {email.priority === 'HIGH' || email.priority === 'high' ? (
                                                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                                                                    Priority
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <p className="mt-1 truncate text-sm text-slate-500">{email.fromAddress}</p>
                                                    </div>
                                                </button>

                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-xs font-medium text-slate-500">
                                                        {formatDate(email.createdAt)}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${getStatusColor(email.status)}`}>
                                                        {getStatusIcon(email.status)}
                                                        {email.status || 'UNKNOWN'}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => emailIdForRoute && handleEmailClick(emailIdForRoute)}
                                                className="mt-5 block w-full text-left"
                                            >
                                                <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-slate-950 transition group-hover:text-sky-700">
                                                    {email.subject || '(No Subject)'}
                                                </h3>
                                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                                                    {getPreviewText(email)}
                                                </p>
                                            </button>

                                            <div className="mt-5 flex flex-wrap gap-2">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${getSentimentTone(email.sentiment)}`}>
                                                    {email.sentiment || 'NEUTRAL'}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                                                    <Tag className="h-3.5 w-3.5" />
                                                    {email.category || 'Uncategorized'}
                                                </span>
                                                {email.assignedUserId && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                                                        <User className="h-3.5 w-3.5" />
                                                        {email.assignedUserId?.name || 'Assigned'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                                                <div className="text-xs text-slate-500">
                                                    {email.sentAt ? `Sent ${formatDate(email.sentAt)}` : 'Awaiting response'}
                                                </div>
                                                <div className="flex flex-wrap items-center justify-end gap-2">
                                                    {!email.assignedUserId && (
                                                        <button
                                                            type="button"
                                                            onClick={() => emailIdForRoute && handleBulkAction('assign', emailIdForRoute)}
                                                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                                        >
                                                            Assign
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => emailIdForRoute && handleEmailClick(emailIdForRoute)}
                                                        className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                                                    >
                                                        Open
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        {isRefreshingList && (
                            <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-10">
                                <div className="inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-b-sky-600" />
                                    Updating inbox...
                                </div>
                            </div>
                        )}
                        </>
                    )}
                    </div>
                </div>

                {!isInitialLoad && emails.length > 0 && (
                    <div className="border-t border-slate-200 px-5 py-5 md:px-6">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="text-sm text-slate-500">
                                Showing {Math.min(emails.length, pagination.total)} of {pagination.total} emails
                            </div>
                            <div className="text-sm text-slate-500">
                                Page {pagination.page} of {pagination.pages}
                            </div>
                        </div>
                    </div>
                )}

                {!isInitialLoad && emails.length > 0 && (
                    <div ref={loaderRef} className="px-5 pb-6 md:px-6">
                        <div className="flex justify-center">
                            {isLoadingMore ? (
                                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-sky-500" />
                                    Loading more emails...
                                </div>
                            ) : hasMore ? (
                                <button
                                    onClick={loadNextPage}
                                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Load more
                                </button>
                            ) : (
                                <p className="text-sm text-slate-500">You have reached the end of the inbox.</p>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default InboxPage;
