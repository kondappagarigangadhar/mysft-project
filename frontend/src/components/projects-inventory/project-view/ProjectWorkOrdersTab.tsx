'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LuCalendarClock,
    LuCircleCheck,
    LuHardHat,
    LuTimer,
    LuTriangleAlert,
} from 'react-icons/lu';
import { getWorkOrders, type WorkOrder, type WorkOrderStatus } from '@/lib/workOrderStore';
import type { Project } from '@/lib/projectsInventoryStore';
import { cn } from '@/lib/utils';

import {
    BpStatusBadge,
    EmptyState,
    FilterSelect,
    formatProjectDate,
    OpenInModuleLink,
    ProjectTabPagination,
    ProjectTabSection,
    ProjectTabToolbar,
    SimpleTable,
    SummaryCard,
    SummaryCardGrid,
    type SimpleTableColumn,
    workOrderStatusTone,
} from './ProjectRelationalUI';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
    'All',
    'Open',
    'Assigned',
    'In Progress',
    'On Hold',
    'Completed',
    'Verified',
    'Cancelled',
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

type ProjectWorkOrderRow = {
    slug: string;
    code: string;
    title: string;
    workType: string;
    vendorName: string;
    startDate: string;
    endDate: string;
    status: WorkOrderStatus;
    slaStatus: string;
    completionPct: number;
};

function latestCompletionPct(w: WorkOrder): number {
    if (!w.progressUpdates?.length) return 0;
    const last = w.progressUpdates[w.progressUpdates.length - 1]!;
    return Math.min(100, Math.max(0, last.completionPct ?? 0));
}

