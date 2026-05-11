import React, { useEffect, useState } from 'react';
import { chartAggregationAPI } from '../services/api';
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

    const [volumeData, setVolumeData] = useState([]);
    const [statusDist, setStatusDist] = useState({});
    const [categoryDist, setCategoryDist] = useState({});
    const [priorityDist, setPriorityDist] = useState({});
    const [sentimentDist, setSentimentDist] = useState({});
    const [responseTimeStats, setResponseTimeStats] = useState({});
    const [responseTimeByDate, setResponseTimeByDate] = useState([]);
    const [userStats, setUserStats] = useState([]);
    const [heatmapData, setHeatmapData] = useState({});
    const [processingFlow, setProcessingFlow] = useState({});

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

            // Fetch all data in parallel
            const [
                volumeRes,
                statusRes,
                categoryRes,
                priorityRes,
                sentimentRes,
                responseTimeRes,
                responseTimeByDateRes,
                userActivityRes,
                heatmapRes,
                processingFlowRes
            ] = await Promise.allSettled([
                chartAggregationAPI.getEmailVolume(params),
                chartAggregationAPI.getStatusDistribution(params),
                chartAggregationAPI.getCategoryDistribution(params),
                chartAggregationAPI.getPriorityDistribution(params),
                chartAggregationAPI.getSentimentDistribution(params),
                chartAggregationAPI.getResponseTimeStats(params),
                chartAggregationAPI.getResponseTimeByDate(params),
                chartAggregationAPI.getUserActivityStats(params),
                chartAggregationAPI.getActivityHeatmap(params),
                chartAggregationAPI.getEmailProcessingFlow(params)
            ]);

            // Process results
            if (volumeRes.status === 'fulfilled') {
                setVolumeData(volumeRes.value?.data || []);
            }
            if (statusRes.status === 'fulfilled') {
                setStatusDist(statusRes.value?.data || {});
            }
            if (categoryRes.status === 'fulfilled') {
                setCategoryDist(categoryRes.value?.data || {});
            }
            if (priorityRes.status === 'fulfilled') {
                setPriorityDist(priorityRes.value?.data || {});
            }
            if (sentimentRes.status === 'fulfilled') {
                setSentimentDist(sentimentRes.value?.data || {});
            }
            if (responseTimeRes.status === 'fulfilled') {
                setResponseTimeStats(responseTimeRes.value?.data || {});
            }
            if (responseTimeByDateRes.status === 'fulfilled') {
                setResponseTimeByDate(responseTimeByDateRes.value?.data || []);
            }
            if (userActivityRes.status === 'fulfilled') {
                setUserStats(userActivityRes.value?.data || []);
            }
            if (heatmapRes.status === 'fulfilled') {
                setHeatmapData(heatmapRes.value?.data || {});
            }
            if (processingFlowRes.status === 'fulfilled') {
                setProcessingFlow(processingFlowRes.value?.data || {});
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
                    <p className="text-3xl font-bold mt-1 text-blue-600">{processingFlow.total || 0}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
                    <p className="text-sm text-gray-600">Processed</p>
                    <p className="text-3xl font-bold mt-1 text-green-600">{processingFlow.classified || 0}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">
                    <p className="text-sm text-gray-600">Sent</p>
                    <p className="text-3xl font-bold mt-1 text-purple-600">{processingFlow.sent || 0}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-3xl font-bold mt-1 text-red-600">{processingFlow.failed || 0}</p>
                </div>
            </div>

            {/* Email Flow Diagram */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Processing Flow</h2>
                <EmailFlowDiagram stats={processingFlow} loading={loading} />
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
                <EmailActivityHeatmap activities={Object.values(heatmapData).flat()} loading={loading} />
            </div>

            {/* Response Time Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Time Trends</h2>
                <ResponseTimeChart data={responseTimeByDate} loading={loading} />
            </div>

            {/* Sentiment Analysis */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Analysis</h2>
                <SentimentAnalysis emails={[]} loading={loading} />
            </div>

            {/* User Activity Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Activity</h2>
                <UserActivityStats users={userStats} loading={loading} />
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribution Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Status Distribution</h3>
                        <div className="space-y-2">
                            {Object.entries(statusDist).map(([status, count]) => (
                                <div key={status} className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">{status}</span>
                                    <span className="font-semibold text-gray-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Category Distribution</h3>
                        <div className="space-y-2">
                            {Object.entries(categoryDist).slice(0, 5).map(([category, count]) => (
                                <div key={category} className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">{category}</span>
                                    <span className="font-semibold text-gray-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Priority Distribution</h3>
                        <div className="space-y-2">
                            {Object.entries(priorityDist).map(([priority, count]) => (
                                <div key={priority} className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">{priority}</span>
                                    <span className="font-semibold text-gray-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityDashboard;
