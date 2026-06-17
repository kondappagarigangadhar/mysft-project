'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function QuickActionCard({
    title,
    subtitle,
    href,
    icon,
    tone = 'orange',
}: {
    title: string;
    subtitle: string;
    href: string;
    icon: React.ReactNode;
    tone?: 'orange' | 'blue' | 'emerald' | 'violet';
}) {
    const tones: Record<string, string> = {
        orange: 'text-[#e0680a]',
        blue: 'text-[#0a66c2]',
        emerald: 'text-[#057642]',
        violet: 'text-[#7c3aed]',
    };

    return (
        <Link
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-[#e0dfdc] bg-white px-3.5 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-[#d0cfcc] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06)]"
        >
            <div className={cn('grid h-8 w-8 shrink-0 place-items-center', tones[tone])}>{icon}</div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)] group-hover:text-[#0a66c2]">{title}</p>
                <p className="text-xs leading-snug text-[rgba(0,0,0,0.6)]">{subtitle}</p>
            </div>
        </Link>
    );
}
