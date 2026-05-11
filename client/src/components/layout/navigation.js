import {
    Activity,
    BarChart3,
    Eye,
    FileText,
    Inbox,
    LineChart,
    Mail,
    PenSquare,
    Send,
    Settings,
    Users
} from 'lucide-react';

export const navItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'reviewer', 'agent', 'editor', 'member'], section: 'Workspace', shortLabel: 'Overview' },
    { path: '/app/inbox', label: 'Inbox', icon: Inbox, roles: ['admin', 'reviewer', 'agent', 'editor', 'member'], section: 'Workspace', shortLabel: 'Inbox' },
    { path: '/app/compose', label: 'Compose', icon: PenSquare, roles: ['admin', 'reviewer', 'agent', 'editor', 'member'], section: 'Workspace', shortLabel: 'Compose' },
    { path: '/app/sent', label: 'Sent', icon: Send, roles: ['admin', 'reviewer', 'agent', 'editor', 'member'], section: 'Workspace', shortLabel: 'Sent' },
    { path: '/app/drafts', label: 'Drafts', icon: FileText, roles: ['admin', 'reviewer', 'agent', 'editor', 'member'], section: 'Workspace', shortLabel: 'Drafts' },
    { path: '/app/accounts', label: 'Email Accounts', icon: Mail, roles: ['admin', 'reviewer', 'editor'], section: 'Management', shortLabel: 'Accounts' },
    { path: '/app/activity', label: 'Activity', icon: Activity, roles: ['admin', 'reviewer', 'editor'], section: 'Management', shortLabel: 'Activity' },
    { path: '/app/analytics', label: 'Analytics', icon: LineChart, roles: ['admin', 'reviewer', 'editor'], section: 'Management', shortLabel: 'Analytics' },
    { path: '/app/team', label: 'Team', icon: Users, roles: ['admin'], section: 'Management', shortLabel: 'Team' },
    { path: '/app/review', label: 'Review', icon: Eye, roles: ['admin', 'reviewer'], section: 'Management', shortLabel: 'Review' },
    { path: '/app/settings', label: 'Settings', icon: Settings, roles: ['admin', 'reviewer', 'agent', 'editor', 'member'], section: 'Management', shortLabel: 'Settings' }
];

export const getAllowedNavItems = (role) => navItems.filter((item) => item.roles.includes(role || 'agent'));

export const getNavSections = (role) => {
    return getAllowedNavItems(role).reduce((sections, item) => {
        const section = sections.find((entry) => entry.section === item.section);
        if (section) {
            section.items.push(item);
        } else {
            sections.push({ section: item.section, items: [item] });
        }
        return sections;
    }, []);
};

export const getCurrentNavItem = (pathname, items) => {
    const candidates = items || navItems;
    return candidates.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)) || null;
};
