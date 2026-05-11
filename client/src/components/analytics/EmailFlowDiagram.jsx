import React, { useMemo } from 'react';

const EmailFlowDiagram = ({ stats = {}, loading = false }) => {
    const flowData = useMemo(() => {
        return {
            received: stats.totalEmails || 0,
            classified: stats.processedEmails || 0,
            drafted: stats.draftedEmails || 0,
            approved: stats.approvedEmails || 0,
            sent: stats.sentEmails || 0,
            failed: stats.failedEmails || 0
        };
    }, [stats]);

    const getFlowPercentage = (value, total) => {
        return total > 0 ? Math.round((value / total) * 100) : 0;
    };

    const stages = [
        { label: 'Received', value: flowData.received, color: 'bg-blue-500', icon: '📥' },
        { label: 'Classified', value: flowData.classified, color: 'bg-purple-500', icon: '🏷️' },
        { label: 'Drafted', value: flowData.drafted, color: 'bg-yellow-500', icon: '📝' },
        { label: 'Approved', value: flowData.approved, color: 'bg-green-500', icon: '✅' },
        { label: 'Sent', value: flowData.sent, color: 'bg-emerald-500', icon: '📤' }
    ];

    const totalReceived = flowData.received || 1;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Flow visualization */}
            <div className="space-y-4">
                {stages.map((stage, index) => {
                    const percentage = getFlowPercentage(stage.value, totalReceived);
                    const nextStage = stages[index + 1];
                    const dropoff = nextStage ? stage.value - nextStage.value : 0;

                    return (
                        <div key={stage.label}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-2xl">{stage.icon}</span>
                                    <div>
                                        <p className="font-semibold text-gray-900">{stage.label}</p>
                                        <p className="text-xs text-gray-500">{stage.value} emails</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{percentage}%</p>
                                    {dropoff > 0 && (
                                        <p className="text-xs text-red-600">↓ {dropoff} dropped</p>
                                    )}
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-full ${stage.color} transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Failed emails */}
            {flowData.failed > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">❌</span>
                        <div>
                            <p className="font-semibold text-red-900">Failed Emails</p>
                            <p className="text-sm text-red-700">{flowData.failed} emails failed to send</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary statistics */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-xs text-blue-600 font-semibold uppercase">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                        {getFlowPercentage(flowData.sent, flowData.received)}%
                    </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <p className="text-xs text-purple-600 font-semibold uppercase">Processing Rate</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                        {getFlowPercentage(flowData.classified, flowData.received)}%
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmailFlowDiagram;
