'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { ConfirmModal } from '@/components/booking-payment/ConfirmModal';
import { ComplianceDemoRoleSelect } from '@/components/documents-compliance/ComplianceDemoRoleSelect';
import { ComplianceNotificationsBell } from '@/components/documents-compliance/ComplianceNotificationsBell';
import { DocumentVersionModal } from '@/components/documents-compliance/DocumentVersionModal';
import { DocumentRowActionsDropdown } from '@/components/documents-compliance/DocumentRowActionsDropdown';
import { COMPLIANCE_SELECT_FILTER_CLASS, COMPLIANCE_SEARCH_INPUT_CLASS } from '@/components/documents-compliance/complianceFilterStyles';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_FLOW_LINK_SEMIBOLD,
    CTA_INPUT_FOCUS,
    CTA_SHADOW_SOFT,
} from '@/lib/theme/ctaThemeClasses';
import { canDelete, canEdit, canUpload, canView, COMPLIANCE_ROLE_LABELS } from '@/lib/complianceRbac';
import { useComplianceRole } from '@/hooks/useComplianceRole';
import { useComplianceStoreBump } from '@/hooks/useComplianceStoreBump';
import {
    DOCUMENT_CATEGORY_OPTIONS,
    DOCUMENT_TYPE_OPTIONS,
    getComplianceStatus,
    getCurrentVersion,
    getPreviousVersion,
    formatComplianceFileSize,
    getUploadDateYmd,
    getProjectLookupOptions,
    listActiveDocuments,
    logDownload,
    logView,
    softDeleteDocument,
    type ComplianceDocumentRecord,
} from '@/lib/complianceDocumentsMockStore';
import { formatShortDate } from '@/lib/formatDate';
import { downloadComplianceDocumentsCsv } from '@/lib/exportComplianceDocumentsCsv';
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
    LuX,
} from 'react-icons/lu';

const ACTOR_NAME = 'Company Admin User';
const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-documents-compliance-datatable-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-documents-compliance-saved-views';
const DOCS_HUB = '/company-admin/documents-compliance';

const DOCS_TABLE_DATA_COLUMN_META = [
    { id: 'name', label: 'Document name' },
    { id: 'doc_id', label: 'Document ID' },
    { id: 'documentType', label: 'Type' },
    { id: 'fileName', label: 'File' },
    { id: 'fileSize', label: 'Size' },
    { id: 'uploadDate', label: 'Upload date' },
    { id: 'uploadedBy', label: 'Uploaded by' },
    { id: 'bookingId', label: 'Booking ID' },
    { id: 'customerId', label: 'Customer ID' },
    { id: 'projectId', label: 'Project ID' },
    { id: 'version', label: 'Version' },
    { id: 'prevVersion', label: 'Previous ver.' },
    { id: 'accessLevel', label: 'Access' },
    { id: 'allowedRoles', label: 'Allowed roles' },
] as const;

/** Default: five key data columns on; row actions always on. Other columns off until the user enables them. */
const DOCS_TABLE_DEFAULT_ON = new Set<string>([
    'name',
    'documentType',
    'fileName',
    'uploadDate',
    'projectId',
    'actions',
]);

type DocumentsComplianceFilterPayload = {
    searchTerm: string;
    typeFilter: string;
    projectFilter: string;
    categoryFilter: string;
    dateFrom: string;
    dateTo: string;
    statusFilter: 'All' | 'Active' | 'Expired';
};

type SavedComplianceView = { id: string; name: string; payload: DocumentsComplianceFilterPayload };

function defaultComplianceFilters(): DocumentsComplianceFilterPayload {
    return {
        searchTerm: '',
        typeFilter: 'All',
        projectFilter: 'All',
        categoryFilter: 'All',
        dateFrom: '',
        dateTo: '',
        statusFilter: 'All',
    };
}

