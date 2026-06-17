'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { RESIDENT_NAV } from '../routes/residentNav';
import { ResidentBrand } from '../components/ResidentBrand';
import { ResidentCard } from '../components/ResidentCard';
import { ResidentRightRailWidgets } from '../components/ResidentRightRailWidgets';
import { ResidentMobileBottomNav } from '../components/ResidentMobileBottomNav';
import { ResidentProfileMenu } from '../components/ResidentProfileMenu';
import { ResidentProfileAvatar } from '../components/ResidentProfileAvatar';
import { useResidentSession } from '../store/residentSessionStore';
import { ResidentNotificationsBell } from '../notifications/ResidentNotificationsBell';
import { ResidentMessagesNavIcon } from '../messages/ResidentMessagesNavIcon';
import { LuSearch, LuMenu, LuX } from 'react-icons/lu';

const HEADER_MAIN_H = 'h-[52px]';
const MOBILE_HEADER_OFFSET = 'h-[var(--resident-header-h)]';
const MOBILE_BOTTOM_NAV_OFFSET = 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-6';
const STICKY_TOP = 'top-[52px]';

function ResidentNavbar({
    mobileNavOpen,
    onToggleMobileNav,
}: {
    mobileNavOpen: boolean;
    onToggleMobileNav: () => void;
}) {
    const { currentResident } = useResidentSession();

    return (
        <header className="fixed inset-x-0 top-0 z-[100] border-b border-[#e0dfdc] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div
                className={cn(
                    'mx-auto flex max-w-[1400px] flex-nowrap items-center gap-1 px-2 sm:gap-5 lg:px-6',
                    HEADER_MAIN_H,
                )}
            >
                <button
                    type="button"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[rgba(0,0,0,0.6)] transition-colors hover:bg-[#f3f2ef] lg:hidden"
                    onClick={onToggleMobileNav}
                    aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                >
                    {mobileNavOpen ? <LuX className="h-5 w-5" /> : <LuMenu className="h-5 w-5" />}
                </button>

                <Link href="/resident/dashboard" className="hidden min-w-0 shrink-0 lg:block">
                    <ResidentBrand compact />
                </Link>

                {/* Small screens — search centered in header row */}
                <div className="relative min-w-0 flex-1 lg:hidden">
                    <LuSearch
                        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.45)]"
                        aria-hidden
                    />
                    <input
                        placeholder="Search…"
                        className="h-8 w-full rounded-md border border-[#e0dfdc] bg-[#eef3f8] pl-8 pr-2 text-sm text-[rgba(0,0,0,0.9)] placeholder:text-[rgba(0,0,0,0.45)] focus:border-[#0a66c2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0a66c2]"
                    />
                </div>

                {/* Large screens — search */}
                <div className="relative hidden shrink-0 lg:block lg:w-[280px] xl:w-[320px]">
                    <LuSearch
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.45)]"
                        aria-hidden
                    />
                    <input
                        placeholder="Search portal…"
                        className="h-9 w-full rounded-md border border-[#e0dfdc] bg-[#eef3f8] pl-9 pr-3 text-sm text-[rgba(0,0,0,0.9)] placeholder:text-[rgba(0,0,0,0.45)] focus:border-[#0a66c2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0a66c2]"
                    />
                </div>

                <div className="hidden min-w-0 flex-1 lg:block" aria-hidden />

                <div className="ml-auto flex shrink-0 flex-nowrap items-center lg:ml-0">
                    {currentResident ? (
                        <div className="flex items-center gap-0.5 sm:gap-1">
                            <ResidentMessagesNavIcon />
                            <ResidentNotificationsBell residentEmail={currentResident.email} />
                            <ResidentProfileMenu />
                        </div>
                    ) : null}
                </div>
            </div>
        </header>
    );
}

function ResidentLeftSidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { currentResident } = useResidentSession();

    return (
        <aside className={cn('w-full shrink-0 space-y-2 sm:w-[225px]', className)}>
            {currentResident ? (
                <ResidentCard padding="sm" className="overflow-hidden">
                    <div className="flex flex-col items-center text-center">
                        <ResidentProfileAvatar name={currentResident.fullName} size="lg" />
                        <p className="mt-2 w-full truncate text-sm font-semibold text-[rgba(0,0,0,0.9)]">
                            {currentResident.fullName}
                        </p>
                        <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.6)]">
                            Unit {currentResident.unitNumber} · {currentResident.residentType}
                        </p>
                        <Link
                            href="/resident/profile"
                            className="mt-2.5 w-full rounded-full border border-[#0a66c2] px-3 py-1.5 text-center text-xs font-semibold text-[#0a66c2] transition-colors hover:bg-[#ebf4fd]"
                        >
                            View profile
                        </Link>
                    </div>
                </ResidentCard>
            ) : null}

            <ResidentCard padding="none">
                <nav className="py-1">
                    {RESIDENT_NAV.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={cn(
                                    'mx-1 flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm font-medium transition-colors duration-150',
                                    active
                                        ? 'bg-[#f3f2ef] font-semibold text-[rgba(0,0,0,0.9)]'
                                        : 'text-[rgba(0,0,0,0.6)] hover:bg-[#f3f2ef] hover:text-[rgba(0,0,0,0.9)]',
                                )}
                            >
                                <span
                                    className={cn(
                                        'grid h-6 w-6 shrink-0 place-items-center',
                                        active ? 'text-[rgba(0,0,0,0.9)]' : 'text-[rgba(0,0,0,0.6)]',
                                    )}
                                >
                                    {item.icon}
                                </span>
                                <span className="min-w-0 truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </ResidentCard>
        </aside>
    );
}

function ResidentRightSidebar() {
    return (
        <aside className="w-[280px] shrink-0">
            <ResidentRightRailWidgets className="space-y-3" />
        </aside>
    );
}

export function ResidentShellLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
    const isMessagesPage = pathname === '/resident/messages';

    React.useEffect(() => {
        setMobileNavOpen(false);
    }, [pathname]);

    React.useEffect(() => {
        document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileNavOpen]);

    return (
        <div className="min-h-dvh bg-[#f4f2ee] [--resident-header-h:52px]">
            <ResidentNavbar mobileNavOpen={mobileNavOpen} onToggleMobileNav={() => setMobileNavOpen((v) => !v)} />

            {/* Spacer — keeps content below fixed header */}
            <div className={cn('shrink-0', MOBILE_HEADER_OFFSET)} aria-hidden />

            {mobileNavOpen ? (
                <div className="fixed inset-x-0 bottom-0 z-[90] lg:hidden top-[var(--resident-header-h)]">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        aria-label="Close menu"
                        onClick={() => setMobileNavOpen(false)}
                    />
                    <div className="relative h-full w-[min(100vw-3rem,280px)] overflow-y-auto bg-[#f4f2ee] p-3 shadow-xl [scrollbar-width:thin]">
                        <ResidentLeftSidebar />
                    </div>
                </div>
            ) : null}

            <div
                className={cn(
                    'mx-auto max-w-[1400px] px-2 sm:px-4',
                    isMessagesPage ? 'py-2 sm:py-3' : 'py-2 sm:py-4',
                    MOBILE_BOTTOM_NAV_OFFSET,
                )}
            >
                <div className="flex gap-3 lg:gap-4">
                    {!isMessagesPage ? (
                        <ResidentLeftSidebar
                            className={cn(
                                'sticky hidden self-start lg:block',
                                STICKY_TOP,
                                'max-h-[calc(100dvh-68px)] overflow-y-auto [scrollbar-width:thin]',
                            )}
                        />
                    ) : null}

                    <main className={cn('min-w-0 flex-1', !isMessagesPage && 'pb-2')}>{children}</main>

                    {!isMessagesPage ? (
                        <div
                            className={cn(
                                'sticky hidden self-start xl:block',
                                STICKY_TOP,
                                'max-h-[calc(100dvh-68px)] overflow-y-auto [scrollbar-width:thin]',
                            )}
                        >
                            <ResidentRightSidebar />
                        </div>
                    ) : null}
                </div>
            </div>

            <ResidentMobileBottomNav />
        </div>
    );
}
