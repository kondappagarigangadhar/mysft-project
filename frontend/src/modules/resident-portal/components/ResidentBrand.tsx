'use client';

import React from 'react';
import { LOGO_FULL_SRC, LOGO_ICON_SRC, PRODUCT_NAME } from '@/lib/branding';
import { cn } from '@/lib/utils';

export function ResidentBrand({
    className,
    subtitle = 'Smart Community Experience',
    compact = false,
}: {
    className?: string;
    subtitle?: string;
    compact?: boolean;
}) {
    if (compact) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <div className="grid h-12 w-32 shrink-0 place-items-center overflow-hidden rounded-md">
                    <img src={LOGO_FULL_SRC} alt={PRODUCT_NAME} className="h-full w-full object-contain" />
                </div>
            </div>
        ); 
    }

    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md">
                <img src={LOGO_ICON_SRC} alt={PRODUCT_NAME} className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[rgba(0,0,0,0.9)]">
                    {PRODUCT_NAME} <span className="font-normal text-[rgba(0,0,0,0.6)]">Resident</span>
                </p>
                <p className="truncate text-[11px] text-[rgba(0,0,0,0.6)]">{subtitle}</p>
            </div>
        </div>
    );
}
