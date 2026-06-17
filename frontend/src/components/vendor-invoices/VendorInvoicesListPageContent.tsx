'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BpStatusBadge } from '@/components/booking-payment/BpStatusBadge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { VendorInvoiceRowActionsMenu } from '@/components/vendor-invoices/VendorInvoiceRowActionsMenu';
import {
    formatMoney,
    getVendorInvoices,
    VENDOR_INVOICE_AI_STATUSES,
    VENDOR_INVOICE_APPROVAL_STATUSES,
    VENDOR_INVOICE_PAYMENT_STATUSES,
    VENDOR_INVOICE_STORE_UPDATED_EVENT,
    type VendorInvoice,
} from '@/lib/vendorInvoiceStore';
import { LuDownload, LuFilter, LuPlus, LuSearch } from 'react-icons/lu';

const PAGE_SIZE = 10;

function toneApproval(s: string) {
    if (s === 'Approved' || s === 'Paid') return 'success' as const;
    if (s === 'Rejected') return 'danger' as const;
    if (s === 'Under Review' || s === 'Submitted') return 'warning' as const;
    return 'neutral' as const;
}

function tonePayment(s: string) {
    if (s === 'Paid') return 'success' as const;
    if (s === 'Partial') return 'warning' as const;
    return 'neutral' as const;
}

function toneAi(s: string) {
    if (s === 'Passed') return 'success' as const;
    if (s === 'High Risk') return 'danger' as const;
    return 'warning' as const;
}

