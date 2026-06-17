'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LuBell,
    LuCalendarClock,
    LuGitBranch,
    LuHandshake,
    LuLayoutGrid,
    LuMapPin,
    LuTrendingUp,
    LuUserCheck,
} from 'react-icons/lu';

type SubNavKey =
    | 'info'
    | 'assignment'
    | 'follow-ups'
    | 'site-visit'
    | 'pipeline'
    | 'conversion'
    | 'broker'
    | 'notifications';

/**
 * Legacy secondary nav (still valid: deep links redirect to `/leads/view/[slug]?tab=…`).
 */
export function LeadSubNav({ leadSlug }: { leadSlug: string }) {
    const pathname = usePathname();

    const items: Array<{
        key: SubNavKey;
        label: string;
        href: string;
        icon: React.ComponentType<{ className?: string; size?: number }>;
        isActive: (p: string) => boolean;
    }> = [
        {
            key: 'info',
            label: 'Lead Info',
            href: `/leads/view/${leadSlug}`,
            icon: LuLayoutGrid,
            isActive: (p) => p === `/leads/view/${leadSlug}`,
        },
        {
            key: 'assignment',
            label: 'Assignment',
            href: `/leads/${leadSlug}/assignment`,
            icon: LuUserCheck,
            isActive: (p) => p === `/leads/${leadSlug}/assignment`,
        },
        {
            key: 'follow-ups',
            label: 'Follow-up',
            href: `/leads/${leadSlug}/follow-ups`,
            icon: LuCalendarClock,
            isActive: (p) => p === `/leads/${leadSlug}/follow-ups`,
        },
        {
            key: 'site-visit',
            label: 'Site Visit',
            href: `/leads/${leadSlug}/site-visit`,
            icon: LuMapPin,
            isActive: (p) => p === `/leads/${leadSlug}/site-visit`,
        },
        {
            key: 'pipeline',
            label: 'Pipeline',
            href: `/leads/${leadSlug}/pipeline`,
            icon: LuGitBranch,
            isActive: (p) => p === `/leads/${leadSlug}/pipeline`,
        },
        {
            key: 'conversion',
            label: 'Conversion',
            href: `/leads/${leadSlug}/conversion`,
            icon: LuTrendingUp,
            isActive: (p) => p === `/leads/${leadSlug}/conversion`,
        },
        {
            key: 'broker',
            label: 'Broker',
            href: `/leads/${leadSlug}/broker`,
            icon: LuHandshake,
            isActive: (p) => p === `/leads/${leadSlug}/broker`,
        },
        {
            key: 'notifications',
            label: 'Notifications',
            href: `/leads/${leadSlug}/notifications`,
            icon: LuBell,
            isActive: (p) => p === `/leads/${leadSlug}/notifications`,
        },
    ];

    return (
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap gap-1 overflow-x-auto pb-px" aria-label="Lead sections">
                {items.map((item) => {
                    const active = item.isActive(pathname);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={cn(
                                'inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                                active
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
                            )}
                        >
                            <Icon size={16} className="shrink-0 opacity-80" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
