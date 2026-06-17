'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuChevronDown, LuPencil, LuTrash2, LuWorkflow } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import { CTA_MENU_ITEM, CTA_MENU_ITEM_BLOCK, CTA_NAV_PILL_ACTIVE } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import type { BusinessUnit } from '@/data/mockData';

const MENU_MIN_W = 200;

export function BusinessUnitRowActionsMenu({
    bu,
    onEdit,
    onChangeStatus,
    onDelete,
    onCloseParent,
}: {
    bu: BusinessUnit;
    onEdit: (bu: BusinessUnit) => void;
    onChangeStatus: (id: number, status: 'Active' | 'Inactive') => void;
    onDelete: (bu: BusinessUnit) => void;
    onCloseParent?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [sub, setSub] = useState<'status' | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const updatePosition = useCallback(() => {
        if (!open || !btnRef.current) return;
        const r = btnRef.current.getBoundingClientRect();
        const margin = 4;
        const pad = 8;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const menuH = menuRef.current?.offsetHeight ?? 200;
        const menuW = Math.max(menuRef.current?.offsetWidth ?? MENU_MIN_W, MENU_MIN_W);
        let left = r.right - menuW;
        if (left < pad) left = pad;
        if (left + menuW > vw - pad) left = Math.max(pad, vw - menuW - pad);
        const fitsBelow = r.bottom + margin + menuH <= vh - pad;
        const fitsAbove = r.top - margin - menuH >= pad;
        let top: number;
        if (fitsBelow) top = r.bottom + margin;
        else if (fitsAbove) top = r.top - menuH - margin;
        else top = Math.max(pad, Math.min(r.bottom + margin, vh - pad - menuH));
        setCoords({ top, left });
    }, [open]);

    useLayoutEffect(() => {
        if (!open) return;
        let raf1 = 0;
        let raf2 = 0;
        updatePosition();
        raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(updatePosition);
        });
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        const el = menuRef.current;
        const ro =
            el && typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(() => {
                      updatePosition();
                  })
                : null;
        if (el && ro) ro.observe(el);
        return () => {
            cancelAnimationFrame(raf1);
            cancelAnimationFrame(raf2);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
            ro?.disconnect();
        };
    }, [open, sub, updatePosition]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
            setOpen(false);
            setSub(null);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const statuses: Array<'Active' | 'Inactive'> = ['Active', 'Inactive'];

    const menuContent = (
        <div
            ref={menuRef}
            role="menu"
            style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                minWidth: MENU_MIN_W,
                zIndex: 10000,
            }}
            className="rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5"
        >
            <button
                type="button"
                className={CTA_MENU_ITEM}
                onClick={() => {
                    setOpen(false);
                    onCloseParent?.();
                    onEdit(bu);
                }}
            >
                <LuPencil size={16} className="text-slate-400" />
                Edit
            </button>

            <button type="button" className={CTA_MENU_ITEM_BLOCK} onClick={() => setSub(sub === 'status' ? null : 'status')}>
                <LuWorkflow size={16} className="text-slate-400" />
                Change status
            </button>
            {sub === 'status' ? (
                <div className="border-t border-slate-100 bg-slate-50/80 px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                        {statuses.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={cn(
                                    'rounded-lg px-2.5 py-1 text-xs font-semibold ring-1',
                                    bu.status === s
                                        ? cn(CTA_NAV_PILL_ACTIVE, 'ring-1 ring-[var(--cta-button-bg)]')
                                        : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-100',
                                )}
                                onClick={() => {
                                    onChangeStatus(bu.id, s);
                                    setSub(null);
                                    setOpen(false);
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="my-1 border-t border-slate-100" />

            <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                onClick={() => {
                    setOpen(false);
                    onDelete(bu);
                }}
            >
                <LuTrash2 size={16} />
                Delete
            </button>
        </div>
    );

    return (
        <div className="relative flex justify-end" ref={rootRef}>
            <Button
                ref={btnRef}
                type="button"
                variant="companyOutline"
                size="sm"
                className="h-8 gap-1 border-slate-200 px-2 text-xs font-semibold text-slate-700"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
            >
                Actions
                <LuChevronDown size={14} className={cn('transition', open && 'rotate-180')} />
            </Button>
            {mounted && open ? createPortal(menuContent, document.body) : null}
        </div>
    );
}
