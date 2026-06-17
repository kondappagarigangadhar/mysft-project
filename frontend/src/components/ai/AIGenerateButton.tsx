'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LuLoader } from 'react-icons/lu';

export function AIGenerateButton({
    children,
    loading,
    disabled,
    onClick,
    variant = 'primary',
    className,
    type = 'button',
}: {
    children: React.ReactNode;
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
    className?: string;
    type?: 'button' | 'submit';
}) {
    const busy = loading || disabled;
    return (
        <button
            type={type}
            disabled={busy}
            onClick={onClick}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] disabled:opacity-60',
                variant === 'primary' &&
                    'bg-gradient-to-r from-[var(--cta-button-bg)] to-[var(--cta-button-hover-bg)] text-[var(--cta-button-text)] shadow-sm hover:scale-[1.02] hover:shadow-md hover:text-[var(--cta-button-hover-text)] disabled:hover:scale-100',
                variant === 'secondary' &&
                    'border border-gray-300 bg-white text-gray-800 shadow-sm hover:scale-[1.02] hover:bg-gray-50 disabled:hover:scale-100',
                className,
            )}
        >
            {loading ? <LuLoader className="h-4 w-4 animate-spin shrink-0" aria-hidden /> : null}
            {children}
        </button>
    );
}
