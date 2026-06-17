'use client';

import React from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export type SectionTone = 'blue' | 'amber' | 'slate';

export function ProjectRecordCollapsibleSection({
    title,
    icon: Icon,
    tone,
    open,
    onOpenChange,
    headerRight,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: SectionTone;
    open: boolean;
    onOpenChange: (next: boolean) => void;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
}) {
    const toneClasses =
        tone === 'blue'
            ? {
                  head: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)]',
                  icon: 'text-[var(--cta-button-bg)]',
                  ring: 'ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]',
              }
            : tone === 'amber'
              ? { head: 'bg-amber-50/80', icon: 'text-amber-800', ring: 'ring-amber-100/80' }
              : { head: 'bg-slate-50/80', icon: 'text-slate-700', ring: 'ring-slate-200/70' };

    return (
        <section className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                className={cn(
                    'flex w-full items-center gap-2.5 border-b border-gray-100 px-3 py-2.5 text-left transition hover:bg-white/60',
                    toneClasses.head,
                )}
            >
                <span
                    className={cn(
                        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/90 ring-1',
                        toneClasses.ring,
                    )}
                    aria-hidden
                >
                    <Icon className={cn('h-4 w-4', toneClasses.icon)} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-xs font-bold uppercase tracking-wider text-gray-700">{title}</span>
                        {headerRight ? <span className="ml-auto shrink-0">{headerRight}</span> : null}
                    </span>
                </span>
                <LuChevronDown className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
            </button>
            <div hidden={!open}>{children}</div>
        </section>
    );
}

export function ProjectRecordFieldRow({
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
        <div
            className={cn(
                'flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50 md:odd:border-r md:odd:border-gray-100',
                className,
            )}
        >
            <div className="w-44 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                <span className="w-full min-w-0">{children}</span>
            </div>
        </div>
    );
}

export function YesNoBadge({ value }: { value: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                value ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
            )}
        >
            {value ? 'Yes' : 'No'}
        </span>
    );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
    const pct = Math.max(0, Math.min(100, value));
    return (
        <div>
            <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wide text-gray-500">{label}</span>
                <span className="tabular-nums font-bold text-gray-800">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-[var(--cta-button-bg)] transition-all" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export function ToggleSwitch({
    checked,
    onChange,
    disabled,
    label,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] disabled:opacity-50',
                checked ? 'bg-[var(--cta-button-bg)]' : 'bg-gray-200',
            )}
        >
            <span
                className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                    checked ? 'translate-x-5' : 'translate-x-0.5',
                )}
            />
        </button>
    );
}
