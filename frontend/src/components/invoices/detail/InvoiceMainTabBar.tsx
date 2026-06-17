'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { InvoiceDetailMainTabId } from '@/components/invoices/detail/invoiceDetailTabIds';
import { INVOICE_DETAIL_PRIMARY_TAB_ORDER } from '@/components/invoices/detail/invoiceDetailTabIds';
import { LuBell, LuBadgeCheck, LuFileText, LuHistory, LuLayoutGrid, LuReceipt } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { CTA_RECORD_TAB_ACTIVE, CTA_RECORD_TAB_BTN_FOCUS } from '@/lib/theme/ctaThemeClasses';

const TAB_META: Record<
    InvoiceDetailMainTabId,
    { label: string; icon: React.ComponentType<{ className?: string; size?: number }> }
> = {
    overview: { label: 'Overview', icon: LuLayoutGrid },
    validation: { label: 'Validation', icon: LuBadgeCheck },
    payments: { label: 'Payments', icon: LuReceipt },
    documents: { label: 'Documents', icon: LuFileText },
    notifications: { label: 'Notifications', icon: LuBell },
    activity: { label: 'History', icon: LuHistory },
};

const scrollNavClass =
    'overflow-x-auto overflow-y-hidden scroll-smooth overscroll-x-contain [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_theme(colors.slate.50)] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400';

export function InvoiceMainTabBar({
    active,
    onChange,
    disabledKeys,
}: {
    active: InvoiceDetailMainTabId;
    onChange: (id: InvoiceDetailMainTabId) => void;
    disabledKeys?: InvoiceDetailMainTabId[];
}) {
    const navRef = useRef<HTMLElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const disabled = new Set<InvoiceDetailMainTabId>(disabledKeys ?? []);

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
                    className={cn('flex min-w-0 flex-1 divide-x divide-gray-200 px-0', scrollNavClass)}
                    aria-label="Invoice record sections"
                >
                    {INVOICE_DETAIL_PRIMARY_TAB_ORDER.map((id) => {
                        const item = TAB_META[id];
                        const Icon = item.icon;
                        const isActive = active === id;
                        const isDisabled = disabled.has(id);
                        return (
                            <button
                                key={id}
                                type="button"
                                data-tab-id={id}
                                disabled={isDisabled}
                                onClick={() => onChange(id)}
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors duration-200',
                                    CTA_RECORD_TAB_BTN_FOCUS,
                                    isActive ? CTA_RECORD_TAB_ACTIVE : 'font-medium text-gray-500 hover:text-gray-800',
                                    isDisabled && 'cursor-not-allowed opacity-50 hover:text-gray-500',
                                )}
                            >
                                <Icon
                                    size={16}
                                    className={cn('shrink-0', isActive ? 'text-[var(--cta-button-bg)]' : 'opacity-80')}
                                    aria-hidden
                                />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
