import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { emailsAPI } from '../services/api';
import { PageLayout, PageHeader, SectionCard } from '../components/layout/PageLayout';

const REVIEW_STATUSES = ['DRAFTED', 'REVIEWED'];

const normalizeEmailList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.emails)) return payload.emails;
    return [];
};

const getWaitLabel = (dateValue) => {
    if (!dateValue) return '-';
    const created = new Date(dateValue);
    if (Number.isNaN(created.getTime())) return '-';
    const mins = Math.max(1, Math.floor((Date.now() - created.getTime()) / 60000));
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
};

const getPriorityBadge = (priority = '') => {
    const value = String(priority).toUpperCase();
    if (value === 'URGENT' || value === 'HIGH') return 'bg-red-100 text-red-800';
    if (value === 'MEDIUM') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
};

const Review = () => {
    const navigate = useNavigate();
    const [pendingReviews, setPendingReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState('');

    const fetchReviewQueue = async () => {
        try {
            setLoading(true);
            const responses = await Promise.all(
                REVIEW_STATUSES.map((status) =>
                    emailsAPI.getAllEmails({
                        status,
                        limit: 100,
                        sortBy: 'createdAt',
                        sortOrder: 'desc'
                    })
                )
            );

            const merged = responses
                .flatMap((response) => normalizeEmailList(response))
                .filter(Boolean);

            const uniqueById = Array.from(
                new Map(merged.map((email) => [email._id || email.id || email.messageId, email])).values()
            );

            setPendingReviews(uniqueById);
        } catch (error) {
            console.error('Failed to load review queue:', error);
            toast.error(error.message || 'Failed to load review queue');
            setPendingReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviewQueue();
    }, []);

    const stats = useMemo(() => {
        const total = pendingReviews.length;
        const drafted = pendingReviews.filter((e) => e.status === 'DRAFTED').length;
        const reviewed = pendingReviews.filter((e) => e.status === 'REVIEWED').length;
        const avgWaitMins = total === 0
            ? 0
            : Math.round(
                pendingReviews.reduce((sum, e) => {
                    const t = new Date(e.createdAt).getTime();
                    if (Number.isNaN(t)) return sum;
                    return sum + Math.max(1, Math.floor((Date.now() - t) / 60000));
                }, 0) / total
            );

        const avgWaitLabel = avgWaitMins < 60
            ? `${avgWaitMins} min`
            : `${(avgWaitMins / 60).toFixed(1)}h`;

        return { total, drafted, reviewed, avgWaitLabel };
    }, [pendingReviews]);

    const handleApprove = async (emailId) => {
        try {
            setApprovingId(emailId);
            await emailsAPI.approveEmail(emailId);
            toast.success('Email approved');
            setPendingReviews((prev) => prev.filter((email) => email._id !== emailId && email.id !== emailId));
        } catch (error) {
            toast.error(error.message || 'Failed to approve email');
        } finally {
            setApprovingId('');
        }
    };

    return (
        <PageLayout>
            <PageHeader
                title="Review Queue"
                description="Emails waiting for human review"
                actions={(
                    <button
                        onClick={fetchReviewQueue}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-5 w-5 text-yellow-700" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">{stats.total}</h3>
                            <p className="text-gray-600 text-sm">Pending Review</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">{stats.avgWaitLabel}</h3>
                            <p className="text-gray-600 text-sm">Avg Wait Time</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-5 w-5 text-orange-700" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">{stats.drafted}</h3>
                            <p className="text-gray-600 text-sm">Drafted</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-700" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">{stats.reviewed}</h3>
                            <p className="text-gray-600 text-sm">Reviewed</p>
                        </div>
                    </div>
                </div>
            </div>

            <SectionCard>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Pending Reviews ({pendingReviews.length})</h2>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={pendingReviews.length === 0}
                        onClick={() => navigate(`/email/${pendingReviews[0]?._id || pendingReviews[0]?.id}`)}
                    >
                        Start Review Session
                    </button>
                </div>

                {loading ? (
                    <div className="py-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    </div>
                ) : pendingReviews.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500">No emails are waiting for review.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingReviews.map((review) => {
                            const emailId = review._id || review.id;
                            return (
                                <div key={emailId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityBadge(review.priority)}`}>
                                                {review.priority || 'LOW'}
                                            </span>
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                {review.category || 'uncategorized'}
                                            </span>
                                            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                                {review.status || 'UNKNOWN'}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900 truncate">{review.subject || '(No Subject)'}</h4>
                                        <p className="text-sm text-gray-600 truncate">From: {review.fromAddress || review.from || 'Unknown sender'}</p>
                                    </div>

                                    <div className="ml-4 flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="flex items-center text-yellow-700 justify-end">
                                                <Clock className="h-4 w-4 mr-1" />
                                                <span className="text-sm font-medium">{getWaitLabel(review.createdAt)}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">Waiting</p>
                                        </div>

                                        <button
                                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                                            onClick={() => navigate(`/email/${emailId}`)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                            onClick={() => handleApprove(emailId)}
                                            disabled={approvingId === emailId}
                                        >
                                            {approvingId === emailId ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </SectionCard>
        </PageLayout>
    );
};

export default Review;
