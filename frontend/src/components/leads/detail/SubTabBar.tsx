'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type SubTabItem<T extends string> = {
    id: T;
    label: string;
};

type SubTabBarProps<T extends string> = {
    items: SubTabItem<T>[];
    active: T;
    onChange: (id: T) => void;
};

export function SubTabBar<T extends string>({ items, active, onChange }: SubTabBarProps<T>) {
    return (
        <div className="flex gap-1 rounded-lg bg-gray-100/80 p-1">
            {items.map((item) => {
                const isActive = active === item.id;
                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange(item.id)}
                        className={cn(
                            'min-w-0 flex-1 rounded-md px-3 py-2 text-center text-sm font-semibold transition-colors',
                            isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        )}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
