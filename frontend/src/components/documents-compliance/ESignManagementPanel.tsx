'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { ConfirmModal } from '@/components/booking-payment/ConfirmModal';
import { ESignRecordDetailView } from '@/components/documents-compliance/ESignRecordDetailView';
import { Modal } from '@/components/ui/Modal';
import { ComplianceDemoRoleSelect } from '@/components/documents-compliance/ComplianceDemoRoleSelect';
import { ComplianceNotificationsBell } from '@/components/documents-compliance/ComplianceNotificationsBell';
import { COMPLIANCE_SELECT_FILTER_CLASS, COMPLIANCE_SEARCH_INPUT_CLASS } from '@/components/documents-compliance/complianceFilterStyles';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_FLOW_LINK_SEMIBOLD,
    CTA_FOCUS_VISIBLE_RING,
    CTA_INPUT_FOCUS,
    CTA_SHADOW_SOFT,
} from '@/lib/theme/ctaThemeClasses';
import { useComplianceRole } from '@/hooks/useComplianceRole';
import { useComplianceStoreBump } from '@/hooks/useComplianceStoreBump';
import { canDelete, canESign, canView } from '@/lib/complianceRbac';
import { deleteESignRecord, getESignRecords, type ESignRecord } from '@/lib/complianceDocumentsMockStore';
import { formatShortDate } from '@/lib/formatDate';
import { downloadComplianceEsignCsv } from '@/lib/exportComplianceEsignCsv';
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
    LuEye,
    LuFileText,
    LuPencil,
    LuFilter,
    LuPenLine,
    LuSearch,
    LuTrash2,
    LuX,
} from 'react-icons/lu';

const STATUS_OPTIONS: Array<'All' | ESignRecord['status']> = ['All', 'Pending', 'Signed', 'Failed'];

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-esign-datatable-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-compliance-esign-saved-views';
const ESIGN_HUB = '/company-admin/documents-compliance/esign';
const ESIGN_NEW_PATH = '/company-admin/documents-compliance/esign/new';
const esignEditPath = (id: string) => `${ESIGN_HUB}/${encodeURIComponent(id)}/edit`;
const complianceDocumentHref = (documentId: string) =>
    `/company-admin/documents-compliance/${encodeURIComponent(documentId)}`;

type ESignFilterPayload = {
    searchTerm: string;
    statusFilter: (typeof STATUS_OPTIONS)[number];
    dateFrom: string;
    dateTo: string;
};

type SavedESignView = { id: string; name: string; payload: ESignFilterPayload };

function defaultESignFilters(): ESignFilterPayload {
    return { searchTerm: '', statusFilter: 'All', dateFrom: '', dateTo: '' };
}

