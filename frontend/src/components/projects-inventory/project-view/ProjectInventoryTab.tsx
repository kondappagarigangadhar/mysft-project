'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
    decodeUnitSlugParam,
    formatCurrencyINR,
    getProjectInventoryBuckets,
    getUnits,
    type InventoryUnit,
    type Project,
} from '@/lib/projectsInventoryStore';
import { InventoryStatusBadge } from '@/components/projects-inventory/InventoryStatusBadge';
import { InventoryUnitDetailPanel } from '@/components/projects-inventory/InventoryUnitDetailPanel';
import { InventoryImportModal } from '@/components/projects-inventory/InventoryImportModal';
import { LuLayoutGrid, LuPackage, LuPlus, LuSearch, LuUpload } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { CTA_CARD_EDITING_RING, CTA_INPUT_FOCUS, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';

type Props = {
    project: Project;
    projectSlug: string;
    storeVersion: number;
    projectsCount: number;
    onStoreRefresh: () => void;
};

export function ProjectInventoryTab({ project, projectSlug, storeVersion, projectsCount, onStoreRefresh }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const allUnits = useMemo(() => getUnits(), [storeVersion]);
    const projectUnits = useMemo(() => allUnits.filter((u) => u.projectSlug === projectSlug), [allUnits, projectSlug]);
    const buckets = useMemo(() => getProjectInventoryBuckets(projectSlug), [projectSlug, storeVersion]);

    const [invSearch, setInvSearch] = useState('');
    const [invFilter, setInvFilter] = useState<'all' | 'available' | 'reserved' | 'sold' | 'pending'>('all');
    const [invDetailSlug, setInvDetailSlug] = useState<string | null>(null);
    const [importOpen, setImportOpen] = useState(false);

    const filteredUnits = useMemo(() => {
        const q = invSearch.trim().toLowerCase();
        return projectUnits.filter((u) => {
            if (invFilter !== 'all' && u.availability_status !== invFilter) return false;
            if (!q) return true;
            return (
                u.unit_number.toLowerCase().includes(q) ||
                u.unit_id.toLowerCase().includes(q) ||
                String(u.unit_size).includes(q) ||
                (u.tower_block ?? '').toLowerCase().includes(q) ||
                (u.configuration ?? '').toLowerCase().includes(q) ||
                u.unit_type.toLowerCase().includes(q)
            );
        });
    }, [projectUnits, invSearch, invFilter]);

    useEffect(() => {
        const raw = searchParams.get('unit');
        if (raw === null || raw === '') return;
        const decoded = decodeUnitSlugParam(raw);
        if (projectUnits.some((u) => u.slug === decoded)) {
            setInvDetailSlug(decoded);
        }
    }, [searchParams, projectUnits]);

    const syncUrl = (nextUnitSlug: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', 'inventory');
        if (nextUnitSlug) params.set('unit', encodeURIComponent(nextUnitSlug));
        else params.delete('unit');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const inventoryResolvedSlug = invDetailSlug ?? projectUnits[0]?.slug ?? null;
    const invDetailUnit = useMemo(
        () => (inventoryResolvedSlug ? projectUnits.find((u) => u.slug === inventoryResolvedSlug) : undefined),
        [projectUnits, inventoryResolvedSlug],
    );

    const onUnitMutated = () => onStoreRefresh();
    const createHref = '/projects-inventory/inventory/create';

    return (
        <div className="w-full min-w-0">
            {/* No overflow-hidden — it breaks sticky bottom save bar on unit detail (same pattern as Leads overview). */}
            <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm">
                {/* <div className="flex flex-col gap-4 border-b border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 ring-1 ring-gray-200/80">
                            <LuPackage size={20} aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold text-gray-900">Inventory</h2>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {projectUnits.length} units in <span className="font-medium text-gray-700">{project.project_name}</span>
                            </p>
                            <p className="mt-2 text-xs text-gray-600">
                                <span className="font-semibold text-emerald-700">{buckets.available}</span> available ·{' '}
                                <span className="font-semibold text-gray-800">{buckets.booked}</span> booked ·{' '}
                                <span className="font-semibold text-amber-800">{buckets.reserved}</span> reserved ·{' '}
                                <span className="font-semibold text-rose-800">{buckets.blocked}</span> blocked
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={createHref}>
                            <Button type="button" variant="company" size="cta" className={cn('h-10 gap-2', CTA_SHADOW_SOFT)}>
                                <LuPlus size={16} />
                                Add unit
                            </Button>
                        </Link>
                        <Button type="button" variant="companyOutline" size="cta" className="h-10 gap-2" onClick={() => setImportOpen(true)}>
                            <LuUpload size={16} />
                            Import
                        </Button>
                        <Link href="/projects-inventory/inventory">
                            <Button type="button" variant="companyGhost" size="cta" className="h-10 gap-2 text-gray-600">
                                <LuLayoutGrid size={16} />
                                Full list
                            </Button>
                        </Link>
                    </div>
                </div> */}

                <div className="min-w-0 bg-white">
                    {projectUnits.length === 0 ? (
                        <div className="flex min-h-40 flex-col items-center justify-center px-4 py-12 text-center">
                            <p className="text-sm font-medium text-gray-600">No units yet</p>
                            <p className="mt-1 text-xs text-gray-500">Add a unit or import a file.</p>
                            <Link href={createHref} className="mt-4">
                                <Button type="button" variant="company" size="sm" className={cn('gap-2', CTA_SHADOW_SOFT)}>
                                    <LuPlus size={14} />
                                    Add unit
                                </Button>
                            </Link>
                        </div>
                    ) : invDetailUnit ? (
                        <Suspense fallback={<div className="min-h-48 animate-pulse rounded-lg bg-gray-100/80" aria-hidden />}>
                            <InventoryUnitDetailPanel
                                unit={invDetailUnit}
                                project={project}
                                projectsCount={projectsCount}
                                embedded
                                embeddedSidebar={
                                    <>
                                        <div className="border-b border-gray-100 p-3 sm:p-4">
                                            <div className="relative">
                                                <LuSearch
                                                    className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-gray-400"
                                                    aria-hidden
                                                />
                                                <input
                                                    type="search"
                                                    placeholder="Search units…"
                                                    value={invSearch}
                                                    onChange={(e) => setInvSearch(e.target.value)}
                                                    className={cn(
                                                        'h-10 w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400',
                                                        CTA_INPUT_FOCUS,
                                                    )}
                                                />
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {(
                                                    [
                                                        ['all', 'All', buckets.total],
                                                        ['available', 'Available', buckets.available],
                                                        ['reserved', 'Reserved', buckets.reserved],
                                                        ['sold', 'Booked', buckets.booked],
                                                        ['pending', 'Blocked', buckets.blocked],
                                                    ] as const
                                                ).map(([key, label, count]) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setInvFilter(key)}
                                                        className={cn(
                                                            'rounded-full px-2.5 py-1 text-xs font-semibold transition',
                                                            invFilter === key
                                                                ? 'bg-[var(--cta-button-bg)] text-white'
                                                                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
                                                        )}
                                                    >
                                                        {label} <span className="tabular-nums opacity-80">({count})</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className=" h-full overflow-y-auto overscroll-y-contain p-3 sm:p-4 [scrollbar-gutter:stable]">
                                            {filteredUnits.length === 0 ? (
                                                <p className="py-8 text-center text-sm text-gray-500">No matches.</p>
                                            ) : (
                                                <ul className="space-y-1.5">
                                                    {filteredUnits.map((u: InventoryUnit) => {
                                                        const active = inventoryResolvedSlug === u.slug;
                                                        return (
                                                            <li key={u.slug}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setInvDetailSlug(u.slug);
                                                                        syncUrl(u.slug);
                                                                    }}
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                                                                        active
                                                                            ? cn(
                                                                                  'bg-white font-medium text-gray-900 shadow-sm',
                                                                                  CTA_CARD_EDITING_RING,
                                                                              )
                                                                            : 'border-transparent bg-transparent text-gray-700 hover:border-gray-200 hover:bg-white',
                                                                    )}
                                                                >
                                                                    <div className="min-w-0">
                                                                        <p className="truncate tabular-nums">Unit {u.unit_number}</p>
                                                                        <p className="truncate text-xs text-gray-500">
                                                                            {u.configuration}
                                                                            <span className="mx-1 text-gray-300">·</span>
                                                                            <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] font-semibold uppercase text-gray-600">
                                                                                {u.unit_type}
                                                                            </span>
                                                                        </p>
                                                                    </div>
                                                                    <InventoryStatusBadge status={u.availability_status} />
                                                                </button>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    </>
                                }
                                onInventoryMutated={onUnitMutated}
                                onResolvedSlugChange={(nextSlug) => {
                                    if (nextSlug === null) {
                                        setInvDetailSlug(null);
                                        syncUrl(null);
                                    } else {
                                        setInvDetailSlug(nextSlug);
                                        syncUrl(nextSlug);
                                    }
                                }}
                            />
                        </Suspense>
                    ) : (
                        <div className="flex min-h-48 items-center justify-center px-4 py-10 text-center text-sm text-gray-500">
                            Select a unit from the list.
                        </div>
                    )}
                </div>
            </div>

            <InventoryImportModal
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                onImported={() => {
                    onStoreRefresh();
                    setImportOpen(false);
                }}
            />
        </div>
    );
}
