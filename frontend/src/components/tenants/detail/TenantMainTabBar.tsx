'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TenantDetailMainTabId } from '@/components/tenants/detail/tenantDetailTabIds';
import { TENANT_DETAIL_PRIMARY_TAB_ORDER } from '@/components/tenants/detail/tenantDetailTabIds';
import { LuHistory, LuLayoutGrid } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { CTA_FOCUS_VISIBLE_RING } from '@/lib/theme/ctaThemeClasses';

const TAB_META: Record<
    TenantDetailMainTabId,
    { label: string; icon: React.ComponentType<{ className?: string; size?: number }> }
> = {
    overview: { label: 'Overview', icon: LuLayoutGrid },
    history: { label: 'History', icon: LuHistory },
};

export function TenantMainTabBar({
    active,
    onChange,
    disabledTabs,
}: {
    active: TenantDetailMainTabId;
    onChange: (id: TenantDetailMainTabId) => void;
    /** Create mode: lock History until record exists. */
    disabledTabs?: Set<TenantDetailMainTabId>;
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
                <nav ref={navRef} className="flex min-w-0 flex-1 divide-x divide-gray-200 px-0" aria-label="Tenant record sections">
                    {TENANT_DETAIL_PRIMARY_TAB_ORDER.map((id) => {
                        const item = TAB_META[id];
                        const Icon = item.icon;
                        const isActive = active === id;
                        const disabled = disabledTabs?.has(id) ?? false;
                        return (
                            <button
                                key={id}
                                type="button"
                                data-tab-id={id}
                                disabled={disabled}
                                onClick={() => !disabled && onChange(id)}
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                    CTA_FOCUS_VISIBLE_RING,
                                    disabled && 'cursor-not-allowed opacity-40',
                                    isActive
                                        ? 'font-semibold text-[var(--cta-button-bg)]'
                                        : 'font-medium text-gray-500 hover:text-gray-800',
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
