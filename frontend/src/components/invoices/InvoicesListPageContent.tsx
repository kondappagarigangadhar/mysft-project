'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { InvoiceRowActionsMenu } from '@/components/invoices/InvoiceRowActionsMenu';
import { BpStatusBadge } from '@/components/booking-payment/BpStatusBadge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import {
    archiveInvoice,
    formatMoney,
    getInvoices,
    INVOICE_EXPORT_STATUSES,
    INVOICE_PAYMENT_STATUSES,
    INVOICE_VALIDATION_STATUSES,
    isInvoiceOverdue,
    type Invoice,
    type InvoiceExportStatus,
    type InvoicePaymentStatus,
    type InvoiceValidationStatus,
} from '@/lib/invoiceStore';
import { downloadInvoicesCsv } from '@/lib/exportInvoicesCsv';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import {
    LuBookmark,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuPlus,
    LuSearch,
    LuTriangleAlert,
    LuUpload,
    LuX,
} from 'react-icons/lu';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const VALIDATION_FILTER_OPTIONS = ['All', ...INVOICE_VALIDATION_STATUSES] as const;
const PAYMENT_FILTER_OPTIONS = ['All', ...INVOICE_PAYMENT_STATUSES] as const;
const EXPORT_FILTER_OPTIONS = ['All', ...INVOICE_EXPORT_STATUSES] as const;
const PARTY_FILTER_OPTIONS = ['All', 'Vendor', 'Supplier'] as const;

const TABLE_STORAGE_KEY = 'invoices-list-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-invoices-saved-views';
const ITEMS_PER_PAGE = 10;

const INVOICE_TABLE_DATA_COLUMN_IDS = [
    'invoiceId',
    'invoiceNumber',
    'companyName',
    'partyName',
    'linkedProject',
    'linkedWorkOrderId',
    'linkedPaymentId',
    'invoiceDate',
    'dueDate',
    'invoiceAmount',
    'taxAmount',
    'paidAmount',
    'balanceAmount',
    'validationStatus',
    'paymentStatus',
    'exportStatus',
    'assignedFinanceUser',
    'updatedAt',
] as const;

const INVOICE_TABLE_DEFAULT_ON = new Set<string>([
    'invoiceId',
    'invoiceNumber',
    'partyName',
    'linkedProject',
    'invoiceDate',
    'dueDate',
    'totalAmountVisible', // placeholder; replaced below
    'invoiceAmount',
    'paidAmount',
    'balanceAmount',
    'validationStatus',
    'paymentStatus',
    'exportStatus',
    'assignedFinanceUser',
    'updatedAt',
    'actions',
]);

const COLUMN_LABEL: Record<string, string> = {
    invoiceId: 'Invoice ID',
    invoiceNumber: 'Invoice Number',
    companyName: 'Company Name',
    partyName: 'Vendor / Supplier',
    linkedProject: 'Project Name',
    linkedWorkOrderId: 'Linked Work Order',
    linkedPaymentId: 'Linked Payment',
    invoiceDate: 'Invoice Date',
    dueDate: 'Due Date',
    invoiceAmount: 'Invoice Amount',
    taxAmount: 'Tax Amount',
    paidAmount: 'Paid Amount',
    balanceAmount: 'Balance Amount',
    validationStatus: 'Validation',
    paymentStatus: 'Payment',
    exportStatus: 'Export',
    assignedFinanceUser: 'Assigned Finance User',
    updatedAt: 'Last Updated',
};

type InvoicesFilterPayload = {
    search: string;
    validation: string;
    payment: string;
    export: string;
    party: string;
    project: string;
    counterparty: string;
    workOrder: string;
    company: string;
    invoiceDate: string;
    dueDate: string;
};

type SavedInvoicesView = { id: string; name: string; payload: InvoicesFilterPayload };

function defaultFilters(): InvoicesFilterPayload {
    return {
        search: '',
        validation: 'All',
        payment: 'All',
        export: 'All',
        party: 'All',
        project: 'All',
        counterparty: 'All',
        workOrder: 'All',
        company: 'All',
        invoiceDate: '',
        dueDate: '',
    };
}

