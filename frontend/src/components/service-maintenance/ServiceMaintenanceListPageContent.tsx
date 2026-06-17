'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { ImportServiceMaintenanceModal } from '@/components/service-maintenance/ImportServiceMaintenanceModal';
import { ServiceMaintenanceRowActionsMenu } from '@/components/service-maintenance/ServiceMaintenanceRowActionsMenu';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_INPUT_FOCUS,
    CTA_SHADOW_SOFT,
} from '@/lib/theme/ctaThemeClasses';
import { downloadServiceMaintenanceCsv, openServiceMaintenancePrintReport } from '@/lib/exportServiceMaintenanceCsv';
import { serviceMaintenanceCreateHref, serviceMaintenanceViewHref } from '@/lib/serviceMaintenanceRoutes';
import type {
    EscalationLevel,
    IssueCategory,
    PriorityLevel,
    ServiceMaintenanceTicket,
    SlaStatus,
    SourceChannel,
    TicketStatus,
} from '@/lib/serviceMaintenanceStore';
import {
    ESCALATION_LEVEL_OPTIONS,
    ISSUE_CATEGORY_OPTIONS,
    PRIORITY_LEVEL_OPTIONS,
    SLA_STATUS_OPTIONS,
    SOURCE_CHANNEL_OPTIONS,
    TICKET_STATUS_OPTIONS,
    assignVendorToTicket,
    bulkAssignVendor,
    bulkDeleteServiceTicketsPermanent,
    bulkEscalateTickets,
    bulkSetTicketStatus,
    closeServiceMaintenanceTicket,
    computeRemainingSlaLabel,
    deleteServiceMaintenanceTicketPermanent,
    escalateServiceMaintenanceTicket,
    getAssignedVendorOptions,
    getServiceMaintenanceTickets,
} from '@/lib/serviceMaintenanceStore';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import {
    LuBookmark,
    LuCheck,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuPlus,
    LuSearch,
    LuTrash2,
    LuUpload,
    LuX,
} from 'react-icons/lu';

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-service-maintenance-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-service-maintenance-saved-views';

const SERVICE_MAINTENANCE_TABLE_DATA_COLUMN_IDS = [
    'ticketId',
    'requestTitle',
    'issueCategory',
    'priorityLevel',
    'locationUnit',
    'preferredVisitTime',
    'ticketStatus',
    'slaStatus',
    'assignedVendor',
    'remainingSla',
    'createdDate',
] as const;

const SERVICE_MAINTENANCE_TABLE_DEFAULT_ON = new Set<string>([...SERVICE_MAINTENANCE_TABLE_DATA_COLUMN_IDS, 'actions']);

export type ServiceMaintenanceFilterPayload = {
    searchTerm: string;
    issueCategoryFilter: 'All' | IssueCategory;
    priorityFilter: 'All' | PriorityLevel;
    ticketStatusFilter: 'All' | TicketStatus;
    slaStatusFilter: 'All' | SlaStatus;
    escalationFilter: 'All' | EscalationLevel;
    vendorFilter: 'All' | string;
    sourceChannelFilter: 'All' | SourceChannel;
};

type SavedView = { id: string; name: string; payload: ServiceMaintenanceFilterPayload };

function defaultFilters(): ServiceMaintenanceFilterPayload {
    return {
        searchTerm: '',
        issueCategoryFilter: 'All',
        priorityFilter: 'All',
        ticketStatusFilter: 'All',
        slaStatusFilter: 'All',
        escalationFilter: 'All',
        vendorFilter: 'All',
        sourceChannelFilter: 'All',
    };
}