function sortESignList(rows: ESignRecord[], sort: DataTableSortState): ESignRecord[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'documentName':
                va = a.documentName.toLowerCase();
                vb = b.documentName.toLowerCase();
                break;
            case 'documentId':
                va = a.documentId.toLowerCase();
                vb = b.documentId.toLowerCase();
                break;
            case 'signerName':
                va = a.signerName.toLowerCase();
                vb = b.signerName.toLowerCase();
                break;
            case 'aadhaarMasked':
                va = a.aadhaarMasked.toLowerCase();
                vb = b.aadhaarMasked.toLowerCase();
                break;
            case 'transactionId':
                va = a.transactionId.toLowerCase();
                vb = b.transactionId.toLowerCase();
                break;
            case 'status':
                va = a.status;
                vb = b.status;
                break;
            case 'signedAt':
                va = a.signedAt ?? '';
                vb = b.signedAt ?? '';
                break;
            case 'createdAt':
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

export function ESignManagementPanel() {
    const router = useRouter();
    const pathname = usePathname() ?? ESIGN_HUB;
    const globalViewsTick = useGlobalSavedViewsSync();
    const bump = useComplianceStoreBump();
    const { role } = useComplianceRole();
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [drawerOpen, setDrawerOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'createdAt', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ESignRecord | null>(null);
    const [viewTarget, setViewTarget] = useState<ESignRecord | null>(null);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const ids = [
            'documentName',
            'documentId',
            'signerName',
            'aadhaarMasked',
            'transactionId',
            'status',
            'createdAt',
            'signedAt',
            'signedFile',
            'actions',
        ];
        return Object.fromEntries(ids.map((id) => [id, true])) as Record<string, boolean>;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        documentName: 200,
        documentId: 120,
        signerName: 140,
        aadhaarMasked: 130,
        transactionId: 140,
        status: 100,
        createdAt: 120,
        signedAt: 120,
        signedFile: 120,
        actions: 168,
    });

    useEffect(() => {
        if (!columnMenuOpen) return;
        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            const el = columnMenuRef.current;
            if (el && !el.contains(e.target as Node)) setColumnMenuOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown, { passive: true });
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
        };
    }, [columnMenuOpen]);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'eSign', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedESignView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as ESignFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = { ...defaultESignFilters(), ...(f as ESignFilterPayload) };
        setSearchTerm(p.searchTerm ?? '');
        setSearchDraft(p.searchTerm ?? '');
        setStatusFilter(p.statusFilter);
        setDateFrom(p.dateFrom);
        setDateTo(p.dateTo);
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearchTerm((prev) => (prev === searchDraft ? prev : searchDraft));
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

    const allRows = useMemo(() => getESignRecords(), [bump]);

    const filteredRows = useMemo(() => {
        let list = allRows;
        const q = searchTerm.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (r) =>
                    r.documentName.toLowerCase().includes(q) ||
                    r.signerName.toLowerCase().includes(q) ||
                    r.transactionId.toLowerCase().includes(q) ||
                    r.id.toLowerCase().includes(q) ||
                    r.documentId.toLowerCase().includes(q)
            );
        }
        if (statusFilter !== 'All') list = list.filter((r) => r.status === statusFilter);
        if (dateFrom) list = list.filter((r) => r.createdAt.slice(0, 10) >= dateFrom);
        if (dateTo) list = list.filter((r) => r.createdAt.slice(0, 10) <= dateTo);
        return list;
    }, [allRows, searchTerm, statusFilter, dateFrom, dateTo]);

    const sortedFilteredDocs = useMemo(() => sortESignList(filteredRows, sort), [filteredRows, sort]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, dateFrom, dateTo, sort, bump]);

    const totalPages = Math.max(1, Math.ceil(sortedFilteredDocs.length / ITEMS_PER_PAGE));
    const paginatedDocs = useMemo(
        () => sortedFilteredDocs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFilteredDocs, currentPage],
    );

    const hasAdvancedFilters = statusFilter !== 'All' || dateFrom !== '' || dateTo !== '';
    const hasActiveFilters = searchTerm.trim() !== '' || hasAdvancedFilters;

    const persistSavedViews = (views: SavedESignView[]) => {
        replaceViewsForRoute(
            pathname,
            'eSign',
            views.map((x) => ({ id: x.id, name: x.name, payload: x.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        const payload: ESignFilterPayload = {
            searchTerm: searchDraft,
            statusFilter,
            dateFrom,
            dateTo,
        };
        persistSavedViews([...savedViews, { id: `v-${Date.now()}`, name, payload }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const applySavedView = (v: SavedESignView) => {
        const p = { ...defaultESignFilters(), ...v.payload };
        setSearchTerm(p.searchTerm ?? '');
        setSearchDraft(p.searchTerm ?? '');
        setStatusFilter(p.statusFilter);
        setDateFrom(p.dateFrom);
        setDateTo(p.dateTo);
        setDrawerOpen(false);
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((x) => x.id !== id));
    };

    const resetListFilters = () => {
        setSearchDraft('');
        setSearchTerm('');
        setStatusFilter('All');
        setDateFrom('');
        setDateTo('');
    };

    const selectedRows = useMemo(
        () => sortedFilteredDocs.filter((d) => selectedIds.has(d.id)),
        [sortedFilteredDocs, selectedIds],
    );

    const exportRowsForScope = () => (selectedIds.size ? selectedRows : sortedFilteredDocs);

    const runExportCsv = (filename: string) => {
        downloadComplianceEsignCsv(exportRowsForScope(), filename);
        setExportMenuOpen(false);
    };

    const runExportExcelCsv = () => {
        downloadComplianceEsignCsv(exportRowsForScope(), 'esign-excel.csv');
        setExportMenuOpen(false);
    };

    const bulkExportCsv = () => {
        downloadComplianceEsignCsv(
            exportRowsForScope(),
            selectedIds.size ? 'esign-selected.csv' : 'esign-export.csv',
        );
    };

    const runBulkDelete = () => {
        if (!canDelete(role)) return;
        const ids = [...selectedIds];
        if (!ids.length) return;
        let ok = 0;
        ids.forEach((id) => {
            if (deleteESignRecord(id)) ok += 1;
        });
        setSelectedIds(new Set());
        setBulkDeleteOpen(false);
        setToast({ msg: ok === ids.length ? `${ok} eSign request(s) removed.` : `${ok} of ${ids.length} removed.` });
    };

    const confirmSingleDelete = () => {
        if (!deleteTarget) return;
        if (!canDelete(role)) return;
        if (deleteESignRecord(deleteTarget.id)) {
            setToast({ msg: 'eSign request removed.' });
        } else {
            setToast({ msg: 'Could not remove request.', err: true });
        }
        setDeleteTarget(null);
    };

    const columns: DataTableColumn<ESignRecord>[] = useMemo(
        () => [
            {
                id: 'documentName',
                header: 'Document',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.documentName.toLowerCase(),
                minWidth: 200,
                render: (row) => (
                    <Link
                        href={complianceDocumentHref(row.documentId)}
                        className={cn(
                            CTA_FLOW_LINK_SEMIBOLD,
                            'rounded underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                            CTA_FOCUS_VISIBLE_RING,
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {row.documentName}
                    </Link>
                ),
            },
            {
                id: 'documentId',
                header: 'Document ID',
                sortable: true,
                sortValue: (row) => row.documentId.toLowerCase(),
                minWidth: 120,
                render: (row) => (
                    <Link
                        href={complianceDocumentHref(row.documentId)}
                        className={cn(
                            CTA_FLOW_LINK_SEMIBOLD,
                            'rounded font-mono text-xs underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                            CTA_FOCUS_VISIBLE_RING,
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {row.documentId}
                    </Link>
                ),
            },
            {
                id: 'signerName',
                header: 'Signer',
                sortable: true,
                sortValue: (row) => row.signerName.toLowerCase(),
                minWidth: 140,
                render: (row) => <span className="text-slate-700">{row.signerName}</span>,
            },
            {
                id: 'aadhaarMasked',
                header: 'Aadhaar',
                sortable: true,
                sortValue: (row) => row.aadhaarMasked.toLowerCase(),
                minWidth: 130,
                render: (row) => <span className="font-mono text-xs text-slate-600">{row.aadhaarMasked}</span>,
            },
            {
                id: 'transactionId',
                header: 'Transaction',
                sortable: true,
                sortValue: (row) => row.transactionId.toLowerCase(),
                minWidth: 140,
                render: (row) => <span className="font-mono text-xs text-slate-600">{row.transactionId}</span>,
            },
            {
                id: 'status',
                header: 'Status',
                sortable: true,
                sortValue: (row) => row.status,
                minWidth: 100,
                render: (row) => (
                    <span
                        className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold',
                            row.status === 'Signed' && 'bg-emerald-100 text-emerald-800',
                            row.status === 'Pending' && 'bg-amber-100 text-amber-900',
                            row.status === 'Failed' && 'bg-rose-100 text-rose-800',
                        )}
                    >
                        {row.status}
                    </span>
                ),
            },
            {
                id: 'createdAt',
                header: 'Created',
                sortable: true,
                sortValue: (row) => row.createdAt,
                minWidth: 120,
                render: (row) => (
                    <span className="tabular-nums text-slate-600">{formatShortDate(row.createdAt.slice(0, 10))}</span>
                ),
            },
            {
                id: 'signedAt',
                header: 'Signed',
                sortable: true,
                sortValue: (row) => row.signedAt ?? '',
                minWidth: 120,
                render: (row) => (
                    <span className="text-slate-600">{row.signedAt ? formatShortDate(row.signedAt.slice(0, 10)) : '—'}</span>
                ),
            },
            {
                id: 'signedFile',
                header: 'Signed file',
                sortable: false,
                minWidth: 120,
                cellClassName: 'text-right',
                render: (row) =>
                    row.signedStorageUrl ? (
                        <Button
                            type="button"
                            variant="companyGhost"
                            size="sm"
                            className="gap-1"
                            onClick={() => window.open(row.signedStorageUrl!, '_blank', 'noopener,noreferrer')}
                        >
                            <LuDownload className="h-3.5 w-3.5" /> Download
                        </Button>
                    ) : (
                        <span className="text-xs text-slate-400">—</span>
                    ),
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                minWidth: 220,
                cellClassName: 'text-right',
                render: (row) => (
                    <div className="flex flex-wrap items-center justify-end gap-1">
                        {row.status === 'Pending' && canESign(role) ? (
                            <Button
                                type="button"
                                variant="companyGhost"
                                size="sm"
                                className="gap-1"
                                aria-label={`Edit eSign ${row.transactionId}`}
                                onClick={() => router.push(esignEditPath(row.id))}
                            >
                                <LuPencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                        ) : null}
                        {canView(role) ? (
                            <Button
                                type="button"
                                variant="companyGhost"
                                size="sm"
                                className="gap-1"
                                aria-label={`View eSign ${row.transactionId}`}
                                onClick={() => setViewTarget(row)}
                            >
                                <LuEye className="h-3.5 w-3.5" /> View
                            </Button>
                        ) : null}
                        {canDelete(role) ? (
                            <Button
                                type="button"
                                variant="companyGhost"
                                size="sm"
                                className="gap-1 text-rose-700 hover:text-rose-800"
                                aria-label={`Delete eSign ${row.transactionId}`}
                                onClick={() => setDeleteTarget(row)}
                            >
                                <LuTrash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                        ) : null}
                        {!canView(role) && !canDelete(role) ? <span className="text-xs text-slate-400">—</span> : null}
                    </div>
                ),
            },
        ],
        [role, router],
    );

    return (
        <div className="space-y-6">
            <Breadcrumb
                items={[
                    { label: 'Documents & Compliance', href: '/company-admin/documents-compliance' },
                    { label: 'eSign' },
                ]}
            />
            {toast ? (
                <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={() => setToast(null)} />
            ) : null}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Aadhaar eSign</h1>
                        <p className="mt-1 max-w-2xl text-sm text-slate-600">
                            Use the table below; open <strong>New eSign request</strong> to go to the form (consent → OTP → signature placement).
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <ComplianceDemoRoleSelect className="max-w-xs" />
                    <ComplianceNotificationsBell />
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                    <div className="relative max-w-xl flex-1">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search document, signer, transaction ID…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') setSearchTerm(searchDraft);
                            }}
                            className={COMPLIANCE_SEARCH_INPUT_CLASS}
                            aria-label="Search eSign records"
                        />
                    </div>
                </div>
                <div className="order-1 flex flex-wrap items-center justify-end gap-2 sm:order-2">
                    <div className="relative" ref={columnMenuRef}>
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
                            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                {[
                                    ['documentName', 'Document'],
                                    ['documentId', 'Document ID'],
                                    ['signerName', 'Signer'],
                                    ['aadhaarMasked', 'Aadhaar'],
                                    ['transactionId', 'Transaction'],
                                    ['status', 'Status'],
                                    ['createdAt', 'Created'],
                                    ['signedAt', 'Signed'],
                                    ['signedFile', 'Signed file'],
                                ].map(([id, label]) => (
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
                        {hasActiveFilters ? (
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">On</span>
                        ) : null}
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
                                    onClick={() => runExportCsv(selectedIds.size ? 'esign-selected.csv' : 'esign-export.csv')}
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
                    <Button
                        type="button"
                        variant="company"
                        size="cta"
                            className={cn('shrink-0 gap-2', CTA_SHADOW_SOFT)}
                        onClick={() => router.push(ESIGN_NEW_PATH)}
                    >
                        <LuPenLine size={18} />
                        New eSign request
                    </Button>
                </div>
            </div>

            {hasActiveFilters && allRows.length > 0 ? (
                <p className="text-xs font-medium text-slate-500">
                    Filtered table: {filteredRows.length} of {allRows.length} transaction{allRows.length === 1 ? '' : 's'}
                </p>
            ) : null}

            {selectedIds.size > 0 ? (
                <div className={cn(CTA_BULK_BAR, 'mb-4 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between')}>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <LuCheck size={18} />
                        {selectedIds.size} selected
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={bulkExportCsv}>
                            <LuDownload size={16} />
                            Export
                        </Button>
                        {canDelete(role) ? (
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
                        ) : null}
                        <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelectedIds(new Set())}>
                            Clear
                        </Button>
                    </div>
                </div>
            ) : null}

            <DataTable<ESignRecord>
                columns={columns}
                data={paginatedDocs}
                getRowId={(row) => row.id}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                stickyColumnId="documentName"
                enableClientSort={false}
                selection={{
                    rowKey: 'id',
                    selectedIds,
                    onSelectedIdsChange: setSelectedIds,
                }}
                emptyMessage={
                    allRows.length === 0 ? 'No eSign requests yet. Click “New eSign request”.' : 'No rows match your filters.'
                }
            />

            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sortedFilteredDocs.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="transactions"
                />
            </div>

            <Modal
                isOpen={!!viewTarget}
                onClose={() => setViewTarget(null)}
                title={viewTarget ? `eSign — ${viewTarget.documentName}` : 'eSign request'}
                maxWidthClassName="max-w-lg"
                bodyClassName="max-h-[min(70vh,560px)] overflow-y-auto"
            >
                {viewTarget ? <ESignRecordDetailView record={viewTarget} /> : null}
            </Modal>

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
                                <label htmlFor="esign-filter-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    eSign status
                                </label>
                                <select
                                    id="esign-filter-status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>
                                            {s === 'All' ? 'All statuses' : s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="esign-filter-from" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Created from
                                </label>
                                <input
                                    id="esign-filter-from"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                />
                            </div>
                            <div>
                                <label htmlFor="esign-filter-to" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Created to
                                </label>
                                <input
                                    id="esign-filter-to"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                />
                            </div>
                            {savedViews.length > 0 ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                    <p className="text-xs font-semibold uppercase text-slate-500">Saved views</p>
                                    <ul className="mt-2 space-y-1">
                                        {savedViews.map((sv) => (
                                            <li key={sv.id} className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        'min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm transition',
                                                        CTA_FLOW_LINK_SEMIBOLD,
                                                        'hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:no-underline',
                                                    )}
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
                            <Button type="button" variant="companyOutline" size="cta" className="flex-1" onClick={resetListFilters}>
                                Reset
                            </Button>
                            <Button type="button" variant="company" size="cta" className="flex-1" onClick={() => setDrawerOpen(false)}>
                                Apply
                            </Button>
                        </div>
                    </aside>
                </>
            ) : null}


            <ConfirmModal
                open={!!deleteTarget}
                title="Remove eSign request?"
                message={
                    deleteTarget
                        ? `This will remove “${deleteTarget.documentName}” (${deleteTarget.transactionId}).`
                        : ''
                }
                confirmLabel="Remove"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmSingleDelete}
            />

            <ConfirmModal
                open={bulkDeleteOpen}
                title="Delete selected eSign requests?"
                message={`${selectedIds.size} request(s) will be removed from the list.`}
                confirmLabel="Remove"
                onCancel={() => setBulkDeleteOpen(false)}
                onConfirm={runBulkDelete}
            />

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
                    Save the current search and eSign filters (status, created date range) for quick access from the Filters panel.
                </p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Pending · This week"
                />
            </Modal>
        </div>
    );
}
