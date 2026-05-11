import React from 'react';
import { FileText, Edit2, Send, Clock } from 'lucide-react';

const Drafts = () => {
    const drafts = [
        {
            id: 1,
            subject: 'Product Feedback Request',
            to: 'customer@example.com',
            lastEdited: '2 hours ago',
            status: 'ready',
        },
        {
            id: 2,
            subject: 'Invoice #INV-2024-001',
            to: 'billing@company.com',
            lastEdited: '1 day ago',
            status: 'needs_review',
        },
        {
            id: 3,
            subject: 'Technical Support Follow-up',
            to: 'support@tech.com',
            lastEdited: '3 days ago',
            status: 'draft',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Drafts</h1>
                <p className="text-gray-600 mt-2">Review and send your draft emails</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                    <FileText className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">5</h3>
                    <p className="text-gray-600">Total Drafts</p>
                </div>

                <div className="card text-center">
                    <Edit2 className="h-12 w-12 text-warning-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">3</h3>
                    <p className="text-gray-600">Needs Review</p>
                </div>

                <div className="card text-center">
                    <Send className="h-12 w-12 text-success-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">2</h3>
                    <p className="text-gray-600">Ready to Send</p>
                </div>
            </div>

            <div className="card">
                <h2 className="text-xl font-bold mb-4">Recent Drafts</h2>
                <div className="space-y-4">
                    {drafts.map((draft) => (
                        <div key={draft.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-primary-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium">{draft.subject}</h4>
                                    <p className="text-sm text-gray-500">To: {draft.to}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {draft.lastEdited}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button className="btn-secondary px-3 py-1">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button className="btn-primary px-3 py-1">
                                        <Send className="h-4 w-4" />
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

export default Drafts;