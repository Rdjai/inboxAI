import React, { useMemo } from 'react';

const UserActivityStats = ({ users = [], loading = false }) => {
    const stats = useMemo(() => {
        if (!users || users.length === 0) {
            return [];
        }

        return users.map(user => ({
            name: user.name || user.email || 'Unknown',
            email: user.email,
            emailsProcessed: user.emailsProcessed || user.processed || 0,
            emailsSent: user.emailsSent || user.sent || 0,
            avgResponseTime: user.avgResponseTime || 0,
            completionRate: user.completionRate || 0,
            lastActive: user.lastActive || user.lastLoginAt || null,
            role: user.role || 'member'
        }));
    }, [users]);

    const totalProcessed = stats.reduce((sum, user) => sum + user.emailsProcessed, 0);
    const totalSent = stats.reduce((sum, user) => sum + user.emailsSent, 0);
    const avgCompletionRate = stats.length > 0
        ? Math.round(stats.reduce((sum, user) => sum + user.completionRate, 0) / stats.length)
        : 0;

    const getActivityLevel = (processed) => {
        if (processed === 0) return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' };
        if (processed < 10) return { label: 'Low', color: 'bg-yellow-100 text-yellow-700' };
        if (processed < 50) return { label: 'Medium', color: 'bg-blue-100 text-blue-700' };
        return { label: 'High', color: 'bg-green-100 text-green-700' };
    };

    const formatTime = (minutes) => {
        if (!minutes) return '—';
        if (minutes < 60) return `${Math.round(minutes)}m`;
        const hours = Math.round(minutes / 60);
        return `${hours}h`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!users || users.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No user activity data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-semibold">Total Processed</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{totalProcessed}</p>
                    <p className="text-xs text-blue-700 mt-2">emails by all users</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-semibold">Total Sent</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">{totalSent}</p>
                    <p className="text-xs text-green-700 mt-2">emails sent</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-semibold">Avg Completion</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">{avgCompletionRate}%</p>
                    <p className="text-xs text-purple-700 mt-2">team average</p>
                </div>
            </div>

            {/* User activity table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Activity</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Processed</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Sent</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Avg Response</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Completion</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Last Active</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {stats.map((user, index) => {
                            const activityLevel = getActivityLevel(user.emailsProcessed);
                            return (
                                <tr key={user.email || `user-${index}`} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activityLevel.color}`}>
                                            {activityLevel.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                        {user.emailsProcessed}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                        {user.emailsSent}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {formatTime(user.avgResponseTime)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-16 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${user.completionRate}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-600">{user.completionRate}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {formatDate(user.lastActive)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Top performers */}
            {stats.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-900 mb-3">Top Performers</h3>
                    <div className="space-y-2">
                        {stats
                            .sort((a, b) => b.emailsProcessed - a.emailsProcessed)
                            .slice(0, 3)
                            .map((user, index) => (
                                <div key={user.email} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg font-bold text-amber-600">#{index + 1}</span>
                                        <div>
                                            <p className="text-sm font-medium text-amber-900">{user.name}</p>
                                            <p className="text-xs text-amber-700">{user.emailsProcessed} emails processed</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl">🏆</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserActivityStats;
