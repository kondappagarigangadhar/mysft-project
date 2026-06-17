'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LuBell } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { CTA_LINK_TEXT } from '@/lib/theme/ctaThemeClasses';
import {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    runExpiryScan,
} from '@/lib/complianceDocumentsMockStore';
import { useComplianceStoreBump } from '@/hooks/useComplianceStoreBump';
import { formatShortDate } from '@/lib/formatDate';

export function ComplianceNotificationsBell() {
    useComplianceStoreBump();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        runExpiryScan();
        /** Intentionally once on mount: re-scan after store changes is handled when other actions bump(). */
    }, []);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const items = getNotifications().slice(0, 12);
    const unread = items.filter((n) => !n.read).length;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="relative rounded-xl p-2.5 text-slate-600 transition-all hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                aria-expanded={open}
                aria-label="Compliance notifications"
            >
                <LuBell className="h-5 w-5" />
                {unread > 0 ? (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                        {unread > 9 ? '9+' : unread}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="absolute right-0 top-full z-[80] mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xl ring-1 ring-black/5">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">Alerts</h3>
                            <p className="text-xs text-slate-500">Expiry · uploads · versions</p>
                        </div>
                        <button
                            type="button"
                            className={cn('text-xs font-medium', CTA_LINK_TEXT, 'hover:underline')}
                            onClick={() => {
                                markAllNotificationsRead();
                            }}
                        >
                            Mark all read
                        </button>
                    </div>
                    <div className="max-h-[min(60vh,320px)] overflow-y-auto">
                        {items.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-slate-500">No alerts yet.</p>
                        ) : (
                            items.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    className={cn(
                                        'flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50',
                                        !n.read && 'bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]',
                                    )}
                                    onClick={() => markNotificationRead(n.id)}
                                >
                                    <span className="font-medium text-slate-800">{n.title}</span>
                                    <span className="text-xs text-slate-600">{n.message}</span>
                                    <span className="text-[11px] text-slate-400">
                                        {formatShortDate(n.at.slice(0, 10))} ·{' '}
                                        {new Date(n.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
