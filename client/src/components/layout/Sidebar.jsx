import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEmail } from '../../context/EmailContext';
import { getNavSections } from './navigation';

const SidebarNavItem = ({ item, unreadCount, onClose }) => {
    const Icon = item.icon;
    const showUnreadPulse = item.path === '/app/inbox' && unreadCount > 0;
    const badgeText = unreadCount > 99 ? '99+' : unreadCount;

    return (
        <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 dark:bg-sky-500 dark:text-slate-950'
                    : 'text-slate-600 hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 hover:shadow-[0_12px_30px_-18px_rgba(15,23,42,0.45)] dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white dark:hover:shadow-[0_12px_30px_-18px_rgba(2,6,23,0.85)]'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <span className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200 ${isActive
                        ? 'bg-white/12 text-white dark:bg-slate-950/15 dark:text-slate-950'
                        : 'bg-slate-100 text-slate-500 group-hover:scale-105 group-hover:bg-slate-900 group-hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-sky-500 dark:group-hover:text-slate-950'
                        }`}>
                        <Icon className="h-4 w-4" />
                        {showUnreadPulse && (
                            <>
                                <span className="mail-pulse absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-400" />
                                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
                            </>
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className={`truncate transition-transform duration-200 ${isActive ? '' : 'group-hover:translate-x-0.5'}`}>{item.label}</p>
                        <p className={`truncate text-xs transition-colors duration-200 ${isActive ? 'text-white/65 dark:text-slate-900/70' : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-300'}`}>
                            {item.section}
                        </p>
                    </div>
                    {showUnreadPulse && (
                        <span
                            title={`${badgeText} unread messages`}
                            className={`inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full px-2 text-[11px] font-semibold ${isActive
                                ? 'bg-white/15 text-white dark:bg-slate-950/15 dark:text-slate-950'
                                : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30'
                                }`
                                >
                                { badgeText }
                        </span>
                    )}
        </>
    )
}
        </NavLink >
    );
};

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { unreadCount } = useEmail();

    const navSections = getNavSections(user?.role);

    const renderNavSection = (section) => (
        <div key={section.section} className={section.section === 'Management' ? 'mt-7' : ''}>
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                {section.section}
            </p>
            <div className="space-y-2">
                {section.items.map((item) => (
                    <SidebarNavItem key={item.path} item={item} unreadCount={unreadCount} onClose={onClose} />
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-slate-950/45 transition-opacity duration-200 md:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={onClose}
                aria-hidden={!isOpen}
            />

            <aside className={`
                sidebar-panel fixed bottom-0 left-0 top-[73px] z-50 w-[290px] border-r border-slate-200 bg-[#f6f8fb] dark:border-slate-800 dark:bg-slate-950
                transition-transform duration-200 ease-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:bottom-0 md:top-0 md:flex md:h-full md:translate-x-0 md:transition-none
            `}>
                <div className="flex h-full flex-col overflow-hidden px-4 py-4">
                    <div className="rounded-[28px] bg-gradient-to-br from-sky-500 via-cyan-500 to-slate-900 p-4 text-white shadow-lg">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Workspace</p>
                                <p className="mt-2 text-lg font-semibold">{user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'Member'} Console</p>
                                <p className="mt-1 text-sm text-cyan-50/90">
                                    {unreadCount > 0 ? `${unreadCount} unread messages need attention.` : 'Inbox is under control.'}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white/15 p-2.5">
                                <Sparkles className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <nav className="sidebar-scroll mt-5 flex-1 overflow-y-auto">
                        {navSections.map(renderNavSection)}
                    </nav>

                    <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-slate-900 text-sm font-semibold text-white shadow-sm">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
