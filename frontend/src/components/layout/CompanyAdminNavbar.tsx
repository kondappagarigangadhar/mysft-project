'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LuSearch, LuMenu, LuBell, LuMaximize2, LuMinimize2, LuPanelLeftClose, LuPanelLeftOpen, LuHistory, LuPalette } from 'react-icons/lu';
import { CompanyAdminAINavDropdown } from '@/components/layout/CompanyAdminAINavDropdown';
import { GlobalSavedViewsNavDropdown } from '@/components/layout/GlobalSavedViewsNavDropdown';
import { NavbarProfileMenu } from './NavbarProfileMenu';
import { useBrowserFullscreen } from '@/hooks/useBrowserFullscreen';
import { cn } from '@/lib/utils';

const notifications = [
    { id: 1, title: 'New project assigned', message: 'Skyline Tower Phase 2 has been assigned to you', time: '5 min ago', type: 'project' as const },
    { id: 2, title: 'Team member update', message: 'Rajesh Kumar completed foundation work', time: '1 hour ago', type: 'team' as const },
    { id: 3, title: 'Material delivery', message: 'Cement delivery scheduled for tomorrow', time: '2 hours ago', type: 'materials' as const },
    { id: 4, title: 'Client meeting', message: 'Meeting with Urban Developers at 3 PM', time: '3 hours ago', type: 'client' as const },
];

export const CompanyAdminNavbar = ({
    onMenuClick,
    desktopSidebarHoverRailMode,
    onToggleSidebarRailMode,
    onOpenAdminManagePanel,
}: {
    onMenuClick: () => void;
    /** Desktop (lg+): when true, sidebar is narrow and expands on hover; when false, sidebar stays full width. */
    desktopSidebarHoverRailMode?: boolean;
    onToggleSidebarRailMode?: () => void;
    onOpenAdminManagePanel?: () => void;
}) => {
    const { isFullscreen, toggle: toggleFullscreen, supported: fullscreenSupported } = useBrowserFullscreen();
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const historyPath = '/company-admin/history-logs';
    const onHistoryPage = pathname === historyPath || pathname === `${historyPath}/`;
    const mod = searchParams.get('module');
    const isAllHistoryView =
        onHistoryPage && (mod == null || mod === '' || mod === 'all');

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header
            className={cn(
                'fixed inset-x-0 top-0 z-50 flex h-14 w-full items-center justify-between border-b border-black/5 px-4 shadow-md transition-colors duration-200 sm:px-6',
            )}
            style={{ backgroundColor: 'var(--navbar-bg)', color: 'var(--navbar-text)' }}
        >
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="rounded-xl p-2 transition-all duration-200 hover:bg-white/10 lg:hidden"
                    aria-label="Open menu"
                >
                    <LuMenu size={22} />
                </button>

                {onToggleSidebarRailMode != null && desktopSidebarHoverRailMode != null ? (
                    <button
                        type="button"
                        onClick={onToggleSidebarRailMode}
                        className={cn(
                            'hidden shrink-0 rounded-lg p-2 transition-all duration-200 hover:bg-white/15 lg:inline-flex',
                            !desktopSidebarHoverRailMode && 'bg-white/20',
                        )}
                        title={
                            desktopSidebarHoverRailMode
                                ? 'Keep sidebar open (turn off hover-only)'
                                : 'Sidebar expands on hover only'
                        }
                        aria-label={
                            desktopSidebarHoverRailMode
                                ? 'Keep sidebar open'
                                : 'Use hover to expand sidebar'
                        }
                        aria-pressed={!desktopSidebarHoverRailMode}
                    >
                        {desktopSidebarHoverRailMode ? (
                            <LuPanelLeftOpen size={28} aria-hidden />
                        ) : (
                            <LuPanelLeftClose size={28} aria-hidden />
                        )}
                    </button>
                ) : null}

                
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="relative hidden max-w-md flex-1 sm:block">
                    <LuSearch
                        className="pointer-events-none absolute left-3 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-gray-400"
                        aria-hidden
                    />
                    <input
                        type="search"
                        placeholder="Search projects, leads, inventory…"
                        className="h-10 w-60 rounded-lg border border-white/90 bg-white pl-11 pr-4 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2"
                        style={{ outlineColor: 'var(--navbar-bg)' }}
                    />
                </div>
                {fullscreenSupported ? (
                    <button
                        type="button"
                        onClick={() => void toggleFullscreen()}
                        className={cn(
                            'hidden rounded-lg p-2.5 transition-all duration-200 hover:bg-white/15 md:flex',
                            isFullscreen && 'bg-white/20 ring-1 ring-white/35'
                        )}
                        title={isFullscreen ? 'Exit fullscreen (like Esc after F11)' : 'Fullscreen (like F11)'}
                        aria-pressed={isFullscreen}
                    >
                        {isFullscreen ? <LuMinimize2 size={20} /> : <LuMaximize2 size={20} />}
                    </button>
                ) : null}

                <Link
                    href={historyPath}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/15',
                        isAllHistoryView && 'bg-white/15 ring-1 ring-white/30'
                    )}
                    title="All history & audit logs"
                    aria-current={isAllHistoryView ? 'page' : undefined}
                >
                    <LuHistory className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    <span className="hidden sm:inline">History log</span>
                </Link>

                {onOpenAdminManagePanel ? (
                    <button
                        type="button"
                        onClick={onOpenAdminManagePanel}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/15'
                        )}
                        title="Manage (Theme, Settings)"
                        aria-label="Open manage panel"
                    >
                        <LuPalette className="h-[18px] w-[18px] shrink-0" aria-hidden />
                        <span className="hidden sm:inline">Theme</span>
                    </button>
                ) : null}

                <CompanyAdminAINavDropdown triggerTone="onBlue" />

                <GlobalSavedViewsNavDropdown tone="onBlue" />

                <div className="relative" ref={notifRef}>
                    <button
                        type="button"
                        onClick={() => setShowNotifications((v) => !v)}
                        className="relative rounded-lg p-2.5 transition-all duration-200 hover:bg-white/15"
                        aria-expanded={showNotifications}
                        aria-label="Notifications"
                    >
                        <LuBell size={20} />
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-white/90 ring-2 ring-white/30" />
                    </button>

                    {showNotifications ? (
                        <div className="absolute right-0 top-full z-100 mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200 sm:w-80">
                            <div className="border-b border-[#e5e7eb] bg-gray-50 px-4 py-3">
                                <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                                <p className="mt-0.5 text-xs text-gray-500">Updates from your workspace</p>
                            </div>
                            <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="border-b border-gray-100 p-4 transition-colors duration-200 last:border-b-0 hover:bg-blue-50/60"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={cn(
                                                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                                                    notification.type === 'project' && 'bg-blue-500',
                                                    notification.type === 'team' && 'bg-emerald-500',
                                                    notification.type === 'materials' && 'bg-amber-500',
                                                    notification.type === 'client' && 'bg-violet-500'
                                                )}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                                <p className="mt-1 text-xs leading-snug text-gray-600">{notification.message}</p>
                                                <p className="mt-2 text-xs text-gray-400">{notification.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-[#e5e7eb] p-2">
                                <button
                                    type="button"
                                    className="w-full rounded-lg py-2 text-sm font-medium text-[#0092ff] transition-colors duration-200 hover:bg-blue-50/80 hover:text-[#0078cc]"
                                >
                                    View all
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="mx-1 hidden h-8 w-px bg-white/20 sm:block" />

                <NavbarProfileMenu displayName="Company Admin" email="admin@company.com" tone="onBlue" />
            </div>
        </header>
    );
};
