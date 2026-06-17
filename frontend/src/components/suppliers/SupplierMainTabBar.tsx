'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SupplierMainTabId } from '@/components/suppliers/detail/supplierDetailTabIds';
import { cn } from '@/lib/utils';
import { CTA_RECORD_TAB_ACTIVE, CTA_RECORD_TAB_BTN_FOCUS } from '@/lib/theme/ctaThemeClasses';
import {
    LuClipboardCopy,
    LuHistory,
    LuLayoutGrid,
    LuTrendingUp,
} from 'react-icons/lu';

export type { SupplierMainTabId } from '@/components/suppliers/detail/supplierDetailTabIds';

const TAB_META: Record<
    SupplierMainTabId,
    { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
    overview: { label: 'Overview', icon: LuLayoutGrid },
    performance: { label: 'Performance', icon: LuTrendingUp },
    notes: { label: 'Notes', icon: LuClipboardCopy },
    history: { label: 'History', icon: LuHistory },
};

export function SupplierMainTabBar({
    active,
    onChange,
    disabledTabs,
}: {
    active: SupplierMainTabId;
    onChange: (id: SupplierMainTabId) => void;
    disabledTabs?: Partial<Record<SupplierMainTabId, boolean>>;
}) {
    const navRef = useRef<HTMLElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollHints = useCallback(() => {
        const el = navRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        const max = scrollWidth - clientWidth;
        setCanScrollLeft(scrollLeft > 1);
        setCanScrollRight(max > 1 && scrollLeft < max - 1);
    }, []);

    useEffect(() => {
        const el = navRef.current;
        if (!el) return;
        updateScrollHints();
        const ro = new ResizeObserver(updateScrollHints);
        ro.observe(el);
        el.addEventListener('scroll', updateScrollHints, { passive: true });
        return () => {
            ro.disconnect();
            el.removeEventListener('scroll', updateScrollHints);
        };
    }, [updateScrollHints]);

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const btn = nav.querySelector<HTMLElement>(`[data-tab-id="${active}"]`);
        btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        requestAnimationFrame(updateScrollHints);
    }, [active, updateScrollHints]);

    return (
        <div className="sticky top-26 z-40 -mx-6 border-b border-gray-200 bg-white">
            <div className="relative flex min-w-0">
                {canScrollLeft ? (
                    <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-8 bg-linear-to-r from-white to-transparent" aria-hidden />
                ) : null}
                {canScrollRight ? (
                    <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-linear-to-l from-white to-transparent" aria-hidden />
                ) : null}
                <nav
                    ref={navRef}
                    className="flex min-w-0 flex-1 divide-x divide-gray-200 overflow-x-auto overflow-y-hidden scroll-smooth overscroll-x-contain [scrollbar-width:thin] [scrollbar-color:var(--color-slate-300)_var(--color-slate-50)] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
                    aria-label="Supplier record sections"
                >
                    {Object.entries(TAB_META).map(([id, meta]) => {
                        const tabId = id as SupplierMainTabId;
                        const Icon = meta.icon;
                        const isActive = active === tabId;
                        const isDisabled = disabledTabs?.[tabId] === true;
                        return (
                            <button
                                key={tabId}
                                type="button"
                                data-tab-id={tabId}
                                onClick={() => {
                                    if (isDisabled) return;
                                    onChange(tabId);
                                }}
                                disabled={isDisabled}
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors duration-200',
                                    CTA_RECORD_TAB_BTN_FOCUS,
                                    isDisabled && 'cursor-not-allowed opacity-45',
                                    isActive ? CTA_RECORD_TAB_ACTIVE : 'font-medium text-gray-500 hover:text-gray-800',
                                )}
                            >
                                <Icon
                                    size={16}
                                    className={cn('shrink-0', isActive ? 'text-[var(--cta-button-bg)]' : 'opacity-80')}
                                />
                                {meta.label}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
