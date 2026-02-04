import React from 'react';

const AuthLayout = ({ children, sideContent }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
            <div className="mx-auto w-full max-w-6xl">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10 lg:items-start">
                    <div className="order-2 lg:order-1">{children}</div>
                    {sideContent ? <div className="order-1 lg:order-2">{sideContent}</div> : null}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
