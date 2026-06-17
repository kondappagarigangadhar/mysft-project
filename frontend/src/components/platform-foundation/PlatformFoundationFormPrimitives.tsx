'use client';

import React from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { cn } from '@/lib/utils';

/** Same 2-column field grid as Leads inline overview editor. */
export const PF_FIELD_GRID =
    'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';

const baseInputClass =
    'w-full rounded-md border border-blue-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/25 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500';

export function PfFieldRow({
    label,
    required,
    error,
    children,
    className,
    fieldId,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
    className?: string;
    fieldId?: string;
}) {
    return (
        <div
            id={fieldId ? `${fieldId}-row` : undefined}
            className={cn(
                'flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50',
                className,
            )}
        >
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
            <div className="flex w-full min-w-0 items-center gap-2 text-[15px] font-medium text-gray-900">
                <span className="text-gray-300" aria-hidden>
                    :
                </span>
                <span className="w-full min-w-0">
                    {children}
                    {error ? (
                        <p className="mt-1 text-xs font-medium text-rose-600" role="alert">
                            {error}
                        </p>
                    ) : null}
                </span>
            </div>
        </div>
    );
}

export function PfCollapsibleSection({
    title,
    icon: Icon,
    tone = 'slate',
    open,
    onOpenChange,
    headerRight,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: 'blue' | 'amber' | 'slate';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    headerRight?: React.ReactNode;
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
              : { head: 'bg-slate-50/80', icon: 'text-slate-700', ring: 'ring-slate-200/70' };

    return (
        <section className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-none">
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                className={cn(
                    'flex w-full items-center gap-2.5 border-b border-gray-300 px-3 py-2 text-left transition hover:brightness-[0.99]',
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
                        <span className="truncate text-sm font-semibold tracking-wide text-gray-800">{title}</span>
                        {headerRight ? <span className="ml-auto shrink-0">{headerRight}</span> : null}
                    </span>
                </span>
                <LuChevronDown
                    className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')}
                    aria-hidden
                />
            </button>
            <div hidden={!open} className="bg-white">
                {children}
            </div>
        </section>
    );
}

export function PfSectionErrorBadge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
        <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
            {count} field{count === 1 ? '' : 's'} required
        </span>
    );
}

export function PfInput({
    id,
    value,
    onChange,
    type = 'text',
    readOnly,
    disabled,
    placeholder,
    error,
}: {
    id: string;
    value: string;
    onChange?: (v: string) => void;
    type?: string;
    readOnly?: boolean;
    disabled?: boolean;
    placeholder?: string;
    error?: boolean;
}) {
    return (
        <div className="w-full">
            <input
                id={id}
                type={type}
                value={value}
                readOnly={readOnly}
                disabled={disabled}
                placeholder={placeholder}
                onChange={(e) => onChange?.(e.target.value)}
                aria-invalid={Boolean(error)}
                className={cn(
                    baseInputClass,
                    error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/25',
                )}
            />
        </div>
    );
}

export function PfSelect({
    id,
    value,
    onChange,
    options,
    disabled,
    error,
}: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    disabled?: boolean;
    error?: boolean;
}) {
    return (
        <div className="w-full">
            <select
                id={id}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={Boolean(error)}
                className={cn(
                    baseInputClass,
                    error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/25',
                )}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export function PfTextarea({
    id,
    value,
    onChange,
    rows = 3,
    readOnly,
    error,
}: {
    id: string;
    value: string;
    onChange?: (v: string) => void;
    rows?: number;
    readOnly?: boolean;
    error?: boolean;
}) {
    return (
        <div className="w-full">
            <textarea
                id={id}
                rows={rows}
                value={value}
                readOnly={readOnly}
                onChange={(e) => onChange?.(e.target.value)}
                aria-invalid={Boolean(error)}
                className={cn(
                    baseInputClass,
                    'resize-y min-h-[4.5rem]',
                    error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/25',
                )}
            />
        </div>
    );
}

export function PfInfoBanner({
    children,
    variant = 'blue',
}: {
    children: React.ReactNode;
    variant?: 'blue' | 'amber' | 'slate';
}) {
    const tones = {
        blue: 'border-blue-200 bg-blue-50/90 text-blue-900',
        amber: 'border-amber-200 bg-amber-50/90 text-amber-900',
        slate: 'border-gray-200 bg-gray-50/90 text-gray-800',
    };
    return (
        <div className={cn('border-t border-gray-200/80 px-3 py-3 text-sm leading-relaxed', tones[variant])}>
            {children}
        </div>
    );
}

export function PfToggleFieldRow({
    label,
    description,
    checked,
    onChange,
    badge,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    badge?: string;
}) {
    return (
        <div className="flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50">
            <div className="w-44 shrink-0 text-sm font-medium text-gray-500">{label}</div>
            <div className="flex w-full min-w-0 items-center gap-2">
                <span className="text-gray-300" aria-hidden>
                    :
                </span>
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                        {description ? <p className="text-xs font-normal text-gray-500">{description}</p> : null}
                        {badge ? (
                            <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                                {badge}
                            </span>
                        ) : null}
                    </div>
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        className="h-4 w-4 shrink-0 accent-[var(--cta-button-bg)]"
                        aria-label={label}
                    />
                </div>
            </div>
        </div>
    );
}
