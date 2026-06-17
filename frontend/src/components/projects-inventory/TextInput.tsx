'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function TextInput({
    value,
    onChange,
    placeholder,
    type = 'text',
    minLength,
    maxLength,
    required,
    disabled,
    readOnly,
    error,
    className,
    id,
    name,
    autoComplete,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    error?: string;
    className?: string;
    id?: string;
    name?: string;
    autoComplete?: string;
}) {
    return (
        <div className="space-y-1">
            <input
                id={id}
                name={name}
                autoComplete={autoComplete}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                minLength={minLength}
                maxLength={maxLength}
                required={required}
                disabled={disabled}
                readOnly={readOnly}
                className={cn(
                    'w-full px-4 py-2.5 bg-white border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                    error ? 'border-red-300 focus:ring-red-100 bg-red-50/30' : 'border-slate-200'
                )}
            />
            {error ? <p className="text-xs text-red-500 font-medium">{error}</p> : null}
        </div>
    );
}

