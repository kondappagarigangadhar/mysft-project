'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { ImportLeadsModal } from '@/components/leads/ImportLeadsModal';
import { LeadsKanbanBoard } from '@/components/leads/LeadsKanbanBoard';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { LeadRowActionsMenu } from '@/components/leads/LeadRowActionsMenu';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_INPUT_FOCUS,
    CTA_SHADOW_SOFT,
} from '@/lib/theme/ctaThemeClasses';
import { downloadLeadsCsv } from '@/lib/exportLeadsCsv';
import { openLeadsPrintReport } from '@/lib/exportLeadsPdf';
import { leadProfileHref } from '@/lib/leadRoutes';
import type { Lead, LeadSource, LeadStatus as LeadStatusType } from '@/lib/leadStore';
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
    bulkAssignLeads,
    bulkDeleteLeads,
    bulkSetLeadStatus,
    deleteLead,
    getArchivedLeads,
    getLeads,
    normalizeLeadPhoneDigits,
    updateLead,
} from '@/lib/leadStore';
import {
    LuArchive,
    LuBookmark,
    LuCheck,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuLayoutGrid,
    LuPlus,
    LuSearch,
    LuSparkles,
    LuTable2,
    LuTrash2,
    LuUpload,
    LuUserPlus,
    LuX,
} from 'react-icons/lu';

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-leads-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-leads-saved-views';

/** All table column ids; column picker lists data columns only (not `actions`). */
const LEADS_TABLE_DATA_COLUMN_IDS = [
    'name',
    'email',
    'phone',
    'source',
    'project',
    'budgetRange',
    'preferredUnitType',
    'status',
    'assignedTo',
    'createdDate',
] as const;

/** Default: five key data columns on; the rest (and any optional fields) off until the user enables them. `actions` always on. */
const LEADS_TABLE_DEFAULT_ON = new Set<string>(['name', 'project', 'preferredUnitType', 'status', 'assignedTo', 'budgetRange', 'actions']);

type SavedView = { id: string; name: string; payload: LeadsFilterPayload };

export type LeadsFilterPayload = {
    searchTerm: string;
    statusFilter: 'All' | LeadStatusType;
    sourceFilter: 'All' | LeadSource;
    assignedFilter: 'All' | string;
    projectFilter: 'All' | string;
    budgetFilter: 'All' | string;
    dateFrom: string;
    dateTo: string;
};

const defaultFilters = (): LeadsFilterPayload => ({
    searchTerm: '',
    statusFilter: 'All',
    sourceFilter: 'All',
    assignedFilter: 'All',
    projectFilter: 'All',
    budgetFilter: 'All',
    dateFrom: '',
    dateTo: '',
});

function sortLeadsList(leads: Lead[], sort: DataTableSortState): Lead[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...leads];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...leads];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'name':
                va = a.name.toLowerCase();
                vb = b.name.toLowerCase();
                break;
            case 'email':
                va = a.email.toLowerCase();
                vb = b.email.toLowerCase();
                break;
            case 'phone':
                va = normalizeLeadPhoneDigits(a.phone);
                vb = normalizeLeadPhoneDigits(b.phone);
                break;
            case 'project':
                va = (a.project || '').toLowerCase();
                vb = (b.project || '').toLowerCase();
                break;
            case 'budgetRange':
                va = (a.budgetRange || '').toLowerCase();
                vb = (b.budgetRange || '').toLowerCase();
                break;
            case 'preferredUnitType':
                va = a.preferredUnitType.toLowerCase();
                vb = b.preferredUnitType.toLowerCase();
                break;
            case 'source':
                va = a.source;
                vb = b.source;
                break;
            case 'status':
                va = a.status;
                vb = b.status;
                break;
            case 'assignedTo':
                va = (a.assignedTo || '').toLowerCase();
                vb = (b.assignedTo || '').toLowerCase();
                break;
            case 'createdDate':
                va = a.createdDate;
                vb = b.createdDate;
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

