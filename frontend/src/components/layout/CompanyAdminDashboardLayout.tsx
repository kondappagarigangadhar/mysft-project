'use client';

import React, { useState } from 'react';
import { CompanyAdminSidebar } from '@/components/layout/CompanyAdminSidebar';
import { CompanyAdminNavbar } from '@/components/layout/CompanyAdminNavbar';
import { cn } from '@/lib/utils';
import { useSidebarHoverCollapse } from '@/hooks/useSidebarHoverCollapse';
import Link from 'next/link';
import { RightCollapsePanel } from '@/components/booking-payment/RightCollapsePanel';
import { AdminThemeControls } from '@/components/theme/AdminThemeControls';
import { LuChevronRight } from 'react-icons/lu';

/**
 * Same chrome as `app/company-admin/layout.tsx` (company sidebar + navbar).
 * Use for routes outside `/company-admin/*` that should match company admin (e.g. `/leads`, `/demand-intelligence`).
 */
export function CompanyAdminDashboardLayout({
    children,
    mainClassName,
}: {
    children: React.ReactNode;
    mainClassName?: string;
}) {
    const {
        effectiveCollapsed,
        togglePinned,
        hoverProps,
        desktopHoverRailMode,
        sidebarWidthTransitionClasses,
        mainMarginTransitionClasses,
    } = useSidebarHoverCollapse();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [manageOpen, setManageOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <CompanyAdminNavbar
                onMenuClick={() => setIsSidebarOpen(true)}
                desktopSidebarHoverRailMode={desktopHoverRailMode}
                onToggleSidebarRailMode={togglePinned}
                onOpenAdminManagePanel={() => setManageOpen(true)}
            />
            <CompanyAdminSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={effectiveCollapsed}
                onToggle={togglePinned}
                hoverProps={hoverProps}
                sidebarWidthTransitionClassName={sidebarWidthTransitionClasses}
            />
            <div
                suppressHydrationWarning
                className={cn(
                    mainMarginTransitionClasses,
                    effectiveCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[320px]'
                )}
            >
                <main
                    className={cn(
                        'mx-auto w-full max-w-[1600px] px-4 pb-8 lg:px-6 lg:pb-8',
                        'pt-20',
                        mainClassName
                    )}
                >
                    {children}
                </main>
            </div>

            <RightCollapsePanel
                open={manageOpen}
                onClose={() => setManageOpen(false)}
                title="Manage"
                subtitle="Theme and admin settings (live preview)"
                kicker="Admin"
                widthClassName="w-full max-w-[min(100vw-1rem,520px)]"
            >
                <div className="space-y-6">
                    <section>
                        <div className="mt-3">
                            <AdminThemeControls variant="drawer" />
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-slate-900">Settings</h3>
                        <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                            {[
                                { href: '/settings', label: 'Organization settings' },
                                { href: '/settings/theme', label: 'Theme settings page' },
                                { href: '/company-admin/history-logs', label: 'History logs' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setManageOpen(false)}
                                        className="flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
                                    >
                                        {link.label}
                                        <LuChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </RightCollapsePanel>
        </div>
    );
}
