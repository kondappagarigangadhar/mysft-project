'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LuClipboardList,
    LuCoins,
    LuStar,
    LuTruck,
} from 'react-icons/lu';
import { getWorkOrders, type WorkOrder } from '@/lib/workOrderStore';
import { getAllVendorRecords, type VendorRecord } from '@/lib/vendors/vendorStore';
import type { Project } from '@/lib/projectsInventoryStore';
import { cn } from '@/lib/utils';

import {
    BpStatusBadge,
    EmptyState,
    FilterSelect,
    formatINR,
    OpenInModuleLink,
    ProjectTabPagination,
    ProjectTabSection,
    ProjectTabToolbar,
    SimpleTable,
    SummaryCard,
    SummaryCardGrid,
    type SimpleTableColumn,
    vendorStatusTone,
} from './ProjectRelationalUI';

const PAGE_SIZE = 10;

const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Inactive', 'Blacklisted'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

type ProjectVendorRow = {
    vendorId: string | null;
    vendorName: string;
    serviceType: string;
    activeWorkOrders: number;
    totalWorkOrders: number;
    pendingAmount: number;
    status: string;
    rating: number;
};

const ACTIVE_WO_STATUSES = new Set(['Open', 'Assigned', 'In Progress', 'On Hold']);

function parseAmountCell(input: string | undefined): number {
    if (!input) return 0;
    const digits = String(input).replace(/[^\d.-]/g, '');
    const n = Number(digits);
    return Number.isFinite(n) ? n : 0;
}

function deriveProjectVendors(projectName: string): ProjectVendorRow[] {
    if (!projectName.trim()) return [];
    const target = projectName.trim().toLowerCase();

    const workOrders = getWorkOrders().filter(
        (w) => (w.projectOrProperty || '').trim().toLowerCase() === target,
    );

    const vendorMap = new Map<string, ProjectVendorRow>();
    const allVendors = getAllVendorRecords();

    for (const w of workOrders) {
        const name = w.vendor?.vendorName?.trim() || '';
        if (!name) continue;
        const key = name.toLowerCase();
        const existing = vendorMap.get(key);
        const isActive = ACTIVE_WO_STATUSES.has(w.lifecycle?.status as string);
        const isUnpaid =
            (w.finance?.paymentStatus === 'Pending' || w.finance?.paymentStatus === 'Partial') &&
            !!w.vendor?.estimatedCost;
        const pendingForWo = isUnpaid ? parseAmountCell(w.vendor?.estimatedCost) - parseAmountCell(w.finance?.actualCost) : 0;

        if (existing) {
            existing.totalWorkOrders += 1;
            if (isActive) existing.activeWorkOrders += 1;
            existing.pendingAmount += Math.max(0, pendingForWo);
        } else {
            const record = allVendors.find((v) => v.name.trim().toLowerCase() === key);
            vendorMap.set(key, {
                vendorId: record?.id ?? null,
                vendorName: record?.name ?? name,
                serviceType: deriveServiceType(record, w),
                activeWorkOrders: isActive ? 1 : 0,
                totalWorkOrders: 1,
                pendingAmount: Math.max(0, pendingForWo),
                status: record?.status ?? 'Pending',
                rating: record?.rating ?? 0,
            });
        }
    }

    return Array.from(vendorMap.values()).sort((a, b) => b.activeWorkOrders - a.activeWorkOrders);
}

function deriveServiceType(record: VendorRecord | undefined, sampleOrder: WorkOrder): string {
    if (record?.categories?.length) return record.categories.join(', ');
    if (sampleOrder.workType) return sampleOrder.workType;
    return record?.type ?? '—';
}

type Props = {
    project: Project;
    storeVersion: number;
};

