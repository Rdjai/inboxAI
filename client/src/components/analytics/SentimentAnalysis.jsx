import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const SentimentAnalysis = ({ emails = [], loading = false }) => {
    const sentimentData = useMemo(() => {
        if (!emails || emails.length === 0) {
            return {
                positive: 0,
                neutral: 0,
                negative: 0
            };
        }

        const sentiments = {
            POSITIVE: 0,
            NEUTRAL: 0,
            NEGATIVE: 0
        };

        emails.forEach(email => {
            const sentiment = email.sentiment || 'NEUTRAL';
            if (sentiments.hasOwnProperty(sentiment)) {
                sentiments[sentiment]++;
            }
        });

        return {
            positive: sentiments.POSITIVE,
            neutral: sentiments.NEUTRAL,
            negative: sentiments.NEGATIVE
        };
    }, [emails]);

    const total = sentimentData.positive + sentimentData.neutral + sentimentData.negative || 1;

    const chartData = {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [
            {
                label: 'Email Count',
                data: [sentimentData.positive, sentimentData.neutral, sentimentData.negative],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(107, 114, 128, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgb(16, 185, 129)',
                    'rgb(107, 114, 128)',
                    'rgb(239, 68, 68)'
                ],
                borderWidth: 1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const value = context.parsed.y;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true
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

    return (
        <div className="space-y-6">
            <div className="h-80">
                <Bar data={chartData} options={options} />
            </div>

            {/* Sentiment breakdown cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-semibold">Positive</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">{sentimentData.positive}</p>
                        </div>
                        <span className="text-4xl">😊</span>
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                        {((sentimentData.positive / total) * 100).toFixed(1)}% of emails
                    </p>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-semibold">Neutral</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{sentimentData.neutral}</p>
                        </div>
                        <span className="text-4xl">😐</span>
                    </div>
                    <p className="text-xs text-gray-700 mt-2">
                        {((sentimentData.neutral / total) * 100).toFixed(1)}% of emails
                    </p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 font-semibold">Negative</p>
                            <p className="text-2xl font-bold text-red-900 mt-1">{sentimentData.negative}</p>
                        </div>
                        <span className="text-4xl">😞</span>
                    </div>
                    <p className="text-xs text-red-700 mt-2">
                        {((sentimentData.negative / total) * 100).toFixed(1)}% of emails
                    </p>
                </div>
            </div>

            {/* Sentiment insights */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Sentiment Insights</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li>
                        • <strong>Positive emails:</strong> {sentimentData.positive} emails with positive sentiment
                    </li>
                    <li>
                        • <strong>Neutral emails:</strong> {sentimentData.neutral} emails with neutral sentiment
                    </li>
                    <li>
                        • <strong>Negative emails:</strong> {sentimentData.negative} emails requiring attention
                    </li>
                    {sentimentData.negative > 0 && (
                        <li className="text-red-700 font-semibold">
                            ⚠️ Consider prioritizing {sentimentData.negative} negative sentiment emails
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default SentimentAnalysis;
