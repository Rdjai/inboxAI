import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const ResponseTimeChart = ({ data = [], loading = false }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                labels: [],
                datasets: []
            };
        }

        // Group data by date
        const groupedByDate = {};
        data.forEach(item => {
            const date = item.date || item.createdAt;
            if (date) {
                const dateStr = new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
                if (!groupedByDate[dateStr]) {
                    groupedByDate[dateStr] = [];
                }
                groupedByDate[dateStr].push(item.responseTime || item.avgResponseTime || 0);
            }
        });

        // Calculate averages
        const labels = Object.keys(groupedByDate).sort();
        const avgResponseTimes = labels.map(date => {
            const times = groupedByDate[date];
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            return Math.round(avg);
        });

        const minResponseTimes = labels.map(date => {
            const times = groupedByDate[date];
            return Math.min(...times);
        });

        const maxResponseTimes = labels.map(date => {
            const times = groupedByDate[date];
            return Math.max(...times);
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Average Response Time (minutes)',
                    data: avgResponseTimes,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Min Response Time (minutes)',
                    data: minResponseTimes,
                    borderColor: 'rgb(16, 185, 129)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgb(16, 185, 129)'
                },
                {
                    label: 'Max Response Time (minutes)',
                    data: maxResponseTimes,
                    borderColor: 'rgb(239, 68, 68)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgb(239, 68, 68)'
                }
            ]
        };
    }, [data]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 14 },
                bodyFont: { size: 13 },
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${context.parsed.y} min`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Minutes'
                },
                ticks: {
                    callback: function (value) {
                        return value + ' min';
                    }
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No response time data available</p>
            </div>
        );
    }

    return (
        <div className="h-80">
            <Line data={chartData} options={options} />
        </div>
    );
};

export default ResponseTimeChart;
