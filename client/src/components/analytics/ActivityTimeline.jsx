import React from 'react';
import { format, parseISO, isValid } from 'date-fns';

const ActivityTimeline = ({ activities = [], loading = false }) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No activity recorded</p>
            </div>
        );
    }

    const getActivityIcon = (action) => {
        const iconMap = {
            'CREATED': '✉️',
            'CLASSIFIED': '🏷️',
            'DRAFTED': '📝',
            'REVIEWED': '👁️',
            'APPROVED': '✅',
            'SENT': '📤',
            'FAILED': '❌',
            'REPLIED': '↩️',
            'FORWARDED': '➡️',
            'ASSIGNED': '👤',
            'UNASSIGNED': '🚫',
            'EDITED': '✏️',
            'DELETED': '🗑️'
        };
        return iconMap[action] || '📧';
    };

    const getActivityColor = (action) => {
        const colorMap = {
            'CREATED': 'bg-blue-50 border-blue-200',
            'CLASSIFIED': 'bg-purple-50 border-purple-200',
            'DRAFTED': 'bg-yellow-50 border-yellow-200',
            'REVIEWED': 'bg-indigo-50 border-indigo-200',
            'APPROVED': 'bg-green-50 border-green-200',
            'SENT': 'bg-green-50 border-green-200',
            'FAILED': 'bg-red-50 border-red-200',
            'REPLIED': 'bg-blue-50 border-blue-200',
            'FORWARDED': 'bg-cyan-50 border-cyan-200',
            'ASSIGNED': 'bg-orange-50 border-orange-200',
            'UNASSIGNED': 'bg-gray-50 border-gray-200',
            'EDITED': 'bg-amber-50 border-amber-200',
            'DELETED': 'bg-red-50 border-red-200'
        };
        return colorMap[action] || 'bg-gray-50 border-gray-200';
    };

    const getActionLabel = (action) => {
        return action
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    return (
        <div className="space-y-4">
            {activities.map((activity, index) => {
                const timestamp = activity.createdAt || activity.timestamp;
                const date = timestamp ? parseISO(timestamp) : null;
                const isValidDate = date && isValid(date);

                return (
                    <div
                        key={activity._id || `activity-${index}`}
                        className={`border-l-4 p-4 rounded-r-lg ${getActivityColor(activity.action)}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                                <span className="text-2xl">{getActivityIcon(activity.action)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900">
                                        {getActionLabel(activity.action)}
                                    </p>
                                    {activity.emailId?.subject && (
                                        <p className="text-sm text-gray-600 truncate mt-1">
                                            Subject: {activity.emailId.subject}
                                        </p>
                                    )}
                                    {activity.userId && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            By: {activity.userId.name || activity.userId.email || 'Unknown'}
                                        </p>
                                    )}
                                    {activity.details && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            {activity.details}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {isValidDate && (
                                <div className="text-right ml-4 flex-shrink-0">
                                    <p className="text-xs text-gray-500 whitespace-nowrap">
                                        {format(date, 'MMM d')}
                                    </p>
                                    <p className="text-xs text-gray-400 whitespace-nowrap">
                                        {format(date, 'h:mm a')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ActivityTimeline;
