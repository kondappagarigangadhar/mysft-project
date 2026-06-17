'use client';

import type { InvoiceOverviewDraft } from '@/components/invoices/InvoiceInlineOverviewEditor';
import type { Invoice, InvoicePaymentStatus } from '@/lib/invoiceStore';
import {
    formatLinkedPurchaseOrderNumbers,
    getInvoicesForPurchaseRequest,
    resolvePrProcurementLinkContext,
} from '@/lib/procurement/prProcurementLinks';
import type { PurchaseOrder } from '@/lib/purchaseOrderStore';
import type { PurchaseRequest } from '@/lib/purchaseRequestStore';

export type PrInvoiceSummary = {
    totalLinked: number;
    totalValue: number;
    currency: string;
    paidCount: number;
    pendingPaymentCount: number;
    pendingValidationCount: number;
};

export function computePrInvoiceSummary(prSlug: string): PrInvoiceSummary {
    const invoices = getInvoicesForPurchaseRequest(prSlug);
    const currency = invoices[0]?.currency?.trim() || 'INR';
    let totalValue = 0;
    let paidCount = 0;
    let pendingPaymentCount = 0;
    let pendingValidationCount = 0;

    for (const inv of invoices) {
        totalValue += inv.totalAmount;
        if (inv.paymentStatus === 'Paid') paidCount += 1;
        else pendingPaymentCount += 1;
        if (inv.validation?.status === 'Pending') pendingValidationCount += 1;
    }

    return {
        totalLinked: invoices.length,
        totalValue,
        currency,
        paidCount,
        pendingPaymentCount,
        pendingValidationCount,
    };
}

export function formatPrLinkedInvoiceDate(ymd: string): string {
    if (!ymd?.trim()) return '—';
    const [y, m, d] = ymd.split('-');
    if (!y || !m || !d) return ymd;
    return `${d}-${m}-${y}`;
}

function pickPrimaryPo(orders: PurchaseOrder[], preferredPoNumber?: string): PurchaseOrder | undefined {
    if (!orders.length) return undefined;
    if (preferredPoNumber?.trim()) {
        const hit = orders.find((o) => o.poNumber === preferredPoNumber.trim());
        if (hit) return hit;
    }
    return orders[0];
}

export function buildInvoiceDraftFromPr(input: {
    pr: PurchaseRequest;
    linkedPos: PurchaseOrder[];
    supplierName: string;
    preferredPoNumber?: string;
}): InvoiceOverviewDraft {
    const today = new Date();
    const ymd = today.toISOString().slice(0, 10);
    const due = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const primaryPo = pickPrimaryPo(input.linkedPos, input.preferredPoNumber);
    const singlePo = Boolean(input.preferredPoNumber?.trim() && primaryPo);
    const taxable = primaryPo?.totalAmount ?? 0;
    const tax = Math.round(taxable * 0.18);
    const total = taxable + tax;
    const linkedPoLabel = singlePo
        ? primaryPo!.poNumber
        : formatLinkedPurchaseOrderNumbers(input.linkedPos) || primaryPo?.poNumber || '';

    return {
        invoiceNumber: '',
        companyName: 'Requanto Realty Pvt Ltd',
        partyType: 'Supplier',
        partyName: input.supplierName.trim() || primaryPo?.supplierName?.trim() || '',
        linkedProject: input.pr.project?.trim() ?? '',
        linkedWorkOrderId: '',
        linkedPurchaseOrder: linkedPoLabel || primaryPo?.poNumber || '',
        linkedPrSlug: input.pr.slug,
        linkedPrNumber: input.pr.prNumber,
        invoiceDate: ymd,
        dueDate: due,
        currency: (primaryPo?.currency?.trim() || 'INR') as InvoiceOverviewDraft['currency'],
        invoiceAmount: taxable > 0 ? String(taxable) : '',
        taxAmount: taxable > 0 ? String(tax) : '0',
        totalAmount: total > 0 ? String(total) : '',
        notes: [
            `Procurement invoice for ${input.pr.prNumber}`,
            input.pr.project?.trim() ? `Project: ${input.pr.project.trim()}` : '',
            singlePo && primaryPo?.material?.trim() ? `Material: ${primaryPo.material.trim()}` : input.pr.material?.trim() ? `Material: ${input.pr.material.trim()}` : '',
            linkedPoLabel ? `PO: ${linkedPoLabel}` : '',
        ]
            .filter(Boolean)
            .join(' · '),
        paidAmount: '0',
        paymentStatus: 'Pending' as InvoicePaymentStatus,
        primaryPaymentMode: '',
        primaryTransactionRef: '',
        assignedFinanceUser: 'You',
    };
}

export { getInvoicesForPurchaseRequest };

export function invoiceValidationLabel(inv: Invoice): string {
    return inv.validation?.status ?? 'Pending';
}

export function invoicePaymentLabel(inv: Invoice): string {
    return inv.paymentStatus ?? 'Pending';
}
