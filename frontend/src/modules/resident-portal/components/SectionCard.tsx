'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { residentAccentHeaders, residentCardShell, residentHeaderDivider } from '../styles/cardStyles';

export function SectionCard({
    title,
    subtitle,
    action,
    icon,
    accent = 'slate',
    children,
    className,
    bodyClassName,
}: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
    accent?: keyof typeof residentAccentHeaders;
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
}) {
    const styles = residentAccentHeaders[accent];

    return (
        <section className={cn(residentCardShell, className)}>
            <div
                className={cn(
                    'flex items-start justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5',
                    residentHeaderDivider,
                    styles.header,
                )}
            >
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    {icon ? (
                        <div
                            className={cn(
                                'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                                styles.icon,
                            )}
                        >
                            {icon}
                        </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-[rgba(0,0,0,0.9)] sm:text-base">{title}</h2>
                        {subtitle ? <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.55)]">{subtitle}</p> : null}
                    </div>
                </div>
                {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
            </div>
            <div className={cn('px-4 py-3 sm:px-5 sm:py-4', bodyClassName)}>{children}</div>
        </section>
    );
}
