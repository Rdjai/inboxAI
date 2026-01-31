import React from 'react';

const LoadingSpinner = ({ size = 'medium' }) => {
    const sizes = {
        small: 'h-4 w-4',
        medium: 'h-8 w-8',
        large: 'h-12 w-12',
    };

    return (
        <div className="flex items-center justify-center">
            <div className={`${sizes[size]} animate-spin rounded-full border-b-2 border-primary-600`}></div>
        </div>
    );
};

export default LoadingSpinner;