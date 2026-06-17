'use client';

import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    normalizePermissionId,
    PERMISSION_DROPDOWN_OPTIONS,
    PERMISSION_TOOLTIPS,
    permissionBadgeClasses,
    permissionShortLabel,
} from '@/lib/accessMatrix/constants';
import type { PermissionId } from '@/lib/accessMatrix/types';
import { cn } from '@/lib/utils';
import { LuChevronDown } from 'react-icons/lu';

const MENU_MIN_HEIGHT = 160;
const MENU_IDEAL_HEIGHT = 280;
const MENU_MIN_WIDTH_PX = 240;
const VIEWPORT_PAD = 12;
const MENU_GAP = 6;
/** Above sticky matrix header; permission menus must not shift table layout (portaled). */
const PERMISSION_MENU_Z_INDEX = 350;

export type MatrixPermissionCellProps = {
    featureId: string;
    roleId: string;
    value: PermissionId;
    disabled?: boolean;
    onPick: (next: PermissionId) => void;
};

type MenuCoords = {
    left: number;
    top: number;
    placement: 'down' | 'up';
    maxHeight: number;
};

function computeMenuCoords(trigger: HTMLElement, menuEl: HTMLUListElement | null): MenuCoords {
    const r = trigger.getBoundingClientRect();
    const viewH = window.innerHeight;
    const spaceBelow = Math.max(0, viewH - r.bottom - VIEWPORT_PAD);
    const spaceAbove = Math.max(0, r.top - VIEWPORT_PAD);
    const menuH = menuEl?.offsetHeight ?? MENU_IDEAL_HEIGHT;

    const openUp = spaceBelow < Math.min(menuH, MENU_MIN_HEIGHT) && spaceAbove > spaceBelow;
    const usable = (openUp ? spaceAbove : spaceBelow) - MENU_GAP;
    const maxHeight = Math.max(MENU_MIN_HEIGHT, Math.min(MENU_IDEAL_HEIGHT, Math.floor(usable)));

    return {
        left: r.left + r.width / 2,
        top: openUp ? r.top - MENU_GAP : r.bottom + MENU_GAP,
        placement: openUp ? 'up' : 'down',
        maxHeight,
    };
}

export const MatrixPermissionCell = memo(function MatrixPermissionCell({
    featureId,
    roleId,
    value,
    disabled,
    onPick,
}: MatrixPermissionCellProps) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState<MenuCoords | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);

    useEffect(() => setMounted(true), []);

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

    const updateCoords = useCallback(() => {
        const el = rootRef.current;
        if (!el) return;
        setCoords(computeMenuCoords(el, menuRef.current));
    }, []);

    useLayoutEffect(() => {
        if (!open) {
            setCoords(null);
            return undefined;
        }
        updateCoords();
        const raf = requestAnimationFrame(updateCoords);
        window.addEventListener('resize', updateCoords, { passive: true });
        window.addEventListener('scroll', updateCoords, true);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [open, updateCoords]);

    const pick = useCallback(
        (p: PermissionId) => {
            onPick(p);
            setOpen(false);
        },
        [onPick],
    );

    const normalizedValue = normalizePermissionId(value);
    const tip = PERMISSION_TOOLTIPS[normalizedValue];
    const menuId = `perm-menu-${featureId}-${roleId}`;

    const menu =
        open && !disabled && coords && mounted ? (
            <ul
                id={menuId}
                role="listbox"
                ref={menuRef}
                style={{
                    position: 'fixed',
                    left: coords.left,
                    top: coords.top,
                    maxHeight: coords.maxHeight,
                    minWidth: MENU_MIN_WIDTH_PX,
                    width: MENU_MIN_WIDTH_PX,
                    transform: coords.placement === 'up' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
                    zIndex: PERMISSION_MENU_Z_INDEX,
                }}
                className="overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5"
            >
                {PERMISSION_DROPDOWN_OPTIONS.map((opt) => (
                    <li key={opt} role="option" aria-selected={opt === normalizedValue}>
                        <button
                            type="button"
                            title={PERMISSION_TOOLTIPS[opt]}
                            className={cn(
                                'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-800 transition',
                                opt === normalizedValue
                                    ? 'bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-[var(--cta-button-bg)]'
                                    : 'hover:bg-slate-50',
                            )}
                            onClick={() => pick(opt)}
                        >
                            <span className={cn('shrink-0', permissionBadgeClasses(opt))}>
                                {permissionShortLabel(opt)}
                            </span>
                            <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{opt}</span>
                        </button>
                    </li>
                ))}
            </ul>
        ) : null;

    return (
        <div ref={rootRef} className="relative flex justify-center overflow-visible">
            <button
                type="button"
                title={tip}
                disabled={disabled}
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-controls={open ? menuId : undefined}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) setOpen((o) => !o);
                }}
                className={cn(
                    'group mx-auto flex h-11 w-full min-w-0 max-w-full cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-sm text-left shadow-md ring-1 ring-slate-200/80 transition',
                    'hover:shadow-lg hover:ring-1 hover:ring-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]',
                    open && 'ring-2 ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]',
                    disabled && 'cursor-not-allowed opacity-45 hover:translate-y-0 hover:shadow-sm hover:ring-0',
                    permissionBadgeClasses(normalizedValue),
                )}
            >
                <span className="truncate font-bold tracking-wide">{permissionShortLabel(normalizedValue)}</span>
                <LuChevronDown
                    className={cn('h-4 w-4 shrink-0 opacity-70 transition-transform', open && 'rotate-180')}
                    aria-hidden
                />
            </button>
            {menu && typeof document !== 'undefined' ? createPortal(menu, document.body) : null}
        </div>
    );
});
