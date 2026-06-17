'use client';

import Link from 'next/link';
import {
    LuActivity,
    LuCircleDollarSign,
    LuFileText,
    LuHardHat,
    LuLayoutGrid,
    LuPackage,
    LuReceipt,
    LuTruck,
} from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { CTA_FOCUS_VISIBLE_RING } from '@/lib/theme/ctaThemeClasses';

/**
 * Project 360 workspace tab keys.
 *
 * Order follows enterprise SaaS hierarchy:
 *   summary → assets → people/relations → operations → audit
 */
export type ProjectViewTabKey =
    | 'overview'
    | 'inventory'
    | 'pricing'
    | 'documents'
    | 'payments'
    | 'vendors'
    | 'work-orders'
    | 'history';

const ICONS: Record<ProjectViewTabKey, typeof LuLayoutGrid> = {
    overview: LuLayoutGrid,
    inventory: LuPackage,
    pricing: LuCircleDollarSign,
    payments: LuReceipt,
    documents: LuFileText,
    vendors: LuTruck,
    'work-orders': LuHardHat,
    history: LuActivity,
};

/**
 * Reusable mapping of valid keys → URL tab values (URL-safe slugs).
 * Used by parent `ProjectRecordTabs` for `normalizeTab` and URL builders.
 */
export const PROJECT_VIEW_TAB_KEYS: ProjectViewTabKey[] = [
    'overview',
    'inventory',
    'pricing',
    'documents',
    'payments',
    'vendors',
    'work-orders',
    'history',
];

// Re-export for callers that want to enumerate icons too.
export const PROJECT_VIEW_TAB_ICONS = ICONS;

/** Tab chrome aligned with Leads `LeadMainTabBar` (divided row, gray borders). */
export function ProjectViewTabBar({
    items,
    activeKey,
    onChange,
    disabledKeys,
}: {
    items: Array<{ key: ProjectViewTabKey; label: string; href: string }>;
    activeKey: ProjectViewTabKey;
    onChange?: (key: ProjectViewTabKey) => void;
    disabledKeys?: ProjectViewTabKey[];
}) {
    const disabled = new Set<ProjectViewTabKey>(disabledKeys ?? []);
    return (
        <div className="sticky top-26 z-40 -mx-3 border-b border-gray-200 bg-white sm:-mx-4 lg:-mx-6">
            <nav
                className="flex min-w-0 divide-x divide-gray-200 overflow-x-auto scroll-smooth"
                aria-label="Project record sections"
            >
                {items.map((t) => {
                    const Icon = ICONS[t.key];
                    const isActive = activeKey === t.key;
                    const isDisabled = disabled.has(t.key);
                    return onChange ? (
                        <button
                            key={t.key}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => onChange(t.key)}
                            className={cn(
                                'inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                CTA_FOCUS_VISIBLE_RING,
                                isActive ? 'font-semibold text-[var(--cta-button-bg)]' : 'font-medium text-gray-500 hover:text-gray-800',
                                isDisabled && 'cursor-not-allowed opacity-50 hover:text-gray-500',
                            )}
                        >
                            <Icon size={16} className={cn('shrink-0', isActive ? 'text-[var(--cta-button-bg)]' : 'opacity-80')} aria-hidden />
                            {t.label}
                        </button>
                    ) : (
                        <Link
                            key={t.key}
                            href={t.href}
                            scroll={false}
                            className={cn(
                                'inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                CTA_FOCUS_VISIBLE_RING,
                                isActive ? 'font-semibold text-[var(--cta-button-bg)]' : 'font-medium text-gray-500 hover:text-gray-800',
                            )}
                        >
                            <Icon size={16} className={cn('shrink-0', isActive ? 'text-[var(--cta-button-bg)]' : 'opacity-80')} aria-hidden />
                            {t.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
