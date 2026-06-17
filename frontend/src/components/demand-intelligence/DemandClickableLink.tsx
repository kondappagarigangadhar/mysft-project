'use client';

import React from 'react';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';
import { cn } from '@/lib/utils';

/** Internal demand page anchor or verified project/inventory route only. */
export function DemandClickableLink({
    href,
    children,
    className,
    showArrow = false,
    block = false,
    'aria-label': ariaLabel,
}: {
    href: string | null | undefined;
    children: React.ReactNode;
    className?: string;
    showArrow?: boolean;
    block?: boolean;
    'aria-label'?: string;
}) {
    if (!href) {
        return <span className={className}>{children}</span>;
    }

    const isAnchor = href.startsWith('#');
    const classes = cn(
        block && 'block',
        'transition-colors',
        isAnchor ? 'hover:text-violet-800' : 'text-violet-800 hover:text-violet-950 hover:underline',
        className,
    );

    if (isAnchor) {
        return (
            <a href={href} className={classes} aria-label={ariaLabel}>
                {children}
                {showArrow ? <LuChevronRight size={14} className="inline shrink-0 opacity-70" aria-hidden /> : null}
            </a>
        );
    }

    return (
        <Link href={href} className={classes} aria-label={ariaLabel}>
            {children}
            {showArrow ? <LuChevronRight size={14} className="inline shrink-0 opacity-70" aria-hidden /> : null}
        </Link>
    );
}

export function DemandClickableCard({
    href,
    children,
    className,
}: {
    href: string | null | undefined;
    children: React.ReactNode;
    className?: string;
}) {
    const interactive = href
        ? cn(
              className,
              'cursor-pointer transition-shadow hover:shadow-md hover:ring-2 hover:ring-violet-200/80 focus-within:ring-2 focus-within:ring-violet-300',
          )
        : className;

    if (!href) {
        return <div className={interactive}>{children}</div>;
    }

    if (href.startsWith('#')) {
        return (
            <a href={href} className={cn(interactive, 'block no-underline text-inherit')}>
                {children}
            </a>
        );
    }

    return (
        <Link href={href} className={cn(interactive, 'block no-underline text-inherit')}>
            {children}
        </Link>
    );
}
