'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center',
                className
            )}
        >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm ring-1 ring-gray-100">
                {icon}
            </span>
            <p className="mt-4 text-sm font-semibold text-gray-800">{title}</p>
            {description ? <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p> : null}
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}