function sortDocumentsList(rows: ComplianceDocumentRecord[], sort: DataTableSortState): ComplianceDocumentRecord[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        const vaVer = getCurrentVersion(a);
        const vbVer = getCurrentVersion(b);
        const vaPrev = getPreviousVersion(a);
        const vbPrev = getPreviousVersion(b);
        switch (col) {
            case 'name':
                va = a.name.toLowerCase();
                vb = b.name.toLowerCase();
                break;
            case 'doc_id':
                va = a.id.toLowerCase();
                vb = b.id.toLowerCase();
                break;
            case 'documentType':
                va = a.documentType.toLowerCase();
                vb = b.documentType.toLowerCase();
                break;
            case 'fileName':
                va = (vaVer?.fileName ?? '').toLowerCase();
                vb = (vbVer?.fileName ?? '').toLowerCase();
                break;
            case 'fileSize':
                va = vaVer?.sizeBytes ?? 0;
                vb = vbVer?.sizeBytes ?? 0;
                break;
            case 'uploadDate':
                va = getUploadDateYmd(a);
                vb = getUploadDateYmd(b);
                break;
            case 'uploadedBy':
                va = (vaVer?.uploadedBy ?? '').toLowerCase();
                vb = (vbVer?.uploadedBy ?? '').toLowerCase();
                break;
            case 'bookingId':
                va = (a.bookingId ?? '').toLowerCase();
                vb = (b.bookingId ?? '').toLowerCase();
                break;
            case 'customerId':
                va = (a.customerId ?? '').toLowerCase();
                vb = (b.customerId ?? '').toLowerCase();
                break;
            case 'projectId':
                va = (a.projectId ?? '').toLowerCase();
                vb = (b.projectId ?? '').toLowerCase();
                break;
            case 'version':
                va = vaVer?.version ?? 0;
                vb = vbVer?.version ?? 0;
                break;
            case 'prevVersion':
                va = vaPrev ? `${vaPrev.version} ${vaPrev.fileName}`.toLowerCase() : '';
                vb = vbPrev ? `${vbPrev.version} ${vbPrev.fileName}`.toLowerCase() : '';
                break;
            case 'accessLevel':
                va = a.accessLevel;
                vb = b.accessLevel;
                break;
            case 'allowedRoles':
                va = a.allowedRoles.join(',').toLowerCase();
                vb = b.allowedRoles.join(',').toLowerCase();
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export function DocumentManagementDashboard() {
    const router = useRouter();
    const pathname = usePathname() ?? DOCS_HUB;
    const globalViewsTick = useGlobalSavedViewsSync();
    const bump = useComplianceStoreBump();
    const { role } = useComplianceRole();
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('All');
    const [projectFilter, setProjectFilter] = useState<string>('All');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Expired'>('All');

    const [drawerOpen, setDrawerOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'uploadDate', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...DOCS_TABLE_DATA_COLUMN_META.map((c) => c.id), 'actions' as const];
        return Object.fromEntries(allIds.map((id) => [id, DOCS_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        name: 200,
        doc_id: 140,
        documentType: 120,
        fileName: 180,
        fileSize: 100,
        uploadDate: 120,
        uploadedBy: 120,
        bookingId: 120,
        customerId: 110,
        projectId: 130,
        version: 80,
        prevVersion: 160,
        accessLevel: 100,
        allowedRoles: 160,
        actions: 128,
    });

    const [versionId, setVersionId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const projectOptions = useMemo(() => getProjectLookupOptions(), []);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Documents', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedComplianceView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as DocumentsComplianceFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = { ...defaultComplianceFilters(), ...(f as DocumentsComplianceFilterPayload) };
        setSearchTerm(p.searchTerm ?? '');
        setSearchDraft(p.searchTerm ?? '');
        setTypeFilter(p.typeFilter);
        setProjectFilter(p.projectFilter);
        setCategoryFilter(p.categoryFilter);
        setDateFrom(p.dateFrom);
        setDateTo(p.dateTo);
        setStatusFilter(p.statusFilter);
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearchTerm((prev) => (prev === searchDraft ? prev : searchDraft));
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

    const allDocs = useMemo(() => listActiveDocuments(), [bump]);

    const filteredDocs = useMemo(() => {
        let list = allDocs;
        const q = searchTerm.trim().toLowerCase();
        if (q) {
            list = list.filter((d) => {
                const v = getCurrentVersion(d);
                const fileName = v?.fileName?.toLowerCase() ?? '';
                return (
                    d.name.toLowerCase().includes(q) ||
                    d.documentType.toLowerCase().includes(q) ||
                    d.projectId.toLowerCase().includes(q) ||
                    d.bookingId.toLowerCase().includes(q) ||
                    d.customerId.toLowerCase().includes(q) ||
                    d.id.toLowerCase().includes(q) ||
                    fileName.includes(q)
                );
            });
        }
        if (typeFilter !== 'All') list = list.filter((d) => d.documentType === typeFilter);
        if (projectFilter !== 'All') list = list.filter((d) => d.projectId === projectFilter);
        if (categoryFilter !== 'All') list = list.filter((d) => d.categories.includes(categoryFilter));
        if (dateFrom) list = list.filter((d) => getUploadDateYmd(d) >= dateFrom);
        if (dateTo) list = list.filter((d) => getUploadDateYmd(d) <= dateTo);
        if (statusFilter !== 'All') list = list.filter((d) => getComplianceStatus(d.expiryDate) === statusFilter);
        return list;
    }, [allDocs, searchTerm, typeFilter, projectFilter, categoryFilter, dateFrom, dateTo, statusFilter]);

    const sortedFilteredDocs = useMemo(() => sortDocumentsList(filteredDocs, sort), [filteredDocs, sort]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, typeFilter, projectFilter, categoryFilter, dateFrom, dateTo, statusFilter, sort, bump]);

    const totalPages = Math.max(1, Math.ceil(sortedFilteredDocs.length / ITEMS_PER_PAGE));
    const paginatedDocs = useMemo(
        () => sortedFilteredDocs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFilteredDocs, currentPage],
    );

    const hasAdvancedFilters =
        typeFilter !== 'All' ||
        projectFilter !== 'All' ||
        categoryFilter !== 'All' ||
        dateFrom !== '' ||
        dateTo !== '' ||
        statusFilter !== 'All';

    const hasActiveFilters = searchTerm.trim() !== '' || hasAdvancedFilters;

    const persistSavedViews = (views: SavedComplianceView[]) => {
        replaceViewsForRoute(
            pathname,
            'Documents',
            views.map((x) => ({ id: x.id, name: x.name, payload: x.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        const payload: DocumentsComplianceFilterPayload = {
            searchTerm: searchDraft,
            typeFilter,
            projectFilter,
            categoryFilter,
            dateFrom,
            dateTo,
            statusFilter,
        };
        persistSavedViews([...savedViews, { id: `v-${Date.now()}`, name, payload }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const applySavedView = (v: SavedComplianceView) => {
        const p = { ...defaultComplianceFilters(), ...v.payload };
        setSearchTerm(p.searchTerm ?? '');
        setSearchDraft(p.searchTerm ?? '');
        setTypeFilter(p.typeFilter);
        setProjectFilter(p.projectFilter);
        setCategoryFilter(p.categoryFilter);
        setDateFrom(p.dateFrom);
        setDateTo(p.dateTo);
        setStatusFilter(p.statusFilter);
        setDrawerOpen(false);
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((x) => x.id !== id));
    };

    const resetListFilters = () => {
        setSearchDraft('');
        setSearchTerm('');
        setTypeFilter('All');
        setProjectFilter('All');
        setCategoryFilter('All');
        setDateFrom('');
        setDateTo('');
        setStatusFilter('All');
    };

    const onView = (id: string) => {
        if (!canView(role)) return;
        logView(id, { name: ACTOR_NAME, role });
        router.push(`${DOCS_HUB}/${encodeURIComponent(id)}`);
    };

    const onDownload = (d: ComplianceDocumentRecord) => {
        const v = getCurrentVersion(d);
        if (!v) return;
        logView(d.id, { name: ACTOR_NAME, role });
        logDownload(d.id, { name: ACTOR_NAME, role });
        window.open(v.storageUrl, '_blank', 'noopener,noreferrer');
        setToast({ msg: 'Opening signed download URL…' });
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        softDeleteDocument(deleteId, { name: ACTOR_NAME, role });
        setDeleteId(null);
        setToast({ msg: 'Document moved to Deleted Records.' });
    };

    const selectedRows = useMemo(
        () => sortedFilteredDocs.filter((d) => selectedIds.has(d.id)),
        [sortedFilteredDocs, selectedIds],
    );

    const exportRowsForScope = () => (selectedIds.size ? selectedRows : sortedFilteredDocs);

    const runExportCsv = (filename: string) => {
        downloadComplianceDocumentsCsv(exportRowsForScope(), filename);
        setExportMenuOpen(false);
    };

    const runExportExcelCsv = () => {
        downloadComplianceDocumentsCsv(exportRowsForScope(), 'documents-excel.csv');
        setExportMenuOpen(false);
    };

    const bulkExportCsv = () => {
        downloadComplianceDocumentsCsv(
            exportRowsForScope(),
            selectedIds.size ? 'documents-selected.csv' : 'documents-export.csv',
        );
    };

    const runBulkDelete = () => {
        const ids = [...selectedIds];
        if (!ids.length) return;
        ids.forEach((id) => softDeleteDocument(id, { name: ACTOR_NAME, role }));
        setSelectedIds(new Set());
        setBulkDeleteOpen(false);
        setToast({ msg: `${ids.length} document(s) moved to Deleted Records.` });
    };

    const columns: DataTableColumn<ComplianceDocumentRecord>[] = useMemo(
        () => [
            {
                id: 'name',
                header: 'Document name',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.name.toLowerCase(),
                minWidth: 200,
                render: (row) =>
                    canView(role) ? (
                        <Link
                            href={`${DOCS_HUB}/${encodeURIComponent(row.id)}`}
                            className="min-w-0 truncate font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline"
                            onClick={() => logView(row.id, { name: ACTOR_NAME, role })}
                        >
                            {row.name}
                        </Link>
                    ) : (
                        <span className="font-semibold text-slate-900">{row.name}</span>
                    ),
            },
            {
                id: 'doc_id',
                header: 'Document ID',
                sortable: true,
                sortValue: (row) => row.id.toLowerCase(),
                minWidth: 140,
                render: (row) => <span className="font-mono text-xs text-slate-600">{row.id}</span>,
            },
            {
                id: 'documentType',
                header: 'Type',
                sortable: true,
                sortValue: (row) => row.documentType,
                minWidth: 120,
                render: (row) => <span className="text-slate-700">{row.documentType}</span>,
            },
            {
                id: 'fileName',
                header: 'File',
                sortable: true,
                sortValue: (row) => (getCurrentVersion(row)?.fileName ?? '').toLowerCase(),
                minWidth: 180,
                render: (row) => {
                    const v = getCurrentVersion(row);
                    return (
                        <span className="block max-w-[220px] truncate font-mono text-xs text-slate-700" title={v?.fileName ?? ''}>
                            {v?.fileName ?? '—'}
                        </span>
                    );
                },
            },
            {
                id: 'fileSize',
                header: 'Size',
                sortable: true,
                sortValue: (row) => getCurrentVersion(row)?.sizeBytes ?? 0,
                minWidth: 100,
                render: (row) => {
                    const v = getCurrentVersion(row);
                    return <span className="text-slate-600">{v ? formatComplianceFileSize(v.sizeBytes) : '—'}</span>;
                },
            },
            {
                id: 'uploadDate',
                header: 'Upload date',
                sortable: true,
                sortValue: (row) => getUploadDateYmd(row),
                minWidth: 120,
                render: (row) => (
                    <span className="tabular-nums text-slate-600">{formatShortDate(getUploadDateYmd(row))}</span>
                ),
            },
            {
                id: 'uploadedBy',
                header: 'Uploaded by',
                sortable: true,
                sortValue: (row) => (getCurrentVersion(row)?.uploadedBy ?? '').toLowerCase(),
                minWidth: 120,
                render: (row) => <span className="text-slate-600">{getCurrentVersion(row)?.uploadedBy ?? '—'}</span>,
            },
            {
                id: 'bookingId',
                header: 'Booking ID',
                sortable: true,
                sortValue: (row) => (row.bookingId ?? '').toLowerCase(),
                minWidth: 120,
                render: (row) => (
                    <span className="max-w-[140px] truncate font-mono text-xs text-slate-600" title={row.bookingId || undefined}>
                        {row.bookingId || '—'}
                    </span>
                ),
            },
            {
                id: 'customerId',
                header: 'Customer ID',
                sortable: true,
                sortValue: (row) => (row.customerId ?? '').toLowerCase(),
                minWidth: 110,
                render: (row) => <span className="font-mono text-xs text-slate-600">{row.customerId || '—'}</span>,
            },
            {
                id: 'projectId',
                header: 'Project ID',
                sortable: true,
                sortValue: (row) => (row.projectId ?? '').toLowerCase(),
                minWidth: 130,
                render: (row) => (
                    <span className="max-w-[160px] truncate text-slate-600" title={row.projectId}>
                        {row.projectId || '—'}
                    </span>
                ),
            },
            {
                id: 'version',
                header: 'Version',
                sortable: true,
                sortValue: (row) => getCurrentVersion(row)?.version ?? 0,
                minWidth: 80,
                render: (row) => <span className="font-mono text-xs">{getCurrentVersion(row)?.version ?? '—'}</span>,
            },
            {
                id: 'prevVersion',
                header: 'Previous ver.',
                sortable: true,
                sortValue: (row) => {
                    const p = getPreviousVersion(row);
                    return p ? `${p.version} ${p.fileName}`.toLowerCase() : '';
                },
                minWidth: 160,
                render: (row) => {
                    const prev = getPreviousVersion(row);
                    return (
                        <span
                            className="max-w-[200px] truncate font-mono text-xs text-slate-600"
                            title={
                                prev
                                    ? `v${prev.version} · ${prev.fileName} · ${formatComplianceFileSize(prev.sizeBytes)}`
                                    : undefined
                            }
                        >
                            {prev ? (
                                <span>
                                    v{prev.version} · <span className="text-slate-500">{prev.fileName}</span>
                                </span>
                            ) : (
                                '—'
                            )}
                        </span>
                    );
                },
            },
            {
                id: 'accessLevel',
                header: 'Access',
                sortable: true,
                sortValue: (row) => row.accessLevel,
                minWidth: 100,
                render: (row) => <span className="capitalize text-slate-600">{row.accessLevel}</span>,
            },
            {
                id: 'allowedRoles',
                header: 'Allowed roles',
                sortable: true,
                sortValue: (row) => row.allowedRoles.join(',').toLowerCase(),
                minWidth: 160,
                render: (row) => {
                    const rolesLabel = row.allowedRoles.map((r) => COMPLIANCE_ROLE_LABELS[r]).join(', ');
                    return (
                        <span className="max-w-[200px] text-xs leading-snug text-slate-600" title={rolesLabel}>
                            {rolesLabel || '—'}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                minWidth: 128,
                cellClassName: 'text-right',
                render: (row) => (
                    <DocumentRowActionsDropdown
                        canViewDoc={canView(role)}
                        canEditDoc={canEdit(role)}
                        canDeleteDoc={canDelete(role)}
                        onView={() => onView(row.id)}
                        onDownload={() => onDownload(row)}
                        onEdit={() => router.push(`${DOCS_HUB}/${encodeURIComponent(row.id)}/edit`)}
                        onVersions={() => setVersionId(row.id)}
                        onDelete={() => setDeleteId(row.id)}
                    />
                ),
            },
        ],
        [role, onView, onDownload, router],
    );

    return (
        <div className="space-y-6">
            <Breadcrumb
                items={[
                    { label: 'Documents & Compliance' },
                ]}
            />
            {toast ? (
                <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={() => setToast(null)} />
            ) : null}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Document management</h1>
                        <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
                            Search and filter compliance documents; open a row to view details, upload, or edit on dedicated pages.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <ComplianceDemoRoleSelect className="max-w-xs" />
                    <ComplianceNotificationsBell />
                </div>
            </div>

            {/* Toolbar — same pattern as Leads list */}
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                    <div className="relative max-w-xl flex-1">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search name, type, file, project, booking, customer, ID…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setSearchTerm(searchDraft);
                                }
                            }}
                            className={COMPLIANCE_SEARCH_INPUT_CLASS}
                            aria-label="Search documents"
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
                                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                <p className="px-3 pb-2 text-[10px] leading-snug text-slate-500">
                                    Key columns on by default — enable more below.
                                </p>
                                {DOCS_TABLE_DATA_COLUMN_META.map(({ id, label }) => (
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
                                    onClick={() =>
                                        runExportCsv(selectedIds.size ? 'documents-selected.csv' : 'documents-export.csv')
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
                    {canUpload(role) ? (
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className={cn('shrink-0 gap-2', CTA_SHADOW_SOFT)}
                            onClick={() => router.push(`${DOCS_HUB}/new`)}
                        >
                            <LuPlus size={18} />
                            Create document
                        </Button>
                    ) : null}
                </div>
            </div>

            {hasActiveFilters && allDocs.length > 0 ? (
                <p className="text-xs font-medium text-slate-500">
                    Filtered table: {filteredDocs.length} of {allDocs.length} document{allDocs.length === 1 ? '' : 's'}
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

            <DataTable<ComplianceDocumentRecord>
                columns={columns}
                data={paginatedDocs}
                getRowId={(row) => row.id}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                stickyColumnId="name"
                enableClientSort={false}
                selection={{
                    rowKey: 'id',
                    selectedIds,
                    onSelectedIdsChange: setSelectedIds,
                }}
                emptyMessage={
                    allDocs.length === 0
                        ? 'No documents yet. Use Upload document to add one.'
                        : 'No documents match your filters.'
                }
            />

            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sortedFilteredDocs.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="documents"
                />
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
                                <label htmlFor="doc-filter-type" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Document type
                                </label>
                                <select
                                    id="doc-filter-type"
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                >
                                    <option value="All">All types</option>
                                    {[...DOCUMENT_TYPE_OPTIONS].map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="doc-filter-project" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Project
                                </label>
                                <select
                                    id="doc-filter-project"
                                    value={projectFilter}
                                    onChange={(e) => setProjectFilter(e.target.value)}
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                >
                                    <option value="All">All projects</option>
                                    {projectOptions.map((p) => (
                                        <option key={p.value} value={p.value}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="doc-filter-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Compliance status
                                </label>
                                <select
                                    id="doc-filter-status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                >
                                    <option value="All">All statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="doc-filter-category" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Category
                                </label>
                                <select
                                    id="doc-filter-category"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                >
                                    <option value="All">All categories</option>
                                    {DOCUMENT_CATEGORY_OPTIONS.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="doc-filter-from" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Upload date from
                                </label>
                                <input
                                    id="doc-filter-from"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                />
                            </div>
                            <div>
                                <label htmlFor="doc-filter-to" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Upload date to
                                </label>
                                <input
                                    id="doc-filter-to"
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

            <DocumentVersionModal
                open={!!versionId}
                documentId={versionId}
                onClose={() => setVersionId(null)}
                uploadedBy={ACTOR_NAME}
                userRole={role}
            />

            <ConfirmModal
                open={!!deleteId}
                title="Soft delete document?"
                message="This record moves to Deleted Records. Audit history is preserved."
                confirmLabel="Move to deleted"
                onCancel={() => setDeleteId(null)}
                onConfirm={confirmDelete}
            />

            <ConfirmModal
                open={bulkDeleteOpen}
                title="Delete selected documents?"
                message={`${selectedIds.size} record(s) will move to Deleted Records. Audit history is preserved.`}
                confirmLabel="Move to deleted"
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
                    Save the current search and advanced filters (type, project, status, category, dates) for quick access from the Filters
                    panel.
                </p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Active · KYC · Tower A"
                />
            </Modal>
        </div>
    );
}
