'use client';

import type { ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

import { useVendorDocumentModals } from '@/hooks/useVendorDocumentModals';
import { VerificationBadge } from '@/components/vendors/VendorShared';
import { MOCK_VENDOR_DOCUMENTS, MOCK_VENDORS } from '@/lib/vendors/mockData';
import type { VendorDocument } from '@/lib/vendors/types';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { cn } from '@/lib/utils';
import { getModuleDocuments } from '@/lib/vendors/vendorModuleStore';
import { isPendingVerificationStatus, markDocumentVerified } from '@/lib/vendors/vendorComplianceVerification';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    LuBookmark,
    LuBuilding2,
    LuCalendarClock,
    LuCheck,
    LuChevronDown,
    LuCircleAlert,
    LuCircleCheck,
    LuCircleX,
    LuColumns3,
    LuEllipsisVertical,
    LuDownload,
    LuEye,
    LuFileWarning,
    LuFileText,
    LuFilter,
    LuHistory,
    LuPencil,
    LuPlus,
    LuRefreshCw,
    LuSearch,
    LuShieldCheck,
    LuTrash2,
    LuUpload,
    LuX,
} from 'react-icons/lu';

const TABLE_STORAGE_KEY = 'arris-vendor-docs-table-v2';
const LEGACY_SAVED_VIEWS_KEY = 'arris-vendor-docs-saved-views';
/** Column order aligned with Add Document modal and view/edit dialogs. */
const DOC_TABLE_COLUMN_IDS = [
    'vendor',
    'type',
    'documentFile',
    'documentName',
    'uploadedDate',
    'expiryDate',
    'status',
    'verifiedBy',
    'verifiedDate',
    'actions',
] as const;

const DOC_COLUMN_LABEL: Record<(typeof DOC_TABLE_COLUMN_IDS)[number], string> = {
    vendor: 'Vendor',
    type: 'Document Type',
    documentFile: 'Document File',
    documentName: 'Document Name',
    uploadedDate: 'Upload Date',
    expiryDate: 'Expiry Date',
    status: 'Verification Status',
    verifiedBy: 'Verified By',
    verifiedDate: 'Verified Date',
    actions: 'Actions',
};

type DocsFilterPayload = {
    search: string;
    vendorFilter: string;
    typeFilter: string;
    statusFilter: string;
    expiryFilter: string;
};

type SavedView = { id: string; name: string; payload: DocsFilterPayload };

function parseIsoDate(d: string | undefined): Date | null {
    if (!d?.trim()) return null;
    const x = new Date(`${d.trim()}T12:00:00`);
    return Number.isNaN(x.getTime()) ? null : x;
}

function fmtDisplayDate(d: string | undefined) {
    if (!d?.trim()) return '—';
    const p = parseIsoDate(d);
    if (!p) return d;
    return p.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayStart() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
}

function daysUntil(expiry: string | undefined) {
    const e = parseIsoDate(expiry);
    if (!e) return null;
    const diff = Math.ceil((e.getTime() - todayStart().getTime()) / (24 * 60 * 60 * 1000));
    return diff;
}

function cloneSeedDocuments(): VendorDocument[] {
    return [...getModuleDocuments().map((d) => ({ ...d })), ...MOCK_VENDOR_DOCUMENTS.map((d) => ({ ...d }))];
}

type ActivityEntry = { id: string; at: string; message: string };

const SEED_ACTIVITY: ActivityEntry[] = [
    { id: 'a1', at: '2026-04-27 09:12', message: 'Amit uploaded GST Certificate for Metro Civil Solutions.' },
    { id: 'a2', at: '2026-04-26 14:40', message: 'Admin verified PAN for Prime Electrical Works.' },
    { id: 'a3', at: '2026-04-25 11:05', message: 'License expiry reminder sent for Trade License (Prime Electrical).' },
    { id: 'a4', at: '2026-04-24 08:55', message: 'Service Agreement marked expired for SafeGuard Security Services.' },
];

