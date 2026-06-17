'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ContractStatusBadge } from '@/components/vendors/VendorShared';
import { MOCK_VENDOR_CONTRACTS, MOCK_VENDORS } from '@/lib/vendors/mockData';
import type { ContractStatus, VendorContract } from '@/lib/vendors/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AddContractModal } from '@/components/vendors/shared/VendorCrudModals';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { cn } from '@/lib/utils';
import { appendModuleContract, getModuleContracts } from '@/lib/vendors/vendorModuleStore';
import {
    LuActivity,
    LuBookmark,
    LuCalendarClock,
    LuCheck,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuEllipsisVertical,
    LuEye,
    LuFileText,
    LuFileWarning,
    LuFilter,
    LuPencil,
    LuPlus,
    LuRefreshCw,
    LuRotateCw,
    LuSearch,
    LuTrash2,
    LuUpload,
    LuX,
} from 'react-icons/lu';

const TABLE_STORAGE_KEY = 'arris-vendor-contracts-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-vendor-contracts-saved-views';
const CONTRACT_TABLE_COLUMN_IDS = [
    'vendor',
    'contractName',
    'startDate',
    'endDate',
    'daysLeft',
    'value',
    'file',
    'status',
    'actions',
] as const;

type ContractsFilterPayload = {
    search: string;
    vendorFilter: string;
    statusFilter: 'all' | ContractStatus;
    dateFrom: string;
    dateTo: string;
    expiryFilter: 'all' | '7' | '15' | '30' | 'expired';
};

type SavedView = { id: string; name: string; payload: ContractsFilterPayload };

type ContractRow = VendorContract & {
    notes?: string;
    createdBy: string;
    updatedBy: string;
    updatedAt: string;
    renewalOf?: string;
    history: string[];
};

type ContractFormState = {
    vendorId: string;
    contractName: string;
    startDate: string;
    endDate: string;
    value: string;
    fileName: string;
    notes: string;
};

const EMPTY_FORM: ContractFormState = {
    vendorId: '',
    contractName: '',
    startDate: '',
    endDate: '',
    value: '',
    fileName: '',
    notes: '',
};

