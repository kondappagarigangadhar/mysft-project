'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuChevronDown, LuDownload, LuEllipsis, LuEye, LuHistory, LuPencil, LuTrash2 } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const GAP_PX = 6;
const VIEWPORT_MARGIN = 8;
const MIN_MENU_W = 208;

function placeMenu(
    btnRect: DOMRect,
    menuW: number,
    menuH: number
): { top: number; left: number } {
    const left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(btnRect.right - menuW, window.innerWidth - menuW - VIEWPORT_MARGIN)
    );
    let top = btnRect.bottom + GAP_PX;
    if (top + menuH > window.innerHeight - VIEWPORT_MARGIN) {
        top = btnRect.top - GAP_PX - menuH;
    }
    if (top < VIEWPORT_MARGIN) {
        top = VIEWPORT_MARGIN;
    }
    return { top, left };
}

export function DocumentRowActionsDropdown({
    canViewDoc,
    canEditDoc,
    canDeleteDoc,
    onView,
    onDownload,
    onEdit,
    onVersions,
    onDelete,
}: {
    canViewDoc: boolean;
    canEditDoc: boolean;
    canDeleteDoc: boolean;
    onView: () => void;
    onDownload: () => void;
    onEdit: () => void;
    onVersions: () => void;
    onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

    const updatePosition = useCallback(() => {
        const btn = btnRef.current;
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const menu = menuRef.current;
        const w = menu ? Math.max(menu.offsetWidth, MIN_MENU_W) : MIN_MENU_W;
        const h = menu?.offsetHeight ?? 0;
        const fallbackH = 220;
        const effectiveH = h > 0 ? h : fallbackH;
        setCoords(placeMenu(r, w, effectiveH));
    }, []);

    const close = useCallback(() => {
        setOpen(false);
        setCoords(null);
    }, []);

    const toggle = () => {
        if (open) {
            close();
        } else {
            const btn = btnRef.current;
            if (btn) {
                const r = btn.getBoundingClientRect();
                setCoords(placeMenu(r, MIN_MENU_W, 220));
            }
            setOpen(true);
        }
    };

    useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
        const id = requestAnimationFrame(() => updatePosition());
        return () => cancelAnimationFrame(id);
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;
        const onResizeOrScroll = () => updatePosition();
        window.addEventListener('resize', onResizeOrScroll);
        window.addEventListener('scroll', onResizeOrScroll, true);
        return () => {
            window.removeEventListener('resize', onResizeOrScroll);
            window.removeEventListener('scroll', onResizeOrScroll, true);
        };
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (btnRef.current?.contains(t)) return;
            if (menuRef.current?.contains(t)) return;
            close();
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, close]);

    const run = (fn: () => void) => {
        fn();
        close();
    };

    const itemClass =
        'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors';

    const menu =
        open &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
            <div
                ref={menuRef}
                role="menu"
                aria-label="Document actions"
                className="fixed z-[200] min-w-[208px] max-h-[min(70vh,calc(100vh-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-900/5"
                style={{ top: coords.top, left: coords.left }}
            >
                {canViewDoc ? (
                    <button type="button" role="menuitem" className={itemClass} onClick={() => run(onView)}>
                        <LuEye size={16} className="shrink-0 text-slate-500" aria-hidden />
                        View
                    </button>
                ) : null}
                <button type="button" role="menuitem" className={itemClass} onClick={() => run(onDownload)}>
                    <LuDownload size={16} className="shrink-0 text-slate-500" aria-hidden />
                    Download
                </button>
                {canEditDoc ? (
                    <>
                        <button type="button" role="menuitem" className={itemClass} onClick={() => run(onEdit)}>
                            <LuPencil size={16} className="shrink-0 text-slate-500" aria-hidden />
                            Edit
                        </button>
                        <button type="button" role="menuitem" className={itemClass} onClick={() => run(onVersions)}>
                            <LuHistory size={16} className="shrink-0 text-slate-500" aria-hidden />
                            Version history
                        </button>
                    </>
                ) : null}
                {canDeleteDoc ? (
                    <>
                        <div className="my-1 h-px bg-slate-100" />
                        <button
                            type="button"
                            role="menuitem"
                            className={cn(itemClass, 'text-rose-700 hover:bg-rose-50/80')}
                            onClick={() => run(onDelete)}
                        >
                            <LuTrash2 size={16} className="shrink-0 text-rose-600" aria-hidden />
                            Delete
                        </button>
                    </>
                ) : null}
            </div>,
            document.body
        );

    return (
        <div className="relative flex justify-end">
            <button
                ref={btnRef}
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-haspopup="menu"
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm',
                    'hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1'
                )}
            >
                <LuEllipsis size={16} className="text-slate-500" aria-hidden />
                Actions
                <LuChevronDown size={14} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} aria-hidden />
            </button>
            {menu}
        </div>
    );
}
