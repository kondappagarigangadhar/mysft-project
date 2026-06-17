'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LuCircleUser,
    LuCreditCard,
    LuLayoutDashboard,
    LuMegaphone,
    LuUsers,
    LuWrench,
} from 'react-icons/lu';
import { cn } from '@/lib/utils';

const MOBILE_NAV_LINKS = [
    { key: 'dashboard', label: 'Home', href: '/resident/dashboard', icon: LuLayoutDashboard },
    { key: 'billing', label: 'Billing', href: '/resident/billing', icon: LuCreditCard },
    { key: 'visitors', label: 'Visitors', href: '/resident/visitors', icon: LuUsers },
    { key: 'maintenance', label: 'Requests', href: '/resident/maintenance', icon: LuWrench },
    { key: 'notices', label: 'Notices', href: '/resident/notices', icon: LuMegaphone },
    // { key: 'profile', label: 'Profile', href: '/resident/profile', icon: LuCircleUser },
];

/** Mobile/tablet bottom nav only — hidden on lg+ */
export function ResidentMobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-[90] border-t border-[#e0dfdc] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_3px_rgba(0,0,0,0.06)] lg:hidden"
            aria-label="Mobile navigation"
        >
            <ul className="mx-auto flex w-full max-w-lg items-stretch justify-between px-0.5">
                {MOBILE_NAV_LINKS.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <li key={item.key} className="min-w-0 flex-1">
                            <Link
                                href={item.href}
                                className={cn(
                                    'relative flex w-full min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-2 transition-colors',
                                    active ? 'text-[rgba(0,0,0,0.9)]' : 'text-[rgba(0,0,0,0.6)]',
                                )}
                                aria-current={active ? 'page' : undefined}
                            >
                                <Icon
                                    className={cn('h-5 w-5 shrink-0 sm:h-[22px] sm:w-[22px]', active && 'stroke-[2.5]')}
                                    aria-hidden
                                />
                                <span
                                    className={cn(
                                        'w-full truncate text-center text-[9px] font-medium leading-tight sm:text-[10px]',
                                        active && 'font-semibold',
                                    )}
                                >
                                    {item.label}
                                </span>
                                {active ? (
                                    <span
                                        className="absolute bottom-0 h-0.5 w-6 rounded-full bg-[rgba(0,0,0,0.9)] sm:w-8"
                                        aria-hidden
                                    />
                                ) : null}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
