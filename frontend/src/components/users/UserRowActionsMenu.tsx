'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuChevronDown, LuEye, LuKeyRound, LuPencil, LuPower, LuTrash2, LuArchive } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CTA_MENU_ITEM } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import type { User } from '@/data/mockData';
import { deleteUserRecord, updateUserRecord } from '@/data/mockData';
import { userViewHref } from '@/lib/userRoutes';

const MENU_MIN_W = 220;

export function UserRowActionsMenu({
    user,
    onBump,
}: {
    user: User;
    onBump: () => void;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);
    const [delOpen, setDelOpen] = useState(false);
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
        const menuW = Math.max(menuRef.current?.offsetWidth ?? MENU_MIN_W, MENU_MIN_W);
        let left = r.right - menuW;
        if (left < 8) left = 8;
        const top = r.bottom + 4;
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

    const toggleActive = () => {
        const next = user.status === 'Active' ? 'Inactive' : 'Active';
        updateUserRecord(user.id, { status: next, updatedDate: new Date().toISOString().slice(0, 10) });
        setOpen(false);
        onBump();
    };

    const archive = () => {
        updateUserRecord(user.id, { status: 'Suspended', updatedDate: new Date().toISOString().slice(0, 10) });
        setOpen(false);
        onBump();
    };

    const confirmDelete = () => {
        deleteUserRecord(user.id);
        setDelOpen(false);
        setOpen(false);
        onBump();
    };

    const menu = (
        <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: coords.top, left: coords.left, minWidth: MENU_MIN_W, zIndex: 10000 }}
            className="rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5"
        >
            <Link href={userViewHref(user.id)} className={CTA_MENU_ITEM} onClick={() => setOpen(false)}>
                <LuEye size={16} className="text-slate-400" />
                View
            </Link>
            <button
                type="button"
                className={CTA_MENU_ITEM}
                onClick={() => {
                    setOpen(false);
                    router.push(`${userViewHref(user.id)}?edit=1`);
                }}
            >
                <LuPencil size={16} className="text-slate-400" />
                Edit
            </button>
            <button
                type="button"
                className={CTA_MENU_ITEM}
                onClick={() => {
                    setOpen(false);
                    setResetOpen(true);
                }}
            >
                <LuKeyRound size={16} className="text-slate-400" />
                Reset password
            </button>
            <button type="button" className={CTA_MENU_ITEM} onClick={toggleActive}>
                <LuPower size={16} className="text-slate-400" />
                {user.status === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
            <button type="button" className={CTA_MENU_ITEM} onClick={archive}>
                <LuArchive size={16} className="text-slate-400" />
                Archive
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                onClick={() => {
                    setOpen(false);
                    setDelOpen(true);
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
            {mounted && open ? createPortal(menu, document.body) : null}

            <Modal
                isOpen={resetOpen}
                onClose={() => setResetOpen(false)}
                title="Reset password"
                footer={
                    <Button type="button" variant="company" size="cta" onClick={() => setResetOpen(false)}>
                        OK
                    </Button>
                }
            >
                <p className="text-sm text-slate-600">
                    A password reset link would be sent to <span className="font-semibold">{user.email}</span> (demo — no email sent).
                </p>
            </Modal>

            <Modal
                isOpen={delOpen}
                onClose={() => setDelOpen(false)}
                title="Delete user"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setDelOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">Permanently remove {user.name} from the workspace?</p>
            </Modal>
        </div>
    );
}
