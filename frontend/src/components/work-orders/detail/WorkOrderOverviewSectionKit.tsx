'use client';

import React from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export function FieldRow({
    label,
    required,
    children,
    className,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50', className)}>
            <div className="w-44 shrink-0 text-sm font-medium text-gray-500">
                <span className="inline-flex items-baseline gap-0.5">
                    {label}
                    {required ? (
                        <span className="text-rose-500" aria-hidden>
                            *
                        </span>
                    ) : null}
                </span>
            </div>
            <div className="flex w-full items-center gap-2 text-[15px] font-medium text-gray-900">
                <span className="text-gray-300" aria-hidden>
                    :
                </span>
                <span className="w-full">{children}</span>
            </div>
        </div>
    );
}

export function InlineCollapsibleSection({
    title,
    icon: Icon,
    tone = 'slate',
    open,
    onOpenChange,
    headerRight,
    sectionId,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: 'blue' | 'amber' | 'slate' | 'emerald';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    headerRight?: React.ReactNode;
    sectionId?: string;
    children: React.ReactNode;
}) {
    const toneClasses =
        tone === 'blue'
            ? {
                  head: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]',
                  icon: 'text-[var(--cta-button-bg)]',
                  ring: 'ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]',
              }
            : tone === 'amber'
              ? { head: 'bg-amber-50/80', icon: 'text-amber-800', ring: 'ring-amber-100/80' }
              : tone === 'emerald'
                ? { head: 'bg-emerald-50/80', icon: 'text-emerald-800', ring: 'ring-emerald-100/80' }
                : { head: 'bg-slate-50/80', icon: 'text-slate-700', ring: 'ring-slate-200/70' };

    return (
        <section id={sectionId} className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-none">
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                className={cn(
                    'flex w-full items-center gap-2.5 border-b border-gray-300 px-3 py-2 text-left transition hover:brightness-[0.99]',
                    toneClasses.head,
                )}
            >
                <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/90 ring-1', toneClasses.ring)} aria-hidden>
                    <Icon className={cn('h-4 w-4', toneClasses.icon)} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold tracking-wide text-gray-800">{title}</span>
                        {headerRight ? <span className="ml-auto shrink-0">{headerRight}</span> : null}
                    </span>
                </span>
                <LuChevronDown className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
            </button>
            <div hidden={!open} className="bg-white">
                {children}
            </div>
        </section>
    );
}

export function SummaryStatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{value}</p>
            {sub ? <p className="mt-0.5 text-xs font-medium text-slate-500">{sub}</p> : null}
        </div>
    );
}
