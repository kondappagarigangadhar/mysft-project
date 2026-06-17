'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuBell } from 'react-icons/lu';
import { getLeaseAgreementViewUrl } from '@/lib/rentalLeaseAgreementStore';
import { cn } from '@/lib/utils';
import { useRentalLeaseStoreBump } from '@/hooks/useRentalLeaseStoreBump';
import {
    getLeasePortalNotifications,
    markAllLeaseNotificationsRead,
    markLeaseNotificationRead,
} from '@/lib/rentalLeaseAgreementStore';
import { headerNavBadgeClass, headerNavIconClass } from '../components/headerNavStyles';

type Props = {
    residentEmail: string;
};

export function ResidentNotificationsBell({ residentEmail }: Props) {
    useRentalLeaseStoreBump();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const items = getLeasePortalNotifications(residentEmail).slice(0, 12);
    const unread = items.filter((n) => !n.read).length;

    return (
        <div className="relative shrink-0" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(headerNavIconClass, open && 'bg-[#f3f2ef] text-[rgba(0,0,0,0.9)]')}
                aria-expanded={open}
                aria-label="Notifications"
            >
                <LuBell className="h-[20px] w-[20px]" aria-hidden />
                {unread > 0 ? (
                    <span className={headerNavBadgeClass}>{unread > 9 ? '9+' : unread}</span>
                ) : null}
            </button>

            {open ? (
                <div className="absolute right-0 top-full z-[110] mt-1 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-[#e0dfdc] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                    <div className="flex items-center justify-between border-b border-[#ebebeb] px-4 py-2.5">
                        <div>
                            <h3 className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">Notifications</h3>
                            <p className="text-[11px] text-[rgba(0,0,0,0.6)]">Lease · billing · community</p>
                        </div>
                        <button
                            type="button"
                            className="text-[11px] font-semibold text-[#0a66c2] hover:underline"
                            onClick={() => markAllLeaseNotificationsRead(residentEmail)}
                        >
                            Mark all read
                        </button>
                    </div>
                    <div className="max-h-[min(60vh,320px)] overflow-y-auto">
                        {items.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-[rgba(0,0,0,0.6)]">No notifications yet.</p>
                        ) : (
                            items.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    className={cn(
                                        'flex w-full flex-col gap-0.5 border-b border-[#f3f2ef] px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#f3f2ef]',
                                        !n.read && 'bg-[#ebf4fd]/50',
                                    )}
                                    onClick={() => {
                                        markLeaseNotificationRead(n.id);
                                        setOpen(false);
                                        if (n.agreementId) {
                                            router.push(getLeaseAgreementViewUrl(n.agreementId));
                                        }
                                    }}
                                >
                                    <span className="font-semibold text-[rgba(0,0,0,0.9)]">{n.title}</span>
                                    <span className="text-xs text-[rgba(0,0,0,0.6)] line-clamp-2">{n.message}</span>
                                    <span className="text-[10px] text-[rgba(0,0,0,0.45)]">
                                        {n.channel} · {new Date(n.at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
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
