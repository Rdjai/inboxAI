import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Inbox, PenSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEmail } from '../../context/EmailContext';
import { getAllowedNavItems, getCurrentNavItem } from './navigation';

const PageNavbar = () => {
    const location = useLocation();
    const { user } = useAuth();
    const { unreadCount } = useEmail();

    const navItems = useMemo(() => getAllowedNavItems(user?.role), [user?.role]);
    const currentItem = useMemo(() => getCurrentNavItem(location.pathname, navItems), [location.pathname, navItems]);
    const workspaceItems = useMemo(
        () => navItems.filter((item) => item.section === 'Workspace').slice(0, 5),
        [navItems]
    );

    return (
        <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-slate-200/80 bg-white/88 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/82 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        <span>Dashboard</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="truncate text-sky-600 dark:text-sky-400">{currentItem?.label || 'Workspace'}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
                        Sticky page navigation stays visible while dashboard content scrolls.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 p-1 dark:border-slate-800 dark:bg-slate-900/90">
                        {workspaceItems.map((item) => {
                            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`rounded-full px-3 py-2 text-sm font-medium transition ${isActive
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                                        }`}
                                >
                                    {item.shortLabel || item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <Link
                        to="/app/inbox?filter=unread"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                    >
                        <Inbox className="h-4 w-4" />
                        Unread
                        {unreadCount > 0 && (
                            <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Link>

                    <Link
                        to="/app/compose"
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
                    >
                        <PenSquare className="h-4 w-4" />
                        Compose
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PageNavbar;
