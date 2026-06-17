'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const baseInputClass =
    'w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/25';

type SharedProps = {
    isEditing: boolean;
    error?: string;
    isChanged?: boolean;
    id?: string;
    className?: string;
    readValue: React.ReactNode;
};

type EditableFieldProps = SharedProps & {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'email' | 'tel' | 'date' | 'password';
};

export function EditableField({
    isEditing,
    error,
    isChanged,
    id,
    className,
    readValue,
    value,
    onChange,
    placeholder,
    type = 'text',
}: EditableFieldProps) {
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        if (!isEditing) return;
        const t = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(t);
    }, [isEditing]);

    if (!isEditing) return <>{readValue}</>;

    const borderClass = error
        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/25'
        : isChanged
          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-500/25'
          : 'border-blue-300 focus:border-blue-500';

    return (
        <div
            className={cn(
                'w-full transition-[opacity,transform] duration-200 ease-out',
                entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1',
                className,
            )}
        >
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-invalid={Boolean(error)}
                className={cn(
                    baseInputClass,
                    borderClass,
                )}
            />
            {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
        </div>
    );
}

type EditableDateProps = Omit<EditableFieldProps, 'type'>;

/** Date-specific convenience wrapper used by other inline editors. */
export function EditableDate(props: EditableDateProps) {
    return <EditableField {...props} type="date" />;
}

type EditableSelectProps = SharedProps & {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
};

export function EditableSelect({
    isEditing,
    error,
    isChanged,
    id,
    className,
    readValue,
    value,
    onChange,
    options,
    placeholder,
}: EditableSelectProps) {
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        if (!isEditing) return;
        const t = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(t);
    }, [isEditing]);

    const borderClass = error
        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/25'
        : isChanged
          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-500/25'
          : 'border-blue-300 focus:border-blue-500';

    if (!isEditing) return <>{readValue}</>;

    const safeOptions = options ?? [];

    return (
        <div
            className={cn(
                'w-full transition-[opacity,transform] duration-200 ease-out',
                entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1',
                className,
            )}
        >
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={Boolean(error)}
                className={cn(
                    baseInputClass,
                    'h-10',
                    borderClass,
                )}
            >
                {placeholder ? (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                ) : null}
                {safeOptions.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
        </div>
    );
}

type EditableTextareaProps = SharedProps & {
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    placeholder?: string;
};

export function EditableTextarea({
    isEditing,
    error,
    isChanged,
    id,
    className,
    readValue,
    value,
    onChange,
    rows = 3,
    placeholder,
}: EditableTextareaProps) {
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        if (!isEditing) return;
        const t = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(t);
    }, [isEditing]);

    if (!isEditing) return <>{readValue}</>;

    const borderClass = error
        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/25'
        : isChanged
          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-500/25'
          : 'border-blue-300 focus:border-blue-500';

    return (
        <div
            className={cn(
                'w-full transition-[opacity,transform] duration-200 ease-out',
                entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1',
                className,
            )}
        >
            <textarea
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                placeholder={placeholder}
                aria-invalid={Boolean(error)}
                className={cn(
                    baseInputClass,
                    'resize-y',
                    borderClass,
                )}
            />
            {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
        </div>
    );
}
