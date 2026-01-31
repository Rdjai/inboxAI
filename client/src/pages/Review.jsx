import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Review = () => {
    const pendingReviews = [
        {
            id: 1,
            subject: 'Refund Request - Order #12345',
            from: 'customer@example.com',
            priority: 'high',
            category: 'refund',
            waitingFor: '30 min',
        },
        {
            id: 2,
            subject: 'Bug Report - Mobile App',
            from: 'user@tech.com',
            priority: 'urgent',
            category: 'issue',
            waitingFor: '1 hour',
        },
        {
            id: 3,
            subject: 'Billing Inquiry',
            from: 'client@business.com',
            priority: 'medium',
            category: 'billing',
            waitingFor: '2 hours',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Review Queue</h1>
                <p className="text-gray-600 mt-2">Emails waiting for human review</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-warning-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-8 w-8 text-warning-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">12</h3>
                            <p className="text-gray-600">Pending Review</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">1.2h</h3>
                            <p className="text-gray-600">Avg Wait Time</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-success-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-success-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">85%</h3>
                            <p className="text-gray-600">Approval Rate</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-danger-100 rounded-lg flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-danger-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">5%</h3>
                            <p className="text-gray-600">Rejection Rate</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Pending Reviews ({pendingReviews.length})</h2>
                    <button className="btn-primary">
                        Start Review Session
                    </button>
                </div>

                <div className="space-y-4">
                    {pendingReviews.map((review) => (
                        <div key={review.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${review.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                            review.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                'bg-blue-100 text-blue-800'
                                        }`}>
                                        {review.priority}
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                                        {review.category}
                                    </span>
                                </div>

                                <h4 className="font-medium text-lg">{review.subject}</h4>
                                <p className="text-gray-600">From: {review.from}</p>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="text-right">
                                    <div className="flex items-center text-warning-600">
                                        <Clock className="h-4 w-4 mr-1" />
                                        <span className="text-sm font-medium">{review.waitingFor}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Waiting</p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button className="btn-success px-4 py-2">
                                        <CheckCircle className="h-5 w-5" />
                                    </button>
                                    <button className="btn-danger px-4 py-2">
                                        <XCircle className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Review;