function sortServiceMaintenanceList(rows: ServiceMaintenanceTicket[], sort: DataTableSortState): ServiceMaintenanceTicket[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'ticketId':
                va = a.ticketCode.toLowerCase();
                vb = b.ticketCode.toLowerCase();
                break;
            case 'requestTitle':
                va = a.requestTitle.toLowerCase();
                vb = b.requestTitle.toLowerCase();
                break;
            case 'issueCategory':
                va = a.issueCategory;
                vb = b.issueCategory;
                break;
            case 'priorityLevel':
                va = a.priorityLevel;
                vb = b.priorityLevel;
                break;
            case 'locationUnit':
                va = (a.locationUnit || '').toLowerCase();
                vb = (b.locationUnit || '').toLowerCase();
                break;
            case 'preferredVisitTime':
                va = a.preferredVisitTime;
                vb = b.preferredVisitTime;
                break;
            case 'ticketStatus':
                va = a.ticketStatus;
                vb = b.ticketStatus;
                break;
            case 'slaStatus':
                va = a.slaStatus;
                vb = b.slaStatus;
                break;
            case 'assignedVendor':
                va = (a.assignedVendor || '').toLowerCase();
                vb = (b.assignedVendor || '').toLowerCase();
                break;
            case 'remainingSla':
                va = Date.parse(a.slaDueAt) || 0;
                vb = Date.parse(b.slaDueAt) || 0;
                break;
            case 'createdDate':
                va = a.createdAt;
                vb = b.createdAt;
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

function formatYmdDisplay(ymd: string) {
    if (!ymd || ymd.length < 10) return ymd;
    const [y, m, d] = ymd.slice(0, 10).split('-');
    if (!y || !m || !d) return ymd;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mi = Number(m) - 1;
    return `${months[mi] || m} ${Number(d)}, ${y}`;
}

function formatDateTimeDisplay(iso: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function priorityBadgeClass(p: PriorityLevel) {
    if (p === 'Critical') return 'bg-rose-100 text-rose-950';
    if (p === 'High') return 'bg-orange-100 text-orange-900';
    if (p === 'Medium') return 'bg-amber-100 text-amber-950';
    return 'bg-slate-100 text-slate-800';
}

function ticketStatusTone(s: TicketStatus) {
    if (s === 'Open') return 'bg-sky-100 text-sky-950';
    if (s === 'In Progress') return 'bg-[color-mix(in_srgb,var(--cta-button-bg)_18%,white)] text-slate-900';
    if (s === 'On Hold') return 'bg-amber-100 text-amber-950';
    if (s === 'Resolved') return 'bg-emerald-100 text-emerald-900';
    return 'bg-slate-200 text-slate-800';
}

function slaStatusTone(s: SlaStatus) {
    if (s === 'On Track') return 'bg-emerald-100 text-emerald-900';
    if (s === 'Warning') return 'bg-amber-100 text-amber-950';
    return 'bg-rose-100 text-rose-950';
}

function issueCategoryBadgeClass(c: IssueCategory) {
    if (c === 'Plumbing') return 'bg-cyan-100 text-cyan-950';
    if (c === 'Electrical') return 'bg-yellow-100 text-yellow-950';
    if (c === 'HVAC') return 'bg-indigo-100 text-indigo-950';
    if (c === 'Security') return 'bg-violet-100 text-violet-900';
    if (c === 'Cleaning') return 'bg-teal-100 text-teal-950';
    if (c === 'Civil') return 'bg-stone-100 text-stone-900';
    return 'bg-slate-100 text-slate-800';
}

export function ServiceMaintenanceListPageContent() {
    const pathname = usePathname() ?? '';
    const router = useRouter();
    const searchParams = useSearchParams();
    const globalViewsTick = useGlobalSavedViewsSync();
    const vendorOptions = useMemo(() => getAssignedVendorOptions(), []);
    const assignableVendors = useMemo(() => vendorOptions.filter((v) => v !== 'Unassigned'), [vendorOptions]);

    const [listVersion, setListVersion] = useState(0);
    const allRows = useMemo(() => {
        void listVersion;
        return getServiceMaintenanceTickets();
    }, [listVersion]);

    const [filters, setFilters] = useState<ServiceMaintenanceFilterPayload>(() => defaultFilters());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [searchDraft, setSearchDraft] = useState('');

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Service Maintenance', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        void globalViewsTick;
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as ServiceMaintenanceFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as Partial<ServiceMaintenanceFilterPayload>;
        setFilters({ ...defaultFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((f) => (f.searchTerm === searchDraft ? f : { ...f, searchTerm: searchDraft }));
        }, 320);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'createdDate', direction: 'desc' });
    const [importOpen, setImportOpen] = useState(false);
    useEffect(() => {
        if (searchParams.get('import') !== '1') return;
        setImportOpen(true);
        const next = new URLSearchParams(searchParams.toString());
        next.delete('import');
        const q = next.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }, [searchParams, router, pathname]);

    const [assignVendorTarget, setAssignVendorTarget] = useState<ServiceMaintenanceTicket | null>(null);
    const [escalateTarget, setEscalateTarget] = useState<ServiceMaintenanceTicket | null>(null);
    const [closeTarget, setCloseTarget] = useState<ServiceMaintenanceTicket | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ServiceMaintenanceTicket | null>(null);
    const [rowVendorPick, setRowVendorPick] = useState('');
    const [rowEscalationPick, setRowEscalationPick] = useState<EscalationLevel>('Level 2');

    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const headerExportRef = useRef<HTMLDivElement>(null);
    const [headerExportOpen, setHeaderExportOpen] = useState(false);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...SERVICE_MAINTENANCE_TABLE_DATA_COLUMN_IDS, 'actions'] as string[];
        return Object.fromEntries(allIds.map((id) => [id, SERVICE_MAINTENANCE_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        ticketId: 120,
        requestTitle: 220,
        issueCategory: 120,
        priorityLevel: 110,
        locationUnit: 200,
        preferredVisitTime: 160,
        ticketStatus: 120,
        slaStatus: 110,
        assignedVendor: 160,
        remainingSla: 130,
        createdDate: 120,
        actions: 128,
    });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, listVersion, sort]);

    useEffect(() => {
        if (!exportMenuOpen && !headerExportOpen) return;
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (exportMenuRef.current?.contains(t) || headerExportRef.current?.contains(t)) return;
            setExportMenuOpen(false);
            setHeaderExportOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [exportMenuOpen, headerExportOpen]);

    useEffect(() => {
        if (!columnMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) setColumnMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [columnMenuOpen]);

    const bump = useCallback(() => {
        setListVersion((v) => v + 1);
        setSelectedIds(new Set());
    }, []);

    const filtered = useMemo(() => {
        const st = filters.searchTerm.trim().toLowerCase();
        return allRows.filter((r) => {
            const matchSearch =
                !st ||
                r.ticketCode.toLowerCase().includes(st) ||
                r.requestTitle.toLowerCase().includes(st) ||
                r.description.toLowerCase().includes(st) ||
                (r.locationUnit || '').toLowerCase().includes(st) ||
                (r.assignedVendor || '').toLowerCase().includes(st);
            const matchCategory = filters.issueCategoryFilter === 'All' || r.issueCategory === filters.issueCategoryFilter;
            const matchPriority = filters.priorityFilter === 'All' || r.priorityLevel === filters.priorityFilter;
            const matchStatus = filters.ticketStatusFilter === 'All' || r.ticketStatus === filters.ticketStatusFilter;
            const matchSla = filters.slaStatusFilter === 'All' || r.slaStatus === filters.slaStatusFilter;
            const matchEscalation = filters.escalationFilter === 'All' || r.escalationLevel === filters.escalationFilter;
            const matchVendor = filters.vendorFilter === 'All' || r.assignedVendor === filters.vendorFilter;
            const matchChannel = filters.sourceChannelFilter === 'All' || r.sourceChannel === filters.sourceChannelFilter;
            return matchSearch && matchCategory && matchPriority && matchStatus && matchSla && matchEscalation && matchVendor && matchChannel;
        });
    }, [allRows, filters]);

    const sorted = useMemo(() => sortServiceMaintenanceList(filtered, sort), [filtered, sort]);
    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    const pageRows = useMemo(() => sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [sorted, currentPage]);

    const selectClass = cn('h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800', CTA_INPUT_FOCUS);

    const hasActiveFilters =
        filters.searchTerm.trim() !== '' ||
        filters.issueCategoryFilter !== 'All' ||
        filters.priorityFilter !== 'All' ||
        filters.ticketStatusFilter !== 'All' ||
        filters.slaStatusFilter !== 'All' ||
        filters.escalationFilter !== 'All' ||
        filters.vendorFilter !== 'All' ||
        filters.sourceChannelFilter !== 'All';

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Service Maintenance',
            views.map((v) => ({ id: v.id, name: v.name, payload: v.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((v) => v.id !== id));
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        const id = `v-${Date.now()}`;
        persistSavedViews([...savedViews, { id, name, payload: { ...filters } }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const applySavedView = (v: SavedView) => {
        setFilters({ ...defaultFilters(), ...v.payload });
        setSearchDraft(v.payload.searchTerm ?? '');
        setDrawerOpen(false);
    };

    const resetFilters = () => {
        setFilters(defaultFilters());
        setSearchDraft('');
        setCurrentPage(1);
    };

    const selectedRows = useMemo(() => sorted.filter((r) => selectedIds.has(r.slug)), [sorted, selectedIds]);

    const exportRowsForScope = () => (selectedIds.size ? selectedRows : sorted);

    const runExportCsv = (filename: string) => {
        downloadServiceMaintenanceCsv(exportRowsForScope(), filename);
        setExportMenuOpen(false);
        setHeaderExportOpen(false);
    };

    const runExportPdf = () => {
        const rows = exportRowsForScope();
        const scope = selectedIds.size ? 'Selected service tickets' : 'Service maintenance export';
        openServiceMaintenancePrintReport(rows, `${scope} · ${rows.length} record(s)`);
        setExportMenuOpen(false);
        setHeaderExportOpen(false);
    };

    const columns: DataTableColumn<ServiceMaintenanceTicket>[] = useMemo(
        () => [
            {
                id: 'ticketId',
                header: 'Ticket ID',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.ticketCode.toLowerCase(),
                minWidth: 120,
                render: (row) => <span className="font-mono text-xs font-semibold text-slate-800">{row.ticketCode}</span>,
            },
            {
                id: 'requestTitle',
                header: 'Request Title',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.requestTitle.toLowerCase(),
                minWidth: 220,
                render: (row) => (
                    <Link
                        href={serviceMaintenanceViewHref(row.slug)}
                        className="block min-w-0 truncate font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {row.requestTitle || '—'}
                    </Link>
                ),
            },
            {
                id: 'issueCategory',
                header: 'Issue Category',
                sortable: true,
                sortValue: (row) => row.issueCategory,
                minWidth: 120,
                render: (row) => (
                    <span className={cn('rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide', issueCategoryBadgeClass(row.issueCategory))}>
                        {row.issueCategory}
                    </span>
                ),
            },
            {
                id: 'priorityLevel',
                header: 'Priority',
                sortable: true,
                sortValue: (row) => row.priorityLevel,
                minWidth: 110,
                render: (row) => (
                    <span className={cn('rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide', priorityBadgeClass(row.priorityLevel))}>
                        {row.priorityLevel}
                    </span>
                ),
            },
            {
                id: 'locationUnit',
                header: 'Location / Unit',
                sortable: true,
                sortValue: (row) => (row.locationUnit || '').toLowerCase(),
                minWidth: 200,
                render: (row) => (
                    <span className="line-clamp-2 max-w-[220px] text-slate-700" title={row.locationUnit}>
                        {row.locationUnit?.trim() || '—'}
                    </span>
                ),
            },
            {
                id: 'preferredVisitTime',
                header: 'Preferred Visit',
                sortable: true,
                sortValue: (row) => row.preferredVisitTime,
                minWidth: 160,
                render: (row) => <span className="tabular-nums text-slate-700">{formatDateTimeDisplay(row.preferredVisitTime)}</span>,
            },
            {
                id: 'ticketStatus',
                header: 'Ticket Status',
                sortable: true,
                sortValue: (row) => row.ticketStatus,
                minWidth: 120,
                render: (row) => (
                    <span className={cn('rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide', ticketStatusTone(row.ticketStatus))}>
                        {row.ticketStatus}
                    </span>
                ),
            },
            {
                id: 'slaStatus',
                header: 'SLA Status',
                sortable: true,
                sortValue: (row) => row.slaStatus,
                minWidth: 110,
                render: (row) => (
                    <span className={cn('rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide', slaStatusTone(row.slaStatus))}>
                        {row.slaStatus}
                    </span>
                ),
            },
            {
                id: 'assignedVendor',
                header: 'Assigned Vendor',
                sortable: true,
                sortValue: (row) => (row.assignedVendor || '').toLowerCase(),
                minWidth: 160,
                render: (row) => (
                    <span
                        className={cn(
                            'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                            row.assignedVendor && row.assignedVendor !== 'Unassigned'
                                ? 'border-slate-200 bg-slate-50 text-slate-700'
                                : 'border-dashed border-slate-300 bg-white text-slate-500',
                        )}
                    >
                        {row.assignedVendor?.trim() || 'Unassigned'}
                    </span>
                ),
            },
            {
                id: 'remainingSla',
                header: 'Remaining SLA',
                sortable: true,
                sortValue: (row) => Date.parse(row.slaDueAt) || 0,
                minWidth: 130,
                render: (row) => {
                    const label = computeRemainingSlaLabel(row.slaDueAt, row.ticketStatus);
                    const overdue = label.includes('overdue');
                    const complete = label === 'Complete';
                    return (
                        <span
                            className={cn(
                                'text-xs font-semibold tabular-nums',
                                complete ? 'text-emerald-800' : overdue ? 'text-rose-700' : 'text-slate-700',
                            )}
                        >
                            {label}
                        </span>
                    );
                },
            },
            {
                id: 'createdDate',
                header: 'Created Date',
                sortable: true,
                sortValue: (row) => row.createdAt,
                minWidth: 120,
                render: (row) => <span className="tabular-nums text-slate-700">{formatYmdDisplay(row.createdAt)}</span>,
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                stickyEnd: true,
                minWidth: 112,
                headerClassName: 'w-[128px]',
                cellClassName: 'text-right bg-white shadow-[-8px_0_12px_-8px_rgba(15,23,42,0.08)]',
                render: (row) => (
                    <ServiceMaintenanceRowActionsMenu
                        ticket={row}
                        onAssignVendor={(t) => {
                            setRowVendorPick(t.assignedVendor && t.assignedVendor !== 'Unassigned' ? t.assignedVendor : assignableVendors[0] ?? '');
                            setAssignVendorTarget(t);
                        }}
                        onClose={(t) => setCloseTarget(t)}
                        onDelete={(t) => setDeleteTarget(t)}
                        onCloseParent={() => setSelectedIds(new Set())}
                    />
                ),
            },
        ],
        [assignableVendors],
    );

    const [bulkVendorPick, setBulkVendorPick] = useState('');
    const [bulkStatusPick, setBulkStatusPick] = useState<TicketStatus>('Open');
    const [bulkEscalationPick, setBulkEscalationPick] = useState<EscalationLevel>('Level 2');
    const [bulkAssignVendorOpen, setBulkAssignVendorOpen] = useState(false);
    const [bulkChangeStatusOpen, setBulkChangeStatusOpen] = useState(false);
    const [bulkEscalateOpen, setBulkEscalateOpen] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    useEffect(() => {
        if (!bulkAssignVendorOpen) return;
        if (!bulkVendorPick && assignableVendors[0]) setBulkVendorPick(assignableVendors[0]);
    }, [bulkAssignVendorOpen, bulkVendorPick, assignableVendors]);

    const confirmBulkAssignVendor = () => {
        if (!selectedIds.size || !bulkVendorPick) return;
        bulkAssignVendor([...selectedIds], bulkVendorPick);
        setBulkAssignVendorOpen(false);
        bump();
    };

    const confirmBulkChangeStatus = () => {
        if (!selectedIds.size) return;
        bulkSetTicketStatus([...selectedIds], bulkStatusPick);
        setBulkChangeStatusOpen(false);
        bump();
    };

    const confirmBulkEscalate = () => {
        if (!selectedIds.size) return;
        bulkEscalateTickets([...selectedIds], bulkEscalationPick);
        setBulkEscalateOpen(false);
        bump();
    };

    const confirmBulkDelete = () => {
        if (!selectedIds.size) return;
        bulkDeleteServiceTicketsPermanent([...selectedIds]);
        setBulkDeleteOpen(false);
        bump();
    };

    const confirmRowAssignVendor = () => {
        if (!assignVendorTarget || !rowVendorPick) return;
        assignVendorToTicket(assignVendorTarget.slug, rowVendorPick);
        setAssignVendorTarget(null);
        bump();
    };

    const confirmRowEscalate = () => {
        if (!escalateTarget) return;
        escalateServiceMaintenanceTicket(escalateTarget.slug, rowEscalationPick);
        setEscalateTarget(null);
        bump();
    };

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Platform Foundation', href: '/platform/tenants' },
                    { label: 'mySFT Community Hub', href: '/platform/community/service-maintenance' },
                    { label: 'Service Request & Maintenance OS' },
                ]}
            />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Service Request & Maintenance OS</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Centralized maintenance and operations platform for managing service tickets, SLA tracking, vendor assignment, and issue
                        resolution workflows.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link href={serviceMaintenanceCreateHref()}>
                        <Button variant="company" size="cta" className={cn('gap-2', CTA_SHADOW_SOFT)}>
                            <LuPlus size={18} />
                            Create Ticket
                        </Button>
                    </Link>
                   
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:order-1">
                    <div className="relative min-w-[200px] flex-1 max-w-xl">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search ticket ID, issue, unit, vendor, or resident..."
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') setFilters((f) => ({ ...f, searchTerm: searchDraft }));
                            }}
                            className={cn(
                                'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                                CTA_INPUT_FOCUS,
                            )}
                            aria-label="Search service tickets"
                        />
                    </div>
                </div>

                <div className="order-1 flex flex-wrap items-center justify-end gap-2 sm:order-2">
                    <div className="relative" ref={columnMenuRef}>
                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setColumnMenuOpen((o) => !o)} aria-expanded={columnMenuOpen}>
                            <LuColumns3 size={18} />
                            Columns
                        </Button>
                        {columnMenuOpen ? (
                            <div className="absolute right-0 top-[calc(100%+6px)] z-[300] w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                {SERVICE_MAINTENANCE_TABLE_DATA_COLUMN_IDS.map((id) => {
                                    const labelMap: Record<string, string> = {
                                        ticketId: 'Ticket ID',
                                        requestTitle: 'Request title',
                                        issueCategory: 'Issue category',
                                        priorityLevel: 'Priority',
                                        locationUnit: 'Location / unit',
                                        preferredVisitTime: 'Preferred visit',
                                        ticketStatus: 'Ticket status',
                                        slaStatus: 'SLA status',
                                        assignedVendor: 'Assigned vendor',
                                        remainingSla: 'Remaining SLA',
                                        createdDate: 'Created date',
                                    };
                                    return (
                                        <label key={id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                                            <input
                                                type="checkbox"
                                                className={CTA_CHECKBOX_SM}
                                                checked={columnVisibility[id] !== false}
                                                onChange={() =>
                                                    setColumnVisibility((m) => {
                                                        const vis = m[id] !== false;
                                                        return { ...m, [id]: !vis };
                                                    })
                                                }
                                            />
                                            {labelMap[id]}
                                        </label>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>

                    <Button type="button" variant={drawerOpen ? 'company' : 'companyOutline'} size="cta" className="gap-2" onClick={() => setDrawerOpen(true)}>
                        <LuFilter size={18} />
                        Filters
                        {hasActiveFilters ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">On</span> : null}
                    </Button>

                    <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setSaveModalOpen(true)}>
                        <LuBookmark size={18} />
                        Save view
                    </Button>

                    <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setImportOpen(true)}>
                        <LuUpload size={18} />
                        Import
                    </Button>

                    <div className="relative" ref={exportMenuRef}>
                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setExportMenuOpen((o) => !o)} aria-expanded={exportMenuOpen}>
                            <LuDownload size={18} />
                            Export
                            <LuChevronDown size={16} className="opacity-70" />
                        </Button>
                        {exportMenuOpen ? (
                            <div className="absolute right-0 top-[calc(100%+6px)] z-[300] w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => runExportCsv(selectedIds.size ? 'service-tickets-selected.csv' : 'service-tickets-export.csv')}
                                >
                                    <LuDownload size={16} className="text-slate-400" />
                                    CSV
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => {
                                        downloadServiceMaintenanceCsv(exportRowsForScope(), 'service-tickets-excel.csv');
                                        setExportMenuOpen(false);
                                    }}
                                >
                                    <LuFileText size={16} className="text-slate-400" />
                                    Excel (UTF-8 CSV)
                                </button>
                                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={runExportPdf}>
                                    <LuFileText size={16} className="text-slate-400" />
                                    PDF / Print
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {selectedIds.size > 0 ? (
                <div className={cn('mb-4 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between', CTA_BULK_BAR)}>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <LuCheck size={18} />
                        {selectedIds.size} selected
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="gap-1.5 bg-white"
                            onClick={() => downloadServiceMaintenanceCsv(selectedRows, 'service-tickets-selected.csv')}
                        >
                            <LuDownload size={16} />
                            Export selected
                        </Button>
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={() => setBulkAssignVendorOpen(true)}>
                            Assign vendor
                        </Button>
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={() => setBulkChangeStatusOpen(true)}>
                            Change status
                        </Button>
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={() => setBulkEscalateOpen(true)}>
                            Escalate
                        </Button>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="gap-1.5 border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                            onClick={() => setBulkDeleteOpen(true)}
                        >
                            <LuTrash2 size={16} />
                            Delete
                        </Button>
                        <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelectedIds(new Set())}>
                            Clear
                        </Button>
                    </div>
                </div>
            ) : null}

            <DataTable<ServiceMaintenanceTicket>
                columns={columns}
                data={pageRows}
                getRowId={(row) => row.slug}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                stickyColumnId="requestTitle"
                enableClientSort={false}
                stickyHeader
                emptyMessage="No service tickets match your filters. Adjust search or filters, or create a ticket."
                selection={{
                    rowKey: 'slug',
                    selectedIds,
                    onSelectedIdsChange: setSelectedIds,
                }}
                onRowClick={(row) => router.push(serviceMaintenanceViewHref(row.slug))}
            />

            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sorted.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="tickets"
                />
            </div>

            {drawerOpen ? (
                <>
                    <button type="button" className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" aria-label="Close filters" onClick={() => setDrawerOpen(false)} />
                    <aside
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                        role="dialog"
                        aria-label="Service maintenance filters"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Advanced filters</h2>
                            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" onClick={() => setDrawerOpen(false)}>
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Issue Category</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.issueCategoryFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, issueCategoryFilter: e.target.value as ServiceMaintenanceFilterPayload['issueCategoryFilter'] }))}
                                >
                                    <option value="All">All categories</option>
                                    {ISSUE_CATEGORY_OPTIONS.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.priorityFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, priorityFilter: e.target.value as ServiceMaintenanceFilterPayload['priorityFilter'] }))}
                                >
                                    <option value="All">All priorities</option>
                                    {PRIORITY_LEVEL_OPTIONS.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ticket Status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.ticketStatusFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, ticketStatusFilter: e.target.value as ServiceMaintenanceFilterPayload['ticketStatusFilter'] }))}
                                >
                                    <option value="All">All statuses</option>
                                    {TICKET_STATUS_OPTIONS.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">SLA Status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.slaStatusFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, slaStatusFilter: e.target.value as ServiceMaintenanceFilterPayload['slaStatusFilter'] }))}
                                >
                                    <option value="All">All SLA states</option>
                                    {SLA_STATUS_OPTIONS.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Escalation Level</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.escalationFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, escalationFilter: e.target.value as ServiceMaintenanceFilterPayload['escalationFilter'] }))}
                                >
                                    <option value="All">All levels</option>
                                    {ESCALATION_LEVEL_OPTIONS.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Vendor</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.vendorFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, vendorFilter: e.target.value }))}
                                >
                                    <option value="All">All vendors</option>
                                    {vendorOptions.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source Channel</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.sourceChannelFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, sourceChannelFilter: e.target.value as ServiceMaintenanceFilterPayload['sourceChannelFilter'] }))}
                                >
                                    <option value="All">All channels</option>
                                    {SOURCE_CHANNEL_OPTIONS.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {savedViews.length > 0 ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved views</p>
                                    <ul className="mt-2 space-y-1">
                                        {savedViews.map((v) => (
                                            <li key={v.id} className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-[var(--cta-button-bg)] hover:bg-white"
                                                    onClick={() => applySavedView(v)}
                                                >
                                                    {v.name}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600"
                                                    aria-label={`Delete saved view ${v.name}`}
                                                    onClick={() => deleteSavedView(v.id)}
                                                >
                                                    <LuTrash2 size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                        <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
                            <Button type="button" variant="companyOutline" size="cta" className="flex-1" onClick={resetFilters}>
                                Reset
                            </Button>
                            <Button type="button" variant="company" size="cta" className="flex-1" onClick={() => setDrawerOpen(false)}>
                                Apply
                            </Button>
                        </div>
                    </aside>
                </>
            ) : null}

            <Modal
                isOpen={saveModalOpen}
                onClose={() => setSaveModalOpen(false)}
                title="Save filter view"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setSaveModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={saveCurrentView} disabled={!saveViewName.trim()}>
                            Save
                        </Button>
                    </>
                }
            >
                <p className="mb-3 text-sm text-slate-600">Save the current search and filter combination for quick recall across admin pages.</p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Critical HVAC · SLA breached"
                />
            </Modal>

            <Modal
                isOpen={!!assignVendorTarget}
                onClose={() => setAssignVendorTarget(null)}
                title="Assign vendor"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setAssignVendorTarget(null)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={confirmRowAssignVendor} disabled={!rowVendorPick}>
                            Assign
                        </Button>
                    </>
                }
            >
                <p className="mb-3 text-sm text-slate-600">
                    Assign a vendor to <span className="font-semibold text-slate-900">{assignVendorTarget?.ticketCode}</span> — {assignVendorTarget?.requestTitle}
                </p>
                <label className="text-xs font-bold uppercase text-slate-400">Vendor</label>
                <select className={cn('mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)} value={rowVendorPick} onChange={(e) => setRowVendorPick(e.target.value)}>
                    {assignableVendors.map((v) => (
                        <option key={v} value={v}>
                            {v}
                        </option>
                    ))}
                </select>
            </Modal>

            <Modal
                isOpen={!!escalateTarget}
                onClose={() => setEscalateTarget(null)}
                title="Escalate ticket"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setEscalateTarget(null)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={confirmRowEscalate}>
                            Escalate
                        </Button>
                    </>
                }
            >
                <p className="mb-3 text-sm text-slate-600">
                    Escalate <span className="font-semibold text-slate-900">{escalateTarget?.ticketCode}</span> to a higher support tier.
                </p>
                <label className="text-xs font-bold uppercase text-slate-400">Escalation level</label>
                <select
                    className={cn('mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    value={rowEscalationPick}
                    onChange={(e) => setRowEscalationPick(e.target.value as EscalationLevel)}
                >
                    {ESCALATION_LEVEL_OPTIONS.map((l) => (
                        <option key={l} value={l}>
                            {l}
                        </option>
                    ))}
                </select>
            </Modal>

            <Modal
                isOpen={!!closeTarget}
                onClose={() => setCloseTarget(null)}
                title="Close ticket"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setCloseTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            onClick={() => {
                                if (closeTarget) closeServiceMaintenanceTicket(closeTarget.slug);
                                setCloseTarget(null);
                                bump();
                            }}
                        >
                            Close ticket
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Close <span className="font-semibold text-slate-900">{closeTarget?.ticketCode}</span> — {closeTarget?.requestTitle}? The ticket will be marked as closed.
                </p>
            </Modal>

            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete ticket"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={() => {
                                if (deleteTarget) deleteServiceMaintenanceTicketPermanent(deleteTarget.slug);
                                setDeleteTarget(null);
                                bump();
                            }}
                        >
                            Delete permanently
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Permanently delete <span className="font-semibold text-slate-900">{deleteTarget?.ticketCode}</span> — {deleteTarget?.requestTitle}? This cannot be undone in the demo store.
                </p>
            </Modal>

            <Modal
                isOpen={bulkAssignVendorOpen}
                onClose={() => setBulkAssignVendorOpen(false)}
                title="Assign vendor"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkAssignVendorOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={confirmBulkAssignVendor} disabled={!selectedIds.size || !bulkVendorPick}>
                            Apply
                        </Button>
                    </>
                }
            >
                <label className="text-xs font-bold uppercase text-slate-400">Vendor</label>
                <select className={cn('mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)} value={bulkVendorPick} onChange={(e) => setBulkVendorPick(e.target.value)}>
                    {assignableVendors.map((v) => (
                        <option key={v} value={v}>
                            {v}
                        </option>
                    ))}
                </select>
                <p className="mt-3 text-sm text-slate-600">{selectedIds.size} ticket(s) will be updated.</p>
            </Modal>

            <Modal
                isOpen={bulkChangeStatusOpen}
                onClose={() => setBulkChangeStatusOpen(false)}
                title="Change status"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkChangeStatusOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={confirmBulkChangeStatus} disabled={!selectedIds.size}>
                            Apply
                        </Button>
                    </>
                }
            >
                <label className="text-xs font-bold uppercase text-slate-400">Ticket status</label>
                <select className={cn('mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)} value={bulkStatusPick} onChange={(e) => setBulkStatusPick(e.target.value as TicketStatus)}>
                    {TICKET_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
                <p className="mt-3 text-sm text-slate-600">{selectedIds.size} ticket(s) will be updated.</p>
            </Modal>

            <Modal
                isOpen={bulkEscalateOpen}
                onClose={() => setBulkEscalateOpen(false)}
                title="Escalate selected"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkEscalateOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={confirmBulkEscalate} disabled={!selectedIds.size}>
                            Escalate
                        </Button>
                    </>
                }
            >
                <label className="text-xs font-bold uppercase text-slate-400">Escalation level</label>
                <select
                    className={cn('mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    value={bulkEscalationPick}
                    onChange={(e) => setBulkEscalationPick(e.target.value as EscalationLevel)}
                >
                    {ESCALATION_LEVEL_OPTIONS.map((l) => (
                        <option key={l} value={l}>
                            {l}
                        </option>
                    ))}
                </select>
                <p className="mt-3 text-sm text-slate-600">{selectedIds.size} ticket(s) will be escalated.</p>
            </Modal>

            <Modal
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                title="Delete selected"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmBulkDelete}>
                            Delete permanently
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">Permanently delete {selectedIds.size} ticket(s)? This cannot be undone in the demo store.</p>
            </Modal>

            <ImportServiceMaintenanceModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={bump} />
        </CompanyAdminDashboardLayout>
    );
}
