import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, truncateText, getInitials } from '../../utils/helpers';
import { getStatusColor, getPriorityColor, getCategoryIcon } from '../../utils/helpers';

const EmailCard = ({ email, showAccount = false }) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold">
                                    {getInitials(email.from?.name || email.from?.email)}
                                </span>
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {email.from?.name || email.from?.email || 'Unknown Sender'}
                                </p>
                                {!email.isRead && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                                to: {email.to?.map(t => t.name || t.email).join(', ') || 'Unknown'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <span className="text-xs text-gray-500">
                            {formatDate(email.receivedAt || email.sentAt)}
                        </span>
                        {email.priority && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(email.priority)}`}>
                                {email.priority}
                            </span>
                        )}
                    </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">
                    {email.subject || '(No Subject)'}
                </h3>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {truncateText(email.body?.text || email.body?.html || '', 150)}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {email.category && (
                            <span className="flex items-center text-xs text-gray-500">
                                <span className="mr-1">{getCategoryIcon(email.category)}</span>
                                {email.category}
                            </span>
                        )}

                        {email.labels && email.labels.length > 0 && (
                            <div className="flex space-x-1">
                                {email.labels.slice(0, 2).map((label, index) => (
                                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                        {label}
                                    </span>
                                ))}
                                {email.labels.length > 2 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                        +{email.labels.length - 2}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Reply
                        </button>
                        <Link to={`/email/${email._id}`} className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                            View
                        </Link>
                    </div>
                </div>

                {showAccount && email.emailAccount && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center text-xs text-gray-500">
                            <span className="mr-2">From account:</span>
                            <span className="font-medium">{email.emailAccount.email}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailCard;