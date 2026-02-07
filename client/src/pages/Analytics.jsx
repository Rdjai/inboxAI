import React, { useEffect, useMemo, useState } from 'react';
import { analyticsAPI, dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const CHART_COLORS = [
    'rgba(59, 130, 246, 0.85)',
    'rgba(16, 185, 129, 0.85)',
    'rgba(245, 158, 11, 0.85)',
    'rgba(239, 68, 68, 0.85)',
    'rgba(168, 85, 247, 0.85)',
    'rgba(14, 165, 233, 0.85)',
    'rgba(99, 102, 241, 0.85)',
    'rgba(244, 114, 182, 0.85)'
];

const getPayload = (response) => {
    const level1 = response?.data ?? response;
    return level1?.data ?? level1;
};

const normalizeDistribution = (value) => {
    if (!value) return {};
    if (Array.isArray(value)) {
        return value.reduce((acc, item) => {
            const key = item?.category || item?.status || item?.priority || item?.name || 'Unknown';
            const count = item?.total ?? item?.count ?? item?.value ?? 0;
            acc[key] = (acc[key] || 0) + count;
            return acc;
        }, {});
    }
    if (typeof value === 'object') return value;
    return {};
};

const toChartData = (distribution) => {
    const entries = Object.entries(distribution || {}).filter(([, v]) => Number(v) > 0);
    return {
        labels: entries.map(([label]) => label || 'Unknown'),
        data: entries.map(([, count]) => Number(count) || 0)
    };
};

const formatMinutes = (mins) => `${Math.max(0, Math.round(Number(mins) || 0))}m`;

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week');

    const [overview, setOverview] = useState({
        totalEmails: 0,
        unprocessedEmails: 0,
        processedEmails: 0,
        processingRate: 0,
        avgResponseTime: 0
    });
    const [categoryDistribution, setCategoryDistribution] = useState({});
    const [statusDistribution, setStatusDistribution] = useState({});
    const [priorityDistribution, setPriorityDistribution] = useState({});
    const [categoryDetails, setCategoryDetails] = useState([]);
    const [teamStats, setTeamStats] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [queueStats, setQueueStats] = useState(null);

    useEffect(() => {
        fetchAnalyticsData();
    }, [timeRange]);

    const buildDateParams = () => {
        const now = new Date();
        const from = new Date(now);
        if (timeRange === 'week') from.setDate(now.getDate() - 7);
        if (timeRange === 'month') from.setDate(now.getDate() - 30);
        if (timeRange === 'quarter') from.setDate(now.getDate() - 90);
        if (timeRange === 'year') from.setFullYear(now.getFullYear() - 1);
        return { fromDate: from.toISOString(), toDate: now.toISOString() };
    };

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const params = buildDateParams();

            const [dashboardRes, categoryRes, teamRes, queueRes] = await Promise.allSettled([
                dashboardAPI.getDashboard(params),
                analyticsAPI.getCategoryAnalytics(params),
                analyticsAPI.getTeamAnalytics(params),
                analyticsAPI.getQueueStatus()
            ]);

            if (dashboardRes.status === 'fulfilled') {
                const payload = getPayload(dashboardRes.value) || {};
                const ov = payload.overview || {};
                setOverview({
                    totalEmails: Number(ov.totalEmails) || 0,
                    unprocessedEmails: Number(ov.unprocessedEmails) || 0,
                    processedEmails: Number(ov.processedEmails) || 0,
                    processingRate: Number(ov.processingRate) || 0,
                    avgResponseTime: Number(ov.avgResponseTime) || 0
                });
                setCategoryDistribution(normalizeDistribution(payload.categories));
                setStatusDistribution(normalizeDistribution(payload.status));
                setPriorityDistribution(normalizeDistribution(payload.priorities));
                setRecentActivity(Array.isArray(payload.recentActivity) ? payload.recentActivity : []);
            } else {
                throw dashboardRes.reason;
            }

            if (categoryRes.status === 'fulfilled') {
                const payload = getPayload(categoryRes.value);
                const rows = Array.isArray(payload)
                    ? payload
                    : Object.entries(normalizeDistribution(payload)).map(([category, total]) => ({ category, total }));
                setCategoryDetails(rows);
            } else {
                setCategoryDetails([]);
            }

            if (teamRes.status === 'fulfilled') {
                const payload = getPayload(teamRes.value);
                const rows = Array.isArray(payload) ? payload : [];
                const normalized = rows.map((item) => {
                    const received = Number(item.totalAssigned ?? item.total ?? item.received ?? 0);
                    const sent = Number(item.completed ?? item.sent ?? item.replied ?? 0);
                    const pending = Number(item.pending ?? item.unread ?? 0);
                    const completionRate = Number(item.completionRate ?? (received > 0 ? (sent / received) * 100 : 0));
                    return {
                        account: item.account || item.user?.name || item.user?.email || 'Unknown',
                        sent,
                        received,
                        pending,
                        completionRate,
                        avgResponseTime: Number(item.avgResponseTime ?? 0),
                        categoryDistribution: item.categoryDistribution || {}
                    };
                });
                setTeamStats(normalized);
            } else {
                setTeamStats([]);
            }

            if (queueRes.status === 'fulfilled') {
                const payload = getPayload(queueRes.value);
                setQueueStats(payload || null);
            } else {
                setQueueStats(null);
            }
        } catch (error) {
            toast.error(error?.message || 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const categoryChart = useMemo(() => toChartData(categoryDistribution), [categoryDistribution]);
    const statusChart = useMemo(() => toChartData(statusDistribution), [statusDistribution]);
    const priorityChart = useMemo(() => toChartData(priorityDistribution), [priorityDistribution]);

    const pieData = {
        labels: categoryChart.labels,
        datasets: [{
            data: categoryChart.data,
            backgroundColor: CHART_COLORS.slice(0, Math.max(categoryChart.data.length, 1)),
            borderWidth: 1
        }]
    };

    const statusBarData = {
        labels: statusChart.labels,
        datasets: [{
            label: 'Emails by Status',
            data: statusChart.data,
            backgroundColor: CHART_COLORS.slice(0, Math.max(statusChart.data.length, 1))
        }]
    };

    const priorityBarData = {
        labels: priorityChart.labels,
        datasets: [{
            label: 'Emails by Priority',
            data: priorityChart.data,
            backgroundColor: CHART_COLORS.slice(0, Math.max(priorityChart.data.length, 1))
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-600 mt-1">Live analytics from dashboard, category, team and queue endpoints.</p>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                    <option value="quarter">Last 90 days</option>
                    <option value="year">Last year</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-sm text-gray-600">Total Emails</p>
                    <p className="text-2xl font-bold mt-1">{overview.totalEmails}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-sm text-gray-600">Unprocessed</p>
                    <p className="text-2xl font-bold mt-1">{overview.unprocessedEmails}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-sm text-gray-600">Processed</p>
                    <p className="text-2xl font-bold mt-1">{overview.processedEmails}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-sm text-gray-600">Processing Rate</p>
                    <p className="text-2xl font-bold mt-1">{overview.processingRate.toFixed(1)}%</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-sm text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold mt-1">{formatMinutes(overview.avgResponseTime)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h2>
                    <div className="h-72">
                        <Pie data={pieData} options={chartOptions} />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h2>
                    <div className="h-72">
                        <Bar data={statusBarData} options={chartOptions} />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h2>
                    <div className="h-72">
                        <Bar data={priorityBarData} options={chartOptions} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Analytics</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Confidence</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Response</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Counts</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {categoryDetails.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 text-center">No category analytics available.</td>
                                </tr>
                            )}
                            {categoryDetails.map((row, idx) => (
                                <tr key={`${row.category || 'unknown'}-${idx}`} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.category || 'Unknown'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{row.total ?? 0}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {row.avgConfidence !== undefined && row.avgConfidence !== null
                                            ? `${Math.round(Number(row.avgConfidence) * 100)}%`
                                            : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {row.avgResponseTime !== undefined && row.avgResponseTime !== null
                                            ? formatMinutes(row.avgResponseTime)
                                            : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {row.statusCounts && typeof row.statusCounts === 'object'
                                            ? Object.entries(row.statusCounts).map(([k, v]) => `${k}:${v}`).join(' | ')
                                            : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Team / Account Analytics</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Response</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {teamStats.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-sm text-gray-500 text-center">No team/account analytics available for your role.</td>
                                </tr>
                            )}
                            {teamStats.map((item, idx) => (
                                <tr key={`${item.account}-${idx}`} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.account}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{item.sent}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{item.received}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{item.pending}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{Math.round(item.completionRate)}%</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{formatMinutes(item.avgResponseTime)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3 max-h-80 overflow-auto">
                        {recentActivity.length === 0 && (
                            <p className="text-sm text-gray-500">No recent activity in selected period.</p>
                        )}
                        {recentActivity.map((item) => (
                            <div key={item._id} className="border border-gray-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-gray-900">{item.action || 'Activity'}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    {item.userId?.name || item.userId?.email || 'Unknown user'} | {new Date(item.createdAt).toLocaleString()}
                                </p>
                                {item.emailId?.subject && (
                                    <p className="text-xs text-gray-700 mt-1">Subject: {item.emailId.subject}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Queue Status</h2>
                    {!queueStats && <p className="text-sm text-gray-500">Queue stats unavailable for your role.</p>}
                    {queueStats && (
                        <div className="space-y-3">
                            {Object.entries(queueStats).map(([queueName, stats]) => (
                                <div key={queueName} className="border border-gray-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-gray-900">{queueName}</p>
                                    <div className="grid grid-cols-5 gap-2 mt-2 text-xs text-gray-700">
                                        <span>Waiting: {stats.waiting ?? 0}</span>
                                        <span>Active: {stats.active ?? 0}</span>
                                        <span>Completed: {stats.completed ?? 0}</span>
                                        <span>Failed: {stats.failed ?? 0}</span>
                                        <span>Delayed: {stats.delayed ?? 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
