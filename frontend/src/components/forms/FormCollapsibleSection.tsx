'use client';

import React from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export const sectionToneClass = {
    blue: {
        headTint: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]',
        icon: 'bg-white text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] shadow-sm',
    },
    amber: {
        headTint: 'bg-amber-50/80',
        icon: 'bg-white text-amber-800 ring-1 ring-amber-200/70 shadow-sm',
    },
    slate: {
        headTint: 'bg-slate-50/90',
        icon: 'bg-white text-slate-700 ring-1 ring-gray-200/80 shadow-sm',
    },
} as const;

/**
 * Section with collapsible body. `card` = full-width bordered block.
 * `embed` = compact cards for modals (see Lead/Project forms).
 */
export function FormCollapsibleSection({
    title,
    icon: Icon,
    children,
    className,
    defaultOpen = true,
    open: openProp,
    onOpenChange,
    headerRight,
    layout,
    tone: toneProp = 'blue',
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    className?: string;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    headerRight?: React.ReactNode;
    layout: 'card' | 'embed';
    tone?: keyof typeof sectionToneClass;
}) {
    const isControlled = openProp !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const open = isControlled ? openProp : uncontrolledOpen;
    const setOpen = React.useCallback(
        (next: boolean) => {
            if (!isControlled) setUncontrolledOpen(next);
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange],
    );
    const uid = React.useId();
    const bodyId = `form-section-body-${uid}`;

    const chevron = (
        <LuChevronDown
            className={cn('h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')}
            aria-hidden
        />
    );

    if (layout === 'card') {
        const t = sectionToneClass[toneProp];
        return (
            <section className={cn('overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm', className)}>
                <button
                    type="button"
                    className={cn(
                        'flex w-full items-center gap-3.5 border-b border-gray-200/90 px-3 py-3 text-left transition sm:gap-4 lg:px-3',
                        t.headTint,
                    )}
                    aria-expanded={open}
                    aria-controls={bodyId}
                    onClick={() => setOpen(!open)}
                >
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', t.icon)}>
                        <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                            <h2 className="min-w-0 text-lg font-semibold leading-snug text-gray-900 sm:text-[18px]">
                                {title}
                            </h2>
                            {headerRight ? <div className="shrink-0 sm:ml-auto sm:pl-2">{headerRight}</div> : null}
                        </div>
                    </div>
                    {chevron}
                </button>
                <div id={bodyId} hidden={!open} className="bg-white p-6 sm:p-7">
                    {children}
                </div>
            </section>
        );
    }

    const t = sectionToneClass[toneProp];
    return (
        <div className={className}>
            <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-sm sm:rounded-2xl">
                <button
                    type="button"
                    className={cn(
                        'flex w-full items-center gap-3 border-b border-gray-200/80 px-3.5 py-2.5 text-left transition sm:gap-3.5 sm:px-4 sm:py-3',
                        t.headTint,
                        'hover:brightness-[0.99]',
                    )}
                    aria-expanded={open}
                    aria-controls={bodyId}
                    onClick={() => setOpen(!open)}
                >
                    <div
                        className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10',
                            t.icon,
                        )}
                        aria-hidden
                    >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                            <h3 className="min-w-0 text-[15px] font-semibold leading-tight text-gray-900 sm:text-base">
                                {title}
                            </h3>
                            {headerRight ? <div className="shrink-0 sm:ml-auto sm:pl-2">{headerRight}</div> : null}
                        </div>
                    </div>
                    {chevron}
                </button>
                <div
                    id={bodyId}
                    hidden={!open}
                    className="space-y-0 border-t border-slate-100/90 bg-white px-3.5 py-4 sm:px-5 sm:py-5"
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
