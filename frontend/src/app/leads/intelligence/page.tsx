'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
    LuBookmark,
    LuCheck,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuSearch,
    LuSparkles,
    LuTrash2,
    LuX,
} from 'react-icons/lu';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableSortState } from '@/components/data-table/types';
import { FiltersBar } from '@/components/leads-intelligence/FiltersBar';
import { ExecutiveAttentionRequired } from '@/components/leads-intelligence/ExecutiveAttentionRequired';
import { PriorityActionsCenter } from '@/components/leads-intelligence/PriorityActionsCenter';
import { RevenueCommandCenter } from '@/components/leads-intelligence/RevenueCommandCenter';
import { TeamPerformanceStrip } from '@/components/leads-intelligence/TeamPerformanceStrip';
import { useLeadsIntelDashboard } from '@/hooks/useLeadsIntelDashboard';
import {
    buildLeadsIntelligenceColumns,
    LEADS_INTEL_COLUMN_MENU,
    LEADS_INTEL_DEFAULT_ON,
} from '@/components/leads-intelligence/LeadsIntelligenceTable';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { downloadLeadsIntelligenceCsv } from '@/lib/exportLeadsIntelligenceCsv';
import { getRecommendedActionLabel } from '@/lib/leadsIntelligenceHelpers';
import { dateRangeForLeadsIntelPreset, type LeadsIntelDatePreset } from '@/lib/leadsIntelligenceDecisionHelpers';
import {
    bulkDeleteIntelligenceLeads,
    deleteIntelligenceLead,
    getIntelligenceLeads,
    type IntelligenceLead,
    type LeadSource,
    type LeadStatus,
} from '@/lib/leadsIntelligenceStore';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_INPUT_FOCUS,
} from '@/lib/theme/ctaThemeClasses';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-leads-intelligence-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-leads-intelligence-saved-views';

type LeadsIntelFilterPayload = {
    searchTerm: string;
    statusFilter: 'All' | LeadStatus;
    sourceFilter: 'All' | LeadSource;
    dateFrom: string;
    dateTo: string;
    datePreset: LeadsIntelDatePreset;
    projectFilter: string;
    assignedFilter: string;
};

type SavedLeadsIntelView = { id: string; name: string; payload: LeadsIntelFilterPayload };

function defaultLeadsIntelFilters(): LeadsIntelFilterPayload {
    return {
        searchTerm: '',
        statusFilter: 'All',
        sourceFilter: 'All',
        dateFrom: '',
        dateTo: '',
        datePreset: 'all',
        projectFilter: 'All',
        assignedFilter: 'All',
    };
}