export function ProjectVendorsTab({ project, storeVersion }: Props) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    const [page, setPage] = useState(1);

    const rows = useMemo(
        () => deriveProjectVendors(project.project_name),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [project.project_name, project.slug, storeVersion],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (statusFilter !== 'All' && r.status !== statusFilter) return false;
            if (!q) return true;
            return (
                r.vendorName.toLowerCase().includes(q) ||
                r.serviceType.toLowerCase().includes(q) ||
                r.status.toLowerCase().includes(q)
            );
        });
    }, [rows, search, statusFilter]);

    const totalItems = filtered.length;
    const paginated = useMemo(
        () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filtered, page],
    );

    const stats = useMemo(() => {
        const active = rows.filter((r) => r.status === 'Active').length;
        const totalActiveWO = rows.reduce((s, r) => s + r.activeWorkOrders, 0);
        const totalPending = rows.reduce((s, r) => s + r.pendingAmount, 0);
        const avgRating =
            rows.length > 0
                ? rows.reduce((s, r) => s + r.rating, 0) / rows.length
                : 0;
        return { total: rows.length, active, totalActiveWO, totalPending, avgRating };
    }, [rows]);

    const columns: SimpleTableColumn<ProjectVendorRow>[] = useMemo(
        () => [
            {
                key: 'vendor',
                header: 'Vendor',
                render: (r) => (
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{r.vendorName}</p>
                        <p className="truncate text-xs text-gray-500">{r.serviceType}</p>
                    </div>
                ),
            },
            {
                key: 'service',
                header: 'Service Type',
                hideBelow: 'lg',
                render: (r) => <span className="truncate text-sm text-gray-700">{r.serviceType}</span>,
            },
            {
                key: 'active-wo',
                header: 'Active Work Orders',
                align: 'right',
                hideBelow: 'sm',
                render: (r) => (
                    <div className="text-right">
                        <p className="font-semibold text-[var(--cta-button-bg)]">{r.activeWorkOrders}</p>
                        <p className="text-xs text-gray-500">{r.totalWorkOrders} total</p>
                    </div>
                ),
            },
            {
                key: 'rating',
                header: 'Rating',
                hideBelow: 'md',
                render: (r) => (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-700">
                        <LuStar size={14} className="fill-amber-500 text-amber-500" aria-hidden />
                        {r.rating ? r.rating.toFixed(1) : '—'}
                    </span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                render: (r) => <BpStatusBadge tone={vendorStatusTone(r.status)}>{r.status}</BpStatusBadge>,
            },
            {
                key: 'pending',
                header: 'Pending Amount',
                align: 'right',
                hideBelow: 'sm',
                render: (r) => (
                    <span className={cn(r.pendingAmount > 0 ? 'font-semibold text-amber-800' : 'text-gray-500')}>
                        {r.pendingAmount > 0 ? formatINR(r.pendingAmount) : '—'}
                    </span>
                ),
            },
            {
                key: 'actions',
                header: '',
                align: 'right',
                render: (r) =>
                    r.vendorId ? (
                        <OpenInModuleLink href={`/company-admin/vendors/${encodeURIComponent(r.vendorId)}`} label="Open" />
                    ) : (
                        <span className="text-xs text-gray-400">Not onboarded</span>
                    ),
            },
        ],
        [],
    );

    return (
        <div className="space-y-4">
            <SummaryCardGrid>
                <SummaryCard
                    tone="blue"
                    label="Vendors engaged"
                    value={stats.total}
                    sublabel="Unique vendors on this project"
                    icon={<LuTruck size={18} aria-hidden />}
                />
                <SummaryCard
                    tone="emerald"
                    label="Active vendors"
                    value={stats.active}
                    sublabel={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% active`}
                    icon={<LuClipboardList size={18} aria-hidden />}
                />
                <SummaryCard
                    tone="violet"
                    label="Live work orders"
                    value={stats.totalActiveWO}
                    sublabel="Across all vendors"
                    icon={<LuClipboardList size={18} aria-hidden />}
                />
                <SummaryCard
                    tone="amber"
                    label="Pending payouts"
                    value={formatINR(stats.totalPending)}
                    sublabel="Estimated vendor balances"
                    icon={<LuCoins size={18} aria-hidden />}
                />
            </SummaryCardGrid>

            <ProjectTabSection
                title="Vendors on this project"
                description="Derived from work orders assigned to this project."
                actions={
                    <OpenInModuleLink href="/company-admin/vendors/list" label="Open Vendors module" />
                }
            >
                <div className="space-y-4">
                    <ProjectTabToolbar
                        searchValue={search}
                        onSearchChange={(v) => {
                            setSearch(v);
                            setPage(1);
                        }}
                        searchPlaceholder="Search vendor, service…"
                        leftAdornment={
                            <FilterSelect
                                label="Status"
                                value={statusFilter}
                                onChange={(v) => {
                                    setStatusFilter(v);
                                    setPage(1);
                                }}
                                options={STATUS_FILTERS.map((s) => ({ value: s, label: s }))}
                            />
                        }
                    />

                    {rows.length === 0 ? (
                        <EmptyState
                            title="No vendors engaged yet."
                            description="Vendors will appear here automatically once work orders are assigned for this project."
                        />
                    ) : totalItems === 0 ? (
                        <EmptyState
                            title="No vendors match your filters."
                            description="Adjust the search or status filter to see more results."
                        />
                    ) : (
                        <>
                            <SimpleTable<ProjectVendorRow>
                                columns={columns}
                                rows={paginated}
                                getRowKey={(r) => r.vendorId ?? r.vendorName}
                                onRowClick={(r) => {
                                    if (r.vendorId) router.push(`/company-admin/vendors/${encodeURIComponent(r.vendorId)}`);
                                }}
                            />
                            <ProjectTabPagination
                                currentPage={page}
                                totalItems={totalItems}
                                onPageChange={setPage}
                                pageSize={PAGE_SIZE}
                                label="vendors"
                            />
                        </>
                    )}
                </div>
            </ProjectTabSection>
        </div>
    );
}
