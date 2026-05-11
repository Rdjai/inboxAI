import React, { useMemo } from 'react';

const EmailActivityHeatmap = ({ activities = [], loading = false }) => {
    const heatmapData = useMemo(() => {
        if (!activities || activities.length === 0) return {};

        const data = {};
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const hours = Array.from({ length: 24 }, (_, i) => i);

        // Initialize grid
        days.forEach(day => {
            data[day] = {};
            hours.forEach(hour => {
                data[day][hour] = 0;
            });
        });

        // Populate with activity data
        activities.forEach(activity => {
            const timestamp = activity.createdAt || activity.timestamp;
            if (timestamp) {
                const date = new Date(timestamp);
                const day = days[date.getDay()];
                const hour = date.getHours();
                data[day][hour]++;
            }
        });

        return data;
    }, [activities]);

    const getIntensityColor = (count, maxCount) => {
        if (count === 0) return 'bg-gray-100';
        const intensity = count / maxCount;
        if (intensity > 0.8) return 'bg-blue-600';
        if (intensity > 0.6) return 'bg-blue-500';
        if (intensity > 0.4) return 'bg-blue-400';
        if (intensity > 0.2) return 'bg-blue-300';
        return 'bg-blue-200';
    };

    const maxCount = useMemo(() => {
        let max = 0;
        Object.values(heatmapData).forEach(dayData => {
            Object.values(dayData).forEach(count => {
                if (count > max) max = count;
            });
        });
        return max || 1;
    }, [heatmapData]);

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
                <p className="text-gray-500">No activity data available</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
                {/* Header with hours */}
                <div className="flex">
                    <div className="w-12 flex-shrink-0"></div>
                    <div className="flex gap-1">
                        {Array.from({ length: 24 }, (_, i) => (
                            <div key={`hour-${i}`} className="w-8 h-6 flex items-center justify-center text-xs text-gray-600">
                                {i % 6 === 0 ? `${i}h` : ''}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Heatmap grid */}
                {Object.entries(heatmapData).map(([day, hourData]) => (
                    <div key={day} className="flex gap-1 mb-1">
                        <div className="w-12 flex-shrink-0 flex items-center justify-center text-xs font-medium text-gray-600">
                            {day}
                        </div>
                        <div className="flex gap-1">
                            {Array.from({ length: 24 }, (_, hour) => {
                                const count = hourData[hour] || 0;
                                return (
                                    <div
                                        key={`${day}-${hour}`}
                                        className={`w-8 h-8 rounded ${getIntensityColor(count, maxCount)} cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all`}
                                        title={`${day} ${hour}:00 - ${count} activities`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Legend */}
                <div className="mt-4 flex items-center justify-end gap-2 text-xs">
                    <span className="text-gray-600">Less</span>
                    <div className="flex gap-1">
                        <div className="w-4 h-4 bg-gray-100 rounded"></div>
                        <div className="w-4 h-4 bg-blue-200 rounded"></div>
                        <div className="w-4 h-4 bg-blue-400 rounded"></div>
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    </div>
                    <span className="text-gray-600">More</span>
                </div>
            </div>
        </div>
    );
};

export default EmailActivityHeatmap;