function deriveProjectWorkOrders(projectName: string): ProjectWorkOrderRow[] {
    if (!projectName.trim()) return [];
    const target = projectName.trim().toLowerCase();
    return getWorkOrders()
        .filter((w) => (w.projectOrProperty || '').trim().toLowerCase() === target)
        .map((w) => ({
            slug: w.slug,
            code: w.workOrderId,
            title: w.title,
            workType: w.workType || '—',
            vendorName: w.vendor?.vendorName?.trim() || '—',
            startDate: w.scheduling?.startDate || '',
            endDate: w.scheduling?.endDate || '',
            status: w.lifecycle?.status ?? 'Draft',
            slaStatus: w.scheduling?.slaStatus || '—',
            completionPct: latestCompletionPct(w),
        }))
        .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

type Props = {
    project: Project;
    storeVersion: number;
};

export function ProjectWorkOrdersTab({ project, storeVersion }: Props) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    const [page, setPage] = useState(1);

    const rows = useMemo(
        () => deriveProjectWorkOrders(project.project_name),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [project.project_name, project.slug, storeVersion],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (statusFilter !== 'All' && r.status !== statusFilter) return false;
            if (!q) return true;
            return (
                r.title.toLowerCase().includes(q) ||
                r.code.toLowerCase().includes(q) ||
                r.vendorName.toLowerCase().includes(q) ||
                r.workType.toLowerCase().includes(q)
            );
        });
    }, [rows, search, statusFilter]);

    const totalItems = filtered.length;
    const paginated = useMemo(
        () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filtered, page],
    );

    const stats = useMemo(() => {
        const inProgress = rows.filter((r) => r.status === 'In Progress' || r.status === 'Assigned').length;
        const completed = rows.filter((r) => r.status === 'Completed' || r.status === 'Verified').length;
        const delayed = rows.filter((r) => r.slaStatus === 'Delayed' || r.slaStatus === 'At Risk').length;
        return { total: rows.length, inProgress, completed, delayed };
    }, [rows]);

    const columns: SimpleTableColumn<ProjectWorkOrderRow>[] = useMemo(
        () => [
            {
                key: 'wo',
                header: 'Work Order',
                render: (r) => (
                    <div className="min-w-0">
                        <p className="truncate font-mono text-xs font-semibold text-[var(--cta-button-bg)]">{r.code}</p>
                        <p className="truncate text-xs text-gray-500">{r.workType}</p>
                    </div>
                ),
            },
            {
                key: 'task',
                header: 'Task',
                render: (r) => <span className="block truncate font-medium text-gray-900">{r.title}</span>,
            },
            {
                key: 'vendor',
                header: 'Vendor',
                hideBelow: 'md',
                render: (r) => <span className="truncate text-sm text-gray-700">{r.vendorName}</span>,
            },
            {
                key: 'timeline',
                header: 'Timeline',
                hideBelow: 'lg',
                render: (r) => (
                    <div className="text-xs text-gray-600">
                        <p className="tabular-nums">{formatProjectDate(r.startDate)}</p>
                        <p className="tabular-nums text-gray-500">→ {formatProjectDate(r.endDate)}</p>
                    </div>
                ),
            },
            {
                key: 'progress',
                header: 'Progress',
                hideBelow: 'sm',
                render: (r) => (
                    <div className="min-w-[140px]">
                        <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                            <span>{r.completionPct}%</span>
                            <span className="text-gray-400">{r.slaStatus}</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all',
                                    r.completionPct >= 80
                                        ? 'bg-emerald-500'
                                        : r.completionPct >= 40
                                          ? 'bg-[var(--cta-button-bg)]'
                                          : 'bg-amber-500',
                                )}
                                style={{ width: `${r.completionPct}%` }}
                            />
                        </div>
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                render: (r) => <BpStatusBadge tone={workOrderStatusTone(r.status)}>{r.status}</BpStatusBadge>,
            },
            {
                key: 'actions',
                header: '',
                align: 'right',
                render: (r) => (
                    <OpenInModuleLink href={`/work-orders/view/${encodeURIComponent(r.slug)}`} label="Open" />
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
                    label="Total work orders"
                    value={stats.total}
                    sublabel="Active in this project"
                    icon={<LuHardHat size={18} aria-hidden />}
                />
                <SummaryCard
                    tone="amber"
                    label="In progress"
                    value={stats.inProgress}
                    sublabel="Assigned & ongoing"
                    icon={<LuTimer size={18} aria-hidden />}
                />
                <SummaryCard
                    tone="emerald"
                    label="Completed"
                    value={stats.completed}
                    sublabel={`${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate`}
                    icon={<LuCircleCheck size={18} aria-hidden />}
                />
                <SummaryCard
                    tone="rose"
                    label="Delayed / At risk"
                    value={stats.delayed}
                    sublabel="SLA breaches & risks"
                    icon={<LuTriangleAlert size={18} aria-hidden />}
                />
            </SummaryCardGrid>

            <ProjectTabSection
                title="Work orders"
                description="Operational execution tracked against this project."
                actions={
                    <OpenInModuleLink
                        href={`/work-orders?project=${encodeURIComponent(project.project_name)}`}
                        label="Open Work Orders module"
                    />
                }
            >
                <div className="space-y-4">
                    <ProjectTabToolbar
                        searchValue={search}
                        onSearchChange={(v) => {
                            setSearch(v);
                            setPage(1);
                        }}
                        searchPlaceholder="Search task, vendor, code…"
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
                        rightAdornment={
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                <LuCalendarClock size={14} className="text-gray-400" aria-hidden />
                                Showing {totalItems} of {rows.length}
                            </span>
                        }
                    />

                    {rows.length === 0 ? (
                        <EmptyState
                            title="No work orders raised yet."
                            description="Operational work orders raised against this project will appear here."
                        />
                    ) : totalItems === 0 ? (
                        <EmptyState
                            title="No work orders match your filters."
                            description="Adjust the search or status filter to see more results."
                        />
                    ) : (
                        <>
                            <SimpleTable<ProjectWorkOrderRow>
                                columns={columns}
                                rows={paginated}
                                getRowKey={(r) => r.slug}
                                onRowClick={(r) => router.push(`/work-orders/view/${encodeURIComponent(r.slug)}`)}
                            />
                            <ProjectTabPagination
                                currentPage={page}
                                totalItems={totalItems}
                                onPageChange={setPage}
                                pageSize={PAGE_SIZE}
                                label="work orders"
                            />
                        </>
                    )}
                </div>
            </ProjectTabSection>
        </div>
    );
}
