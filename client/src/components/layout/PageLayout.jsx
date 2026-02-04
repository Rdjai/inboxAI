import React from 'react';

export const PageLayout = ({ children, className = '' }) => {
    return <div className={`space-y-6 ${className}`.trim()}>{children}</div>;
};

export const PageHeader = ({ title, description, actions, className = '' }) => {
    return (
        <div className={`flex items-start justify-between gap-4 ${className}`.trim()}>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                {description ? <p className="text-gray-600 mt-2">{description}</p> : null}
            </div>

            {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
    );
};

export const SectionCard = ({ children, className = '' }) => {
    return <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`.trim()}>{children}</div>;
};
