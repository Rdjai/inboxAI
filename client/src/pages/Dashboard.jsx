import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { endOfDay, format, isValid, startOfDay, subDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, emailAccountsAPI, emailsAPI } from '../services/api';

const buildRange = (daysBackStart, daysBackEnd = 0) => {
    const now = new Date();

    return {
        fromDate: startOfDay(subDays(now, daysBackStart)).toISOString(),
        toDate: endOfDay(subDays(now, daysBackEnd)).toISOString()
    };
};

const getNumber = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
};

const getTrendLabel = (delta, suffix = '') => {
    if (delta === 0) {
        return `Flat vs last week${suffix}`;
    }

    return `${delta > 0 ? '+' : ''}${delta}${suffix} vs last week`;
};

const getWeeklyHighlights = (thisWeek, lastWeek) => {
    if (!thisWeek) {
        return [];
    }

    const processedEmails = getNumber(thisWeek.processedEmails);
    const unprocessedEmails = getNumber(thisWeek.unprocessedEmails);
    const processingRate = getNumber(thisWeek.processingRate);
    const avgResponseTime = getNumber(thisWeek.avgResponseTime);

    const lastWeekProcessed = getNumber(lastWeek?.processedEmails);
    const lastWeekRate = getNumber(lastWeek?.processingRate);
    const lastWeekResponseTime = getNumber(lastWeek?.avgResponseTime);

    const processedDelta = processedEmails - lastWeekProcessed;
    const rateDelta = Math.round((processingRate - lastWeekRate) * 10) / 10;
    const responseDelta = Math.round((lastWeekResponseTime - avgResponseTime) * 10) / 10;

    return [
        {
            label: 'Processed this week',
            value: processedEmails.toLocaleString(),
            detail: getTrendLabel(processedDelta),
            tone: processedDelta >= 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
        },
        {
            label: 'Inbox control',
            value: `${processingRate.toFixed(1)}%`,
            detail: getTrendLabel(rateDelta, '%'),
            tone: processingRate >= 70
                ? 'border-sky-200 bg-sky-50 text-sky-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
        },
        {
            label: 'Response pace',
            value: avgResponseTime > 0 ? `${Math.round(avgResponseTime)}m` : 'N/A',
            detail: avgResponseTime > 0
                ? (lastWeekResponseTime > 0
                    ? `${responseDelta >= 0 ? `${responseDelta}m faster` : `${Math.abs(responseDelta)}m slower`} than last week`
                    : 'First measured week')
                : `${unprocessedEmails.toLocaleString()} emails still waiting`,
            tone: responseDelta >= 0
                ? 'border-violet-200 bg-violet-50 text-violet-800'
                : 'border-orange-200 bg-orange-50 text-orange-800'
        }
    ];
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalAccounts: 0,
        totalEmails: 0,
        unreadEmails: 0,
        sentToday: 0
    });
    const [accounts, setAccounts] = useState([]);
    const [recentEmails, setRecentEmails] = useState([]);
    const [weeklyInsights, setWeeklyInsights] = useState({
        thisWeek: null,
        lastWeek: null,
        highlights: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const extractEmailList = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.emails)) return payload.emails;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.items)) return payload.items;
        return [];
    };

    const getEmailDateLabel = (email) => {
        const dateValue = email?.receivedAt || email?.sentAt || email?.createdAt;
        if (!dateValue) return '-';

        const date = new Date(dateValue);
        return isValid(date) ? format(date, 'MMM d') : '-';
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const [
                accountsRes,
                dashboardRes,
                emailsRes,
                thisWeekRes,
                lastWeekRes
            ] = await Promise.all([
                emailAccountsAPI.getAccounts(),
                dashboardAPI.getDashboard(),
                emailsAPI.getAllEmails({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
                dashboardAPI.getDashboard(buildRange(6, 0)),
                dashboardAPI.getDashboard(buildRange(13, 7))
            ]);

            const accountsData = accountsRes?.data || accountsRes;
            const accountsList = accountsData?.data || accountsData?.accounts || accountsData || [];
            setAccounts(accountsList);

            const dashboardData = dashboardRes?.data || dashboardRes;
            const dashboardPayload = dashboardData?.data || dashboardData;
            const overview = dashboardPayload?.overview || {};

            const recentList = extractEmailList(emailsRes);
            setRecentEmails(recentList);

            const thisWeekData = thisWeekRes?.data || thisWeekRes;
            const lastWeekData = lastWeekRes?.data || lastWeekRes;
            const thisWeekOverview = (thisWeekData?.data || thisWeekData)?.overview || {};
            const lastWeekOverview = (lastWeekData?.data || lastWeekData)?.overview || {};

            setWeeklyInsights({
                thisWeek: thisWeekOverview,
                lastWeek: lastWeekOverview,
                highlights: getWeeklyHighlights(thisWeekOverview, lastWeekOverview)
            });

            setStats({
                totalAccounts: accountsList.length,
                totalEmails: overview.totalEmails ?? recentList.length,
                unreadEmails: overview.unprocessedEmails ?? 0,
                sentToday: 0
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const weekSummary = weeklyInsights.thisWeek || {};
    const accountsConnectedLabel = `${accounts.length} connected ${accounts.length === 1 ? 'account' : 'accounts'}`;
    const weeklyThroughput = `${getNumber(weekSummary.processedEmails).toLocaleString()} handled in the last 7 days`;
    const weeklyBacklog = `${getNumber(weekSummary.unprocessedEmails).toLocaleString()} still need attention`;

    return (
        <div className="space-y-8">
            <div className="rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-slate-900 p-6 text-white shadow-lg">
                <h1 className="mb-2 text-2xl font-bold">Welcome back, {user?.name}!</h1>
                <p className="opacity-90">
                    Here&apos;s what&apos;s happening across your inbox operation today.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="rounded-lg bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
                        {user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'Member'}
                    </div>
                    <div className="text-sm opacity-80">
                        Last login:{' '}
                        {user?.lastLoginAt || user?.lastLogin
                            ? format(new Date(user.lastLoginAt || user.lastLogin), 'MMM d, h:mm a')
                            : 'Never'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Email Accounts</p>
                            <p className="mt-1 text-2xl font-bold">{stats.totalAccounts}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-xl text-blue-600">
                            <span>📧</span>
                        </div>
                    </div>
                    <Link to="/accounts" className="mt-4 block text-sm text-blue-600 hover:text-blue-800">
                        Manage accounts →
                    </Link>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Emails</p>
                            <p className="mt-1 text-2xl font-bold">{stats.totalEmails}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-xl text-green-600">
                            <span>📥</span>
                        </div>
                    </div>
                    <Link to="/inbox" className="mt-4 block text-sm text-green-600 hover:text-green-800">
                        View inbox →
                    </Link>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Unread</p>
                            <p className="mt-1 text-2xl font-bold">{stats.unreadEmails}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-xl text-yellow-600">
                            <span>🔔</span>
                        </div>
                    </div>
                    <Link to="/inbox?filter=unread" className="mt-4 block text-sm text-yellow-600 hover:text-yellow-800">
                        Mark as read →
                    </Link>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Sent Today</p>
                            <p className="mt-1 text-2xl font-bold">{stats.sentToday}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-xl text-purple-600">
                            <span>📤</span>
                        </div>
                    </div>
                    <Link to="/compose" className="mt-4 block text-sm text-purple-600 hover:text-purple-800">
                        Compose email →
                    </Link>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] xl:grid-cols-[2fr_1fr]">
                    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-900 p-6 text-white lg:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-200">
                                    Weekly Productivity
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold">Insights for the last 7 days</h2>
                                <p className="mt-2 max-w-2xl text-sm text-slate-200">
                                    A quick read on throughput, inbox control, and response pace so the team can spot momentum without opening the full analytics view.
                                </p>
                            </div>
                            <Link
                                to="/analytics"
                                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                            >
                                Open analytics
                            </Link>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {weeklyInsights.highlights.map((highlight) => (
                                <div
                                    key={highlight.label}
                                    className={`rounded-2xl border p-4 ${highlight.tone} transition-shadow hover:shadow-md`}
                                >
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                                        {highlight.label}
                                    </p>
                                    <p className="mt-3 text-3xl font-semibold">{highlight.value}</p>
                                    <p className="mt-3 text-sm leading-6">{highlight.detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col justify-between bg-slate-50 p-6 lg:p-8">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                This week at a glance
                            </p>
                            <div className="mt-4 space-y-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
                                    <p className="text-sm text-slate-500">Coverage</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">{accountsConnectedLabel}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
                                    <p className="text-sm text-slate-500">Throughput</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">{weeklyThroughput}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
                                    <p className="text-sm text-slate-500">Backlog</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">{weeklyBacklog}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/inbox?filter=unread')}
                            className="mt-6 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                            Focus unread queue
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Emails</h2>
                    <Link to="/inbox" className="text-sm text-blue-600 hover:text-blue-800">
                        View all →
                    </Link>
                </div>

                {recentEmails.length === 0 ? (
                    <div className="py-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-gray-900">No emails yet</h3>
                        <p className="text-gray-500">Start by adding an email account</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentEmails.map((email, index) => (
                            <div
                                key={email._id || email.id || email.messageId || `${email.subject || 'email'}-${index}`}
                                className="flex cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-gray-50"
                                onClick={() => {
                                    const emailId = email._id || email.id;
                                    if (emailId) {
                                        navigate(`/email/${emailId}`);
                                    }
                                }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                                        <span className="text-sm font-medium text-gray-600">
                                            {email.from?.name?.charAt(0)
                                                || email.from?.email?.charAt(0)
                                                || email.fromAddress?.charAt(0)
                                                || email.from?.charAt(0)
                                                || '?'}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`truncate text-sm font-medium ${email.isRead === false || email.status === 'NEW' ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {email.from?.name || email.from?.email || email.fromAddress || email.from || 'Unknown'}
                                        </p>
                                        <p className="truncate text-sm text-gray-500">{email.subject || '(No subject)'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-xs text-gray-500">{getEmailDateLabel(email)}</span>
                                    {(email.isRead === false || email.status === 'NEW') && (
                                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 p-6">
                    <h3 className="mb-2 font-semibold text-blue-900">Add Email Account</h3>
                    <p className="mb-4 text-sm text-blue-700">
                        Connect your Gmail, Outlook, or custom email account
                    </p>
                    <Link to="/accounts" className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                        Add Account
                    </Link>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-green-50 to-green-100 p-6">
                    <h3 className="mb-2 font-semibold text-green-900">Compose Email</h3>
                    <p className="mb-4 text-sm text-green-700">
                        Send a new email from any of your connected accounts
                    </p>
                    <Link to="/compose" className="inline-block rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">
                        Compose
                    </Link>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 p-6">
                    <h3 className="mb-2 font-semibold text-purple-900">Team Management</h3>
                    <p className="mb-4 text-sm text-purple-700">
                        {user?.role === 'admin' ? 'Manage team members and permissions' : 'View team members'}
                    </p>
                    <Link to="/team" className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700">
                        {user?.role === 'admin' ? 'Manage Team' : 'View Team'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
