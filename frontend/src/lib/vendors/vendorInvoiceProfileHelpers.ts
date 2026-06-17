'use client';

import {
    formatMoney,
    getVendorInvoicesByVendorId,
    type VendorInvoice,
} from '@/lib/vendorInvoiceStore';
import { getWorkOrdersForVendor } from '@/lib/vendors/vendorWorkOrders';
import type { VendorRecord } from '@/lib/vendors/vendorStore';

export type VendorInvoicePerformanceMetrics = {
    invoiceAccuracy: number;
    paymentApprovalRate: number;
    averageResolutionCost: number;
    slaCompliance: number;
    repeatWorkOrders: number;
};

const APPROVED_STATUSES = new Set(['Approved', 'Paid']);

function invoicesForVendor(vendorId: string): VendorInvoice[] {
    return getVendorInvoicesByVendorId(vendorId);
}

export function computeVendorInvoicePerformanceMetrics(
    vendorId: string,
    vendorName: string,
    vendor?: Pick<VendorRecord, 'slaBreaches' | 'delays'>,
): VendorInvoicePerformanceMetrics {
    const rows = invoicesForVendor(vendorId);
    const workOrders = getWorkOrdersForVendor(vendorId, vendorName);

    const passedAi = rows.filter((r) => r.aiValidation.status === 'Passed').length;
    const invoiceAccuracy = rows.length ? Math.round((passedAi / rows.length) * 100) : 100;

    const approved = rows.filter((r) => APPROVED_STATUSES.has(r.approvalStatus)).length;
    const paymentApprovalRate = rows.length ? Math.round((approved / rows.length) * 100) : 0;

    const averageResolutionCost = rows.length
        ? Math.round(rows.reduce((sum, r) => sum + r.invoiceAmount, 0) / rows.length)
        : 0;

    const slaBreaches = vendor?.slaBreaches ?? 0;
    const delays = vendor?.delays ?? 0;
    const slaCompliance = Math.max(10, Math.min(100, 100 - slaBreaches * 8 - delays * 4));

    const woInvoiceCounts = new Map<string, number>();
    rows.forEach((r) => {
        const wo = r.linkedWorkOrderId?.trim();
        if (!wo) return;
        woInvoiceCounts.set(wo, (woInvoiceCounts.get(wo) ?? 0) + 1);
    });
    const repeatWorkOrders = [...woInvoiceCounts.values()].filter((c) => c > 1).length;

    // Blend work-order volume when no invoices yet
    const effectiveRepeat = repeatWorkOrders || (workOrders.length > 3 ? 1 : 0);

    return {
        invoiceAccuracy,
        paymentApprovalRate,
        averageResolutionCost,
        slaCompliance,
        repeatWorkOrders: effectiveRepeat,
    };
}

export function downloadVendorInvoicePdf(inv: VendorInvoice): void {
    const currency = inv.currency ?? 'INR';
    const lines = [
        'VENDOR INVOICE',
        '==============',
        `Invoice Number: ${inv.invoiceNumber}`,
        `Invoice ID: ${inv.invoiceId}`,
        `Vendor: ${inv.vendorName} (${inv.vendorId})`,
        `Project: ${inv.linkedProject}`,
        `Work Order: ${inv.linkedWorkOrderId || '—'}`,
        `Service Request: ${inv.linkedServiceRequestId || '—'}`,
        `Resident: ${inv.workOrderRef?.residentName || '—'}`,
        `Invoice Date: ${inv.invoiceDate}`,
        `Due Date: ${inv.dueDate || '—'}`,
        '',
        'LINE ITEMS',
        '----------',
        ...inv.lineItems.map(
            (li) =>
                `${li.description} | ${li.quantity} ${li.unit} @ ${formatMoney(li.unitRate, currency)} = ${formatMoney(li.amount, currency)}`,
        ),
        '',
        `Subtotal: ${formatMoney(inv.subtotal, currency)}`,
        `GST (${inv.gstPercent}%): ${formatMoney(inv.gstAmount, currency)}`,
        `Invoice Amount: ${formatMoney(inv.invoiceAmount, currency)}`,
        `Paid: ${formatMoney(inv.paidAmount, currency)}`,
        `Balance: ${formatMoney(inv.balanceAmount, currency)}`,
        '',
        `Approval: ${inv.approvalStatus}`,
        `Payment: ${inv.paymentStatus}`,
    ];
    const safeName = (inv.invoiceNumber || inv.invoiceId || 'invoice')
        .trim()
        .replace(/[/\\?%*:|"<>]/g, '-')
        .slice(0, 60);
    const blob = new Blob([lines.join('\n')], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
}
