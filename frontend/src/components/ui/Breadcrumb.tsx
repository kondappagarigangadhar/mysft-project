'use client';

import React from 'react';
import Link from 'next/link';
import { LuHouse } from 'react-icons/lu';
import { CTA_BREADCRUMB_CURRENT, CTA_BREADCRUMB_LINK } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';

function defaultHomeHref(): string {
    return '/company-admin/dashboard';
}

function breadcrumbStickyTopClass(): string {
    return 'top-14';
}

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    /** Show home icon linking to dashboard (default: true). */
    showHome?: boolean;
    /** Override home URL (default: company admin dashboard). */
    homeHref?: string;
    className?: string;
    /**
     * `page` — full-bleed strip under the app header (default).
     * `inline` — contained block for use inside cards / narrow layouts (no negative margins, no sticky).
     */
    variant?: 'page' | 'inline';
}

function BreadcrumbTrail({ items }: { items: BreadcrumbItem[] }) {
    return (
        <ol className="flex min-w-0 flex-wrap items-center justify-start gap-x-1 gap-y-0.5 text-left text-[13px] leading-snug sm:text-sm">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <li key={index} className="flex min-w-0 items-center gap-x-1 sm:gap-x-1.5">
                        {index > 0 ? (
                            <span className="shrink-0 select-none text-slate-300 tabular-nums" aria-hidden>
                                /
                            </span>
                        ) : null}
                        {item.href && !isLast ? (
                            <Link
                                href={item.href}
                                className={CTA_BREADCRUMB_LINK}
                                title={item.label}
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span
                                className={cn(
                                    'min-w-0 truncate font-medium',
                                    isLast ? CTA_BREADCRUMB_CURRENT : 'text-slate-600',
                                )}
                                title={item.label}
                                aria-current={isLast ? 'page' : undefined}
                            >
                                {item.label}
                            </span>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

/**
 * Full-width strip directly under the fixed app header: cancels main top padding so the bar sits flush
 * below the navbar; trail is always start-aligned (never centered), matching all pages.
 */
export function Breadcrumb({
    items,
    showHome = true,
    homeHref: homeHrefProp,
    className,
    variant = 'page',
}: BreadcrumbProps) {
    const resolvedHomeHref = homeHrefProp ?? defaultHomeHref();
    const isInline = variant === 'inline';

    const homeBtn = showHome && (
        <>
            <Link
                href={resolvedHomeHref}
                className="inline-flex shrink-0 items-center justify-center rounded-md p-1 text-slate-500 transition-colors hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] hover:text-[var(--cta-button-bg)]"
                aria-label="Dashboard"
                title="Dashboard"
            >
                <LuHouse size={18} className="shrink-0" aria-hidden />
            </Link>
            {items.length > 0 ? (
                <span className="mx-1 h-4 w-px shrink-0 bg-slate-200/90" aria-hidden />
            ) : null}
        </>
    );

    return (
        <nav
            aria-label="Breadcrumb"
            className={cn(
                'relative min-w-0 text-left',
                isInline
                    ? 'z-0 mx-0 mt-0 mb-4 w-full max-w-full rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-2.5 shadow-sm sm:px-4'
                    : [
                          'z-30',
                          '-mx-4 -mt-6 mb-4 w-[calc(100%+2rem)] max-w-none border-b border-slate-200/90 bg-white px-4 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.04)]',
                          'lg:-mx-6 lg:w-[calc(100%+3rem)] lg:px-6',
                          'sticky',
                          breadcrumbStickyTopClass(),
                      ],
                className
            )}
        >
            <div className="flex w-full min-w-0 flex-wrap items-center justify-start gap-x-2 gap-y-1.5">
                {homeBtn}
                <BreadcrumbTrail items={items} />
            </div>
        </nav>
    );
}
