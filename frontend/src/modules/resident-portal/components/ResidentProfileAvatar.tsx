'use client';

import { cn } from '@/lib/utils';

export function ResidentProfileAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const sizeClasses = {
        sm: 'h-7 w-7 text-[10px]',
        md: 'h-9 w-9 text-xs',
        lg: 'h-12 w-12 text-sm',
    };
    return (
        <div
            className={cn(
                'grid shrink-0 place-items-center rounded-full bg-[#0a66c2] font-semibold text-white',
                sizeClasses[size],
            )}
            aria-hidden
        >
            {initials}
        </div>
    );
}
