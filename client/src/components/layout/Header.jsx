import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, PenSquare, Settings, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEmail } from '../../context/EmailContext';
import { getAllowedNavItems, getCurrentNavItem } from './navigation';

const Header = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { unreadCount } = useEmail();
    const location = useLocation();
    const navigate = useNavigate();
    const menuRef = useRef(null);
    const [profileOpen, setProfileOpen] = useState(false);

    const navItems = useMemo(() => getAllowedNavItems(user?.role), [user?.role]);
    const currentItem = useMemo(
        () => getCurrentNavItem(location.pathname, navItems),
        [location.pathname, navItems]
    );
    const quickLinks = useMemo(
        () => navItems.filter((item) => ['/app/inbox', '/app/compose', '/app/analytics'].includes(item.path)).slice(0, 3),
        [navItems]
    );

    useEffect(() => {
        setProfileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!profileOpen) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };

        window.addEventListener('mousedown', handlePointerDown);
        return () => window.removeEventListener('mousedown', handlePointerDown);
    }, [profileOpen]);

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex h-18 items-center justify-between gap-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            onClick={onMenuClick}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 md:hidden"
                            aria-label="Open navigation"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <Link to="/app/dashboard" className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-slate-900 shadow-sm">
                                <span className="text-lg font-semibold text-white">I</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">InboxFlow</p>
                                <p className="truncate text-sm font-semibold text-slate-900">
                                    {currentItem?.label || 'Workspace'}
                                </p>
                            </div>
                        </Link>
                    </div>

                    <div className="hidden flex-1 items-center justify-center lg:flex">
                        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-2 py-1">
                            {quickLinks.map((item) => {
                                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${isActive
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                    >
                                        {item.shortLabel || item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/app/inbox?filter=unread')}
                            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            aria-label="Open unread mail"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <>
                                    <span className="mail-pulse absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-400" />
                                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
                                    <span className="absolute -right-1 -top-1 inline-flex min-w-[1.2rem] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/app/compose')}
                            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                            <PenSquare className="h-4 w-4" />
                            <span className="hidden sm:inline">Compose</span>
                        </button>

                        <div ref={menuRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setProfileOpen((open) => !open)}
                                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-slate-900 text-sm font-semibold text-white shadow-sm">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="hidden text-left md:block">
                                    <p className="max-w-[140px] truncate text-sm font-medium text-slate-800">{user?.name}</p>
                                    <p className="max-w-[140px] truncate text-xs text-slate-500 capitalize">{user?.role || 'member'}</p>
                                </div>
                                <ChevronDown className={`h-4 w-4 text-slate-400 transition ${profileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
                                        <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                                        <p className="mt-1 truncate text-sm text-slate-500">{user?.email}</p>
                                    </div>

                                    <div className="p-2">
                                        <Link to="/app/settings" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                                            <Settings className="h-4 w-4 text-slate-400" />
                                            Settings
                                        </Link>
                                        <Link to="/app/team" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                                            <Users className="h-4 w-4 text-slate-400" />
                                            Team
                                        </Link>
                                        <button
                                            onClick={logout}
                                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
