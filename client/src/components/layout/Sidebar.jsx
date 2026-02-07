import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'reviewer', 'agent'] },
        { path: '/inbox', label: 'Inbox', icon: '📥', roles: ['admin', 'reviewer', 'agent'] },
        { path: '/compose', label: 'Compose', icon: '📝', roles: ['admin', 'reviewer', 'agent'] },
        { path: '/sent', label: 'Sent', icon: '📤', roles: ['admin', 'reviewer', 'agent'] },
        { path: '/drafts', label: 'Drafts', icon: '📄', roles: ['admin', 'reviewer', 'agent'] },
        { path: '/accounts', label: 'Email Accounts', icon: '📧', roles: ['admin', 'reviewer'] },
        { path: '/team', label: 'Team', icon: '👥', roles: ['admin'] },
        { path: '/analytics', label: 'Analytics', icon: '📈', roles: ['admin', 'reviewer'] },
        { path: '/review', label: 'Review', icon: '👁️', roles: ['admin', 'reviewer'] },
        { path: '/settings', label: 'Settings', icon: '⚙️', roles: ['admin', 'reviewer', 'agent'] },
    ];

    const filteredItems = navItems.filter(item =>
        item.roles.includes(user?.role || 'agent')
    );

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 md:flex md:flex-col
            `}>
                <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                    {/* Navigation */}
                    <nav className="mt-5 flex-1 px-2 space-y-1">
                        {filteredItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-l-4 border-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                }
                            >
                                <span className="mr-3 text-lg">{item.icon}</span>
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User info */}
                    <div className="mt-auto px-4 py-4 border-t border-gray-200">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">
                                    {user?.name?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;