import React from 'react';
import { getStatusColor } from '../../utils/helpers';

const StatusBadge = ({ status, showIcon = false }) => {
    const statusConfig = {
        'sent': { icon: '✓', label: 'Sent' },
        'draft': { icon: '📝', label: 'Draft' },
        'failed': { icon: '✗', label: 'Failed' },
        'scheduled': { icon: '⏰', label: 'Scheduled' },
        'processing': { icon: '🔄', label: 'Processing' },
        'pending': { icon: '⏳', label: 'Pending' },
    };

    const config = statusConfig[status] || { icon: '?', label: status || 'Unknown' };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {showIcon && <span className="mr-1">{config.icon}</span>}
            {config.label}
        </span>
    );
};

export default StatusBadge;