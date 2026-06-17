'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { residentCardBorder, residentCardBorderHover, residentCardShadow, residentKpiTones } from '../styles/cardStyles';

export function KpiCard({
    title,
    value,
    helper,
    icon,
    href,
    tone = 'orange',
    className,
}: {
    title: string;
    value: string;
    helper?: string;
    icon: React.ReactNode;
    href?: string;
    tone?: keyof typeof residentKpiTones;
    className?: string;
}) {
    const styles = residentKpiTones[tone];

    const cardClassName = cn(
        'group block rounded-xl p-3 transition-all duration-200 sm:p-3.5',
        residentCardBorder,
        residentCardShadow,
        styles.bg,
        href &&
            cn(
                'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a66c2]/30',
                residentCardBorderHover,
            ),
        className,
    );

    const content = (
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
                <p className="text-xs font-medium text-[rgba(0,0,0,0.55)]">{title}</p>
                <p
                    className={cn(
                        'mt-1 text-xl font-semibold tracking-tight text-[rgba(0,0,0,0.9)] sm:text-2xl',
                        styles.valueHover,
                    )}
                >
                    {value}
                </p>
                {helper ? <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.5)]">{helper}</p> : null}
            </div>
            <div
                className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9',
                    styles.icon,
                )}
            >
                {icon}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className={cardClassName} aria-label={`${title}: ${value}`}>
                {content}
            </Link>
        );
    }

    return <div className={cardClassName}>{content}</div>;
}
