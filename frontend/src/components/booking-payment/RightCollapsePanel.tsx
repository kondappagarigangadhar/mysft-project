'use client';

import React from 'react';
import { LuPanelRightClose, LuPanelRightOpen } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export type PanelMode = 'add' | 'edit' | 'view' | null;

export function RightCollapsePanel({
    open,
    onClose,
    title,
    subtitle,
    children,
    widthClassName = 'w-full max-w-[min(100vw-1rem,440px)]',
    collapseLabel = 'Close panel',
    kicker = 'Panel',
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    /** Tailwind width classes for the drawer */
    widthClassName?: string;
    collapseLabel?: string;
    /** Small label above the title (e.g. "Documents", "Booking"). */
    kicker?: string;
}) {
    return (
        <>
            <button
                type="button"
                aria-hidden={!open}
                className={cn(
                    'fixed inset-0 z-[90] bg-slate-900/35 backdrop-blur-[2px] transition-opacity lg:bg-slate-900/25',
                    open ? 'opacity-100' : 'pointer-events-none opacity-0'
                )}
                onClick={onClose}
            />
            <aside
                className={cn(
                    'fixed top-0 right-0 z-[100] flex h-full flex-col border-l border-slate-200 bg-white shadow-[-8px_0_32px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out',
                    widthClassName,
                    open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
                )}
                aria-hidden={!open}
            >
                <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kicker}</p>
                        <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">{title}</h2>
                        {subtitle ? <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{subtitle}</p> : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        aria-label={collapseLabel}
                        title={collapseLabel}
                    >
                        <LuPanelRightClose size={20} />
                    </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
            </aside>
        </>
    );
}

/** Floating toggle when panel is closed — optional use on pages */
export function OpenPanelHintButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="fixed bottom-6 right-6 z-[80] inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-lg hover:bg-slate-50 lg:hidden"
        >
            <LuPanelRightOpen size={18} />
            {label}
        </button>
    );
}
