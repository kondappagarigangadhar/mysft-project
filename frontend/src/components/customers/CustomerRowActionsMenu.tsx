'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuArchive, LuChevronDown, LuCopy, LuDownload, LuEye, LuPencil, LuShare2, LuTrash2 } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import { CTA_MENU_ITEM } from '@/lib/theme/ctaThemeClasses';
import { customerProfileEditHref, customerViewHref } from '@/lib/customerRoutes';
import type { Customer } from '@/lib/customersStore';
import { duplicateCustomer } from '@/lib/customersStore';
import { downloadCustomersCsv } from '@/lib/exportCustomersCsv';

const MENU_MIN_W = 220;

export function CustomerRowActionsMenu({
    customer,
    onArchive,
    onDelete,
    onCloseParent,
}: {
    customer: Customer;
    onArchive: (c: Customer) => void;
    onDelete: (c: Customer) => void;
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
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
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

    const menuContent = (
        <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: coords.top, left: coords.left, minWidth: MENU_MIN_W, zIndex: 10000 }}
            className="rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5"
        >
            <Link
                href={customerViewHref(customer.slug)}
                className={CTA_MENU_ITEM}
                onClick={() => {
                    setOpen(false);
                    onCloseParent?.();
                }}
            >
                <LuEye size={16} className="text-slate-400" />
                View
            </Link>
            <Link href={customerProfileEditHref(customer.slug)} className={CTA_MENU_ITEM} onClick={() => setOpen(false)}>
                <LuPencil size={16} className="text-slate-400" />
                Edit
            </Link>
            <button
                type="button"
                className={CTA_MENU_ITEM}
                onClick={() => {
                    const copy = duplicateCustomer(customer.slug);
                    setOpen(false);
                    if (copy) router.push(customerViewHref(copy.slug));
                }}
            >
                <LuCopy size={16} className="text-slate-400" />
                Clone
            </button>
            <button
                type="button"
                className={CTA_MENU_ITEM}
                onClick={() => {
                    downloadCustomersCsv([customer], `${customer.slug}-export.csv`);
                    setOpen(false);
                }}
            >
                <LuDownload size={16} className="text-slate-400" />
                Export
            </button>
            <button
                type="button"
                className={CTA_MENU_ITEM}
                onClick={() => {
                    void navigator.clipboard?.writeText(window.location.origin + customerViewHref(customer.slug));
                    setOpen(false);
                }}
            >
                <LuShare2 size={16} className="text-slate-400" />
                Share
            </button>
            <button
                type="button"
                className={CTA_MENU_ITEM}
                onClick={() => {
                    setOpen(false);
                    onArchive(customer);
                }}
            >
                <LuArchive size={16} className="text-slate-400" />
                Archive
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                onClick={() => {
                    setOpen(false);
                    onDelete(customer);
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
