import React, { useEffect, useState } from 'react';
import { analyticsAPI, dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
import ActivityTimeline from '../components/analytics/ActivityTimeline';
import EmailActivityHeatmap from '../components/analytics/EmailActivityHeatmap';
import EmailFlowDiagram from '../components/analytics/EmailFlowDiagram';
import ResponseTimeChart from '../components/analytics/ResponseTimeChart';
import SentimentAnalysis from '../components/analytics/SentimentAnalysis';
import EmailVolumeChart from '../components/analytics/EmailVolumeChart';
import UserActivityStats from '../components/analytics/UserActivityStats';

const ActivityDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week');
    const [chartType, setChartType] = useState('line');

    const [activities, setActivities] = useState([]);
    const [emails, setEmails] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({});
    const [volumeData, setVolumeData] = useState([]);

    useEffect(() => {
        fetchActivityData();
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

    const fetchActivityData = async () => {
        try {
            setLoading(true);
            const params = buildDateParams();

            const [dashboardRes, categoryRes, teamRes] = await Promise.allSettled([
                dashboardAPI.getDashboard(params),
                analyticsAPI.getCategoryAnalytics(params),
                analyticsAPI.getTeamAnalytics(params)
            ]);

            // Extract dashboard data
            if (dashboardRes.status === 'fulfilled') {
                const payload = dashboardRes.value?.data || dashboardRes.value;
                const dashboardData = payload?.data || payload;

                setStats({
                    totalEmails: dashboardData?.overview?.totalEmails || 0,
                    processedEmails: dashboardData?.overview?.processedEmails || 0,
                    draftedEmails: dashboardData?.overview?.draftedEmails || 0,
                    approvedEmails: dashboardData?.overview?.approvedEmails || 0,
                    sentEmails: dashboardData?.overview?.sentEmails || 0,
                    failedEmails: dashboardData?.overview?.failedEmails || 0,
                    avgResponseTime: dashboardData?.overview?.avgResponseTime || 0
                });

                // Extract activities
                const recentActivity = dashboardData?.recentActivity || [];
                setActivities(Array.isArray(recentActivity) ? recentActivity : []);

                // Generate volume data from activities
                const volumeData = (Array.isArray(recentActivity) ? recentActivity : []).map(activity => ({
                    date: activity.createdAt,
                    type: activity.action?.toLowerCase() || 'received'
                }));
                setVolumeData(volumeData);
            }

            // Extract team/user data
            if (teamRes.status === 'fulfilled') {
                const payload = teamRes.value?.data || teamRes.value;
                const teamData = Array.isArray(payload) ? payload : payload?.data || [];
                setUsers(teamData);
            }

        } catch (error) {
            toast.error(error?.message || 'Failed to load activity data');
        } finally {
            setLoading(false);
        }
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Email Activity Dashboard</h1>
                    <p className="text-gray-600 mt-1">Comprehensive email activity visualizations and analytics</p>
                </div>
                <div className="flex gap-2">
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
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-600">Total Emails</p>
                    <p className="text-3xl font-bold mt-1 text-blue-600">{stats.totalEmails}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
                    <p className="text-sm text-gray-600">Processed</p>
                    <p className="text-3xl font-bold mt-1 text-green-600">{stats.processedEmails}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">
                    <p className="text-sm text-gray-600">Sent</p>
                    <p className="text-3xl font-bold mt-1 text-purple-600">{stats.sentEmails}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-3xl font-bold mt-1 text-red-600">{stats.failedEmails}</p>
                </div>
            </div>

            {/* Email Flow Diagram */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Processing Flow</h2>
                <EmailFlowDiagram stats={stats} loading={loading} />
            </div>

            {/* Email Volume Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Email Volume Over Time</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setChartType('line')}
                            className={`px-3 py-1 rounded text-sm ${chartType === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Line
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`px-3 py-1 rounded text-sm ${chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Bar
                        </button>
                    </div>
                </div>
                <EmailVolumeChart data={volumeData} chartType={chartType} loading={loading} />
            </div>

            {/* Activity Heatmap */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Heatmap</h2>
                <p className="text-sm text-gray-600 mb-4">Email activity by day and hour</p>
                <EmailActivityHeatmap activities={activities} loading={loading} />
            </div>

            {/* Response Time Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Time Trends</h2>
                <ResponseTimeChart data={activities} loading={loading} />
            </div>

            {/* Sentiment Analysis */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Analysis</h2>
                <SentimentAnalysis emails={emails} loading={loading} />
            </div>

            {/* User Activity Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Activity</h2>
                <UserActivityStats users={users} loading={loading} />
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity Timeline</h2>
                <ActivityTimeline activities={activities} loading={loading} />
            </div>
        </div>
    );
};

export default ActivityDashboard;
