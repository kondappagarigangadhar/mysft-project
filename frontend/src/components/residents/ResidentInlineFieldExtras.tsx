'use client';

import React, { useEffect, useState } from 'react';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { cn } from '@/lib/utils';

const baseInputClass =
    'w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/25';

type SharedProps = {
    isEditing: boolean;
    error?: string;
    readValue: React.ReactNode;
};

export function EditableEnterpriseTitle({
    isEditing,
    error,
    readValue,
    value,
    onChange,
    placeholder,
    id,
}: SharedProps & {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    id?: string;
}) {
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        if (!isEditing) return;
        const t = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(t);
    }, [isEditing]);

    if (!isEditing) return <>{readValue}</>;

    const borderClass = error
        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/25'
        : 'border-blue-300 focus:border-blue-500';

    return (
        <div className={cn('w-full transition-[opacity,transform] duration-200', entered ? 'opacity-100' : 'opacity-0')}>
            <input
                id={id}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-invalid={Boolean(error)}
                className={cn(
                    'w-full rounded-lg border bg-white px-3 py-2.5 text-2xl font-semibold tracking-tight text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2',
                    borderClass,
                )}
            />
            {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
        </div>
    );
}

export function EditableDatetime({
    isEditing,
    error,
    readValue,
    value,
    onChange,
    id,
}: SharedProps & {
    value: string;
    onChange: (value: string) => void;
    id?: string;
}) {
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        if (!isEditing) return;
        const t = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(t);
    }, [isEditing]);

    if (!isEditing) return <>{readValue}</>;

    const borderClass = error
        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/25'
        : 'border-blue-300 focus:border-blue-500';

    return (
        <div className={cn('w-full transition-[opacity,transform] duration-200', entered ? 'opacity-100' : 'opacity-0')}>
            <input
                id={id}
                type="datetime-local"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={Boolean(error)}
                className={cn(baseInputClass, borderClass)}
            />
            {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
        </div>
    );
}

export function EditableToggleInline({
    isEditing,
    readValue,
    checked,
    onChange,
    label,
}: SharedProps & {
    checked: boolean;
    onChange: (v: boolean) => void;
    label?: string;
}) {
    if (!isEditing) return <>{readValue}</>;
    return <ToggleSwitch checked={checked} onCheckedChange={onChange} label={label} className="w-full max-w-md" />;
}

export function EditableMultiSelectChips<T extends string>({
    isEditing,
    readValue,
    value,
    onChange,
    options,
}: SharedProps & {
    value: T[];
    onChange: (next: T[]) => void;
    options: readonly T[];
}) {
    if (!isEditing) return <>{readValue}</>;

    const toggle = (opt: T) => {
        if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
        else onChange([...value, opt]);
    };

    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
                const on = value.includes(opt);
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => toggle(opt)}
                        className={cn(
                            'rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide transition',
                            on
                                ? 'border-[var(--cta-button-bg)] bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-slate-900'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                        )}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}

export function EditableTagMultiSelect({
    isEditing,
    readValue,
    value,
    onChange,
    presets,
}: SharedProps & {
    value: string[];
    onChange: (next: string[]) => void;
    presets: readonly string[];
}) {
    const [custom, setCustom] = useState('');

    if (!isEditing) return <>{readValue}</>;

    const toggle = (tag: string) => {
        if (value.includes(tag)) onChange(value.filter((t) => t !== tag));
        else onChange([...value, tag]);
    };

    const addCustom = () => {
        const t = custom.trim();
        if (!t || value.includes(t)) return;
        onChange([...value, t]);
        setCustom('');
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {presets.map((tag) => {
                    const on = value.includes(tag);
                    return (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => toggle(tag)}
                            className={cn(
                                'rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide transition',
                                on
                                    ? 'border-violet-400 bg-violet-100 text-violet-950'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                            )}
                        >
                            {tag}
                        </button>
                    );
                })}
                {value
                    .filter((t) => !presets.includes(t))
                    .map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => toggle(tag)}
                            className="rounded-full border border-violet-400 bg-violet-100 px-3 py-1 text-xs font-bold text-violet-950"
                        >
                            {tag} ×
                        </button>
                    ))}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustom();
                        }
                    }}
                    placeholder="Add custom tag"
                    className={cn(baseInputClass, 'max-w-xs border-blue-300')}
                />
                <button
                    type="button"
                    onClick={addCustom}
                    className="shrink-0 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Add
                </button>
            </div>
        </div>
    );
}

export function formatNoticeDatetime(iso: string): string {
    if (!iso?.trim()) return '—';
    try {
        const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

export function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
