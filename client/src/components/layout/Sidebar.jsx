import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    BarChart3,
    Inbox,
    PenSquare,
    Send,
    FileText,
    Mail,
    Users,
    LineChart,
    Eye,
    Settings,
    Activity
} from 'lucide-react';

const navItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'reviewer', 'agent', 'editor', 'member'], section: 'Workspace' },
    { path: '/app/inbox', label: 'Inbox', icon: Inbox, roles: ['admin', 'reviewer', 'agent', 'editor', 'member'], section: 'Workspace' },
    { path: '/app/compose', label: 'Compose', icon: PenSquare, roles: ['admin', 'reviewer', 'agent', 'editor', 'member'], section: 'Workspace' },
    { path: '/app/sent', label: 'Sent', icon: Send, roles: ['admin', 'reviewer', 'agent', 'editor', 'member'], section: 'Workspace' },
    { path: '/app/drafts', label: 'Drafts', icon: FileText, roles: ['admin', 'reviewer', 'agent', 'editor', 'member'], section: 'Workspace' },
    { path: '/app/accounts', label: 'Email Accounts', icon: Mail, roles: ['admin', 'reviewer', 'editor'], section: 'Management' },
    { path: '/app/activity', label: 'Activity', icon: Activity, roles: ['admin', 'reviewer', 'editor'], section: 'Management' },
    { path: '/app/analytics', label: 'Analytics', icon: LineChart, roles: ['admin', 'reviewer', 'editor'], section: 'Management' },
    { path: '/app/team', label: 'Team', icon: Users, roles: ['admin'], section: 'Management' },
    { path: '/app/review', label: 'Review', icon: Eye, roles: ['admin', 'reviewer'], section: 'Management' },
    { path: '/app/settings', label: 'Settings', icon: Settings, roles: ['admin', 'reviewer', 'agent', 'editor', 'member'], section: 'Management' },
];

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();

    const filteredItems = navItems.filter(item =>
        item.roles.includes(user?.role || 'agent')
    );

    const workspaceItems = filteredItems.filter((item) => item.section === 'Workspace');
    const managementItems = filteredItems.filter((item) => item.section === 'Management');

    const renderNavItem = (item) => {
        const Icon = item.icon;

        return (
            <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${isActive
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                }
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors duration-200 group-hover:bg-white group-hover:text-gray-900">
                    <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{item.label}</span>
            </NavLink>
        );
    };

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 z-40 bg-slate-950/45 transition-opacity duration-200 md:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={onClose}
                aria-hidden={!isOpen}
            />

            {/* Sidebar */}
            <aside className={`
                sidebar-panel fixed bottom-0 left-0 top-16 z-50 w-64 border-r border-gray-200 bg-white
                transition-transform duration-200 ease-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:bottom-0 md:top-0 md:flex md:h-full md:translate-x-0 md:transition-none
            `}>
                <div className="h-full flex flex-col pt-4 pb-4 overflow-hidden">
                    {/* Navigation */}
                    <nav className="sidebar-scroll mt-2 flex-1 px-3 overflow-y-auto">
                        <div>
                            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Workspace</p>
                            <div className="space-y-1">
                                {workspaceItems.map(renderNavItem)}
                            </div>
                        </div>

                        {managementItems.length > 0 && (
                            <div className="mt-6">
                                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Management</p>
                                <div className="space-y-1">
                                    {managementItems.map(renderNavItem)}
                                </div>
                            </div>
                        )}
                    </nav>

                    {/* User info */}
                    <div className="mt-auto mx-3 px-3 py-3 border border-gray-200 rounded-xl bg-gray-50">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
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