function sortLeadsIntelligenceList(rows: IntelligenceLead[], sort: DataTableSortState): IntelligenceLead[] {
    const col = sort.columnId;
    if (!col || col === 'quick_actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'name':
                va = a.name.toLowerCase();
                vb = b.name.toLowerCase();
                break;
            case 'phone':
                va = a.phone.replace(/\D/g, '');
                vb = b.phone.replace(/\D/g, '');
                break;
            case 'email':
                va = a.email.toLowerCase();
                vb = b.email.toLowerCase();
                break;
            case 'source':
                va = a.source;
                vb = b.source;
                break;
            case 'lead_score':
                va = a.leadScore;
                vb = b.leadScore;
                break;
            case 'status':
                va = a.status;
                vb = b.status;
                break;
            case 'assigned':
                va = a.assignedTo.toLowerCase();
                vb = b.assignedTo.toLowerCase();
                break;
            case 'conversion':
                va = a.conversionProbability;
                vb = b.conversionProbability;
                break;
            case 'risk':
                va = a.followUpRisk;
                vb = b.followUpRisk;
                break;
            case 'created':
                va = a.createdAt;
                vb = b.createdAt;
                break;
            case 'next_action':
                va = getRecommendedActionLabel(a).toLowerCase();
                vb = getRecommendedActionLabel(b).toLowerCase();
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export default function LeadsIntelligenceDashboardPage() {
    const pathname = usePathname() ?? '/leads/intelligence';
    const globalViewsTick = useGlobalSavedViewsSync();
    const [allLeads, setAllLeads] = useState<IntelligenceLead[]>([]);

    const [filters, setFilters] = useState<LeadsIntelFilterPayload>(() => defaultLeadsIntelFilters());
    const [searchDraft, setSearchDraft] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'conversion', direction: 'desc' });
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const ids = [...LEADS_INTEL_COLUMN_MENU.map((c) => c.id)];
        return Object.fromEntries(ids.map((id) => [id, LEADS_INTEL_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        name: 180,
        phone: 120,
        email: 200,
        source: 110,
        lead_score: 100,
        status: 120,
        assigned: 130,
        risk: 100,
        created: 110,
        next_action: 160,
        quick_actions: 176,
    });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    useEffect(() => {
        setAllLeads(getIntelligenceLeads());
    }, []);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Leads intelligence', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedLeadsIntelView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as LeadsIntelFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const base = defaultLeadsIntelFilters();
        const merged = { ...base, ...(f as LeadsIntelFilterPayload) };
        const datePreset =
            merged.datePreset ??
            (merged.dateFrom || merged.dateTo ? ('custom' as LeadsIntelDatePreset) : base.datePreset);
        setFilters({
            ...merged,
            projectFilter: merged.projectFilter ?? base.projectFilter,
            assignedFilter: merged.assignedFilter ?? base.assignedFilter,
            datePreset,
        });
        setSearchDraft((f as LeadsIntelFilterPayload).searchTerm ?? '');
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((f) => (f.searchTerm === searchDraft ? f : { ...f, searchTerm: searchDraft }));
        }, 320);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    useEffect(() => {
        if (!columnMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) setColumnMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [columnMenuOpen]);

    useEffect(() => {
        if (!exportMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setExportMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [exportMenuOpen]);

    const filtered = useMemo(() => {
        const term = filters.searchTerm.trim().toLowerCase();
        return allLeads.filter((lead) => {
            const matchesSearch =
                !term ||
                lead.name.toLowerCase().includes(term) ||
                lead.email.toLowerCase().includes(term) ||
                lead.phone.toLowerCase().includes(term) ||
                lead.assignedTo.toLowerCase().includes(term) ||
                lead.projectInterest.toLowerCase().includes(term);
            const matchesStatus = filters.statusFilter === 'All' ? true : lead.status === filters.statusFilter;
            const matchesSource = filters.sourceFilter === 'All' ? true : lead.source === filters.sourceFilter;
            const matchesProject = filters.projectFilter === 'All' ? true : lead.projectInterest === filters.projectFilter;
            const matchesAssigned = filters.assignedFilter === 'All' ? true : lead.assignedTo === filters.assignedFilter;
            const matchesStart = !filters.dateFrom || lead.createdAt >= filters.dateFrom;
            const matchesEnd = !filters.dateTo || lead.createdAt <= filters.dateTo;
            return matchesSearch && matchesStatus && matchesSource && matchesProject && matchesAssigned && matchesStart && matchesEnd;
        });
    }, [allLeads, filters]);

    const projectOptions = useMemo(() => {
        const s = new Set<string>();
        for (const l of allLeads) {
            if (l.projectInterest && l.projectInterest !== '—') s.add(l.projectInterest);
        }
        return [...s].sort((a, b) => a.localeCompare(b));
    }, [allLeads]);

    const assigneeOptions = useMemo(() => {
        const s = new Set<string>();
        for (const l of allLeads) {
            if (l.assignedTo.trim()) s.add(l.assignedTo.trim());
        }
        return [...s].sort((a, b) => a.localeCompare(b));
    }, [allLeads]);

    const hasActiveFilters =
        filters.searchTerm.trim() !== '' ||
        filters.statusFilter !== 'All' ||
        filters.sourceFilter !== 'All' ||
        filters.projectFilter !== 'All' ||
        filters.assignedFilter !== 'All' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== '';

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sort]);

    const sortedFiltered = useMemo(() => sortLeadsIntelligenceList(filtered, sort), [filtered, sort]);
    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => sortedFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFiltered, currentPage],
    );

    const dashboard = useLeadsIntelDashboard(filtered);

    const persistSavedViews = (views: SavedLeadsIntelView[]) => {
        replaceViewsForRoute(
            pathname,
            'Leads intelligence',
            views.map((v) => ({ id: v.id, name: v.name, payload: v.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        persistSavedViews([...savedViews, { id: `v-${Date.now()}`, name, payload: { ...filters } }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const applySavedView = (sv: SavedLeadsIntelView) => {
        const base = defaultLeadsIntelFilters();
        const merged = { ...base, ...sv.payload };
        const datePreset =
            merged.datePreset ??
            (merged.dateFrom || merged.dateTo ? ('custom' as LeadsIntelDatePreset) : base.datePreset);
        setFilters({
            ...merged,
            projectFilter: merged.projectFilter ?? base.projectFilter,
            assignedFilter: merged.assignedFilter ?? base.assignedFilter,
            datePreset,
        });
        setSearchDraft(sv.payload.searchTerm ?? '');
        setDrawerOpen(false);
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((v) => v.id !== id));
    };

    const resetFilters = () => {
        setFilters(defaultLeadsIntelFilters());
        setSearchDraft('');
        setCurrentPage(1);
    };

    const bumpStore = useCallback(() => {
        setAllLeads(getIntelligenceLeads());
        setSelectedIds(new Set());
    }, []);

    const removeLead = useCallback((lead: IntelligenceLead) => {
        if (typeof window !== 'undefined' && !window.confirm(`Delete lead “${lead.name}”?`)) return;
        deleteIntelligenceLead(lead.id);
        bumpStore();
    }, [bumpStore]);

    const selectedRows = useMemo(
        () => sortedFiltered.filter((l) => selectedIds.has(l.id)),
        [sortedFiltered, selectedIds],
    );

    const exportRowsForScope = () => (selectedIds.size ? selectedRows : sortedFiltered);

    const runExportCsv = (filename: string) => {
        downloadLeadsIntelligenceCsv(exportRowsForScope(), filename);
        setExportMenuOpen(false);
    };

    const runExportExcelCsv = () => {
        downloadLeadsIntelligenceCsv(exportRowsForScope(), 'leads-intelligence-excel.csv');
        setExportMenuOpen(false);
    };

    const bulkExportCsv = () => {
        downloadLeadsIntelligenceCsv(
            exportRowsForScope(),
            selectedIds.size ? 'leads-intelligence-selected.csv' : 'leads-intelligence-export.csv',
        );
    };

    const confirmBulkDelete = () => {
        if (!selectedIds.size) return;
        bulkDeleteIntelligenceLeads([...selectedIds]);
        setBulkDeleteOpen(false);
        bumpStore();
    };

    const selectClass = cn(
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800',
        CTA_INPUT_FOCUS,
    );

    const onDatePresetChange = useCallback((preset: Exclude<LeadsIntelDatePreset, 'custom'>) => {
        setFilters((f) => {
            if (preset === 'all') {
                return { ...f, datePreset: 'all', dateFrom: '', dateTo: '' };
            }
            const { dateFrom, dateTo } = dateRangeForLeadsIntelPreset(preset);
            return { ...f, datePreset: preset, dateFrom, dateTo };
        });
    }, []);

    const columns = useMemo(
        () =>
            buildLeadsIntelligenceColumns({
                removeLead,
                onQuickCall: (row) => {
                    const d = row.phone.replace(/\D/g, '');
                    if (typeof document === 'undefined' || !d) return;
                    const a = document.createElement('a');
                    a.href = `tel:${d}`;
                    a.click();
                },
                onQuickScheduleVisit: (row) => {
                    if (typeof window !== 'undefined') window.alert(`Schedule site visit: ${row.name}`);
                },
                onQuickAssign: (row) => {
                    if (typeof window !== 'undefined') window.alert(`Assign lead: ${row.name}`);
                },
            }),
        [removeLead],
    );

    return (
        <CompanyAdminDashboardLayout>
            <div className="space-y-4 pb-8">
                <Breadcrumb
                    items={[
                        { label: 'Leads', href: '/leads' },
                        { label: 'Leads Intelligence', href: '/leads/intelligence' },
                    ]}
                />

                <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Leads Intelligence</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            <LuSparkles size={12} aria-hidden />
                            Revenue & execution
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        Management command center — where revenue is, what is leaking, and what needs action today.
                    </p>
                </div>

                <FiltersBar
                    datePreset={filters.datePreset}
                    onDatePresetChange={onDatePresetChange}
                    projectFilter={filters.projectFilter}
                    projectOptions={projectOptions}
                    onProjectChange={(value) => setFilters((f) => ({ ...f, projectFilter: value }))}
                    sourceFilter={filters.sourceFilter}
                    onSourceChange={(value) => setFilters((f) => ({ ...f, sourceFilter: value }))}
                    assignedFilter={filters.assignedFilter}
                    assigneeOptions={assigneeOptions}
                    onAssignedChange={(value) => setFilters((f) => ({ ...f, assignedFilter: value }))}
                />

                {filtered.length > 0 ? (
                    <div className="space-y-4">
                        <RevenueCommandCenter
                            kpis={dashboard.kpis}
                            leadCount={dashboard.leadCount}
                            summary={dashboard.summary}
                            hotClosures={dashboard.hotClosures}
                            siteVisitStats={dashboard.siteVisitStats}
                        />
                        <PriorityActionsCenter rows={dashboard.priorityActions} />
                        {dashboard.alerts.length > 0 ? (
                            <ExecutiveAttentionRequired alerts={dashboard.alerts} />
                        ) : null}
                        <TeamPerformanceStrip reps={dashboard.team} />
                    </div>
                ) : (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        No leads match filters. Adjust filters or add leads to see command metrics.
                    </p>
                )}
                <div className="space-y-3">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Lead pipeline</h2>
                        <p className="text-xs text-slate-500">Execution view — status, risk, next action, and quick actions per lead.</p>
                    </div>
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                        <div className="relative max-w-xl flex-1">
                            <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Search name, email, phone, project, assigned…"
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
                                aria-label="Search leads intelligence"
                            />
                        </div>
                    </div>

                    <div className="order-1 flex flex-wrap items-center justify-end gap-2 sm:order-2">
                        <div className="relative" ref={columnMenuRef}>
                            <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setColumnMenuOpen((o) => !o)}>
                                <LuColumns3 size={18} />
                                Columns
                            </Button>
                            {columnMenuOpen ? (
                                <div className="absolute right-0 top-[calc(100%+6px)] z-50 max-h-[min(70vh,420px)] w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                    <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                    {LEADS_INTEL_COLUMN_MENU.map(({ id, label }) => (
                                        <label key={id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50">
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
                                    ))}
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
                            {hasActiveFilters ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">On</span> : null}
                        </Button>

                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setSaveModalOpen(true)}>
                            <LuBookmark size={18} />
                            Save view
                        </Button>

                        <div className="relative" ref={exportMenuRef}>
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
                                <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                        onClick={() =>
                                            runExportCsv(selectedIds.size ? 'leads-intelligence-selected.csv' : 'leads-intelligence-export.csv')
                                        }
                                    >
                                        <LuDownload size={16} className="text-slate-400" />
                                        CSV
                                    </button>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                        onClick={runExportExcelCsv}
                                    >
                                        <LuFileText size={16} className="text-slate-400" />
                                        Excel (UTF-8 CSV)
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {hasActiveFilters && allLeads.length > 0 ? (
                    <p className="text-xs font-medium text-slate-500">
                        Showing {filtered.length} of {allLeads.length} lead{allLeads.length === 1 ? '' : 's'}
                    </p>
                ) : null}

               

                {selectedIds.size > 0 ? (
                    <div className={cn('flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between', CTA_BULK_BAR)}>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <LuCheck size={18} />
                            {selectedIds.size} selected
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={bulkExportCsv}>
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

                <DataTable<IntelligenceLead>
                    columns={columns}
                    data={paginated}
                    getRowId={(row) => row.id}
                    sort={sort}
                    onSortChange={setSort}
                    columnVisibility={columnVisibility}
                    columnWidths={columnWidths}
                    onColumnWidthsChange={setColumnWidths}
                    storageKey={TABLE_STORAGE_KEY}
                    stickyColumnId="name"
                    enableClientSort={false}
                    selection={{ rowKey: 'id', selectedIds, onSelectedIdsChange: setSelectedIds }}
                    emptyMessage={
                        allLeads.length === 0 ? 'No leads in intelligence store.' : 'No leads match your filters. Adjust filters or reset.'
                    }
                />

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={sortedFiltered.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        label="leads"
                    />
                </div>
                </div>
            </div>

            {drawerOpen ? (
                <>
                    <button type="button" className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" aria-label="Close" onClick={() => setDrawerOpen(false)} />
                    <aside
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                        role="dialog"
                        aria-label="Filters"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Filters</h2>
                            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setDrawerOpen(false)}>
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.statusFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, statusFilter: e.target.value as 'All' | LeadStatus }))}
                                >
                                    <option value="All">All statuses</option>
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Converted">Converted</option>
                                    <option value="Lost">Lost</option>
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
                                    <option value="Website">Website</option>
                                    <option value="Referral">Referral</option>
                                    <option value="Campaign">Campaign</option>
                                    <option value="Ads">Ads</option>
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
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned salesperson</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.assignedFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, assignedFilter: e.target.value }))}
                                >
                                    <option value="All">All</option>
                                    {assigneeOptions.map((a) => (
                                        <option key={a} value={a}>
                                            {a}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created date range</span>
                                <div className="mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="li-from" className="sr-only">
                                            From
                                        </label>
                                        <input
                                            id="li-from"
                                            type="date"
                                            value={filters.dateFrom}
                                            onChange={(e) =>
                                                setFilters((f) => {
                                                    const dateFrom = e.target.value;
                                                    const empty = !dateFrom && !f.dateTo;
                                                    return { ...f, dateFrom, datePreset: empty ? 'all' : 'custom' };
                                                })
                                            }
                                            className={cn(selectClass, 'px-3')}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="li-to" className="sr-only">
                                            To
                                        </label>
                                        <input
                                            id="li-to"
                                            type="date"
                                            value={filters.dateTo}
                                            onChange={(e) =>
                                                setFilters((f) => {
                                                    const dateTo = e.target.value;
                                                    const empty = !f.dateFrom && !dateTo;
                                                    return { ...f, dateTo, datePreset: empty ? 'all' : 'custom' };
                                                })
                                            }
                                            className={cn(selectClass, 'px-3')}
                                        />
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Leave blank to ignore start or end. Both narrow the created date.</p>
                            </div>
                            {savedViews.length > 0 ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                    <p className="text-xs font-semibold uppercase text-slate-500">Saved views</p>
                                    <ul className="mt-2 space-y-1">
                                        {savedViews.map((sv) => (
                                            <li key={sv.id} className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-[var(--cta-button-bg)] hover:bg-white"
                                                    onClick={() => applySavedView(sv)}
                                                >
                                                    {sv.name}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600"
                                                    aria-label={`Delete saved view ${sv.name}`}
                                                    onClick={() => deleteSavedView(sv.id)}
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
                                Reset all
                            </Button>
                            <Button type="button" variant="company" size="cta" className="flex-1" onClick={() => setDrawerOpen(false)}>
                                Done
                            </Button>
                        </div>
                    </aside>
                </>
            ) : null}

            <Modal
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                title="Delete selected leads"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmBulkDelete}>
                            Delete {selectedIds.size} lead{selectedIds.size === 1 ? '' : 's'}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Permanently remove {selectedIds.size} selected lead{selectedIds.size === 1 ? '' : 's'} from intelligence? This cannot be undone in the
                    mock store.
                </p>
            </Modal>

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
                <p className="mb-3 text-sm text-slate-600">Save the current filters and search for quick access from the drawer.</p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn(
                        'mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm',
                        CTA_INPUT_FOCUS,
                    )}
                    placeholder="e.g. Hot · Website"
                />
            </Modal>

        </CompanyAdminDashboardLayout>
    );
}