export function LeadsListPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname() ?? '';
    const globalViewsTick = useGlobalSavedViewsSync();
    const [listVersion, setListVersion] = useState(0);
    const allLeads = useMemo(() => getLeads(), [listVersion]);
    const archivedCount = useMemo(() => getArchivedLeads().length, [listVersion]);

    const [filters, setFilters] = useState<LeadsFilterPayload>(() => defaultFilters());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [searchDraft, setSearchDraft] = useState('');

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Leads', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as LeadsFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as Partial<LeadsFilterPayload>;
        setFilters({ ...defaultFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });
    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'createdDate', direction: 'desc' });

    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
    const [importOpen, setImportOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get('import') !== '1') return;
        setImportOpen(true);
        const next = new URLSearchParams(searchParams.toString());
        next.delete('import');
        const q = next.toString();
        router.replace(q ? `/leads?${q}` : '/leads', { scroll: false });
    }, [searchParams, router]);
    const [deleteOneTarget, setDeleteOneTarget] = useState<Lead | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
    const [bulkAssignPick, setBulkAssignPick] = useState('');
    const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
    const [bulkStatusPick, setBulkStatusPick] = useState<LeadStatusType>('Qualified');
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...LEADS_TABLE_DATA_COLUMN_IDS, 'actions' as const];
        return Object.fromEntries(allIds.map((id) => [id, LEADS_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        name: 260,
        email: 220,
        phone: 118,
        source: 128,
        project: 140,
        budgetRange: 108,
        preferredUnitType: 120,
        status: 112,
        assignedTo: 140,
        createdDate: 124,
        actions: 128,
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((f) => (f.searchTerm === searchDraft ? f : { ...f, searchTerm: searchDraft }));
        }, 320);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    useEffect(() => {
        if (!exportMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setExportMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [exportMenuOpen]);

    useEffect(() => {
        if (!columnMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
                setColumnMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [columnMenuOpen]);

    const statusOptions = useMemo(() => {
        const set = new Set<LeadStatusType>();
        allLeads.forEach((l) => set.add(l.status));
        return Array.from(set);
    }, [allLeads]);

    const sourceOptions = useMemo(() => {
        const set = new Set<LeadSource>();
        allLeads.forEach((l) => set.add(l.source));
        return Array.from(set);
    }, [allLeads]);

    const assigneeOptions = useMemo(() => {
        const set = new Set<string>();
        allLeads.forEach((l) => {
            if (l.assignedTo?.trim()) set.add(l.assignedTo.trim());
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [allLeads]);

    const projectOptions = useMemo(() => {
        const set = new Set<string>();
        allLeads.forEach((l) => {
            if (l.project?.trim()) set.add(l.project.trim());
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [allLeads]);

    const budgetOptions = useMemo(() => {
        const set = new Set<string>();
        allLeads.forEach((l) => {
            if (l.budgetRange?.trim()) set.add(l.budgetRange.trim());
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [allLeads]);

    const bump = () => {
        setListVersion((v) => v + 1);
        setSelectedIds(new Set());
    };

    const filteredLeads = useMemo(() => {
        const st = filters.searchTerm.trim().toLowerCase();
        return allLeads.filter((l) => {
            const matchesSearch =
                !st ||
                l.name.toLowerCase().includes(st) ||
                l.phone.toLowerCase().includes(st) ||
                l.email.toLowerCase().includes(st) ||
                l.project.toLowerCase().includes(st) ||
                l.budgetRange.toLowerCase().includes(st) ||
                l.preferredUnitType.toLowerCase().includes(st);
            const matchesStatus = filters.statusFilter === 'All' ? true : l.status === filters.statusFilter;
            const matchesSource = filters.sourceFilter === 'All' ? true : l.source === filters.sourceFilter;
            const matchesAssigned =
                filters.assignedFilter === 'All' ? true : l.assignedTo.trim() === filters.assignedFilter;
            const matchesProject = filters.projectFilter === 'All' ? true : l.project.trim() === filters.projectFilter;
            const matchesBudget = filters.budgetFilter === 'All' ? true : l.budgetRange.trim() === filters.budgetFilter;
            const ymd = l.createdDate.slice(0, 10);
            const matchesDateFrom = !filters.dateFrom || ymd >= filters.dateFrom;
            const matchesDateTo = !filters.dateTo || ymd <= filters.dateTo;
            return (
                matchesSearch &&
                matchesStatus &&
                matchesSource &&
                matchesAssigned &&
                matchesProject &&
                matchesBudget &&
                matchesDateFrom &&
                matchesDateTo
            );
        });
    }, [allLeads, filters]);

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, listVersion, sort]);

    const sortedFilteredLeads = useMemo(() => sortLeadsList(filteredLeads, sort), [filteredLeads, sort]);

    const totalPages = Math.max(1, Math.ceil(sortedFilteredLeads.length / ITEMS_PER_PAGE));
    const paginatedLeads = useMemo(
        () => sortedFilteredLeads.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFilteredLeads, currentPage],
    );

    const handleDeleteOne = (lead: Lead) => {
        setDeleteOneTarget(lead);
    };

    const confirmDeleteOne = () => {
        if (!deleteOneTarget) return;
        if (deleteLead(deleteOneTarget.slug)) bump();
        setDeleteOneTarget(null);
    };

    const handleAssign = (slug: string, assignedTo: string) => {
        const d = new Date().toISOString().slice(0, 10);
        updateLead(slug, {
            assignedTo,
            assignment: { assignedTo, assignmentDate: d },
        });
        bump();
    };

    const handleStatus = (slug: string, status: LeadStatusType) => {
        bulkSetLeadStatus([slug], status);
        bump();
    };

    const selectClass = cn(
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800',
        CTA_INPUT_FOCUS,
    );

    const hasActiveFilters =
        filters.searchTerm.trim() !== '' ||
        filters.statusFilter !== 'All' ||
        filters.sourceFilter !== 'All' ||
        filters.assignedFilter !== 'All' ||
        filters.projectFilter !== 'All' ||
        filters.budgetFilter !== 'All' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== '';

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Leads',
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
        const next = [...savedViews, { id, name, payload: { ...filters } }];
        persistSavedViews(next);
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

    const selectedLeads = useMemo(
        () => sortedFilteredLeads.filter((l) => selectedIds.has(l.slug)),
        [sortedFilteredLeads, selectedIds],
    );

    const exportRowsForScope = () => {
        if (selectedIds.size) return selectedLeads;
        return sortedFilteredLeads;
    };

    const runExportCsv = (filename: string) => {
        downloadLeadsCsv(exportRowsForScope(), filename);
        setExportMenuOpen(false);
    };

    const runExportExcel = () => {
        downloadLeadsCsv(exportRowsForScope(), 'leads-export-excel.csv');
        setExportMenuOpen(false);
    };

    const runExportPdf = () => {
        const rows = exportRowsForScope();
        const scope = selectedIds.size ? 'Selected leads' : 'Leads export';
        openLeadsPrintReport(rows, `${scope} · ${rows.length} record(s)`);
        setExportMenuOpen(false);
    };

    const columns: DataTableColumn<Lead>[] = useMemo(
        () => [
            {
                id: 'name',
                header: 'Lead Name',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.name.toLowerCase(),
                minWidth: 200,
                render: (row) => (
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-sm font-bold text-slate-700 ring-1 ring-slate-200/80">
                            {row.name.charAt(0).toUpperCase()}
                        </div>
                        <Link
                            href={leadProfileHref(row.slug)}
                            className="min-w-0 truncate font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline"
                        >
                            {row.name}
                        </Link>
                    </div>
                ),
            },
            {
                id: 'email',
                header: 'Email',
                sortable: true,
                sortValue: (row) => row.email.toLowerCase(),
                minWidth: 180,
                render: (row) => (
                    <a
                        href={`mailto:${row.email}`}
                        className="truncate block max-w-[240px] text-slate-700 hover:text-[var(--cta-button-bg)] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {row.email || '—'}
                    </a>
                ),
            },
            {
                id: 'phone',
                header: 'Phone Number',
                sortable: true,
                sortValue: (row) => normalizeLeadPhoneDigits(row.phone),
                minWidth: 110,
                render: (row) => {
                    const d = normalizeLeadPhoneDigits(row.phone);
                    const display = d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : row.phone.trim() || '—';
                    return (
                        <a
                            href={d.length === 10 ? `tel:${d}` : undefined}
                            className={cn(
                                'tabular-nums',
                                d.length === 10 ? 'text-slate-800 hover:text-[var(--cta-button-bg)]' : 'text-slate-500',
                            )}
                            onClick={(e) => d.length !== 10 && e.preventDefault()}
                        >
                            {display}
                        </a>
                    );
                },
            },
            {
                id: 'source',
                header: 'Lead Source',
                sortable: true,
                sortValue: (row) => row.source,
                minWidth: 120,
                render: (row) => <span className="text-slate-700">{row.source}</span>,
            },
            {
                id: 'project',
                header: 'Project Interest',
                sortable: true,
                sortValue: (row) => (row.project || '').toLowerCase(),
                minWidth: 140,
                render: (row) => (
                    <span className="text-slate-700 truncate block max-w-[180px]" title={row.project}>
                        {row.project?.trim() || '—'}
                    </span>
                ),
            },
            {
                id: 'budgetRange',
                header: 'Budget Range',
                sortable: true,
                sortValue: (row) => (row.budgetRange || '').toLowerCase(),
                minWidth: 100,
                render: (row) => <span className="tabular-nums text-slate-700">{row.budgetRange?.trim() || '—'}</span>,
            },
            {
                id: 'preferredUnitType',
                header: 'Preferred Unit Type',
                sortable: true,
                sortValue: (row) => row.preferredUnitType,
                minWidth: 120,
                render: (row) => <span className="text-slate-700">{row.preferredUnitType}</span>,
            },
            {
                id: 'status',
                header: 'Lead Status',
                sortable: true,
                sortValue: (row) => row.status,
                minWidth: 100,
                render: (row) => <LeadStatusBadge status={row.status} />,
            },
            {
                id: 'assignedTo',
                header: 'Assigned to',
                sortable: true,
                sortValue: (row) => (row.assignedTo || '').toLowerCase(),
                minWidth: 120,
                render: (row) => <span className="text-slate-700">{row.assignedTo || '—'}</span>,
            },
            {
                id: 'createdDate',
                header: 'Created',
                sortable: true,
                sortValue: (row) => row.createdDate,
                minWidth: 110,
                render: (row) => (
                    <span className="tabular-nums text-slate-600">{formatYmdDisplay(row.createdDate)}</span>
                ),
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                minWidth: 100,
                headerClassName: 'w-[128px]',
                cellClassName: 'text-right',
                render: (row) => (
                    <LeadRowActionsMenu
                        lead={row}
                        assignees={assigneeOptions.length ? assigneeOptions : ['Unassigned']}
                        onAssign={handleAssign}
                        onChangeStatus={handleStatus}
                        onDelete={handleDeleteOne}
                    />
                ),
            },
        ],
        [assigneeOptions],
    );

    const openBulkAssign = () => {
        setBulkAssignPick(assigneeOptions[0] ?? '');
        setBulkAssignOpen(true);
    };

    const confirmBulkAssign = () => {
        const t = bulkAssignPick.trim();
        if (!t || !selectedIds.size) return;
        bulkAssignLeads([...selectedIds], t);
        setBulkAssignOpen(false);
        bump();
    };

    const openBulkStatus = () => {
        setBulkStatusPick('Qualified');
        setBulkStatusOpen(true);
    };

    const confirmBulkStatus = () => {
        if (!selectedIds.size) return;
        bulkSetLeadStatus([...selectedIds], bulkStatusPick);
        setBulkStatusOpen(false);
        bump();
    };

    const confirmBulkDelete = () => {
        if (!selectedIds.size) return;
        bulkDeleteLeads([...selectedIds]);
        setBulkDeleteOpen(false);
        bump();
    };

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb items={[{ label: 'Leads & Sales', href: '/leads' }]} />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leads</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Enterprise pipeline — search, filter, and act on records like a full CRM workspace.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link href="/leads/archived">
                        <Button variant="companyOutline" size="cta" className="gap-2">
                            <LuArchive size={18} />
                            Archived{archivedCount > 0 ? ` (${archivedCount})` : ''}
                        </Button>
                    </Link>
                    <Link href="/leads/intelligence">
                        <Button variant="company" size="cta" className="gap-2">
                            <LuSparkles size={18} />
                            Intelligence
                        </Button>
                    </Link>
                    <Link href="/leads/view/new">
                        <Button variant="company" size="cta" className={cn('gap-2', CTA_SHADOW_SOFT)}>
                            <LuPlus size={18} />
                            Create lead
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Toolbar */}
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:order-1">
                    <div className="relative min-w-[200px] flex-1 max-w-xl">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search name, email, phone, project…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setFilters((f) => ({ ...f, searchTerm: searchDraft }));
                                }
                            }}
                            className={cn(
                                'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                                CTA_INPUT_FOCUS,
                            )}
                            aria-label="Search leads"
                        />
                    </div>
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50/80 p-0.5">
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide',
                                viewMode === 'table'
                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                                    : 'text-slate-500 hover:text-slate-800',
                            )}
                            aria-pressed={viewMode === 'table'}
                        >
                            <LuTable2 size={16} />
                            Table
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('kanban')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide',
                                viewMode === 'kanban'
                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                                    : 'text-slate-500 hover:text-slate-800',
                            )}
                            aria-pressed={viewMode === 'kanban'}
                        >
                            <LuLayoutGrid size={16} />
                            Pipeline
                        </button>
                    </div>
                </div>

                <div className="order-1 flex flex-wrap items-center justify-end gap-2 sm:order-2">
                    <div className="relative " ref={columnMenuRef}>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="cta"
                            className="gap-2"
                            onClick={() => setColumnMenuOpen((o) => !o)}
                            aria-expanded={columnMenuOpen}
                        >
                            <LuColumns3 size={18} />
                            Columns
                        </Button>
                        {columnMenuOpen ? (
                            <div className="absolute right-0 top-[calc(100%+6px)] z-[300] w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                <p className="px-3 pb-2 text-[10px] leading-snug text-slate-500">
                                    Key columns on by default — enable more below.
                                </p>
                                {LEADS_TABLE_DATA_COLUMN_IDS.map((id) => {
                                    const label =
                                        id === 'assignedTo'
                                            ? 'Assigned to'
                                            : id === 'createdDate'
                                              ? 'Created date'
                                                : id === 'name'
                                                  ? 'Lead name'
                                                  : id === 'phone'
                                                    ? 'Phone number'
                                                  : id === 'source'
                                                    ? 'Lead source'
                                                  : id === 'project'
                                                    ? 'Project interest'
                                                  : id === 'budgetRange'
                                                    ? 'Budget range'
                                                  : id === 'preferredUnitType'
                                                    ? 'Preferred unit type'
                                                  : id === 'status'
                                                    ? 'Lead status'
                                                  : id.charAt(0).toUpperCase() + id.slice(1);
                                    return (
                                        <label
                                            key={id}
                                            className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                                        >
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
                                            {label}
                                        </label>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>

                    <Button
                        type="button"
                        variant={drawerOpen ? 'company' : 'companyOutline'}
                        size="cta"
                        className="gap-2"
                        onClick={() => setDrawerOpen(true)}
                    >
                        <LuFilter size={18} />
                        Filters
                        {hasActiveFilters ? (
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">On</span>
                        ) : null}
                    </Button>

                    <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setSaveModalOpen(true)}>
                        <LuBookmark size={18} />
                        Save view
                    </Button>

                    <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setImportOpen(true)}>
                        <LuUpload size={18} />
                        Import
                    </Button>

                    <div className="relative " ref={exportMenuRef}>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="cta"
                            className="gap-2"
                            onClick={() => setExportMenuOpen((o) => !o)}
                            aria-expanded={exportMenuOpen}
                        >
                            <LuDownload size={18} />
                            Export
                            <LuChevronDown size={16} className="opacity-70" />
                        </Button>
                        {exportMenuOpen ? (
                            <div className="absolute right-0 top-[calc(100%+6px)] z-[300] w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => runExportCsv(selectedIds.size ? 'leads-selected.csv' : 'leads-export.csv')}
                                >
                                    <LuDownload size={16} className="text-slate-400" />
                                    CSV
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={runExportExcel}
                                >
                                    <LuFileText size={16} className="text-slate-400" />
                                    Excel (UTF-8 CSV)
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={runExportPdf}
                                >
                                    <LuFileText size={16} className="text-slate-400" />
                                    PDF / Print
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Bulk bar */}
            {selectedIds.size > 0 ? (
                <div className={cn('mb-4 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between', CTA_BULK_BAR)}>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <LuCheck size={18} />
                        {selectedIds.size} selected
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={openBulkAssign}>
                            <LuUserPlus size={16} />
                            Bulk assign
                        </Button>
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={openBulkStatus}>
                            Status
                        </Button>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="gap-1.5 bg-white"
                            onClick={() => downloadLeadsCsv(selectedLeads, 'leads-selected.csv')}
                        >
                            <LuDownload size={16} />
                            Export
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

            {viewMode === 'kanban' ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <LeadsKanbanBoard leads={sortedFilteredLeads} onMoved={bump} />
                </div>
            ) : (
                <>
                    <DataTable<Lead>
                        columns={columns}
                        data={paginatedLeads}
                        getRowId={(row) => row.slug}
                        sort={sort}
                        onSortChange={setSort}
                        columnVisibility={columnVisibility}
                        columnWidths={columnWidths}
                        onColumnWidthsChange={setColumnWidths}
                        storageKey={TABLE_STORAGE_KEY}
                        stickyColumnId="name"
                        enableClientSort={false}
                        emptyMessage="No leads match your filters. Adjust search or filters, or create a new lead."
                        selection={{
                            rowKey: 'slug',
                            selectedIds,
                            onSelectedIdsChange: setSelectedIds,
                        }}
                    />

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={sortedFilteredLeads.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            label="leads"
                        />
                    </div>
                </>
            )}

            {/* Filter drawer */}
            {drawerOpen ? (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
                        aria-label="Close filters"
                        onClick={() => setDrawerOpen(false)}
                    />
                    <aside
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                        role="dialog"
                        aria-label="Advanced filters"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Advanced filters</h2>
                            <button
                                type="button"
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                onClick={() => setDrawerOpen(false)}
                            >
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.statusFilter}
                                    onChange={(e) =>
                                        setFilters((f) => ({ ...f, statusFilter: e.target.value as 'All' | LeadStatusType }))
                                    }
                                >
                                    <option value="All">All statuses</option>
                                    {statusOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.sourceFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, sourceFilter: e.target.value as 'All' | LeadSource }))}
                                >
                                    <option value="All">All sources</option>
                                    {sourceOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned to</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.assignedFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, assignedFilter: e.target.value }))}
                                >
                                    <option value="All">Everyone</option>
                                    {assigneeOptions.map((a) => (
                                        <option key={a} value={a}>
                                            {a}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.projectFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, projectFilter: e.target.value }))}
                                >
                                    <option value="All">All projects</option>
                                    {projectOptions.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget range</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.budgetFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, budgetFilter: e.target.value }))}
                                >
                                    <option value="All">All budgets</option>
                                    {budgetOptions.map((b) => (
                                        <option key={b} value={b}>
                                            {b}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created from</label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                                        className={`mt-1.5 ${selectClass}`}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created to</label>
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                                        className={`mt-1.5 ${selectClass}`}
                                    />
                                </div>
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
                <p className="text-sm text-slate-600 mb-3">
                    Save the current search and filter combination. Access it from this drawer or the Saved views icon in the top bar (all
                    admin pages).
                </p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn(
                        'mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm',
                        CTA_INPUT_FOCUS,
                    )}
                    placeholder="e.g. East site · Qualified"
                />
            </Modal>

            <Modal
                isOpen={!!deleteOneTarget}
                onClose={() => setDeleteOneTarget(null)}
                title="Archive lead"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setDeleteOneTarget(null)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmDeleteOne}>
                            Archive
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Archive <span className="font-semibold text-slate-900">{deleteOneTarget?.name}</span>? This removes the lead from your active list.
                </p>
            </Modal>

            <Modal
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                title="Archive selected leads"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmBulkDelete}>
                            Archive {selectedIds.size} lead(s)
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Archive {selectedIds.size} selected lead(s)? They will be removed from the active list.
                </p>
            </Modal>

            <Modal
                isOpen={bulkAssignOpen}
                onClose={() => setBulkAssignOpen(false)}
                title="Bulk assign"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkAssignOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={confirmBulkAssign} disabled={!bulkAssignPick.trim()}>
                            Assign
                        </Button>
                    </>
                }
            >
                <p className="mb-3 text-sm text-slate-600">Assign {selectedIds.size} lead(s) to a sales rep.</p>
                <label className="text-xs font-bold uppercase text-slate-400">Assignee</label>
                <input
                    className={`mt-1.5 ${selectClass}`}
                    list="leads-bulk-assignees"
                    value={bulkAssignPick}
                    onChange={(e) => setBulkAssignPick(e.target.value)}
                    placeholder="Type or pick from suggestions"
                />
                <datalist id="leads-bulk-assignees">
                    {(assigneeOptions.length ? assigneeOptions : ['Sales Team']).map((a) => (
                        <option key={a} value={a} />
                    ))}
                </datalist>
            </Modal>

            <Modal
                isOpen={bulkStatusOpen}
                onClose={() => setBulkStatusOpen(false)}
                title="Bulk status"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkStatusOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={confirmBulkStatus}>
                            Update status
                        </Button>
                    </>
                }
            >
                <p className="mb-3 text-sm text-slate-600">Set CRM status for {selectedIds.size} selected lead(s).</p>
                <label className="text-xs font-bold uppercase text-slate-400">Status</label>
                <select
                    className={`mt-1.5 ${selectClass}`}
                    value={bulkStatusPick}
                    onChange={(e) => setBulkStatusPick(e.target.value as LeadStatusType)}
                >
                    <option value="New">New</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Lost">Lost</option>
                </select>
            </Modal>

            <ImportLeadsModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={bump} />
        </CompanyAdminDashboardLayout>
    );
}