export function VendorInvoicesListPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const vendorIdFilter = searchParams.get('vendorId')?.trim() || '';
    const [refresh, setRefresh] = useState(0);
    const [search, setSearch] = useState('');
    const [project, setProject] = useState('All');
    const [vendor, setVendor] = useState('All');
    const [category, setCategory] = useState('All');
    const [approval, setApproval] = useState('All');
    const [payment, setPayment] = useState('All');
    const [ai, setAi] = useState('All');
    const [page, setPage] = useState(1);
    const [filtersOpen, setFiltersOpen] = useState(false);

    useEffect(() => {
        const onEvt = () => setRefresh((n) => n + 1);
        window.addEventListener(VENDOR_INVOICE_STORE_UPDATED_EVENT, onEvt);
        return () => window.removeEventListener(VENDOR_INVOICE_STORE_UPDATED_EVENT, onEvt);
    }, []);

    const rows = useMemo(() => getVendorInvoices(), [refresh]);

    const vendorNameById = useMemo(() => {
        const map = new Map<string, string>();
        rows.forEach((r) => {
            if (r.vendorId?.trim() && r.vendorName?.trim()) {
                map.set(r.vendorId.trim(), r.vendorName.trim());
            }
        });
        return map;
    }, [rows]);

    const projectOpts = useMemo(() => ['All', ...new Set(rows.map((r) => r.linkedProject).filter(Boolean))], [rows]);
    const vendorOpts = useMemo(() => ['All', ...new Set(rows.map((r) => r.vendorName).filter(Boolean))], [rows]);

    useEffect(() => {
        if (!vendorIdFilter) return;
        const name = vendorNameById.get(vendorIdFilter);
        if (name) setVendor(name);
    }, [vendorIdFilter, vendorNameById]);
    const categoryOpts = useMemo(() => ['All', ...new Set(rows.map((r) => r.vendorCategory).filter(Boolean))], [rows]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (vendorIdFilter && r.vendorId !== vendorIdFilter) return false;
            if (project !== 'All' && r.linkedProject !== project) return false;
            if (vendor !== 'All' && r.vendorName !== vendor) return false;
            if (category !== 'All' && r.vendorCategory !== category) return false;
            if (approval !== 'All' && r.approvalStatus !== approval) return false;
            if (payment !== 'All' && r.paymentStatus !== payment) return false;
            if (ai !== 'All' && r.aiValidation.status !== ai) return false;
            if (!q) return true;
            const hay = `${r.invoiceId} ${r.invoiceNumber} ${r.vendorName} ${r.linkedWorkOrderId} ${r.linkedServiceRequestId}`.toLowerCase();
            return hay.includes(q);
        });
    }, [rows, search, project, vendor, category, approval, payment, ai, vendorIdFilter]);

    const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    return (
        <div className="space-y-4">
            <Breadcrumb items={[{ label: 'Vendor Management', href: '/company-admin/vendors/list' }, { label: 'Vendor Invoices' }]} />

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Vendor Invoice Management</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Service & maintenance vendor invoices linked to work orders and service requests.
                        {vendorIdFilter ? (
                            <>
                                {' '}
                                <Link
                                    href={`/company-admin/vendors/${encodeURIComponent(vendorIdFilter)}?tab=overview`}
                                    className="font-semibold text-[var(--cta-button-bg)] hover:underline"
                                >
                                    Back to vendor profile
                                </Link>
                            </>
                        ) : null}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="companyOutline" size="sm" onClick={() => setFiltersOpen((o) => !o)}>
                        <LuFilter size={16} />
                        Filters
                    </Button>
                    <Button type="button" variant="companyOutline" size="sm">
                        <LuDownload size={16} />
                        Export
                    </Button>
                    <Button type="button" variant="company" size="sm" onClick={() => router.push('/company-admin/vendors/invoices/view/new?tab=overview')}>
                        <LuPlus size={16} />
                        Create Vendor Invoice
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1 max-w-md">
                    <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search invoice, vendor, work order…"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm"
                    />
                </div>
            </div>

            {filtersOpen ? (
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-xs font-semibold text-slate-500">Project<select className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" value={project} onChange={(e) => { setProject(e.target.value); setPage(1); }}>{projectOpts.map((o) => <option key={o}>{o}</option>)}</select></label>
                    <label className="text-xs font-semibold text-slate-500">Vendor<select className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" value={vendor} onChange={(e) => { setVendor(e.target.value); setPage(1); }}>{vendorOpts.map((o) => <option key={o}>{o}</option>)}</select></label>
                    <label className="text-xs font-semibold text-slate-500">Category<select className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>{categoryOpts.map((o) => <option key={o}>{o}</option>)}</select></label>
                    <label className="text-xs font-semibold text-slate-500">Approval<select className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" value={approval} onChange={(e) => { setApproval(e.target.value); setPage(1); }}>{['All', ...VENDOR_INVOICE_APPROVAL_STATUSES].map((o) => <option key={o}>{o}</option>)}</select></label>
                    <label className="text-xs font-semibold text-slate-500">Payment<select className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1); }}>{['All', ...VENDOR_INVOICE_PAYMENT_STATUSES].map((o) => <option key={o}>{o}</option>)}</select></label>
                    <label className="text-xs font-semibold text-slate-500">AI Validation<select className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" value={ai} onChange={(e) => { setAi(e.target.value); setPage(1); }}>{['All', ...VENDOR_INVOICE_AI_STATUSES].map((o) => <option key={o}>{o}</option>)}</select></label>
                </div>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <tr>
                                {['Invoice ID', 'Invoice #', 'Vendor', 'Category', 'Project', 'Tower', 'Work Order', 'Service Req', 'Invoice Date', 'Due Date', 'Amount', 'Approved', 'Payment', 'Approval', 'AI', 'Finance User', 'Updated', ''].map((h) => (
                                    <th key={h || 'actions'} className="whitespace-nowrap px-3 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((r) => (
                                <tr key={r.slug} className="border-t border-slate-100 hover:bg-slate-50/60">
                                    <td className="px-3 py-2.5 font-mono text-xs">{r.invoiceId}</td>
                                    <td className="px-3 py-2.5">
                                        <Link href={`/company-admin/vendors/invoices/view/${encodeURIComponent(r.slug)}`} className="font-medium text-[var(--cta-button-bg)] hover:underline">
                                            {r.invoiceNumber}
                                        </Link>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        {r.vendorId?.trim() ? (
                                            <Link
                                                href={`/company-admin/vendors/${encodeURIComponent(r.vendorId)}?tab=overview`}
                                                className="font-medium text-[var(--cta-button-bg)] hover:underline"
                                            >
                                                {r.vendorName}
                                            </Link>
                                        ) : (
                                            r.vendorName
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">{r.vendorCategory}</td>
                                    <td className="px-3 py-2.5">{r.linkedProject}</td>
                                    <td className="px-3 py-2.5">{r.linkedTower}</td>
                                    <td className="px-3 py-2.5 font-mono text-xs">{r.linkedWorkOrderId || '—'}</td>
                                    <td className="px-3 py-2.5 font-mono text-xs">{r.linkedServiceRequestId || '—'}</td>
                                    <td className="px-3 py-2.5">{r.invoiceDate}</td>
                                    <td className="px-3 py-2.5">{r.dueDate}</td>
                                    <td className="px-3 py-2.5 font-medium">{formatMoney(r.invoiceAmount, r.currency)}</td>
                                    <td className="px-3 py-2.5">{formatMoney(r.approvedAmount, r.currency)}</td>
                                    <td className="px-3 py-2.5"><BpStatusBadge tone={tonePayment(r.paymentStatus)}>{r.paymentStatus}</BpStatusBadge></td>
                                    <td className="px-3 py-2.5"><BpStatusBadge tone={toneApproval(r.approvalStatus)}>{r.approvalStatus}</BpStatusBadge></td>
                                    <td className="px-3 py-2.5"><BpStatusBadge tone={toneAi(r.aiValidation.status)}>{r.aiValidation.status}</BpStatusBadge></td>
                                    <td className="px-3 py-2.5">{r.assignedFinanceUser}</td>
                                    <td className="px-3 py-2.5 text-xs text-slate-500">{new Date(r.updatedAt).toLocaleDateString()}</td>
                                    <td className="px-3 py-2.5">
                                        <VendorInvoiceRowActionsMenu invoice={r} onArchived={() => setRefresh((n) => n + 1)} onDuplicated={() => setRefresh((n) => n + 1)} />
                                    </td>
                                </tr>
                            ))}
                            {paginated.length === 0 ? (
                                <tr><td colSpan={18} className="px-4 py-10 text-center text-slate-500">No vendor invoices match your filters.</td></tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-slate-100 px-4 py-3">
                    <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={PAGE_SIZE} onPageChange={setPage} />
                </div>
            </div>
        </div>
    );
}
