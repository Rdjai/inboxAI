import React from 'react';
import { Send, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';

const Sent = () => {
    const sentEmails = [
        {
            id: 1,
            subject: 'Welcome to InboxAI!',
            to: 'newuser@example.com',
            sentAt: '10:30 AM',
            status: 'delivered',
            opens: 1,
            clicks: 0,
        },
        {
            id: 2,
            subject: 'Monthly Report - March 2024',
            to: 'team@company.com',
            sentAt: 'Yesterday, 2:45 PM',
            status: 'opened',
            opens: 5,
            clicks: 2,
        },
        {
            id: 3,
            subject: 'Payment Confirmation',
            to: 'customer@business.com',
            sentAt: 'Mar 12, 11:20 AM',
            status: 'clicked',
            opens: 3,
            clicks: 1,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Sent Emails</h1>
                <p className="text-gray-600 mt-2">Track your email campaigns and performance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Send className="h-8 w-8 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">1,245</h3>
                            <p className="text-gray-600">Total Sent</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">89%</h3>
                            <p className="text-gray-600">Delivery Rate</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">42%</h3>
                            <p className="text-gray-600">Open Rate</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-8 w-8 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">18%</h3>
                            <p className="text-gray-600">Click Rate</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2 className="text-xl font-bold mb-4">Recently Sent</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Recipient</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Sent</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Opens</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Clicks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sentEmails.map((email) => (
                                <tr key={email.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="font-medium">{email.subject}</div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">{email.to}</td>
                                    <td className="py-3 px-4 text-gray-600">{email.sentAt}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${email.status === 'delivered' ? 'bg-gray-100 text-gray-800' :
                                                email.status === 'opened' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {email.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <span className="font-medium">{email.opens}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <span className="font-medium">{email.clicks}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Sent;