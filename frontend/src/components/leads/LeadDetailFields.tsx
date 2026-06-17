'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function FieldBlock({
    label,
    children,
    className,
    icon: Icon,
}: {
    label: string;
    children: React.ReactNode;
    className?: string;
    icon?: React.ComponentType<{ className?: string; size?: number }>;
}) {
    return (
        <div
            className={cn(
                'rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md',
                className
            )}
        >
            <div className="flex items-start gap-3">
                {Icon ? (
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 ring-1 ring-gray-100">
                        <Icon className="h-4 w-4" size={16} />
                    </span>
                ) : null}
                <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm text-gray-500">{label}</p>
                    <div className="text-base font-semibold text-gray-900">{children}</div>
                </div>
            </div>
        </div>
    );
}

export function SectionCard({
    title,
    description,
    icon: Icon,
    children,
}: {
    title: string;
    description?: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="border-b border-gray-100 bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-blue-600 ring-1 ring-gray-100">
                        <Icon className="h-[18px] w-[18px]" size={18} />
                    </span>
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                        {description ? <p className="mt-0.5 text-sm text-gray-500">{description}</p> : null}
                    </div>
                </div>
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}