export function VendorComplianceCenterPage() {
    const pathname = usePathname() ?? '/company-admin/vendors/compliance';
    const searchParams = useSearchParams();
    const vendorNameById = useMemo(() => {
        const m = new Map<string, string>();
        MOCK_VENDORS.forEach((v) => m.set(v.id, v.name));
        return m;
    }, []);

    const [documents, setDocuments] = useState<VendorDocument[]>(() => cloneSeedDocuments());
    const [activity, setActivity] = useState<ActivityEntry[]>(() => [...SEED_ACTIVITY]);

    const [search, setSearch] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [vendorFilter, setVendorFilter] = useState<string>('all');
    useEffect(() => {
        const id = searchParams.get('vendor')?.trim();
        if (id && MOCK_VENDORS.some((v) => v.id === id)) setVendorFilter(id);
    }, [searchParams]);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [expiryFilter, setExpiryFilter] = useState<string>('all');
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
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        try {
            const raw = localStorage.getItem(TABLE_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Record<string, boolean>;
                return { ...Object.fromEntries(DOC_TABLE_COLUMN_IDS.map((id) => [id, true])), ...parsed };
            }
        } catch {
            // ignore
        }
        return Object.fromEntries(DOC_TABLE_COLUMN_IDS.map((id) => [id, true]));
    });

    const [mobileMenuId, setMobileMenuId] = useState<string | null>(null);
    const [actionMenuPos, setActionMenuPos] = useState<{ top: number; left: number } | null>(null);

    const [savedViewsTick, setSavedViewsTick] = useState(0);

    const pushActivity = useCallback((message: string) => {
        const at = new Date().toLocaleString(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        setActivity((prev) => [{ id: `act-${Date.now()}`, at, message }, ...prev]);
    }, []);

    const { openCreate, openView, openEdit, openDelete, downloadDocument, modals: documentModals } = useVendorDocumentModals({
        setDocuments,
        vendorNameById,
        onAfterAdd: (row) => {
            pushActivity(`New document "${row.documentName}" uploaded (${row.type}).`);
        },
        onAfterUpdate: (row) => {
            pushActivity(`Document "${row.documentName}" updated.`);
        },
        onAfterDelete: (row) => {
            pushActivity(`Document "${row.documentName}" deleted.`);
            setMobileMenuId(null);
        },
        onDownload: (d) => {
            const name = d.fileName ?? `${d.documentName}.pdf`;
            pushActivity(`Download triggered for "${name}" (demo).`);
            setMobileMenuId(null);
        },
    });

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Vendor Docs', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
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
        const menuHeight = 196;
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

    const kpis = useMemo(() => {
        const total = documents.length;
        const pending = documents.filter((d) => isPendingVerificationStatus(d.verificationStatus)).length;
        const expSoon = documents.filter((d) => {
            const du = daysUntil(d.expiryDate);
            return du !== null && du >= 0 && du <= 30 && d.verificationStatus !== 'Expired';
        }).length;
        const verifiedPct =
            total === 0 ? 0 : Math.round((documents.filter((d) => d.verificationStatus === 'Verified').length / total) * 100);
        return { total, pending, expSoon, verifiedPct };
    }, [documents]);

    const complianceSummary = useMemo(() => {
        const gst = documents.some((d) => d.type === 'GST' && d.verificationStatus === 'Verified');
        const pan = documents.some((d) => d.type === 'PAN' && d.verificationStatus === 'Verified');
        const licensePending = documents.some((d) => d.type === 'License' && isPendingVerificationStatus(d.verificationStatus));
        const agreementExpired = documents.some((d) => {
            if (d.type !== 'Agreement') return false;
            const du = daysUntil(d.expiryDate);
            return d.verificationStatus === 'Expired' || (du !== null && du < 0);
        });
        const checklistScore =
            Math.round(((gst ? 1 : 0) + (pan ? 1 : 0) + (!licensePending ? 1 : 0) + (!agreementExpired ? 1 : 0)) * 25) || 0;
        return { gst, pan, licensePending, agreementExpired, checklistScore };
    }, [documents]);

    const filtered = useMemo(() => {
        return documents.filter((d) => {
            const vName = vendorNameById.get(d.vendorId) ?? d.vendorId;
            if (search.trim()) {
                const q = search.toLowerCase();
                const fileStr = (d.fileName ?? '').toLowerCase();
                if (
                    !d.documentName.toLowerCase().includes(q) &&
                    !d.type.toLowerCase().includes(q) &&
                    !vName.toLowerCase().includes(q) &&
                    !fileStr.includes(q)
                )
                    return false;
            }
            if (vendorFilter !== 'all' && d.vendorId !== vendorFilter) return false;
            if (typeFilter !== 'all' && d.type !== typeFilter) return false;
            if (statusFilter !== 'all' && d.verificationStatus !== statusFilter) return false;

            if (expiryFilter !== 'all') {
                const du = daysUntil(d.expiryDate);
                const expired =
                    d.verificationStatus === 'Expired' || (du !== null && du < 0 && parseIsoDate(d.expiryDate) !== null);
                if (expiryFilter === 'expired' && !expired) return false;
                if (expiryFilter === 'expiring' && !(du !== null && du >= 0 && du <= 30 && !expired)) return false;
                if (expiryFilter === 'valid' && expired) return false;
            }
            return true;
        });
    }, [documents, search, vendorFilter, typeFilter, statusFilter, expiryFilter, vendorNameById]);

    const savedViews = useMemo((): SavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as DocsFilterPayload }));
    }, [pathname, savedViewsTick]);

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Vendor Docs',
            views.map((v) => ({ id: v.id, name: v.name, payload: v.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
        setSavedViewsTick((n) => n + 1);
    };

    const hasActiveFilters =
        search.trim() !== '' ||
        vendorFilter !== 'all' ||
        typeFilter !== 'all' ||
        statusFilter !== 'all' ||
        expiryFilter !== 'all';

    const selectedRows = useMemo(() => filtered.filter((d) => selectedIds.has(d.id)), [filtered, selectedIds]);

    const resetFilters = () => {
        setSearch('');
        setSearchDraft('');
        setVendorFilter('all');
        setTypeFilter('all');
        setStatusFilter('all');
        setExpiryFilter('all');
    };

    const applySavedView = (view: SavedView) => {
        const p = view.payload;
        setSearch(p.search ?? '');
        setSearchDraft(p.search ?? '');
        setVendorFilter(p.vendorFilter ?? 'all');
        setTypeFilter(p.typeFilter ?? 'all');
        setStatusFilter(p.statusFilter ?? 'all');
        setExpiryFilter(p.expiryFilter ?? 'all');
        setDrawerOpen(false);
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((v) => v.id !== id));
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        const payload: DocsFilterPayload = { search, vendorFilter, typeFilter, statusFilter, expiryFilter };
        persistSavedViews([...savedViews, { id: `v-${Date.now()}`, name, payload }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const exportCsv = (scopeRows?: VendorDocument[]) => {
        const headers = [
            'Vendor',
            'Document Type',
            'Document File',
            'Document Name',
            'Upload Date',
            'Expiry Date',
            'Verification Status',
            'Verified By',
            'Verified Date',
        ];
        const rows = (scopeRows ?? filtered).map((d) => {
            const vn = vendorNameById.get(d.vendorId) ?? d.vendorId;
            return [
                vn,
                d.type,
                d.fileName ?? '',
                d.documentName,
                d.uploadedDate,
                d.expiryDate ?? '',
                d.verificationStatus,
                d.verifiedBy,
                d.verifiedDate ?? '',
            ]
                .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                .join(',');
        });
        const csv = [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedIds.size ? 'vendor-documents-selected.csv' : `vendor-compliance-documents-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        pushActivity('Exported filtered document list (CSV).');
    };

    const runImport = () => {
        if (!importFilename.trim()) return;
        pushActivity(`Imported document batch from ${importFilename} (demo).`);
        setImportOpen(false);
        setImportFilename('');
    };

    const refresh = () => {
        setDocuments(cloneSeedDocuments());
        setActivity([...SEED_ACTIVITY]);
        setSelectedIds(new Set());
        pushActivity('Refresh: reloaded documents from catalog.');
    };

    useEffect(() => {
        setSelectedIds((prev) => {
            const visible = new Set(filtered.map((d) => d.id));
            const next = new Set([...prev].filter((id) => visible.has(id)));
            return next.size === prev.size ? prev : next;
        });
    }, [filtered]);

    const verifyDoc = (d: VendorDocument) => {
        setDocuments((prev) =>
            prev.map((x) =>
                x.id === d.id
                    ? markDocumentVerified(x, {
                          verifiedBy: 'Company Admin',
                          verifiedDate: new Date().toISOString().slice(0, 10),
                          approvalNotes: 'Approved via compliance center.',
                      })
                    : x,
            ),
        );
        pushActivity(`Company Admin verified ${d.type} — ${d.documentName}.`);
        setMobileMenuId(null);
    };

    const rowVisual = (d: VendorDocument) => {
        const du = daysUntil(d.expiryDate);
        const dateExpired =
            d.verificationStatus === 'Expired' ||
            (du !== null && du < 0 && parseIsoDate(d.expiryDate) !== null);
        const expiringSoon = !dateExpired && du !== null && du >= 0 && du <= 30;
        return { dateExpired, expiringSoon };
    };

    const getVerifiedByDisplay = (d: VendorDocument) => {
        if (d.verificationStatus === 'Verified') {
            return d.verifiedBy && d.verifiedBy !== '—' ? d.verifiedBy : 'Admin';
        }
        return d.verifiedBy || '—';
    };

    const uniqueTypes = useMemo(() => {
        const s = new Set<string>();
        documents.forEach((d) => s.add(d.type));
        return Array.from(s).sort();
    }, [documents]);
    const selectClass =
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]';

    return (
        <div className="w-full min-w-0 space-y-6 px-1 pb-10 sm:px-0">
            <Breadcrumb items={[{ label: 'Vendor List', href: '/company-admin/vendors' }, { label: 'Documents & Compliance' }]} />

            {/* Header */}
            <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Documents & Compliance</h1>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                        Manage vendor licenses, tax docs, agreements, approvals, and verification records.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={refresh}>
                        <LuRefreshCw size={18} />
                        Refresh
                    </Button>
                    <Button type="button" variant="company" size="cta" className="gap-2 shadow-md shadow-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]" onClick={openCreate}>
                        <LuPlus size={18} />
                        Add Document
                    </Button>
                </div>
            </header>


            <div className="w-full min-w-0 space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                        <div className="relative min-w-[220px] flex-1 max-w-xl">
                            <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Search document, type, vendor..."
                                value={searchDraft}
                                onChange={(e) => setSearchDraft(e.target.value)}
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
                                <div className="absolute right-0 top-[calc(100%+6px)] z-300 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                    {DOC_TABLE_COLUMN_IDS.filter((id) => id !== 'actions').map((id) => (
                                        <label key={id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-[var(--cta-button-bg)]"
                                                checked={columnVisibility[id] !== false}
                                                onChange={() => setColumnVisibility((m) => ({ ...m, [id]: !(m[id] !== false) }))}
                                            />
                                            {DOC_COLUMN_LABEL[id]}
                                        </label>
                                    ))}
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
                            <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setExportMenuOpen((o) => !o)}>
                                <LuDownload size={18} />
                                Export
                                <LuChevronDown size={16} className="opacity-70" />
                            </Button>
                            {exportMenuOpen ? (
                                <div className="absolute right-0 top-[calc(100%+6px)] z-300 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => exportCsv(selectedIds.size ? selectedRows : filtered)}>
                                        <LuDownload size={16} className="text-slate-400" />
                                        CSV
                                    </button>
                                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => window.print()}>
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
                            <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={() => selectedRows.forEach((d) => verifyDoc(d))}>
                                <LuShieldCheck size={16} />
                                Verify
                            </Button>
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
                                    setDocuments((prev) => prev.filter((d) => !selectedIds.has(d.id)));
                                    setSelectedIds(new Set());
                                    pushActivity(`Bulk deleted ${count} selected document(s).`);
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

                    {/* Table desktop */}
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
                                        {columnVisibility.vendor !== false ? (
                                            <th className="min-w-[120px] whitespace-normal px-4 py-3 text-left">{DOC_COLUMN_LABEL.vendor}</th>
                                        ) : null}
                                        {columnVisibility.type !== false ? (
                                            <th className="min-w-[100px] whitespace-nowrap px-4 py-3 text-left">{DOC_COLUMN_LABEL.type}</th>
                                        ) : null}
                                        {columnVisibility.documentFile !== false ? (
                                            <th className="min-w-[120px] whitespace-normal px-4 py-3 text-left">{DOC_COLUMN_LABEL.documentFile}</th>
                                        ) : null}
                                        {columnVisibility.documentName !== false ? (
                                            <th className="min-w-[140px] whitespace-normal px-4 py-3 text-left">{DOC_COLUMN_LABEL.documentName}</th>
                                        ) : null}
                                        {columnVisibility.uploadedDate !== false ? (
                                            <th className="min-w-[100px] whitespace-nowrap px-4 py-3 text-left">{DOC_COLUMN_LABEL.uploadedDate}</th>
                                        ) : null}
                                        {columnVisibility.expiryDate !== false ? (
                                            <th className="min-w-[100px] whitespace-nowrap px-4 py-3 text-left">{DOC_COLUMN_LABEL.expiryDate}</th>
                                        ) : null}
                                        {columnVisibility.status !== false ? (
                                            <th className="min-w-[120px] whitespace-nowrap px-4 py-3 text-left">{DOC_COLUMN_LABEL.status}</th>
                                        ) : null}
                                        {columnVisibility.verifiedBy !== false ? (
                                            <th className="min-w-[100px] whitespace-normal px-4 py-3 text-left">{DOC_COLUMN_LABEL.verifiedBy}</th>
                                        ) : null}
                                        {columnVisibility.verifiedDate !== false ? (
                                            <th className="min-w-[100px] whitespace-nowrap px-4 py-3 text-left">{DOC_COLUMN_LABEL.verifiedDate}</th>
                                        ) : null}
                                        {columnVisibility.actions !== false ? (
                                            <th className="min-w-[200px] whitespace-nowrap px-4 py-3 text-right">{DOC_COLUMN_LABEL.actions}</th>
                                        ) : null}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((d) => {
                                        const vName = vendorNameById.get(d.vendorId) ?? d.vendorId;
                                        const { dateExpired, expiringSoon } = rowVisual(d);
                                        return (
                                            <tr
                                                key={d.id}
                                                className={cn(
                                                    'border-b border-slate-100 transition-colors hover:bg-slate-50/90',
                                                    expiringSoon && 'bg-orange-50/40',
                                                    dateExpired && 'border-l-4 border-l-rose-500 bg-rose-50/20',
                                                )}
                                            >
                                                <td className="px-2 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(d.id)}
                                                        onChange={(e) =>
                                                            setSelectedIds((prev) => {
                                                                const next = new Set(prev);
                                                                if (e.target.checked) next.add(d.id);
                                                                else next.delete(d.id);
                                                                return next;
                                                            })
                                                        }
                                                        className="rounded border-slate-300 text-[var(--cta-button-bg)]"
                                                        aria-label={`Select ${d.documentName}`}
                                                    />
                                                </td>
                                                {columnVisibility.vendor !== false ? (
                                                    <td className="max-w-0 truncate px-4 py-3" title={vName}>
                                                        <Link href={`/company-admin/vendors/${encodeURIComponent(d.vendorId)}`} className="font-medium text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline">
                                                            {vName}
                                                        </Link>
                                                    </td>
                                                ) : null}
                                                {columnVisibility.type !== false ? <td className="px-4 py-3 text-slate-700">{d.type}</td> : null}
                                                {columnVisibility.documentFile !== false ? (
                                                    <td className="max-w-0 truncate px-4 py-3 font-mono text-xs text-slate-700" title={d.fileName ?? `${d.documentName}.pdf`}>
                                                        {d.fileName?.trim() || '—'}
                                                    </td>
                                                ) : null}
                                                {columnVisibility.documentName !== false ? (
                                                    <td className="max-w-0 truncate px-4 py-3" title={d.documentName}>
                                                        <button
                                                            type="button"
                                                            className="font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                                                            onClick={() => {
                                                                openView(d);
                                                                setMobileMenuId(null);
                                                            }}
                                                            aria-label={`View ${d.documentName}`}
                                                        >
                                                            {d.documentName}
                                                        </button>
                                                    </td>
                                                ) : null}
                                                {columnVisibility.uploadedDate !== false ? <td className="px-4 py-3 tabular-nums text-slate-600">{fmtDisplayDate(d.uploadedDate)}</td> : null}
                                                {columnVisibility.expiryDate !== false ? <td className="px-4 py-3 tabular-nums text-slate-600">{fmtDisplayDate(d.expiryDate)}</td> : null}
                                                {columnVisibility.status !== false ? (
                                                    <td className="px-4 py-3">
                                                        <VerificationBadge status={d.verificationStatus} />
                                                    </td>
                                                ) : null}
                                                {columnVisibility.verifiedBy !== false ? (
                                                    <td className="max-w-0 truncate px-4 py-3 text-slate-600" title={getVerifiedByDisplay(d)}>
                                                        {getVerifiedByDisplay(d)}
                                                    </td>
                                                ) : null}
                                                {columnVisibility.verifiedDate !== false ? (
                                                    <td className="px-4 py-3 tabular-nums text-slate-600">{fmtDisplayDate(d.verifiedDate)}</td>
                                                ) : null}
                                                {columnVisibility.actions !== false ? (
                                                    <td className="px-4 py-3">
                                                        <div className="relative flex justify-end">
                                                            <button
                                                                type="button"
                                                                className="inline-flex items-center justify-center rounded-lg transition-all focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border bg-white shadow-sm hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:border-[color-mix(in_srgb,var(--cta-button-bg)_38%,transparent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)] h-8 gap-1 border-slate-200 px-2 text-xs font-semibold text-slate-700"
                                                                aria-label="Open actions"
                                                                aria-expanded={mobileMenuId === d.id}
                                                                onClick={(e) => toggleActionMenu(d.id, e.currentTarget)}
                                                            >
                                                                Actions
                                                                <LuChevronDown size={14} className={cn('transition', mobileMenuId === d.id && 'rotate-180')} />
                                                            </button>
                                                            {mobileMenuId === d.id && actionMenuPos ? (
                                                                <div
                                                                    className="fixed z-600 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                                                                    style={{ top: actionMenuPos.top, left: actionMenuPos.left }}
                                                                >
                                                                    <MenuRow icon={<LuEye size={16} />} onClick={() => {
                                                                openView(d);
                                                                setMobileMenuId(null);
                                                            }}>
                                                                        View
                                                                    </MenuRow>
                                                                    <MenuRow icon={<LuDownload size={16} />} onClick={() => {
                                                                        downloadDocument(d);
                                                                        setMobileMenuId(null);
                                                                    }}>
                                                                        Download
                                                                    </MenuRow>
                                                                    <MenuRow icon={<LuPencil size={16} />} onClick={() => {
                                                                        openEdit(d);
                                                                        setMobileMenuId(null);
                                                                    }}>
                                                                        Edit
                                                                    </MenuRow>
                                                                    <MenuRow
                                                                        icon={<LuTrash2 size={16} />}
                                                                        onClick={() => {
                                                                            setMobileMenuId(null);
                                                                            openDelete(d);
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </MenuRow>
                                                                    <MenuRow icon={<LuShieldCheck size={16} />} onClick={() => verifyDoc(d)}>
                                                                        Verify
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
                                    <LuUpload className="mx-auto h-10 w-10 text-slate-400" aria-hidden />
                                    <p className="mt-3 text-sm font-semibold text-slate-800">No documents uploaded yet.</p>
                                    <p className="mt-1 text-sm text-slate-500">Upload compliance files to track verification and expiry.</p>
                                    <Button type="button" variant="company" size="cta" className="mt-5 gap-2" onClick={openCreate}>
                                        <LuPlus size={18} />
                                        Add First Document
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </section>

                {/* Cards mobile / tablet */}
                <section className="w-full space-y-3 lg:hidden">
                        {filtered.length === 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                                <LuUpload className="mx-auto h-10 w-10 text-slate-400" />
                                <p className="mt-3 font-semibold text-slate-800">No documents uploaded yet.</p>
                                <Button type="button" variant="company" size="cta" className="mt-4 gap-2" onClick={openCreate}>
                                    <LuPlus size={18} />
                                    Add First Document
                                </Button>
                            </div>
                        ) : (
                            filtered.map((d) => {
                                const vName = vendorNameById.get(d.vendorId) ?? d.vendorId;
                                const { dateExpired, expiringSoon } = rowVisual(d);
                                const open = mobileMenuId === d.id;
                                return (
                                    <article
                                        key={d.id}
                                        className={cn(
                                            'relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
                                            expiringSoon && 'bg-orange-50/50',
                                            dateExpired && 'border-l-4 border-l-rose-500',
                                            open && 'z-50',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900">{d.documentName}</p>
                                                <dl className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
                                                    <div>
                                                        <dt className="font-semibold text-slate-500">{DOC_COLUMN_LABEL.vendor}</dt>
                                                        <dd className="mt-0.5 font-medium text-slate-800">{vName}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="font-semibold text-slate-500">{DOC_COLUMN_LABEL.type}</dt>
                                                        <dd className="mt-0.5 font-medium text-slate-800">{d.type}</dd>
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <dt className="font-semibold text-slate-500">{DOC_COLUMN_LABEL.documentFile}</dt>
                                                        <dd className="mt-0.5 font-mono font-medium text-slate-800">{d.fileName?.trim() || '—'}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="font-semibold text-slate-500">{DOC_COLUMN_LABEL.uploadedDate}</dt>
                                                        <dd className="mt-0.5 font-medium tabular-nums">{fmtDisplayDate(d.uploadedDate)}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="font-semibold text-slate-500">{DOC_COLUMN_LABEL.expiryDate}</dt>
                                                        <dd className="mt-0.5 font-medium tabular-nums">{fmtDisplayDate(d.expiryDate)}</dd>
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <dt className="font-semibold text-slate-500">{DOC_COLUMN_LABEL.status}</dt>
                                                        <dd className="mt-1">
                                                            <VerificationBadge status={d.verificationStatus} />
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="font-semibold text-slate-500">{DOC_COLUMN_LABEL.verifiedBy}</dt>
                                                        <dd className="mt-0.5 font-medium">{getVerifiedByDisplay(d)}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="font-semibold text-slate-500">{DOC_COLUMN_LABEL.verifiedDate}</dt>
                                                        <dd className="mt-0.5 font-medium tabular-nums">{fmtDisplayDate(d.verifiedDate)}</dd>
                                                    </div>
                                                </dl>
                                            </div>
                                            <div className="relative shrink-0">
                                                <button
                                                    type="button"
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                                                    aria-expanded={open}
                                                    onClick={(e) => toggleActionMenu(d.id, e.currentTarget)}
                                                >
                                                    <LuEllipsisVertical size={20} />
                                                </button>
                                                {open && actionMenuPos ? (
                                                    <div
                                                        className="fixed z-600 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                                                        style={{ top: actionMenuPos.top, left: actionMenuPos.left }}
                                                    >
                                                        <MenuRow icon={<LuEye size={16} />} onClick={() => {
                                                                openView(d);
                                                                setMobileMenuId(null);
                                                            }}>
                                                            View
                                                        </MenuRow>
                                                        <MenuRow icon={<LuDownload size={16} />} onClick={() => {
                                                                        downloadDocument(d);
                                                                        setMobileMenuId(null);
                                                                    }}>
                                                            Download
                                                        </MenuRow>
                                                        <MenuRow icon={<LuPencil size={16} />} onClick={() => {
                                                                        openEdit(d);
                                                                        setMobileMenuId(null);
                                                                    }}>
                                                            Edit
                                                        </MenuRow>
                                                        <MenuRow
                                                            icon={<LuTrash2 size={16} />}
                                                            onClick={() => {
                                                                setMobileMenuId(null);
                                                                openDelete(d);
                                                            }}
                                                        >
                                                            Delete
                                                        </MenuRow>
                                                        <MenuRow icon={<LuShieldCheck size={16} />} onClick={() => verifyDoc(d)}>
                                                            Verify
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
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document type</label>
                                <select className={`mt-1.5 ${selectClass}`} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                                    <option value="all">All types</option>
                                    {uniqueTypes.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                <select className={`mt-1.5 ${selectClass}`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="all">All statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Verified">Verified</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Expired">Expired</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry</label>
                                <select className={`mt-1.5 ${selectClass}`} value={expiryFilter} onChange={(e) => setExpiryFilter(e.target.value)}>
                                    <option value="all">Any expiry</option>
                                    <option value="expiring">Expiring (30 days)</option>
                                    <option value="expired">Expired</option>
                                    <option value="valid">Valid / not expired</option>
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
                <p className="mb-3 text-sm text-slate-600">
                    Save the current search and filter combination for quick reuse on this page.
                </p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                    placeholder="e.g. Expiring this month"
                />
            </Modal>

            <Modal
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                title="Import documents"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setImportOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={runImport} disabled={!importFilename.trim()}>
                            Import
                        </Button>
                    </>
                }
            >
                <p className="mb-3 text-sm text-slate-600">Upload CSV/XLS file to import document records (demo flow).</p>
                <input
                    type="file"
                    onChange={(e) => setImportFilename(e.target.files?.[0]?.name ?? '')}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-[color-mix(in_srgb,var(--cta-button-bg)_18%,white)]"
                />
                {importFilename ? <p className="mt-2 text-xs text-slate-500">Selected: {importFilename}</p> : null}
            </Modal>

            {documentModals}

            {/* Click-away mobile menu */}
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

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={onClick}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
        >
            {children}
        </button>
    );
}

function MenuRow({ icon, children, onClick }: { icon: ReactNode; children: ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClick}
        >
            <span className="text-slate-500">{icon}</span>
            {children}
        </button>
    );
}

function SummaryRow({
    ok,
    okLabel,
    warnLabel,
    warningMode,
    dangerMode,
}: {
    ok: boolean;
    okLabel: string;
    warnLabel: string;
    warningMode?: boolean;
    dangerMode?: boolean;
}) {
    return (
        <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
            <span className="font-medium text-slate-700">{ok ? okLabel : warnLabel}</span>
            {ok ? (
                <LuCircleCheck className="shrink-0 text-emerald-600" size={18} aria-hidden />
            ) : warningMode ? (
                <LuCircleAlert className="shrink-0 text-amber-500" size={18} aria-hidden />
            ) : dangerMode ? (
                <LuCircleX className="shrink-0 text-rose-600" size={18} aria-hidden />
            ) : (
                <LuCircleX className="shrink-0 text-slate-400" size={18} aria-hidden />
            )}
        </li>
    );
}
