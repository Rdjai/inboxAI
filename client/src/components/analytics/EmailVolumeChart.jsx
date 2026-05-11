import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const EmailVolumeChart = ({ data = [], chartType = 'line', loading = false }) => {
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
                    groupedByDate[dateStr] = {
                        received: 0,
                        sent: 0,
                        failed: 0
                    };
                }
                if (item.type === 'sent' || item.status === 'SENT') {
                    groupedByDate[dateStr].sent++;
                } else if (item.type === 'failed' || item.status === 'FAILED') {
                    groupedByDate[dateStr].failed++;
                } else {
                    groupedByDate[dateStr].received++;
                }
            }
        });

        const labels = Object.keys(groupedByDate).sort();
        const received = labels.map(date => groupedByDate[date].received);
        const sent = labels.map(date => groupedByDate[date].sent);
        const failed = labels.map(date => groupedByDate[date].failed);

        return {
            labels,
            datasets: [
                {
                    label: 'Received',
                    data: received,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: chartType === 'line' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.8)',
                    fill: chartType === 'line',
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Sent',
                    data: sent,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: chartType === 'line' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.8)',
                    fill: chartType === 'line',
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(16, 185, 129)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Failed',
                    data: failed,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: chartType === 'line' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.8)',
                    fill: chartType === 'line',
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(239, 68, 68)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        };
    }, [data, chartType]);

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
                bodyFont: { size: 13 }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return value + ' emails';
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
                <p className="text-gray-500">No email volume data available</p>
            </div>
        );
    }

    const ChartComponent = chartType === 'line' ? Line : Bar;

    return (
        <div className="h-80">
            <ChartComponent data={chartData} options={options} />
        </div>
    );
};

export default EmailVolumeChart;