function validationTone(status: InvoiceValidationStatus | string) {
    if (status === 'Approved') return 'success' as const;
    if (status === 'Rejected') return 'danger' as const;
    return 'warning' as const;
}

function paymentTone(status: InvoicePaymentStatus | string) {
    if (status === 'Paid') return 'success' as const;
    if (status === 'Pending') return 'warning' as const;
    if (status === 'Partial') return 'warning' as const;
    return 'neutral' as const;
}

function exportTone(status: InvoiceExportStatus | string) {
    if (status === 'Exported') return 'success' as const;
    if (status === 'Failed') return 'danger' as const;
    if (status === 'Queued') return 'warning' as const;
    return 'neutral' as const;
}

function sortInvoices(rows: Invoice[], sort: DataTableSortState): Invoice[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'invoiceId':
                va = a.invoiceId;
                vb = b.invoiceId;
                break;
            case 'invoiceNumber':
                va = (a.invoiceNumber || '').toLowerCase();
                vb = (b.invoiceNumber || '').toLowerCase();
                break;
            case 'companyName':
                va = (a.companyName || '').toLowerCase();
                vb = (b.companyName || '').toLowerCase();
                break;
            case 'partyName':
                va = (a.partyName || '').toLowerCase();
                vb = (b.partyName || '').toLowerCase();
                break;
            case 'linkedProject':
                va = (a.linkedProject || '').toLowerCase();
                vb = (b.linkedProject || '').toLowerCase();
                break;
            case 'linkedWorkOrderId':
                va = a.linkedWorkOrderId || '';
                vb = b.linkedWorkOrderId || '';
                break;
            case 'linkedPaymentId':
                va = a.linkedPaymentId || '';
                vb = b.linkedPaymentId || '';
                break;
            case 'invoiceDate':
                va = a.invoiceDate || '';
                vb = b.invoiceDate || '';
                break;
            case 'dueDate':
                va = a.dueDate || '';
                vb = b.dueDate || '';
                break;
            case 'invoiceAmount':
                va = Number(a.invoiceAmount) || 0;
                vb = Number(b.invoiceAmount) || 0;
                break;
            case 'taxAmount':
                va = Number(a.taxAmount) || 0;
                vb = Number(b.taxAmount) || 0;
                break;
            case 'paidAmount':
                va = Number(a.paidAmount) || 0;
                vb = Number(b.paidAmount) || 0;
                break;
            case 'balanceAmount':
                va = Number(a.balanceAmount) || 0;
                vb = Number(b.balanceAmount) || 0;
                break;
            case 'validationStatus':
                va = a.validation?.status || '';
                vb = b.validation?.status || '';
                break;
            case 'paymentStatus':
                va = a.paymentStatus || '';
                vb = b.paymentStatus || '';
                break;
            case 'exportStatus':
                va = a.exportStatus || '';
                vb = b.exportStatus || '';
                break;
            case 'assignedFinanceUser':
                va = (a.assignedFinanceUser || '').toLowerCase();
                vb = (b.assignedFinanceUser || '').toLowerCase();
                break;
            case 'updatedAt':
                va = a.updatedAt || '';
                vb = b.updatedAt || '';
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function InvoicesListPageContent() {
    const router = useRouter();
    const globalViewsTick = useGlobalSavedViewsSync();
    const pathname = '/company-admin/invoices';

    const [refresh, setRefresh] = useState(0);
    const [filters, setFilters] = useState<InvoicesFilterPayload>(defaultFilters());
    const [searchDraft, setSearchDraft] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [importOpen, setImportOpen] = useState(false);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'updatedAt', direction: 'desc' });
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [banner, setBanner] = useState<string | null>(null);

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        invoiceId: 120,
        invoiceNumber: 160,
        companyName: 200,
        partyName: 200,
        linkedProject: 180,
        linkedWorkOrderId: 140,
        linkedPaymentId: 130,
        invoiceDate: 130,
        dueDate: 130,
        invoiceAmount: 130,
        taxAmount: 120,
        paidAmount: 130,
        balanceAmount: 130,
        validationStatus: 130,
        paymentStatus: 130,
        exportStatus: 140,
        assignedFinanceUser: 180,
        updatedAt: 170,
        actions: 120,
    });

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...INVOICE_TABLE_DATA_COLUMN_IDS, 'actions' as const];
        return Object.fromEntries(allIds.map((id) => [id, INVOICE_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });

    const columnMenuRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Invoices', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, []);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key && e.key.startsWith('arris-invoices-v1')) setRefresh((x) => x + 1);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const invoices = useMemo(() => getInvoices(), [refresh]);

    /* ------------------------------ filter catalogs ------------------------ */
    const projectOptionsForFilter = useMemo(() => {
        const set = new Set<string>();
        invoices.forEach((i) => i.linkedProject && set.add(i.linkedProject));
        return ['All', ...Array.from(set).sort()];
    }, [invoices]);

    const counterpartyOptionsForFilter = useMemo(() => {
        const set = new Set<string>();
        invoices.forEach((i) => i.partyName && set.add(i.partyName));
        return ['All', ...Array.from(set).sort()];
    }, [invoices]);

    const workOrderOptionsForFilter = useMemo(() => {
        const set = new Set<string>();
        invoices.forEach((i) => i.linkedWorkOrderId && set.add(i.linkedWorkOrderId));
        return ['All', ...Array.from(set).sort()];
    }, [invoices]);

    const companyOptionsForFilter = useMemo(() => {
        const set = new Set<string>();
        invoices.forEach((i) => i.companyName && set.add(i.companyName));
        return ['All', ...Array.from(set).sort()];
    }, [invoices]);

    const savedViews = useMemo((): SavedInvoicesView[] => {
        return loadGlobalSavedViews()
            .filter((view) => normalizeSavedViewRoute(view.route) === normalizeSavedViewRoute(pathname))
            .map((view) => ({ id: view.id, name: view.name, payload: view.filters as InvoicesFilterPayload }));
        
    }, [globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const payload = { ...defaultFilters(), ...(f as InvoicesFilterPayload) };
        setFilters(payload);
        setSearchDraft(payload.search);
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((prev) => (prev.search === searchDraft ? prev : { ...prev, search: searchDraft }));
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

    /* ------------------------------ filtering & sorting ------------------- */
    const filtered = useMemo(() => {
        const q = filters.search.trim().toLowerCase();
        return invoices.filter((inv) => {
            if (q) {
                const hay =
                    `${inv.invoiceId} ${inv.invoiceNumber} ${inv.partyName} ${inv.companyName} ${inv.linkedProject} ${inv.linkedWorkOrderId} ${inv.linkedPaymentId} ${inv.assignedFinanceUser}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (filters.validation !== 'All' && (inv.validation?.status ?? 'Pending') !== filters.validation) return false;
            if (filters.payment !== 'All' && inv.paymentStatus !== filters.payment) return false;
            if (filters.export !== 'All' && inv.exportStatus !== filters.export) return false;
            if (filters.party !== 'All' && inv.partyType !== filters.party) return false;
            if (filters.project !== 'All' && inv.linkedProject !== filters.project) return false;
            if (filters.counterparty !== 'All' && inv.partyName !== filters.counterparty) return false;
            if (filters.workOrder !== 'All' && inv.linkedWorkOrderId !== filters.workOrder) return false;
            if (filters.company !== 'All' && inv.companyName !== filters.company) return false;
            if (filters.invoiceDate && inv.invoiceDate !== filters.invoiceDate) return false;
            if (filters.dueDate && inv.dueDate !== filters.dueDate) return false;
            return true;
        });
    }, [filters, invoices]);

    const sorted = useMemo(() => sortInvoices(filtered, sort), [filtered, sort]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sort]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sorted, currentPage],
    );

    const hasActiveFilters =
        filters.search.trim() !== '' ||
        filters.validation !== 'All' ||
        filters.payment !== 'All' ||
        filters.export !== 'All' ||
        filters.party !== 'All' ||
        filters.project !== 'All' ||
        filters.counterparty !== 'All' ||
        filters.workOrder !== 'All' ||
        filters.company !== 'All' ||
        filters.invoiceDate !== '' ||
        filters.dueDate !== '';

    /* ------------------------------ saved-views handlers ------------------ */
    const persistSavedViews = (views: SavedInvoicesView[]) => {
        replaceViewsForRoute(
            pathname,
            'Invoices',
            views.map((view) => ({ id: view.id, name: view.name, payload: view.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };
    const deleteSavedView = (id: string) => persistSavedViews(savedViews.filter((v) => v.id !== id));
    const applySavedView = (view: SavedInvoicesView) => {
        setFilters({ ...defaultFilters(), ...view.payload });
        setSearchDraft(view.payload.search ?? '');
        setDrawerOpen(false);
    };
    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        persistSavedViews([...savedViews, { id: `inv-${Date.now()}`, name, payload: { ...filters } }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };
    const resetFilters = () => {
        setFilters(defaultFilters());
        setSearchDraft('');
        setCurrentPage(1);
    };

    /* ------------------------------ export handlers ----------------------- */
    const exportRows = selected.size ? sorted.filter((s) => selected.has(s.slug)) : sorted;
    const downloadJson = (filename: string) => {
        const blob = new Blob([JSON.stringify(exportRows, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        setExportMenuOpen(false);
        setBanner(`Exported ${exportRows.length} invoice record(s).`);
    };
    const downloadCsv = () => {
        downloadInvoicesCsv(exportRows, selected.size ? 'invoices-selected.csv' : 'invoices-export.csv');
        setExportMenuOpen(false);
        setBanner(`Exported ${exportRows.length} invoice record(s) as CSV.`);
    };

    /* ------------------------------ row archive handler ------------------- */
    const onArchiveRow = (row: Invoice) => {
        const ok = window.confirm(`Archive invoice "${row.invoiceId}"? You can restore it later.`);
        if (!ok) return;
        if (archiveInvoice(row.slug)) {
            setRefresh((x) => x + 1);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(row.slug);
                return next;
            });
            setBanner(`Archived ${row.invoiceId}.`);
        } else {
            setBanner(`Could not archive ${row.invoiceId}.`);
        }
    };

    /* ------------------------------ columns ------------------------------- */
    const columns: DataTableColumn<Invoice>[] = [
        {
            id: 'invoiceId',
            header: 'Invoice ID',
            sortable: true,
            sortValue: (r) => r.invoiceId,
            minWidth: 120,
            render: (r) => (
                <Link
                    href={`/company-admin/invoices/view/${encodeURIComponent(r.slug)}?tab=overview`}
                    className="font-mono text-xs font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {r.invoiceId}
                </Link>
            ),
        },
        {
            id: 'invoiceNumber',
            header: 'Invoice Number',
            sortable: true,
            sortValue: (r) => r.invoiceNumber,
            sticky: true,
            minWidth: 200,
            render: (r) => (
                <div className="min-w-0">
                    <Link
                        href={`/company-admin/invoices/view/${encodeURIComponent(r.slug)}?tab=overview`}
                        className="block truncate font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                    >
                        {r.invoiceNumber?.trim() ? r.invoiceNumber : r.invoiceId}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
                        <span>{r.partyName?.trim() || '—'}</span>
                        <span className="text-slate-300">•</span>
                        <span>{r.partyType}</span>
                    </div>
                </div>
            ),
        },
        {
            id: 'companyName',
            header: 'Company Name',
            sortable: true,
            sortValue: (r) => r.companyName,
            minWidth: 180,
            render: (r) => <span className="text-sm font-medium text-slate-700">{r.companyName?.trim() || '—'}</span>,
        },
        {
            id: 'partyName',
            header: 'Vendor / Supplier',
            sortable: true,
            sortValue: (r) => r.partyName,
            minWidth: 200,
            render: (r) => <span className="text-sm font-medium text-slate-700">{r.partyName?.trim() || '—'}</span>,
        },
        {
            id: 'linkedProject',
            header: 'Project Name',
            sortable: true,
            sortValue: (r) => r.linkedProject,
            minWidth: 180,
            render: (r) => <span className="text-sm font-medium text-slate-700">{r.linkedProject?.trim() || '—'}</span>,
        },
        {
            id: 'linkedWorkOrderId',
            header: 'Linked Work Order',
            sortable: true,
            sortValue: (r) => r.linkedWorkOrderId,
            minWidth: 150,
            render: (r) =>
                r.linkedWorkOrderId?.trim() ? (
                    <Link
                        href={`/work-orders/view/${encodeURIComponent(r.linkedWorkOrderId.toLowerCase())}?tab=overview`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-xs font-semibold text-[var(--cta-button-bg)] hover:underline"
                    >
                        {r.linkedWorkOrderId}
                    </Link>
                ) : (
                    <span className="text-sm text-slate-400">—</span>
                ),
        },
        {
            id: 'linkedPaymentId',
            header: 'Linked Payment',
            sortable: true,
            sortValue: (r) => r.linkedPaymentId,
            minWidth: 140,
            render: (r) => <span className="font-mono text-xs text-slate-700">{r.linkedPaymentId?.trim() || '—'}</span>,
        },
        {
            id: 'invoiceDate',
            header: 'Invoice Date',
            sortable: true,
            sortValue: (r) => r.invoiceDate,
            minWidth: 130,
            render: (r) => <span className="text-sm font-medium text-slate-700">{r.invoiceDate || '—'}</span>,
        },
        {
            id: 'dueDate',
            header: 'Due Date',
            sortable: true,
            sortValue: (r) => r.dueDate,
            minWidth: 130,
            render: (r) => {
                const overdue = isInvoiceOverdue({ dueDate: r.dueDate, paymentStatus: r.paymentStatus });
                return (
                    <span className={cn('inline-flex items-center gap-1 text-sm font-medium', overdue ? 'text-rose-700' : 'text-slate-700')}>
                        {overdue ? <LuTriangleAlert size={14} aria-hidden /> : null}
                        {r.dueDate || '—'}
                    </span>
                );
            },
        },
        {
            id: 'invoiceAmount',
            header: 'Invoice Amount',
            sortable: true,
            sortValue: (r) => Number(r.invoiceAmount) || 0,
            minWidth: 130,
            cellClassName: 'text-right',
            headerClassName: 'text-right',
            render: (r) => <span className="font-medium text-slate-800 tabular-nums">{formatMoney(r.invoiceAmount, r.currency)}</span>,
        },
        {
            id: 'taxAmount',
            header: 'Tax Amount',
            sortable: true,
            sortValue: (r) => Number(r.taxAmount) || 0,
            minWidth: 120,
            cellClassName: 'text-right',
            headerClassName: 'text-right',
            render: (r) => <span className="font-medium text-slate-700 tabular-nums">{formatMoney(r.taxAmount, r.currency)}</span>,
        },
        {
            id: 'paidAmount',
            header: 'Paid Amount',
            sortable: true,
            sortValue: (r) => Number(r.paidAmount) || 0,
            minWidth: 130,
            cellClassName: 'text-right',
            headerClassName: 'text-right',
            render: (r) => <span className="font-medium text-emerald-700 tabular-nums">{formatMoney(r.paidAmount, r.currency)}</span>,
        },
        {
            id: 'balanceAmount',
            header: 'Balance',
            sortable: true,
            sortValue: (r) => Number(r.balanceAmount) || 0,
            minWidth: 130,
            cellClassName: 'text-right',
            headerClassName: 'text-right',
            render: (r) => <span className="font-semibold text-amber-700 tabular-nums">{formatMoney(r.balanceAmount, r.currency)}</span>,
        },
        {
            id: 'validationStatus',
            header: 'Validation',
            sortable: true,
            sortValue: (r) => r.validation?.status ?? '',
            minWidth: 130,
            render: (r) => <BpStatusBadge tone={validationTone(r.validation?.status ?? 'Pending')}>{r.validation?.status ?? 'Pending'}</BpStatusBadge>,
        },
        {
            id: 'paymentStatus',
            header: 'Payment',
            sortable: true,
            sortValue: (r) => r.paymentStatus,
            minWidth: 130,
            render: (r) => <BpStatusBadge tone={paymentTone(r.paymentStatus)}>{r.paymentStatus}</BpStatusBadge>,
        },
        {
            id: 'exportStatus',
            header: 'Export',
            sortable: true,
            sortValue: (r) => r.exportStatus,
            minWidth: 140,
            render: (r) => <BpStatusBadge tone={exportTone(r.exportStatus)}>{r.exportStatus}</BpStatusBadge>,
        },
        {
            id: 'assignedFinanceUser',
            header: 'Assigned Finance User',
            sortable: true,
            sortValue: (r) => r.assignedFinanceUser,
            minWidth: 180,
            render: (r) => <span className="text-sm font-medium text-slate-700">{r.assignedFinanceUser?.trim() || '—'}</span>,
        },
        {
            id: 'updatedAt',
            header: 'Last Updated',
            sortable: true,
            sortValue: (r) => r.updatedAt,
            minWidth: 170,
            render: (r) => (
                <span className="text-sm font-medium text-slate-700 tabular-nums">
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            minWidth: 120,
            stickyEnd: true,
            cellClassName: 'text-right',
            render: (r) => (
                <InvoiceRowActionsMenu
                    invoice={r}
                    onArchived={onArchiveRow}
                    onDuplicated={(created) => setBanner(`Duplicated ${r.invoiceId} → ${created.invoiceId}.`)}
                />
            ),
        },
    ];

    /* ------------------------------ render ------------------------------- */
    return (
        <div className="mx-auto w-full px-2 pb-10 sm:px-4">
            <Breadcrumb items={[{ label: 'Procurement Management' }, { label: 'Invoice & Payments' }]} />

            <div className="mb-6 mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoice &amp; Payments</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Track vendor &amp; supplier invoices, validate finance approval, record payments, and export to accounting.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link href="/company-admin/invoices/drafts">
                        <Button variant="companyOutline" size="cta" className="gap-2">
                            Drafts
                        </Button>
                    </Link>
                    <Link href="/company-admin/invoices/view/new?tab=overview">
                        <Button variant="company" size="cta" className="gap-2">
                            <LuPlus size={16} />
                            Create Invoice
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                    <div className="relative min-w-[200px] max-w-xl flex-1">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search invoice number, ID, vendor, project, finance user…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--cta-button-bg)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
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
                            <div className="absolute right-0 top-[calc(100%+6px)] z-300 max-h-[400px] w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                {INVOICE_TABLE_DATA_COLUMN_IDS.map((id) => (
                                    <label
                                        key={id}
                                        className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                    >
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-[var(--cta-button-bg)]"
                                            checked={columnVisibility[id] !== false}
                                            onChange={() => setColumnVisibility((m) => ({ ...m, [id]: m[id] === false }))}
                                        />
                                        {COLUMN_LABEL[id] ?? id}
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
                            <div className="absolute right-0 top-[calc(100%+6px)] z-300 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                    onClick={downloadCsv}
                                >
                                    <LuFileText size={16} className="text-slate-400" />
                                    CSV (Excel)
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                    onClick={() => downloadJson('invoices-export.json')}
                                >
                                    <LuDownload size={16} className="text-slate-400" />
                                    JSON
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {banner ? <div className="rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-3 py-2 text-sm font-medium text-slate-800">{banner}</div> : null}

            {selected.size > 0 ? (
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-semibold text-slate-900">{selected.size} selected</div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="companyOutline" size="sm" className="bg-white" onClick={downloadCsv}>
                            Export CSV
                        </Button>
                        <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelected(new Set())}>
                            Clear
                        </Button>
                    </div>
                </div>
            ) : null}

            <DataTable<Invoice>
                columns={columns}
                data={paginated}
                getRowId={(row) => row.slug}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                selection={{ rowKey: 'slug', selectedIds: selected, onSelectedIdsChange: setSelected }}
                stickyColumnId="invoiceNumber"
                emptyMessage="No invoices found."
                enableClientSort={false}
                onRowClick={(row) => router.push(`/company-admin/invoices/view/${encodeURIComponent(row.slug)}?tab=overview`)}
            />

            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sorted.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="invoices"
                />
            </div>

            {/* Filter drawer */}
            {drawerOpen ? (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
                        onClick={() => setDrawerOpen(false)}
                        aria-label="Close filters"
                    />
                    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Filters</h2>
                            <button
                                type="button"
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                onClick={() => setDrawerOpen(false)}
                            >
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <DrawerSelect
                                label="Validation Status"
                                value={filters.validation}
                                onChange={(v) => setFilters((f) => ({ ...f, validation: v }))}
                                options={[...VALIDATION_FILTER_OPTIONS]}
                            />
                            <DrawerSelect
                                label="Payment Status"
                                value={filters.payment}
                                onChange={(v) => setFilters((f) => ({ ...f, payment: v }))}
                                options={[...PAYMENT_FILTER_OPTIONS]}
                            />
                            <DrawerSelect
                                label="Export Status"
                                value={filters.export}
                                onChange={(v) => setFilters((f) => ({ ...f, export: v }))}
                                options={[...EXPORT_FILTER_OPTIONS]}
                            />
                            <DrawerSelect
                                label="Counterparty Type"
                                value={filters.party}
                                onChange={(v) => setFilters((f) => ({ ...f, party: v }))}
                                options={[...PARTY_FILTER_OPTIONS]}
                            />
                            <DrawerSelect
                                label="Project"
                                value={filters.project}
                                onChange={(v) => setFilters((f) => ({ ...f, project: v }))}
                                options={projectOptionsForFilter}
                            />
                            <DrawerSelect
                                label="Vendor / Supplier"
                                value={filters.counterparty}
                                onChange={(v) => setFilters((f) => ({ ...f, counterparty: v }))}
                                options={counterpartyOptionsForFilter}
                            />
                            <DrawerSelect
                                label="Work Order"
                                value={filters.workOrder}
                                onChange={(v) => setFilters((f) => ({ ...f, workOrder: v }))}
                                options={workOrderOptionsForFilter}
                            />
                            <DrawerSelect
                                label="Company"
                                value={filters.company}
                                onChange={(v) => setFilters((f) => ({ ...f, company: v }))}
                                options={companyOptionsForFilter}
                            />

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice Date</label>
                                <input
                                    type="date"
                                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    value={filters.invoiceDate}
                                    onChange={(e) => setFilters((f) => ({ ...f, invoiceDate: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due Date</label>
                                <input
                                    type="date"
                                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    value={filters.dueDate}
                                    onChange={(e) => setFilters((f) => ({ ...f, dueDate: e.target.value }))}
                                />
                            </div>

                            {savedViews.length > 0 ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved views</p>
                                    <ul className="mt-2 space-y-1">
                                        {savedViews.map((view) => (
                                            <li key={view.id} className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-slate-800 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                                    onClick={() => applySavedView(view)}
                                                >
                                                    {view.name}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600"
                                                    onClick={() => deleteSavedView(view.id)}
                                                >
                                                    ✕
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
                    <p className="mb-3 text-sm text-slate-600">Save the current search and filters for quick reuse.</p>
                    <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                    <input
                        value={saveViewName}
                        onChange={(e) => setSaveViewName(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                        placeholder="e.g. Approved · Pending Payment"
                    />
                </Modal>

            <Modal
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                title="Import invoices"
                footer={
                    <Button type="button" variant="company" size="cta" onClick={() => setImportOpen(false)}>
                        Done
                    </Button>
                }
            >
                <p className="text-sm text-slate-600">
                    CSV import is ready to wire to your API. Column mapping can plug in without changing this table UI.
                </p>
            </Modal>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Filter drawer select                                                       */
/* -------------------------------------------------------------------------- */

function DrawerSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (next: string) => void;
    options: string[];
}) {
    return (
        <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
            <select
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    );
}
