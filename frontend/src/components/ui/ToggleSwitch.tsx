'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type ToggleSwitchProps = {
    checked: boolean;
    onCheckedChange: (next: boolean) => void;
    disabled?: boolean;
    label?: string;
    description?: string;
    className?: string;
};

export function ToggleSwitch({ checked, onCheckedChange, disabled, label, description, className }: ToggleSwitchProps) {
    return (
        <div className={cn('flex items-start justify-between gap-4', className)}>
            <div className="min-w-0">
                {label ? <p className="text-sm font-semibold text-slate-900">{label}</p> : null}
                {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    onCheckedChange(!checked);
                }}
                className={cn(
                    'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:ring-offset-2',
                    checked ? 'border-blue-600 bg-blue-600' : 'border-slate-200 bg-slate-100',
                    disabled && 'cursor-not-allowed opacity-60',
                )}
            >
                <span
                    aria-hidden
                    className={cn(
                        'inline-block h-6 w-6 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-200',
                        checked && 'translate-x-[22px]',
                    )}
                />
            </button>
        </div>
    );
}

