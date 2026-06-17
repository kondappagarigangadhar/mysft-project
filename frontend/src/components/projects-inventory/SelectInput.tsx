'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function SelectInput({
    value,
    onChange,
    options,
    placeholder,
    required,
    disabled,
    error,
    className,
    id,
    name,
}: {
    value: string;
    onChange: (value: string) => void;
    options: Array<string | { value: string; label: string }>;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    className?: string;
    id?: string;
    name?: string;
}) {
    const normalizedOptions = options.map((opt) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
    return (
        <div className="space-y-1">
            <select
                id={id}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                disabled={disabled}
                className={cn(
                    'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer',
                    error ? 'border-red-300 focus:ring-red-100 bg-red-50/30' : '',
                    className
                )}
            >
                {placeholder ? (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                ) : null}
                {normalizedOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error ? <p className="text-xs text-red-500 font-medium">{error}</p> : null}
        </div>
    );
}

