'use client';

import React from 'react';
import { formatInventorySyncTimestampDisplay } from '@/lib/projectsInventoryStore';
import { cn } from '@/lib/utils';

function toDateTimeLocal(raw: string) {
    if (!raw?.trim()) return '';
    const parts = raw.split(' ');
    if (parts.length < 2) return '';
    const datePart = parts[0];
    const timePart = parts[1];
    const hm = timePart.slice(0, 5);
    return `${datePart}T${hm}`;
}

/**
 * Same "Inventory sync & locking" block everywhere: Add unit (preview), Edit (read-only), View (read-only + optional datetime display).
 */
export function InventorySyncLockingSection({
    mode,
    inventory_lock_status = false,
    lock_timestamp = '',
    unlock_timestamp = '',
    showDatetimePickers = false,
    showTitleAndIntro = true,
    className,
}: {
    mode: 'new-unit' | 'existing';
    inventory_lock_status?: boolean;
    lock_timestamp?: string;
    unlock_timestamp?: string;
    /** When timestamps exist, show read-only datetime-local (view page). */
    showDatetimePickers?: boolean;
    /** Set false when the parent card already shows the section title (e.g. unit view). */
    showTitleAndIntro?: boolean;
    className?: string;
}) {
    const isNew = mode === 'new-unit';
    const locked = Boolean(inventory_lock_status);

    const renderTimestamp = (raw: string, compactMaxWidth?: boolean) => {
        const trimmed = (raw || '').trim();
        if (showDatetimePickers && trimmed) {
            return (
                <input
                    type="datetime-local"
                    value={toDateTimeLocal(raw)}
                    readOnly
                    disabled
                    className={cn(
                        'mt-1 w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm',
                        compactMaxWidth && 'max-w-md'
                    )}
                />
            );
        }
        return (
            <p className="text-sm font-medium text-slate-700 tabular-nums mt-1">
                {isNew ? 'Not recorded yet' : formatInventorySyncTimestampDisplay(raw)}
            </p>
        );
    };

    return (
        <div className={cn('rounded-xl border border-slate-200 bg-slate-50/80 p-5 space-y-4', className)}>
            {showTitleAndIntro ? (
                <div>
                    <h3 className="text-sm font-bold text-slate-800">Inventory sync &amp; locking</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {isNew
                            ? 'New units start unlocked with no timestamps. After you save, open View unit to lock inventory for a booking — lock and unlock times are stored automatically.'
                            : 'Used to prevent double booking. Lock and unlock timestamps are recorded when you use Lock / Unlock on the unit view (or connected booking flows).'}
                    </p>
                </div>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Inventory lock status</p>
                    <p className="text-sm font-semibold text-slate-800">
                        {isNew ? 'Unlocked' : locked ? 'Locked — prevents double booking' : 'Unlocked'}
                    </p>
                </div>
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Lock timestamp</p>
                    {renderTimestamp(lock_timestamp)}
                </div>
                <div className={showDatetimePickers ? 'sm:col-span-1' : ''}>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Unlock timestamp</p>
                    {renderTimestamp(unlock_timestamp, true)}
                </div>
            </div>
        </div>
    );
}