function fmtDate(d: string) {
    if (!d) return '—';
    const p = new Date(`${d}T12:00:00`);
    if (Number.isNaN(p.getTime())) return d;
    return p.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtMoney(v: unknown) {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return 'Rs. 0';
    return `Rs. ${n.toLocaleString()}`;
}

function daysLeft(endDate: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const e = new Date(`${endDate}T12:00:00`);
    if (Number.isNaN(e.getTime())) return null;
    return Math.ceil((e.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

function computedStatus(endDate: string): Exclude<ContractStatus, 'Draft'> {
    const left = daysLeft(endDate);
    if (left === null) return 'Active';
    if (left < 0) return 'Expired';
    if (left <= 30) return 'Ending Soon';
    return 'Active';
}

function buildInitialRows(): ContractRow[] {
    const mapped = MOCK_VENDOR_CONTRACTS.map((c, i) => ({
        ...c,
        status: i === 0 ? 'Draft' : c.status,
        notes: i === 0 ? 'Draft pending legal review.' : '',
        createdBy: i % 2 ? 'Admin' : 'Amit',
        updatedBy: i % 2 ? 'Legal Team' : 'Admin',
        updatedAt: `2026-04-${String(10 + i).padStart(2, '0')}`,
        history: [`Contract ${i % 2 ? 'updated' : 'created'} by ${i % 2 ? 'Legal Team' : 'Admin'}.`],
    }));
    const extras = getModuleContracts().map((c) => ({
        ...c,
        notes: '',
        createdBy: 'Admin',
        updatedBy: 'Admin',
        updatedAt: new Date().toISOString().slice(0, 10),
        history: ['Contract created.'],
    }));
    return [...extras, ...mapped];
}

export function VendorContractsCenterPage() {
    const pathname = usePathname() ?? '/company-admin/vendors/contracts';
    const searchParams = useSearchParams();
    const [rows, setRows] = useState<ContractRow[]>(() => buildInitialRows());
    const [activity, setActivity] = useState<string[]>([
        'Amit added Tower A Electrical Contract.',
        'Legal Team replaced civil-phase2.pdf.',
        'Plumbing Maintenance marked expired.',
    ]);

    const [search, setSearch] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [vendorFilter, setVendorFilter] = useState('all');
    useEffect(() => {
        const id = searchParams.get('vendor')?.trim();
        if (id && MOCK_VENDORS.some((v) => v.id === id)) setVendorFilter(id);
    }, [searchParams]);
    const [statusFilter, setStatusFilter] = useState<'all' | ContractStatus>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expiryFilter, setExpiryFilter] = useState<'all' | '7' | '15' | '30' | 'expired'>('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [importOpen, setImportOpen] = useState(false);
    const [importFilename, setImportFilename] = useState('');
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [savedViewsTick, setSavedViewsTick] = useState(0);
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        try {
            const raw = localStorage.getItem(TABLE_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Record<string, boolean>;
                return { ...Object.fromEntries(CONTRACT_TABLE_COLUMN_IDS.map((id) => [id, true])), ...parsed };
            }
        } catch {
            // ignore
        }
        return Object.fromEntries(CONTRACT_TABLE_COLUMN_IDS.map((id) => [id, true]));
    });

    const [mobileMenuId, setMobileMenuId] = useState<string | null>(null);
    const [actionMenuPos, setActionMenuPos] = useState<{ top: number; left: number } | null>(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editRow, setEditRow] = useState<ContractRow | null>(null);
    const [deleteRow, setDeleteRow] = useState<ContractRow | null>(null);
    const [renewRow, setRenewRow] = useState<ContractRow | null>(null);
    const [viewRow, setViewRow] = useState<ContractRow | null>(null);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const [form, setForm] = useState<ContractFormState>(EMPTY_FORM);
    const [renewForm, setRenewForm] = useState({ startDate: '', endDate: '', value: '', fileName: '' });

    const vendorNameById = useMemo(() => {
        const m = new Map<string, string>();
        MOCK_VENDORS.forEach((v) => m.set(v.id, v.name));
        return m;
    }, []);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Vendor Contracts', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
        setSavedViewsTick((n) => n + 1);
    }, [pathname]);

    useEffect(() => {
        const t = window.setTimeout(() => setSearch(searchDraft), 280);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    useEffect(() => {
        try {
            localStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(columnVisibility));
        } catch {
            // ignore
        }
    }, [columnVisibility]);

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

    useEffect(() => {
        if (!mobileMenuId) return;
        const close = () => {
            setMobileMenuId(null);
            setActionMenuPos(null);
        };
        window.addEventListener('resize', close);
        window.addEventListener('scroll', close, true);
        return () => {
            window.removeEventListener('resize', close);
            window.removeEventListener('scroll', close, true);
        };
    }, [mobileMenuId]);

    const toggleActionMenu = (id: string, trigger: HTMLElement) => {
        if (mobileMenuId === id) {
            setMobileMenuId(null);
            setActionMenuPos(null);
            return;
        }
        const rect = trigger.getBoundingClientRect();
        const menuWidth = 208;
        const menuHeight = 220;
        const gap = 6;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const openUp = vh - rect.bottom < menuHeight + gap && rect.top > menuHeight + gap;
        const left = Math.max(8, Math.min(rect.right - menuWidth, vw - menuWidth - 8));
        const unclampedTop = openUp ? rect.top - menuHeight - gap : rect.bottom + gap;
        const top = Math.max(8, Math.min(unclampedTop, vh - menuHeight - 8));
        setActionMenuPos({ top, left });
        setMobileMenuId(id);
    };

    const filtered = useMemo(() => {
        return rows.filter((r) => {
            const vendorName = vendorNameById.get(r.vendorId) ?? r.vendorId;
            const text = `${r.contractName} ${vendorName} ${r.fileName}`.toLowerCase();
            if (search.trim() && !text.includes(search.trim().toLowerCase())) return false;
            if (vendorFilter !== 'all' && r.vendorId !== vendorFilter) return false;
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            if (dateFrom && r.startDate < dateFrom) return false;
            if (dateTo && r.endDate > dateTo) return false;
            const left = daysLeft(r.endDate);
            if (expiryFilter === 'expired' && !(left !== null && left < 0)) return false;
            if (expiryFilter === '7' && !(left !== null && left >= 0 && left <= 7)) return false;
            if (expiryFilter === '15' && !(left !== null && left >= 0 && left <= 15)) return false;
            if (expiryFilter === '30' && !(left !== null && left >= 0 && left <= 30)) return false;
            return true;
        });
    }, [rows, search, vendorFilter, statusFilter, dateFrom, dateTo, expiryFilter, vendorNameById]);

    const savedViews = useMemo((): SavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as ContractsFilterPayload }));
    }, [pathname, savedViewsTick]);

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Vendor Contracts',
            views.map((v) => ({ id: v.id, name: v.name, payload: v.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
        setSavedViewsTick((n) => n + 1);
    };

    const selectedRows = useMemo(() => filtered.filter((r) => selectedIds.has(r.id)), [filtered, selectedIds]);

    const hasActiveFilters =
        search.trim() !== '' ||
        vendorFilter !== 'all' ||
        statusFilter !== 'all' ||
        dateFrom !== '' ||
        dateTo !== '' ||
        expiryFilter !== 'all';

    const kpis = useMemo(() => {
        const total = rows.length;
        const active = rows.filter((r) => r.status === 'Active').length;
        const soon = rows.filter((r) => r.status === 'Ending Soon').length;
        const expired = rows.filter((r) => r.status === 'Expired').length;
        const totalValue = rows.reduce((sum, r) => sum + (Number.isFinite(r.value) ? r.value : 0), 0);
        return { total, active, soon, expired, totalValue };
    }, [rows]);

    const timeline = useMemo(() => {
        const days = [7, 15, 30] as const;
        return days.map((d) => ({
            days: d,
            count: rows.filter((r) => {
                const left = daysLeft(r.endDate);
                return left !== null && left >= 0 && left <= d;
            }).length,
        }));
    }, [rows]);

    const validation = (f: ContractFormState, requireVendor: boolean) => {
        const valueNum = f.value.trim() ? Number(f.value) : null;
        return {
            vendor: requireVendor && !f.vendorId,
            name: !f.contractName.trim() || f.contractName.trim().length > 150,
            start: !f.startDate,
            end: !f.endDate || (!!f.startDate && f.endDate <= f.startDate),
            value: valueNum !== null && (Number.isNaN(valueNum) || valueNum <= 0),
            file: !f.fileName.trim(),
        };
    };

    const editErrors = validation(form, false);

    const openAdd = () => {
        setAddOpen(true);
    };

    const openEdit = (row: ContractRow) => {
        setSubmitAttempted(false);
        setEditRow(row);
        setForm({
            vendorId: row.vendorId,
            contractName: row.contractName,
            startDate: row.startDate,
            endDate: row.endDate,
            value: String(row.value || ''),
            fileName: row.fileName,
            notes: row.notes ?? '',
        });
    };

    const saveAdd = (payload: { vendorId: string; contractName: string; startDate: string; endDate: string; value: string; fileName: string; notes: string }) => {
        const now = new Date().toISOString().slice(0, 10);
        const status = computedStatus(payload.endDate);
        const row: ContractRow = {
            id: `CNT-${Date.now()}`,
            vendorId: payload.vendorId,
            contractName: payload.contractName.trim(),
            startDate: payload.startDate,
            endDate: payload.endDate,
            value: payload.value.trim() ? Number(payload.value) : 0,
            status,
            fileName: payload.fileName.trim(),
            notes: payload.notes.trim() || undefined,
            createdBy: 'Admin',
            updatedBy: 'Admin',
            updatedAt: now,
            history: ['Contract created.'],
        };
        setRows((prev) => [row, ...prev]);
        appendModuleContract({
            id: row.id,
            vendorId: row.vendorId,
            contractName: row.contractName,
            startDate: row.startDate,
            endDate: row.endDate,
            value: row.value,
            status: row.status,
            fileName: row.fileName,
        });
        setActivity((prev) => [`Admin added ${row.contractName}.`, ...prev]);
        setAddOpen(false);
    };

    const saveEdit = () => {
        if (!editRow) return;
        setSubmitAttempted(true);
        if (Object.values(editErrors).some(Boolean)) return;
        const now = new Date().toISOString().slice(0, 10);
        setRows((prev) =>
            prev.map((r) =>
                r.id !== editRow.id
                    ? r
                    : {
                          ...r,
                          contractName: form.contractName.trim(),
                          startDate: form.startDate,
                          endDate: form.endDate,
                          value: form.value.trim() ? Number(form.value) : 0,
                          fileName: form.fileName.trim(),
                          notes: form.notes.trim() || undefined,
                          status: computedStatus(form.endDate),
                          updatedBy: 'Admin',
                          updatedAt: now,
                          history: [...r.history, 'Contract edited.'],
                      },
            ),
        );
        setActivity((prev) => [`Admin edited ${form.contractName.trim()}.`, ...prev]);
        setEditRow(null);
    };

    const confirmDelete = () => {
        if (!deleteRow) return;
        setRows((prev) => prev.filter((r) => r.id !== deleteRow.id));
        setActivity((prev) => [`Admin deleted ${deleteRow.contractName}.`, ...prev]);
        setDeleteRow(null);
    };

    const openRenew = (row: ContractRow) => {
        setRenewRow(row);
        setRenewForm({ startDate: '', endDate: '', value: row.value ? String(row.value) : '', fileName: '' });
    };

    const renewContract = () => {
        if (!renewRow) return;
        if (!renewForm.startDate || !renewForm.endDate || renewForm.endDate <= renewForm.startDate || !renewForm.fileName.trim()) return;
        const now = new Date().toISOString().slice(0, 10);
        setRows((prev) =>
            prev.flatMap((r) => {
                if (r.id !== renewRow.id) return [r];
                const archived: ContractRow = { ...r, status: 'Expired', updatedAt: now, history: [...r.history, 'Moved to history by renewal.'] };
                const renewed: ContractRow = {
                    ...r,
                    id: `CNT-${Date.now()}`,
                    startDate: renewForm.startDate,
                    endDate: renewForm.endDate,
                    value: renewForm.value.trim() ? Number(renewForm.value) : 0,
                    fileName: renewForm.fileName.trim(),
                    status: computedStatus(renewForm.endDate),
                    renewalOf: r.id,
                    updatedBy: 'Admin',
                    updatedAt: now,
                    history: ['Contract renewed from previous cycle.'],
                };
                return [archived, renewed];
            }),
        );
        setActivity((prev) => [`Contract ${renewRow.contractName} renewed.`, ...prev]);
        setRenewRow(null);
    };

    const refresh = () => {
        setRows(buildInitialRows());
        setActivity([
            'Amit added Tower A Electrical Contract.',
            'Legal Team replaced civil-phase2.pdf.',
            'Plumbing Maintenance marked expired.',
        ]);
        setSelectedIds(new Set());
    };

    const exportCsv = (scope?: ContractRow[]) => {
        const headers = ['Vendor', 'Contract Name', 'Start Date', 'End Date', 'Days Left', 'Value', 'File', 'Status'];
        const body = (scope ?? filtered).map((r) => {
            const left = daysLeft(r.endDate);
            const leftLabel = left === null ? '-' : left < 0 ? `Expired ${Math.abs(left)} days ago` : `${left} days`;
            return [
                vendorNameById.get(r.vendorId) ?? r.vendorId,
                r.contractName,
                r.startDate,
                r.endDate,
                leftLabel,
                r.value,
                r.fileName,
                r.status,
            ]
                .map((x) => `"${String(x).replace(/"/g, '""')}"`)
                .join(',');
        });
        const csv = [headers.join(','), ...body].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = scope ? 'vendor-contracts-selected.csv' : `vendor-contracts-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        setSelectedIds((prev) => {
            const visible = new Set(filtered.map((d) => d.id));
            const next = new Set([...prev].filter((id) => visible.has(id)));
            return next.size === prev.size ? prev : next;
        });
    }, [filtered]);

    const resetFilters = () => {
        setSearch('');
        setSearchDraft('');
        setVendorFilter('all');
        setStatusFilter('all');
        setDateFrom('');
        setDateTo('');
        setExpiryFilter('all');
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        const payload: ContractsFilterPayload = { search, vendorFilter, statusFilter, dateFrom, dateTo, expiryFilter };
        persistSavedViews([...savedViews, { id: `v-${Date.now()}`, name, payload }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const applySavedView = (view: SavedView) => {
        const p = view.payload;
        setSearch(p.search ?? '');
        setSearchDraft(p.search ?? '');
        setVendorFilter(p.vendorFilter ?? 'all');
        setStatusFilter((p.statusFilter ?? 'all') as any);
        setDateFrom(p.dateFrom ?? '');
        setDateTo(p.dateTo ?? '');
        setExpiryFilter((p.expiryFilter ?? 'all') as any);
        setDrawerOpen(false);
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((v) => v.id !== id));
    };

    const runImport = () => {
        if (!importFilename.trim()) return;
        setActivity((prev) => [`Imported contracts from ${importFilename} (demo).`, ...prev]);
        setImportOpen(false);
        setImportFilename('');
    };

    const selectClass =
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]';

    return (
        <div className="w-full min-w-0 space-y-6 px-1 pb-10 sm:px-0">
            <Breadcrumb items={[{ label: 'Vendor List', href: '/company-admin/vendors' }, { label: 'Contracts Center' }]} />

            <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Contracts Center</h1>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                        Manage vendor agreements, validity periods, renewals, files, and contract lifecycle.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={refresh}>
                        <LuRefreshCw size={18} />
                        Refresh
                    </Button>
                    <Button type="button" variant="company" size="cta" className="gap-2 shadow-md shadow-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]" onClick={openAdd}>
                        <LuPlus size={18} />
                        Add Contract
                    </Button>
                </div>
            </header>

            <div className="w-full min-w-0 space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                        <div className="relative min-w-[220px] flex-1 max-w-xl">
                            <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={searchDraft}
                                onChange={(e) => setSearchDraft(e.target.value)}
                                placeholder="Search contracts, vendors, files..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--cta-button-bg)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
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
                                <div className="absolute right-0 top-[calc(100%+6px)] z-300 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                    {CONTRACT_TABLE_COLUMN_IDS.filter((id) => id !== 'actions').map((id) => (
                                        <label key={id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-[var(--cta-button-bg)]"
                                                checked={columnVisibility[id] !== false}
                                                onChange={() => setColumnVisibility((m) => ({ ...m, [id]: !(m[id] !== false) }))}
                                            />
                                            {id === 'contractName'
                                                ? 'Contract Name'
                                                : id === 'startDate'
                                                  ? 'Start Date'
                                                  : id === 'endDate'
                                                    ? 'End Date'
                                                    : id === 'daysLeft'
                                                      ? 'Days Left'
                                                      : id === 'vendor'
                                                        ? 'Vendor'
                                                        : id === 'file'
                                                          ? 'File'
                                                          : id === 'status'
                                                            ? 'Status'
                                                            : id === 'value'
                                                              ? 'Value'
                                                              : String(id).charAt(0).toUpperCase() + String(id).slice(1)}
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

                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setImportOpen(true)}>
                            <LuUpload size={18} />
                            Import
                        </Button>

                        <div className="relative" ref={exportMenuRef}>
                            <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setExportMenuOpen((o) => !o)}>
                                <LuDownload size={18} />
                                Export
                                <LuChevronDown size={16} className="opacity-70" />
                            </Button>
                            {exportMenuOpen ? (
                                <div className="absolute right-0 top-[calc(100%+6px)] z-300 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                        onClick={() => {
                                            exportCsv(selectedIds.size ? selectedRows : undefined);
                                            setExportMenuOpen(false);
                                        }}
                                    >
                                        <LuDownload size={16} className="text-slate-400" />
                                        CSV
                                    </button>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                        onClick={() => {
                                            window.print();
                                            setExportMenuOpen(false);
                                        }}
                                    >
                                        <LuFileText size={16} className="text-slate-400" />
                                        PDF / Print
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {selectedIds.size > 0 ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <LuCheck size={18} />
                            {selectedIds.size} selected
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={() => exportCsv(selectedRows)}>
                                <LuDownload size={16} />
                                Export
                            </Button>
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="sm"
                                className="gap-1.5 border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                                onClick={() => {
                                    const count = selectedIds.size;
                                    setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
                                    setActivity((prev) => [`Admin deleted ${count} contracts (bulk).`, ...prev]);
                                    setSelectedIds(new Set());
                                }}
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

                <section className="hidden w-full min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100/80 lg:block">
                    <div className="max-h-[min(70vh,920px)] w-full overflow-x-auto">
                        <table className="w-full table-auto border-collapse text-left text-sm">
                            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm">
                                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="w-10 px-2 py-3">
                                        <input
                                            type="checkbox"
                                            checked={filtered.length > 0 && selectedIds.size === filtered.length}
                                            onChange={(e) => setSelectedIds(e.target.checked ? new Set(filtered.map((d) => d.id)) : new Set())}
                                            className="rounded border-slate-300 text-[var(--cta-button-bg)]"
                                            aria-label="Select all rows"
                                        />
                                    </th>
                                    {columnVisibility.vendor !== false ? <th className="min-w-[120px] whitespace-normal px-4 py-3">Vendor</th> : null}
                                    {columnVisibility.contractName !== false ? <th className="min-w-[160px] whitespace-normal px-4 py-3">Contract Name</th> : null}
                                    {columnVisibility.startDate !== false ? <th className="min-w-[110px] whitespace-nowrap px-4 py-3">Start Date</th> : null}
                                    {columnVisibility.endDate !== false ? <th className="min-w-[110px] whitespace-nowrap px-4 py-3">End Date</th> : null}
                                    {columnVisibility.daysLeft !== false ? <th className="min-w-[110px] whitespace-nowrap px-4 py-3">Days Left</th> : null}
                                    {columnVisibility.value !== false ? <th className="min-w-[110px] whitespace-nowrap px-4 py-3">Value</th> : null}
                                    {columnVisibility.file !== false ? <th className="min-w-[160px] whitespace-normal px-4 py-3">File</th> : null}
                                    {columnVisibility.status !== false ? <th className="min-w-[110px] whitespace-nowrap px-4 py-3">Status</th> : null}
                                    {columnVisibility.actions !== false ? <th className="min-w-[200px] whitespace-nowrap px-4 py-3 text-right">Actions</th> : null}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => {
                                    const left = daysLeft(r.endDate);
                                    const leftLabel =
                                        left === null
                                            ? '—'
                                            : left < 0
                                              ? `Expired ${Math.abs(left)} days ago`
                                              : left <= 14
                                                ? `${left} Days Left`
                                                : `${left} Days`;
                                    const expSoon = left !== null && left >= 0 && left <= 30;
                                    const expired = left !== null && left < 0;
                                    return (
                                        <tr
                                            key={r.id}
                                            className={cn(
                                                'border-b border-slate-100 transition-colors hover:bg-slate-50/90',
                                                expSoon && 'bg-orange-50/40',
                                                expired && 'border-l-4 border-l-rose-500 bg-rose-50/20',
                                            )}
                                        >
                                            <td className="px-2 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(r.id)}
                                                    onChange={(e) =>
                                                        setSelectedIds((prev) => {
                                                            const next = new Set(prev);
                                                            if (e.target.checked) next.add(r.id);
                                                            else next.delete(r.id);
                                                            return next;
                                                        })
                                                    }
                                                    className="rounded border-slate-300 text-[var(--cta-button-bg)]"
                                                    aria-label={`Select ${r.contractName}`}
                                                />
                                            </td>
                                            {columnVisibility.vendor !== false ? (
                                                <td className="max-w-0 truncate px-4 py-3" title={vendorNameById.get(r.vendorId) ?? r.vendorId}>
                                                    <Link href={`/company-admin/vendors/${encodeURIComponent(r.vendorId)}`} className="font-medium text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline">
                                                        {vendorNameById.get(r.vendorId) ?? r.vendorId}
                                                    </Link>
                                                </td>
                                            ) : null}
                                            {columnVisibility.contractName !== false ? (
                                                <td className="max-w-0 truncate px-4 py-3" title={r.contractName}>
                                                    <button
                                                        type="button"
                                                        className="font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                                                        onClick={() => setViewRow(r)}
                                                        aria-label={`View ${r.contractName}`}
                                                    >
                                                        {r.contractName}
                                                    </button>
                                                </td>
                                            ) : null}
                                            {columnVisibility.startDate !== false ? <td className="px-4 py-3 tabular-nums text-slate-600">{fmtDate(r.startDate)}</td> : null}
                                            {columnVisibility.endDate !== false ? <td className="px-4 py-3 tabular-nums text-slate-600">{fmtDate(r.endDate)}</td> : null}
                                            {columnVisibility.daysLeft !== false ? (
                                                <td
                                                    className={cn(
                                                        'px-4 py-3 font-medium',
                                                        left !== null && left < 0
                                                            ? 'text-rose-700'
                                                            : left !== null && left <= 14
                                                              ? 'text-amber-700'
                                                              : 'text-slate-700',
                                                    )}
                                                >
                                                    {leftLabel}
                                                </td>
                                            ) : null}
                                            {columnVisibility.value !== false ? <td className="px-4 py-3 tabular-nums text-slate-700">{fmtMoney(r.value)}</td> : null}
                                            {columnVisibility.file !== false ? (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <LuFileText size={16} className="text-red-500" />
                                                        <span className="max-w-[220px] truncate text-slate-700" title={r.fileName}>
                                                            {r.fileName}
                                                        </span>
                                                    </div>
                                                </td>
                                            ) : null}
                                            {columnVisibility.status !== false ? (
                                                <td className="px-4 py-3">
                                                    <ContractStatusBadge status={r.status} />
                                                </td>
                                            ) : null}
                                            {columnVisibility.actions !== false ? (
                                                <td className="px-4 py-3">
                                                    <div className="relative flex justify-end">
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center justify-center rounded-lg transition-all focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border bg-white shadow-sm hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:border-[color-mix(in_srgb,var(--cta-button-bg)_38%,transparent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)] h-8 gap-1 border-slate-200 px-2 text-xs font-semibold text-slate-700"
                                                            aria-label="Open actions"
                                                            aria-expanded={mobileMenuId === r.id}
                                                            onClick={(e) => toggleActionMenu(r.id, e.currentTarget)}
                                                        >
                                                            Actions
                                                            <LuChevronDown size={14} className={cn('transition', mobileMenuId === r.id && 'rotate-180')} />
                                                        </button>
                                                        {mobileMenuId === r.id && actionMenuPos ? (
                                                            <div
                                                                className="fixed z-600 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                                                                style={{ top: actionMenuPos.top, left: actionMenuPos.left }}
                                                            >
                                                                <MenuRow
                                                                    icon={<LuEye size={16} />}
                                                                    onClick={() => {
                                                                        setMobileMenuId(null);
                                                                        setActionMenuPos(null);
                                                                        setViewRow(r);
                                                                    }}
                                                                >
                                                                    View
                                                                </MenuRow>
                                                                <MenuRow
                                                                    icon={<LuPencil size={16} />}
                                                                    onClick={() => {
                                                                        setMobileMenuId(null);
                                                                        setActionMenuPos(null);
                                                                        openEdit(r);
                                                                    }}
                                                                >
                                                                    Edit
                                                                </MenuRow>
                                                                <MenuRow
                                                                    icon={<LuRotateCw size={16} />}
                                                                    onClick={() => {
                                                                        setMobileMenuId(null);
                                                                        setActionMenuPos(null);
                                                                        openRenew(r);
                                                                    }}
                                                                >
                                                                    Renew
                                                                </MenuRow>
                                                                <MenuRow
                                                                    icon={<LuDownload size={16} />}
                                                                    onClick={() => {
                                                                        setMobileMenuId(null);
                                                                        setActionMenuPos(null);
                                                                        setActivity((a) => [`Downloaded ${r.fileName}.`, ...a]);
                                                                    }}
                                                                >
                                                                    Download
                                                                </MenuRow>
                                                                <MenuRow
                                                                    icon={<LuTrash2 size={16} />}
                                                                    danger
                                                                    onClick={() => {
                                                                        setMobileMenuId(null);
                                                                        setActionMenuPos(null);
                                                                        setDeleteRow(r);
                                                                    }}
                                                                >
                                                                    Delete
                                                                </MenuRow>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
                                <LuFileWarning className="mx-auto h-10 w-10 text-slate-400" aria-hidden />
                                <p className="mt-3 text-sm font-semibold text-slate-800">No contracts added yet.</p>
                                <p className="mt-1 text-sm text-slate-500">Add vendor contracts to track expiry and renewal health.</p>
                                <Button type="button" variant="company" size="cta" className="mt-5 gap-2" onClick={openAdd}>
                                    <LuPlus size={18} />
                                    Add First Contract
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </section>

                <section className="w-full space-y-3 lg:hidden">
                    {filtered.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                            <LuFileWarning className="mx-auto h-10 w-10 text-slate-400" />
                            <p className="mt-3 font-semibold text-slate-800">No contracts added yet.</p>
                            <Button type="button" variant="company" size="cta" className="mt-4 gap-2" onClick={openAdd}>
                                <LuPlus size={18} />
                                Add First Contract
                            </Button>
                        </div>
                    ) : (
                        filtered.map((r) => {
                            const vName = vendorNameById.get(r.vendorId) ?? r.vendorId;
                            const left = daysLeft(r.endDate);
                            const expSoon = left !== null && left >= 0 && left <= 30;
                            const expired = left !== null && left < 0;
                            const open = mobileMenuId === r.id;
                            const leftLabel =
                                left === null
                                    ? '—'
                                    : left < 0
                                      ? `Expired ${Math.abs(left)} days ago`
                                      : left <= 14
                                        ? `${left} Days Left`
                                        : `${left} Days`;
                            return (
                                <article
                                    key={r.id}
                                    className={cn(
                                        'relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
                                        expSoon && 'bg-orange-50/50',
                                        expired && 'border-l-4 border-l-rose-500',
                                        open && 'z-50',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900">{r.contractName}</p>
                                            <p className="mt-1 text-xs text-slate-500">{vName}</p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <ContractStatusBadge status={r.status} />
                                            </div>
                                            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                                                <div>
                                                    <dt className="text-slate-400">Start</dt>
                                                    <dd className="font-medium">{fmtDate(r.startDate)}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-slate-400">End</dt>
                                                    <dd className="font-medium">{fmtDate(r.endDate)}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-slate-400">Days left</dt>
                                                    <dd className="font-medium">{leftLabel}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-slate-400">Value</dt>
                                                    <dd className="font-medium">{fmtMoney(r.value)}</dd>
                                                </div>
                                            </dl>
                                        </div>
                                        <div className="relative shrink-0">
                                            <button
                                                type="button"
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                                                aria-expanded={open}
                                                onClick={(e) => toggleActionMenu(r.id, e.currentTarget)}
                                            >
                                                <LuEllipsisVertical size={20} />
                                            </button>
                                            {open && actionMenuPos ? (
                                                <div
                                                    className="fixed z-600 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                                                    style={{ top: actionMenuPos.top, left: actionMenuPos.left }}
                                                >
                                                    <MenuRow
                                                        icon={<LuEye size={16} />}
                                                        onClick={() => {
                                                            setMobileMenuId(null);
                                                            setActionMenuPos(null);
                                                            setViewRow(r);
                                                        }}
                                                    >
                                                        View
                                                    </MenuRow>
                                                    <MenuRow
                                                        icon={<LuPencil size={16} />}
                                                        onClick={() => {
                                                            setMobileMenuId(null);
                                                            setActionMenuPos(null);
                                                            openEdit(r);
                                                        }}
                                                    >
                                                        Edit
                                                    </MenuRow>
                                                    <MenuRow
                                                        icon={<LuRotateCw size={16} />}
                                                        onClick={() => {
                                                            setMobileMenuId(null);
                                                            setActionMenuPos(null);
                                                            openRenew(r);
                                                        }}
                                                    >
                                                        Renew
                                                    </MenuRow>
                                                    <MenuRow
                                                        icon={<LuDownload size={16} />}
                                                        onClick={() => {
                                                            setMobileMenuId(null);
                                                            setActionMenuPos(null);
                                                            setActivity((a) => [`Downloaded ${r.fileName}.`, ...a]);
                                                        }}
                                                    >
                                                        Download
                                                    </MenuRow>
                                                    <MenuRow
                                                        icon={<LuTrash2 size={16} />}
                                                        danger
                                                        onClick={() => {
                                                            setMobileMenuId(null);
                                                            setActionMenuPos(null);
                                                            setDeleteRow(r);
                                                        }}
                                                    >
                                                        Delete
                                                    </MenuRow>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </section>
            </div>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-900">Upcoming Expiry Timeline</h3>
                    <div className="mt-4 space-y-3">
                        {timeline.map((t) => (
                            <div key={t.days} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                <span className="text-sm text-slate-700">Within {t.days} days</span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">{t.count}</span>
                            </div>
                        ))}
                    </div>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-900">Recent Contract Activity</h3>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                        {activity.slice(0, 6).map((a, i) => <li key={`${a}-${i}`} className="flex items-start gap-2"><LuActivity className="mt-0.5 text-[var(--cta-button-bg)]" size={14} />{a}</li>)}
                    </ul>
                </article>
            </section>

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
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor</label>
                                <select className={`mt-1.5 ${selectClass}`} value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
                                    <option value="all">All vendors</option>
                                    {MOCK_VENDORS.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as 'all' | ContractStatus)}
                                >
                                    <option value="all">All status</option>
                                    <option value="Draft">Draft</option>
                                    <option value="Active">Active</option>
                                    <option value="Ending Soon">Ending Soon</option>
                                    <option value="Expired">Expired</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date from</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className={`mt-1.5 ${selectClass}`}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date to</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className={`mt-1.5 ${selectClass}`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={expiryFilter}
                                    onChange={(e) => setExpiryFilter(e.target.value as typeof expiryFilter)}
                                >
                                    <option value="all">Any expiry</option>
                                    <option value="7">Within 7 days</option>
                                    <option value="15">Within 15 days</option>
                                    <option value="30">Within 30 days</option>
                                    <option value="expired">Expired</option>
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
                                                    className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-slate-800 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
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
                title="Save current view"
                maxWidthClassName="max-w-md"
                footer={
                    <>
                        <Button variant="companyOutline" size="cta" onClick={() => setSaveModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="company" size="cta" onClick={saveCurrentView}>
                            Save
                        </Button>
                    </>
                }
            >
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">View name</label>
                    <input value={saveViewName} onChange={(e) => setSaveViewName(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" placeholder="e.g., Expiring in 30 days" />
                    <p className="text-xs text-slate-500">Saves current filters (search/vendor/status/dates/expiry) for this route.</p>
                </div>
            </Modal>

            <Modal
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                title="Import contracts"
                maxWidthClassName="max-w-md"
                footer={
                    <>
                        <Button variant="companyOutline" size="cta" onClick={() => setImportOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="company" size="cta" onClick={runImport}>
                            Import
                        </Button>
                    </>
                }
            >
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">CSV file name (demo)</label>
                    <input value={importFilename} onChange={(e) => setImportFilename(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" placeholder="vendor-contracts.csv" />
                    <p className="text-xs text-slate-500">This is a UI-only import placeholder (same pattern as Leads/Compliance).</p>
                </div>
            </Modal>

            <AddContractModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSubmit={saveAdd} />

            <Modal isOpen={!!editRow} onClose={() => setEditRow(null)} title="Edit Contract" maxWidthClassName="max-w-xl" footer={<><Button variant="companyOutline" size="cta" onClick={() => setEditRow(null)}>Cancel</Button><Button variant="company" size="cta" onClick={saveEdit}>Update Contract</Button></>}>
                <ContractForm form={form} setForm={setForm} submitAttempted={submitAttempted} errors={editErrors} />
            </Modal>

            <Modal isOpen={!!deleteRow} onClose={() => setDeleteRow(null)} title="Delete contract?" maxWidthClassName="max-w-md" footer={<><Button variant="companyOutline" size="cta" onClick={() => setDeleteRow(null)}>Cancel</Button><Button variant="danger" size="cta" onClick={confirmDelete}>Delete</Button></>}>
                <p className="text-sm text-slate-700">Delete this contract permanently?</p>
            </Modal>

            <Modal isOpen={!!renewRow} onClose={() => setRenewRow(null)} title="Renew Contract" maxWidthClassName="max-w-lg" footer={<><Button variant="companyOutline" size="cta" onClick={() => setRenewRow(null)}>Cancel</Button><Button variant="company" size="cta" onClick={renewContract}>Renew Contract</Button></>}>
                <div className="space-y-3">
                    <Field label="New Start Date *"><input type="date" value={renewForm.startDate} onChange={(e) => setRenewForm((s) => ({ ...s, startDate: e.target.value }))} className={inputClass(false)} /></Field>
                    <Field label="New End Date *"><input type="date" value={renewForm.endDate} onChange={(e) => setRenewForm((s) => ({ ...s, endDate: e.target.value }))} className={inputClass(false)} /></Field>
                    <Field label="New Value"><input type="number" min={1} value={renewForm.value} onChange={(e) => setRenewForm((s) => ({ ...s, value: e.target.value }))} className={inputClass(false)} /></Field>
                    <Field label="Upload Renewed PDF *">
                        <input type="file" accept=".pdf" className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-[color-mix(in_srgb,var(--cta-button-bg)_18%,white)]" onChange={(e) => setRenewForm((s) => ({ ...s, fileName: e.target.files?.[0]?.name ?? '' }))} />
                    </Field>
                </div>
            </Modal>

            {viewRow ? (
                <>
                    <button type="button" className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[1px]" aria-label="Close drawer" onClick={() => setViewRow(null)} />
                    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 className="text-lg font-bold text-slate-900">Contract Details</h3>
                            <Button variant="companyGhost" size="sm" onClick={() => setViewRow(null)}>Close</Button>
                        </div>
                        <div className="h-full overflow-y-auto px-5 py-4 space-y-4">
                            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                <p className="text-sm font-semibold text-slate-900">{viewRow.contractName}</p>
                                <p className="mt-1 text-xs text-slate-600">{vendorNameById.get(viewRow.vendorId) ?? viewRow.vendorId}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <Info k="Start Date" v={fmtDate(viewRow.startDate)} />
                                <Info k="End Date" v={fmtDate(viewRow.endDate)} />
                                <Info k="Contract Value" v={fmtMoney(viewRow.value)} />
                                <Info k="Status" v={viewRow.status} />
                                <Info k="Created by" v={viewRow.createdBy} />
                                <Info k="Updated by" v={viewRow.updatedBy} />
                            </div>
                            <div className="rounded-xl border border-slate-200 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">File preview</p>
                                <p className="mt-2 text-sm font-medium text-slate-800">{viewRow.fileName}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audit history</p>
                                <ul className="mt-2 space-y-1 text-sm text-slate-700">{viewRow.history.map((h, i) => <li key={`${h}-${i}`}>• {h}</li>)}</ul>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Renewal timeline</p>
                                <p className="mt-2 text-sm text-slate-700">{viewRow.renewalOf ? `Renewed from ${viewRow.renewalOf}` : 'Original contract cycle.'}</p>
                            </div>
                        </div>
                    </aside>
                </>
            ) : null}

            {mobileMenuId ? (
                <button
                    type="button"
                    className="fixed inset-0 z-550 cursor-default bg-transparent"
                    aria-label="Close menu"
                    onClick={() => {
                        setMobileMenuId(null);
                        setActionMenuPos(null);
                    }}
                />
            ) : null}
        </div>
    );
}

function ContractForm({
    form,
    setForm,
    errors,
    submitAttempted,
    showVendor,
}: {
    form: ContractFormState;
    setForm: React.Dispatch<React.SetStateAction<ContractFormState>>;
    errors: { vendor: boolean; name: boolean; start: boolean; end: boolean; value: boolean; file: boolean };
    submitAttempted: boolean;
    showVendor?: boolean;
}) {
    return (
        <div className="space-y-4">
            {showVendor ? (
                <Field label="Select Vendor *">
                    <select value={form.vendorId} onChange={(e) => setForm((s) => ({ ...s, vendorId: e.target.value }))} className={inputClass(submitAttempted && errors.vendor)}>
                        <option value="">Select vendor…</option>
                        {MOCK_VENDORS.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </Field>
            ) : null}
            <Field label="Contract Name *">
                <input value={form.contractName} onChange={(e) => setForm((s) => ({ ...s, contractName: e.target.value.slice(0, 150) }))} className={inputClass(submitAttempted && errors.name)} maxLength={150} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Start Date *"><input type="date" value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} className={inputClass(submitAttempted && errors.start)} /></Field>
                <Field label="End Date *"><input type="date" value={form.endDate} onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))} className={inputClass(submitAttempted && errors.end)} /></Field>
            </div>
            <Field label="Contract Value">
                <input type="number" min={1} value={form.value} onChange={(e) => setForm((s) => ({ ...s, value: e.target.value }))} className={inputClass(submitAttempted && errors.value)} />
            </Field>
            <Field label="Contract File (PDF) *">
                <input type="file" accept=".pdf" className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-[color-mix(in_srgb,var(--cta-button-bg)_18%,white)]" onChange={(e) => setForm((s) => ({ ...s, fileName: e.target.files?.[0]?.name ?? '' }))} />
                {form.fileName ? <p className="mt-1 text-xs text-slate-500">{form.fileName}</p> : null}
            </Field>
            <Field label="Notes (optional)">
                <textarea value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} rows={3} className={cn(inputClass(false), 'min-h-[84px] resize-y')} />
            </Field>
        </div>
    );
}

function inputClass(errored: boolean) {
    return cn(
        'h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]',
        errored ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]',
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
            {children}
        </div>
    );
}

function Info({ k, v }: { k: string; v: string }) {
    return (
        <div className="rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k}</p>
            <p className="mt-1 font-medium text-slate-900">{v}</p>
        </div>
    );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={onClick}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
        >
            {children}
        </button>
    );
}

function MenuRow({
    icon,
    children,
    onClick,
    danger,
}: {
    icon: React.ReactNode;
    children: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50',
                danger ? 'text-rose-700 hover:bg-rose-50' : 'text-slate-700',
            )}
            onClick={onClick}
        >
            <span className={cn('text-slate-500', danger && 'text-rose-500')}>{icon}</span>
            {children}
        </button>
    );
}
