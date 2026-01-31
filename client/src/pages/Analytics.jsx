import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
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

const Analytics = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week');
    const [overview, setOverview] = useState(null);
    const [emailStats, setEmailStats] = useState(null);
    const [accountStats, setAccountStats] = useState(null);
    const [categoryData, setCategoryData] = useState(null);

    useEffect(() => {
        fetchAnalyticsData();
    }, [timeRange]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);

            // You'll need to implement these API endpoints in your backend
            // For now, using mock data
            const mockOverview = {
                totalEmails: 1247,
                sentEmails: 543,
                receivedEmails: 704,
                unreadEmails: 42,
                responseRate: '78%',
                avgResponseTime: '2.4h',
            };

            const mockEmailStats = {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                sent: [45, 52, 48, 67, 59, 32, 18],
                received: [67, 59, 71, 84, 62, 45, 28],
            };

            const mockAccountStats = [
                { account: 'work@company.com', sent: 234, received: 312, unread: 8 },
                { account: 'personal@gmail.com', sent: 189, received: 267, unread: 21 },
                { account: 'projects@client.com', sent: 120, received: 125, unread: 13 },
            ];

            const mockCategoryData = {
                labels: ['Work', 'Personal', 'Newsletters', 'Promotions', 'Social', 'Spam'],
                data: [45, 25, 15, 8, 5, 2],
            };

            setOverview(mockOverview);
            setEmailStats(mockEmailStats);
            setAccountStats(mockAccountStats);
            setCategoryData(mockCategoryData);

        } catch (error) {
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const emailChartData = {
        labels: emailStats?.labels || [],
        datasets: [
            {
                label: 'Sent',
                data: emailStats?.sent || [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
            },
            {
                label: 'Received',
                data: emailStats?.received || [],
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
            },
        ],
    };

    const categoryChartData = {
        labels: categoryData?.labels || [],
        datasets: [
            {
                data: categoryData?.data || [],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(14, 165, 233, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 20,
                },
            },
        },
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
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-600 mt-1">
                        Insights into your email activity and performance
                    </p>
                </div>

                <div className="flex items-center space-x-2">
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

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Emails</p>
                            <p className="text-2xl font-bold mt-1">{overview?.totalEmails || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 text-xl">📧</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        All emails across your accounts
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Unread Emails</p>
                            <p className="text-2xl font-bold mt-1">{overview?.unreadEmails || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <span className="text-yellow-600 text-xl">🔔</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Requires your attention
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Response Rate</p>
                            <p className="text-2xl font-bold mt-1">{overview?.responseRate || '0%'}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-green-600 text-xl">⚡</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Emails replied vs received
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Avg Response Time</p>
                            <p className="text-2xl font-bold mt-1">{overview?.avgResponseTime || '0h'}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 text-xl">⏱️</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Average time to reply
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email Activity Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Activity</h2>
                    <div className="h-64">
                        <Line data={emailChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Category Distribution Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h2>
                    <div className="h-64">
                        <Pie data={categoryChartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Account Performance */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Performance</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Account
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sent
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Received
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Unread
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Response Rate
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {accountStats?.map((account, index) => {
                                const responseRate = Math.round((account.sent / account.received) * 100) || 0;
                                return (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {account.account}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {account.sent}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {account.received}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${account.unread > 10
                                                ? 'bg-red-100 text-red-800'
                                                : account.unread > 0
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}>
                                                {account.unread}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${Math.min(responseRate, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="ml-2 text-sm text-gray-500">{responseRate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Insights & Recommendations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-green-600">📈</span>
                            </div>
                            <h3 className="font-medium">Peak Activity</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Your busiest email hours are between 10 AM - 2 PM. Consider scheduling important emails during this time.
                        </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-blue-600">⏰</span>
                            </div>
                            <h3 className="font-medium">Response Time</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Your average response time is improving. Try to respond within 24 hours for better communication.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;