'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
    residentAccentHeaders,
    residentCardBorder,
    residentCardShadow,
    residentHeaderDivider,
} from '../styles/cardStyles';

const variantStyles = {
    default: cn(residentCardBorder, 'bg-white', residentCardShadow),
    welcome: 'border border-[#d4e4f2] bg-[#f6faff] shadow-[0_1px_2px_rgba(10,102,194,0.05)]',
} as const;

export function ResidentCard({
    children,
    className,
    padding = 'md',
    hover = false,
    variant = 'default',
}: {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    variant?: keyof typeof variantStyles;
}) {
    const paddingMap = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-5',
    };

    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border',
                variantStyles[variant],
                paddingMap[padding],
                hover && 'transition-shadow duration-200 hover:shadow-sm',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function ResidentWidget({
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
        <ResidentCard padding="none" className={className}>
            <div
                className={cn(
                    'flex items-start justify-between gap-2 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-t-xl',
                    residentHeaderDivider,
                    styles.header,
                )}
            >
                <div className="flex min-w-0 flex-1 items-start gap-2">
                    {icon ? (
                        <div
                            className={cn(
                                'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg',
                                styles.icon,
                            )}
                        >
                            {icon}
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <h3 className="text-[13px] font-semibold text-[rgba(0,0,0,0.9)]">{title}</h3>
                        {subtitle ? (
                            <p className="mt-0.5 text-[11px] text-[rgba(0,0,0,0.55)]">{subtitle}</p>
                        ) : null}
                    </div>
                </div>
                {action}
            </div>
            <div className={cn('px-3 py-2 sm:px-3.5 sm:py-2.5', bodyClassName)}>{children}</div>
        </ResidentCard>
    );
}

export function ResidentFeedItem({
    children,
    className,
    onClick,
    size = 'section',
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    size?: 'section' | 'widget';
}) {
    const Tag = onClick ? 'button' : 'div';
    const padding = size === 'widget' ? 'px-3 sm:px-3.5' : 'px-4 sm:px-5';

    return (
        <Tag
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={cn(
                'w-full py-3 text-left transition-colors duration-150',
                padding,
                onClick && 'cursor-pointer hover:bg-[#f8f8f6]',
                className,
            )}
        >
            {children}
        </Tag>
    );
}
