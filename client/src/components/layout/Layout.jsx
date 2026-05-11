import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import PageNavbar from './PageNavbar';
import Sidebar from './Sidebar';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-gray-50 transition-colors dark:bg-slate-950">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        borderRadius: '10px',
                        background: '#363636',
                        color: '#fff',
                    },
                }}
            />

            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 min-h-0 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <main className="flex-1 min-w-0 overflow-y-auto bg-gradient-to-br from-transparent via-transparent to-slate-100/60 p-4 transition-colors dark:to-slate-900/70 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <PageNavbar />
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
