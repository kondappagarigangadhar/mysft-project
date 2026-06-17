'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
    LuBookmark,
    LuColumns3,
    LuDownload,
    LuFilter,
    LuIndianRupee,
    LuSearch,
    LuTrash2,
    LuX,
} from 'react-icons/lu';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableSortState } from '@/components/data-table/types';
import {
    AiSalesConversionPredictionCenter,
    AiSalesScoringBreakdown,
} from '@/components/ai-sales-intelligence/AiSalesIntelSections';
import { FiltersBar } from '@/components/leads-intelligence/FiltersBar';
import {
    AIRecommendationsSection,
    LeadFunnelIntelligenceSection,
    NextBestActionQueueSection,
    OpportunityPrioritizationSection,
    RevenueAiSummarySection,
    RevenueLeakageMonitorSection,
    RevenueRiskCenterSection,
    SalespersonIntelligenceSection,
} from '@/components/revenue-intelligence/RevenueIntelligenceSections';
import {
    buildRevenueIntelligenceColumns,
    REVENUE_INTEL_COLUMN_MENU,
    REVENUE_INTEL_DEFAULT_ON,
} from '@/components/revenue-intelligence/RevenueIntelligenceTable';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useRevenueIntelligenceDashboard } from '@/hooks/useRevenueIntelligenceDashboard';
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
import { CTA_BULK_BAR, CTA_CHECKBOX_SM, CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';
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
const TABLE_STORAGE_KEY = 'arris-revenue-intelligence-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-revenue-intelligence-saved-views';

type FilterPayload = {
    searchTerm: string;
    statusFilter: 'All' | LeadStatus;
    sourceFilter: 'All' | LeadSource;
    dateFrom: string;
    dateTo: string;
    datePreset: LeadsIntelDatePreset;
    projectFilter: string;
    assignedFilter: string;
};

type SavedView = { id: string; name: string; payload: FilterPayload };

function defaultFilters(): FilterPayload {
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

function sortLeads(rows: IntelligenceLead[], sort: DataTableSortState): IntelligenceLead[] {
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
            case 'lead_score':
                va = a.leadScore;
                vb = b.leadScore;
                break;
            case 'conversion':
                va = a.conversionProbability;
                vb = b.conversionProbability;
                break;
            case 'revenue_potential':
                va = a.leadScore * a.conversionProbability;
                vb = b.leadScore * b.conversionProbability;
                break;
            case 'status':
                va = a.status;
                vb = b.status;
                break;
            case 'assigned':
                va = a.assignedTo.toLowerCase();
                vb = b.assignedTo.toLowerCase();
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

export default function RevenueIntelligenceCenterPage() {
    const pathname = usePathname() ?? '/leads/revenue-intelligence';
    const globalViewsTick = useGlobalSavedViewsSync();
    const [allLeads, setAllLeads] = useState<IntelligenceLead[]>([]);
    const [filters, setFilters] = useState<FilterPayload>(() => defaultFilters());
    const [searchDraft, setSearchDraft] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'conversion', direction: 'desc' });
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(REVENUE_INTEL_COLUMN_MENU.map((c) => [c.id, REVENUE_INTEL_DEFAULT_ON.has(c.id)])),
    );
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        name: 180,
        lead_score: 100,
        conversion: 110,
        revenue_potential: 120,
        temperature: 100,
        next_action: 160,
        quick_actions: 176,
    });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [conversionSelectedSlug, setConversionSelectedSlug] = useState<string | null>(null);

    useEffect(() => {
        setAllLeads(getIntelligenceLeads());
    }, []);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Revenue Intelligence', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as FilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const base = defaultFilters();
        const merged = { ...base, ...(f as FilterPayload) };
        setFilters({ ...merged, projectFilter: merged.projectFilter ?? base.projectFilter, assignedFilter: merged.assignedFilter ?? base.assignedFilter });
        setSearchDraft((f as FilterPayload).searchTerm ?? '');
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

    useEffect(() => setCurrentPage(1), [filters, sort]);

    const sortedFiltered = useMemo(() => sortLeads(filtered, sort), [filtered, sort]);
    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => sortedFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFiltered, currentPage],
    );

    const dashboard = useRevenueIntelligenceDashboard(filtered);

    const selectedConversionLead = useMemo(
        () => dashboard.conversionPrediction.find((l) => l.leadSlug === conversionSelectedSlug) ?? null,
        [dashboard.conversionPrediction, conversionSelectedSlug],
    );

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Revenue Intelligence',
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

    const applySavedView = (sv: SavedView) => {
        const base = defaultFilters();
        const merged = { ...base, ...sv.payload };
        setFilters({ ...merged, projectFilter: merged.projectFilter ?? base.projectFilter, assignedFilter: merged.assignedFilter ?? base.assignedFilter });
        setSearchDraft(sv.payload.searchTerm ?? '');
        setDrawerOpen(false);
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((v) => v.id !== id));
    };

    const resetFilters = () => {
        setFilters(defaultFilters());
        setSearchDraft('');
        setCurrentPage(1);
    };

    const bumpStore = useCallback(() => {
        setAllLeads(getIntelligenceLeads());
        setSelectedIds(new Set());
    }, []);

    const removeLead = useCallback(
        (lead: IntelligenceLead) => {
            if (typeof window !== 'undefined' && !window.confirm(`Delete lead "${lead.name}"?`)) return;
            deleteIntelligenceLead(lead.id);
            bumpStore();
        },
        [bumpStore],
    );

    const selectedRows = useMemo(() => sortedFiltered.filter((l) => selectedIds.has(l.id)), [sortedFiltered, selectedIds]);

    const runExportCsv = (filename: string) => {
        downloadLeadsIntelligenceCsv(selectedIds.size ? selectedRows : sortedFiltered, filename);
        setExportMenuOpen(false);
    };

    const confirmBulkDelete = () => {
        if (!selectedIds.size) return;
        bulkDeleteIntelligenceLeads([...selectedIds]);
        setBulkDeleteOpen(false);
        bumpStore();
    };

    const onDatePresetChange = useCallback((preset: Exclude<LeadsIntelDatePreset, 'custom'>) => {
        setFilters((f) => {
            if (preset === 'all') return { ...f, datePreset: 'all', dateFrom: '', dateTo: '' };
            const { dateFrom, dateTo } = dateRangeForLeadsIntelPreset(preset);
            return { ...f, datePreset: preset, dateFrom, dateTo };
        });
    }, []);

    const columns = useMemo(
        () =>
            buildRevenueIntelligenceColumns({
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

    const selectClass = cn('h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800', CTA_INPUT_FOCUS);

    return (
        <CompanyAdminDashboardLayout>
            <div className="space-y-3 pb-6">
                <Breadcrumb
                    items={[
                        { label: 'Leads', href: '/leads' },
                        { label: 'Revenue Intelligence Center' },
                    ]}
                />

                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Revenue Intelligence Center</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            <LuIndianRupee size={12} aria-hidden />
                            Executive AI
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        Revenue, risk, prioritization, and daily actions — one executive view for sales managers.
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

                <RevenueAiSummarySection summary={dashboard.summary} empty={filtered.length === 0} />

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                        <AiSalesConversionPredictionCenter
                            leads={dashboard.conversionPrediction}
                            selectedSlug={conversionSelectedSlug}
                            onSelectLead={setConversionSelectedSlug}
                            onOpenInsights={(lead) => setConversionSelectedSlug(lead.leadSlug)}
                            maxRows={5}
                            compact
                        />
                    </div>
                    <AiSalesScoringBreakdown lead={selectedConversionLead} />
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    <RevenueRiskCenterSection rows={dashboard.riskRows} />
                    <NextBestActionQueueSection rows={dashboard.actionQueue} />
                </div>

                <OpportunityPrioritizationSection rows={dashboard.opportunities} />

                <SalespersonIntelligenceSection cards={dashboard.salespeople} />

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    <LeadFunnelIntelligenceSection steps={dashboard.funnel} bottleneck={dashboard.funnelBottleneck} />
                    <RevenueLeakageMonitorSection buckets={dashboard.leakage} />
                </div>

                <AIRecommendationsSection rows={dashboard.recommendations} />

                {/* Section 9 — Lead pipeline table */}
                <div className="space-y-2 pt-1">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Lead Intelligence Table</h2>
                        <p className="text-xs text-slate-500">Pipeline with score, conversion, temperature, revenue potential, and next best action.</p>
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative max-w-xl flex-1">
                            <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Search name, email, phone, project, assigned…"
                                value={searchDraft}
                                onChange={(e) => setSearchDraft(e.target.value)}
                                className={cn(
                                    'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                                    CTA_INPUT_FOCUS,
                                )}
                                aria-label="Search leads"
                            />
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <div className="relative" ref={columnMenuRef}>
                                <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setColumnMenuOpen((o) => !o)}>
                                    <LuColumns3 size={18} />
                                    Columns
                                </Button>
                                {columnMenuOpen ? (
                                    <div className="absolute right-0 top-[calc(100%+6px)] z-50 max-h-[min(70vh,420px)] w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                                        {REVENUE_INTEL_COLUMN_MENU.map((col) => (
                                            <label key={col.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50">
                                                <input
                                                    type="checkbox"
                                                    checked={columnVisibility[col.id] !== false}
                                                    onChange={() =>
                                                        setColumnVisibility((v) => ({ ...v, [col.id]: !(v[col.id] !== false) }))
                                                    }
                                                    className={CTA_CHECKBOX_SM}
                                                />
                                                {col.label}
                                            </label>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setDrawerOpen(true)}>
                                <LuFilter size={18} />
                                Filters
                                {hasActiveFilters ? <span className="h-2 w-2 rounded-full bg-[var(--cta-button-bg)]" /> : null}
                            </Button>
                            <div className="relative" ref={exportMenuRef}>
                                <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setExportMenuOpen((o) => !o)}>
                                    <LuDownload size={18} />
                                    Export
                                </Button>
                                {exportMenuOpen ? (
                                    <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => runExportCsv('revenue-intelligence.csv')}>
                                            CSV
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {selectedIds.size > 0 ? (
                        <div className={cn('flex flex-wrap items-center gap-2 rounded-xl px-3 py-2', CTA_BULK_BAR)}>
                            <span className="text-sm font-semibold text-slate-800">{selectedIds.size} selected</span>
                            <Button type="button" variant="companyOutline" size="sm" onClick={() => runExportCsv('revenue-intelligence-selected.csv')}>
                                Export
                            </Button>
                            <Button type="button" variant="companyOutline" size="sm" className="border-rose-200 text-rose-700" onClick={() => setBulkDeleteOpen(true)}>
                                <LuTrash2 size={16} className="mr-1" />
                                Delete
                            </Button>
                            <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelectedIds(new Set())}>
                                Clear
                            </Button>
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

                    {sortedFiltered.length > ITEMS_PER_PAGE ? (
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    ) : null}
                </div>
            </div>

            {/* Filters drawer */}
            {drawerOpen ? (
                <>
                    <button type="button" className="fixed inset-0 z-40 bg-slate-900/30" aria-label="Close filters" onClick={() => setDrawerOpen(false)} />
                    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <h2 className="font-bold text-slate-900">Filters</h2>
                            <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto p-4">
                            <label className="block text-xs font-semibold uppercase text-slate-500">
                                Status
                                <select className={cn(selectClass, 'mt-1')} value={filters.statusFilter} onChange={(e) => setFilters((f) => ({ ...f, statusFilter: e.target.value as FilterPayload['statusFilter'] }))}>
                                    <option value="All">All</option>
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Converted">Converted</option>
                                    <option value="Lost">Lost</option>
                                </select>
                            </label>
                            <label className="block text-xs font-semibold uppercase text-slate-500">
                                Source
                                <select className={cn(selectClass, 'mt-1')} value={filters.sourceFilter} onChange={(e) => setFilters((f) => ({ ...f, sourceFilter: e.target.value as FilterPayload['sourceFilter'] }))}>
                                    <option value="All">All</option>
                                    <option value="Website">Website</option>
                                    <option value="Referral">Referral</option>
                                    <option value="Walk-in">Walk-in</option>
                                    <option value="Campaign">Campaign</option>
                                    <option value="Broker">Broker</option>
                                </select>
                            </label>
                            <label className="block text-xs font-semibold uppercase text-slate-500">
                                Created from
                                <input type="date" className={cn(selectClass, 'mt-1')} value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value, datePreset: 'custom' }))} />
                            </label>
                            <label className="block text-xs font-semibold uppercase text-slate-500">
                                Created to
                                <input type="date" className={cn(selectClass, 'mt-1')} value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value, datePreset: 'custom' }))} />
                            </label>
                            {savedViews.length > 0 ? (
                                <div>
                                    <p className="text-xs font-semibold uppercase text-slate-500">Saved views</p>
                                    <ul className="mt-2 space-y-1">
                                        {savedViews.map((v) => (
                                            <li key={v.id} className="flex items-center gap-2">
                                                <button type="button" className="flex-1 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50" onClick={() => applySavedView(v)}>
                                                    {v.name}
                                                </button>
                                                <button type="button" className="rounded p-1 text-slate-400 hover:text-rose-600" onClick={() => deleteSavedView(v.id)} aria-label={`Delete ${v.name}`}>
                                                    <LuTrash2 size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
                            <Button type="button" variant="companyOutline" size="cta" onClick={resetFilters}>
                                Reset
                            </Button>
                            <Button type="button" variant="company" size="cta" className="gap-2" onClick={() => setSaveModalOpen(true)}>
                                <LuBookmark size={16} />
                                Save view
                            </Button>
                        </div>
                    </aside>
                </>
            ) : null}

            <Modal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="Save filter view" maxWidthClassName="max-w-md" footer={<><Button variant="companyOutline" size="cta" onClick={() => setSaveModalOpen(false)}>Cancel</Button><Button variant="company" size="cta" onClick={saveCurrentView}>Save</Button></>}>
                <input value={saveViewName} onChange={(e) => setSaveViewName(e.target.value)} placeholder="View name" className={selectClass} />
            </Modal>

            <Modal isOpen={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} title="Delete selected leads?" maxWidthClassName="max-w-md" footer={<><Button variant="companyOutline" size="cta" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button><Button variant="danger" size="cta" onClick={confirmBulkDelete}>Delete</Button></>}>
                <p className="text-sm text-slate-700">Delete {selectedIds.size} lead(s) from intelligence workspace?</p>
            </Modal>
        </CompanyAdminDashboardLayout>
    );
}
