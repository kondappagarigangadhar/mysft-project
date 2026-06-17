'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SimpleTabs({
    items,
    activeKey,
}: {
    items: Array<{ key: string; label: string; href: string }>;
    /** When set (e.g. for `?tab=` on the same path), highlights by key instead of pathname-only match. */
    activeKey?: string;
}) {
    const pathname = usePathname();
    const ACTIVE = '#0092ff';

    return (
        <div className="my-2">
            <div className="flex items-center gap-2 overflow-x-auto p-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
                {items.map((t) => {
                    const active = activeKey !== undefined ? t.key === activeKey : pathname === t.href;
                    return (
                        <Link
                            key={t.key}
                            href={t.href}
                            style={
                                active
                                    ? { backgroundColor: ACTIVE, borderColor: ACTIVE, color: 'white' }
                                    : undefined
                            }
                            className={cn(
                                'px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-slate-50 hover:text-[#0092ff]',
                                active ? 'bg-[#0092ff] border-[#0092ff] text-white' : 'bg-white text-slate-700 border-slate-200'
                            )}
                        >
                            {t.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

