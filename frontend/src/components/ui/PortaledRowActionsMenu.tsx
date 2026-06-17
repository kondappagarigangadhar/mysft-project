'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuChevronDown } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const VIEWPORT_PAD = 8;
const GAP = 4;

/** Fixed + portal so menus escape DataTable `overflow-x-auto`; z-50 above sticky cells. */
const MENU_Z = 'z-50';

function computeMenuTop(buttonRect: DOMRect, menuHeight: number, viewportH: number): number {
    const spaceBelow = viewportH - buttonRect.bottom - GAP;
    const spaceAbove = buttonRect.top - GAP;

    if (menuHeight <= spaceBelow) {
        return buttonRect.bottom + GAP;
    }
    if (menuHeight <= spaceAbove) {
        return buttonRect.top - menuHeight - GAP;
    }
    if (spaceBelow >= spaceAbove) {
        const top = Math.min(buttonRect.bottom + GAP, viewportH - menuHeight - VIEWPORT_PAD);
        return Math.max(VIEWPORT_PAD, top);
    }
    return Math.max(VIEWPORT_PAD, buttonRect.top - menuHeight - GAP);
}

export type PortaledRowActionsMenuProps = {
    /** Menu body; call `close()` before navigation or async work so the panel dismisses. */
    children: (ctx: { close: () => void }) => React.ReactNode;
    /** Used before the menu is measured (first frame). Taller menus can pass a larger value. */
    estimatedMenuHeight?: number;
    /** Minimum width in px (also used for horizontal clamp vs viewport). */
    minMenuWidth?: number;
};

export function PortaledRowActionsMenu({
    children,
    estimatedMenuHeight = 220,
    minMenuWidth = 220,
}: PortaledRowActionsMenuProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

    const updatePosition = useCallback(() => {
        const btn = buttonRef.current;
        if (!btn || typeof window === 'undefined') return;
        const r = btn.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const menuEl = menuRef.current;
        const h = menuEl && menuEl.offsetHeight > 0 ? menuEl.offsetHeight : estimatedMenuHeight;

        const top = computeMenuTop(r, h, vh);
        const left = Math.min(Math.max(VIEWPORT_PAD, r.right - minMenuWidth), vw - minMenuWidth - VIEWPORT_PAD);

        setMenuPos({ top, left });
    }, [estimatedMenuHeight, minMenuWidth]);

    useLayoutEffect(() => {
        if (!open) {
            setMenuPos(null);
            return;
        }
        updatePosition();
        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => updatePosition());
        });
        return () => {
            cancelAnimationFrame(raf1);
            cancelAnimationFrame(raf2);
        };
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;
        const onScroll = () => updatePosition();
        const onResize = () => updatePosition();
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
        };
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (rootRef.current?.contains(t)) return;
            if (menuRef.current?.contains(t)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const close = useCallback(() => setOpen(false), []);

    const menu =
        open && menuPos && typeof document !== 'undefined' ? (
            <div
                ref={menuRef}
                role="menu"
                style={{ top: menuPos.top, left: menuPos.left, minWidth: minMenuWidth }}
                className={cn(
                    MENU_Z,
                    'fixed max-h-[min(70vh,calc(100vh-16px))] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5',
                )}
            >
                {children({ close })}
            </div>
        ) : null;

    return (
        <div className="relative flex justify-end" ref={rootRef}>
            <Button
                ref={buttonRef}
                type="button"
                variant="companyOutline"
                size="sm"
                className="h-8 gap-1 border-slate-200 px-2 text-xs font-semibold text-slate-700"
                aria-expanded={open}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((o) => !o);
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                Actions
                <LuChevronDown size={14} className={cn('transition', open && 'rotate-180')} />
            </Button>

            {menu ? createPortal(menu, document.body) : null}
        </div>
    );
}
