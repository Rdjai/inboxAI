import React, { useState, useEffect } from 'react';
import { emailAccountsAPI, emailsAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalAccounts: 0,
        totalEmails: 0,
        unreadEmails: 0,
        sentToday: 0
    });
    const [accounts, setAccounts] = useState([]);
    const [recentEmails, setRecentEmails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch accounts
            const accountsRes = await emailAccountsAPI.getAccounts();
            setAccounts(accountsRes.accounts || []);

            // Calculate stats
            let totalEmails = 0;
            let unreadEmails = 0;
            const accountsList = accountsRes.accounts || [];

            // Fetch emails for each account
            const emailPromises = accountsList.map(async (account) => {
                try {
                    const emailsRes = await emailsAPI.getEmails(account._id, { limit: 5 });
                    return emailsRes.emails || [];
                } catch (error) {
                    return [];
                }
            });

            const allEmails = await Promise.all(emailPromises);
            const flattenedEmails = allEmails.flat();

            // Update recent emails
            setRecentEmails(flattenedEmails.slice(0, 10));

            // Calculate stats
            setStats({
                totalAccounts: accountsList.length,
                totalEmails: flattenedEmails.length,
                unreadEmails: flattenedEmails.filter(email => !email.isRead).length,
                sentToday: 0 // You'll need to implement this based on your data
            });

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
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
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h1>
                <p className="opacity-90">
                    Here's what's happening with your email accounts today.
                </p>
                <div className="mt-4 flex items-center space-x-2">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-sm">
                        {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
                    </div>
                    <div className="text-sm opacity-80">
                        Last login: {user?.lastLogin ? format(new Date(user.lastLogin), 'MMM d, h:mm a') : 'Never'}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Email Accounts</p>
                            <p className="text-2xl font-bold mt-1">{stats.totalAccounts}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 text-xl">📧</span>
                        </div>
                    </div>
                    <Link to="/accounts" className="mt-4 block text-sm text-blue-600 hover:text-blue-800">
                        Manage accounts →
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Emails</p>
                            <p className="text-2xl font-bold mt-1">{stats.totalEmails}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-green-600 text-xl">📥</span>
                        </div>
                    </div>
                    <Link to="/inbox" className="mt-4 block text-sm text-green-600 hover:text-green-800">
                        View inbox →
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Unread</p>
                            <p className="text-2xl font-bold mt-1">{stats.unreadEmails}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <span className="text-yellow-600 text-xl">🔔</span>
                        </div>
                    </div>
                    <Link to="/inbox?filter=unread" className="mt-4 block text-sm text-yellow-600 hover:text-yellow-800">
                        Mark as read →
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Sent Today</p>
                            <p className="text-2xl font-bold mt-1">{stats.sentToday}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 text-xl">📤</span>
                        </div>
                    </div>
                    <Link to="/compose" className="mt-4 block text-sm text-purple-600 hover:text-purple-800">
                        Compose email →
                    </Link>
                </div>
            </div>

            {/* Recent Emails */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Emails</h2>
                    <Link to="/inbox" className="text-sm text-blue-600 hover:text-blue-800">
                        View all →
                    </Link>
                </div>

                {recentEmails.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No emails yet</h3>
                        <p className="text-gray-500">Start by adding an email account</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentEmails.map((email) => (
                            <div key={email._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                        <span className="text-gray-600 text-sm font-medium">
                                            {email.from?.name?.charAt(0) || email.from?.email?.charAt(0) || '?'}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-medium truncate ${!email.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {email.from?.name || email.from?.email || 'Unknown'}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">{email.subject || '(No subject)'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-xs text-gray-500">
                                        {format(new Date(email.receivedAt), 'MMM d')}
                                    </span>
                                    {!email.isRead && (
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-2">Add Email Account</h3>
                    <p className="text-blue-700 text-sm mb-4">
                        Connect your Gmail, Outlook, or custom email account
                    </p>
                    <Link to="/accounts" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                        Add Account
                    </Link>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
                    <h3 className="font-semibold text-green-900 mb-2">Compose Email</h3>
                    <p className="text-green-700 text-sm mb-4">
                        Send a new email from any of your connected accounts
                    </p>
                    <Link to="/compose" className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                        Compose
                    </Link>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
                    <h3 className="font-semibold text-purple-900 mb-2">Team Management</h3>
                    <p className="text-purple-700 text-sm mb-4">
                        {user?.role === 'admin' ? 'Manage team members and permissions' : 'View team members'}
                    </p>
                    <Link to="/team" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
                        {user?.role === 'admin' ? 'Manage Team' : 'View Team'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;