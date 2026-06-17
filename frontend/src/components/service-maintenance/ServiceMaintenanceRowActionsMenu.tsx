'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuCheck, LuChevronDown, LuCopy, LuPencil, LuTrash2, LuUserPlus } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import { CTA_MENU_ITEM } from '@/lib/theme/ctaThemeClasses';
import type { ServiceMaintenanceTicket } from '@/lib/serviceMaintenanceStore';
import { duplicateServiceMaintenanceTicket } from '@/lib/serviceMaintenanceStore';
import { serviceMaintenanceViewHref } from '@/lib/serviceMaintenanceRoutes';

const MENU_MIN_W = 240;

export function ServiceMaintenanceRowActionsMenu({
    ticket,
    onAssignVendor,
    onClose,
    onDelete,
    onCloseParent,
}: {
    ticket: ServiceMaintenanceTicket;
    onAssignVendor: (t: ServiceMaintenanceTicket) => void;
    onClose: (t: ServiceMaintenanceTicket) => void;
    onDelete: (t: ServiceMaintenanceTicket) => void;
    onCloseParent?: () => void;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
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
        const menuH = menuRef.current?.offsetHeight ?? 320;
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
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const onClone = () => {
        const copy = duplicateServiceMaintenanceTicket(ticket.slug);
        setOpen(false);
        if (copy) router.push(serviceMaintenanceViewHref(copy.slug));
    };

    const menuContent = (
        <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: coords.top, left: coords.left, minWidth: MENU_MIN_W, zIndex: 10000 }}
            className="rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5"
        >
            <Link href={`${serviceMaintenanceViewHref(ticket.slug)}?edit=1`} className={CTA_MENU_ITEM} onClick={() => setOpen(false)}>
                <LuPencil size={16} className="text-slate-400" />
                Edit
            </Link>
            <button
                type="button"
                className={CTA_MENU_ITEM}
                onClick={() => {
                    setOpen(false);
                    onAssignVendor(ticket);
                }}
            >
                <LuUserPlus size={16} className="text-slate-400" />
                Assign Vendor
            </button>
            <button type="button" className={CTA_MENU_ITEM} onClick={onClone}>
                <LuCopy size={16} className="text-slate-400" />
                Clone
            </button>
            <button
                type="button"
                className={CTA_MENU_ITEM}
                onClick={() => {
                    setOpen(false);
                    onClose(ticket);
                }}
            >
                <LuCheck size={16} className="text-slate-400" />
                Close Ticket
            </button>
            <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                onClick={() => {
                    setOpen(false);
                    onDelete(ticket);
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
                aria-haspopup="menu"
                onClick={() => setOpen((o) => !o)}
            >
                Actions
                <LuChevronDown size={14} className="opacity-70" />
            </Button>
            {mounted && open ? createPortal(menuContent, document.body) : null}
        </div>
    );
}
