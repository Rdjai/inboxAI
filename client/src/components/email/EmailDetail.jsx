import React, { useState } from 'react';
import { format } from 'date-fns';
import {
    X,
    Edit2,
    Send,
    CheckCircle,
    Download,
    User,
    Clock,
    AlertCircle,
    Paperclip,
    Copy,
    RefreshCw
} from 'lucide-react';
import { useEmail } from '../../context/EmailContext';
import toast from 'react-hot-toast';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';

const EmailDetail = ({ email, onClose }) => {
    const { updateEmail, approveEmail, sendEmail, replyToEmail } = useEmail();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(email.draft || '');
    const [saving, setSaving] = useState(false);
    const [replying, setReplying] = useState(false);
    const [reply, setReply] = useState('');

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            await updateEmail(email._id, { draft });
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async () => {
        await approveEmail(email._id);
    };

    const handleSend = async () => {
        await sendEmail(email._id);
    };

    const handleReply = async () => {
        if (!reply.trim()) {
            toast.error('Reply content is required');
            return;
        }
        const result = await replyToEmail(email._id, reply);
        if (result.success) {
            setReply('');
            setReplying(false);
        }
    };

    const canEdit = ['drafted', 'reviewed'].includes(email.status);
    const canApprove = email.status === 'reviewed' || email.status === 'drafted';
    const canSend = email.status === 'approved';

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">{email.subject}</h1>
                        <div className="flex items-center space-x-4 mt-2">
                            <StatusBadge status={email.status} />
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${email.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                email.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                    email.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {email.priority}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    {canEdit && (
                        <button
                            onClick={() => setEditing(!editing)}
                            className="btn-secondary"
                        >
                            <Edit2 className="h-4 w-4 mr-2" />
                            {editing ? 'Cancel Edit' : 'Edit Draft'}
                        </button>
                    )}

                    {canApprove && (
                        <button
                            onClick={handleApprove}
                            className="btn-success"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                        </button>
                    )}

                    {canSend && (
                        <button
                            onClick={handleSend}
                            className="btn-primary"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Send Now
                        </button>
                    )}

                    <button className="btn-secondary">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                    </button>

                    <button className="btn-secondary">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                    </button>
                </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Sender Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <User className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                                <p className="font-medium">{email.from || email.fromAddress}</p>
                                <p className="text-sm text-gray-500">to {email.to || email.toAddress}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">
                                {format(new Date(email.createdAt), 'PPpp')}
                            </p>
                            {email.sentAt && (
                                <p className="text-sm text-gray-500">
                                    Sent: {format(new Date(email.sentAt), 'PPpp')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Original Email */}
                <div className="mb-6">
                    <h3 className="font-semibold mb-2">Original Message</h3>
                    <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                        {email.body || email.bodyText}
                    </div>
                </div>

                {/* AI Analysis */}
                {email.keyInfo && (
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">AI Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <AlertCircle className="h-5 w-5 text-blue-600" />
                                    <span className="font-medium">Category</span>
                                </div>
                                <p className="text-lg font-bold capitalize">{email.category}</p>
                                <p className="text-sm text-gray-600">
                                    Confidence: {(email.confidence * 100).toFixed(1)}%
                                </p>
                            </div>

                            {email.keyInfo.urgency && (
                                <div className="p-4 bg-orange-50 rounded-lg">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Clock className="h-5 w-5 text-orange-600" />
                                        <span className="font-medium">Urgency</span>
                                    </div>
                                    <p className="text-lg font-bold capitalize">{email.keyInfo.urgency}</p>
                                </div>
                            )}

                            {email.keyInfo.sentiment && (
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <User className="h-5 w-5 text-purple-600" />
                                        <span className="font-medium">Sentiment</span>
                                    </div>
                                    <p className="text-lg font-bold capitalize">{email.keyInfo.sentiment}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Draft Response */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">AI Draft Response</h3>
                        <div className="flex items-center space-x-2">
                            {editing ? (
                                <>
                                    <button
                                        onClick={handleSaveDraft}
                                        disabled={saving}
                                        className="btn-primary px-3 py-1 text-sm"
                                    >
                                        {saving ? <LoadingSpinner size="small" /> : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="btn-secondary px-3 py-1 text-sm"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditing(!editing)}
                                    className="btn-secondary px-3 py-1 text-sm"
                                >
                                    <Edit2 className="h-3 w-3 mr-1" />
                                    Edit
                                </button>
                            )}
                        </div>
                    </div>

                    {editing ? (
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Write your response..."
                        />
                    ) : (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg whitespace-pre-wrap">
                            {email.draft || 'No draft generated yet'}
                        </div>
                    )}
                </div>

                {/* Attachments */}
                {email.attachments && email.attachments.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Attachments</h3>
                        <div className="space-y-2">
                            {email.attachments.map((attachment, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                                >
                                    <div className="flex items-center space-x-3">
                                        <Paperclip className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="font-medium">{attachment.filename}</p>
                                            <p className="text-sm text-gray-500">
                                                {(attachment.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <button className="btn-secondary px-3 py-1 text-sm">
                                        <Download className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Audit Log */}
                {email.auditLogs && email.auditLogs.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">Activity Log</h3>
                        <div className="space-y-3">
                            {email.auditLogs.map((log, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                                        <User className="h-4 w-4 text-primary-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium capitalize">{log.action}</p>
                                            <p className="text-sm text-gray-500">
                                                {format(new Date(log.createdAt), 'PPpp')}
                                            </p>
                                        </div>
                                        {log.user && (
                                            <p className="text-sm text-gray-600">
                                                By {log.user.name} ({log.user.email})
                                            </p>
                                        )}
                                        {log.details && Object.keys(log.details).length > 0 && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                {JSON.stringify(log.details)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Reply Section */}
            {replying ? (
                <div className="p-6 border-t border-gray-200">
                    <h3 className="font-semibold mb-2">Reply</h3>
                    <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
                        placeholder="Write your reply..."
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setReplying(false)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReply}
                            className="btn-primary"
                        >
                            Send Reply
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-6 border-t border-gray-200">
                    <button
                        onClick={() => setReplying(true)}
                        className="btn-primary w-full"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Reply to Email
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmailDetail;
