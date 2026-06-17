'use client';

import type { Invoice } from '@/lib/invoiceStore';
import { getInvoices } from '@/lib/invoiceStore';
import { getPurchaseOrdersByPrSlug, type PurchaseOrder } from '@/lib/purchaseOrderStore';
import { getPurchaseRequestIncludingArchived } from '@/lib/purchaseRequestStore';
import { getAllSupplierRecords } from '@/lib/suppliers/supplierStore';

/** Comma-separated PO numbers for invoice linking (matches multiple POs on one PR). */
export function formatLinkedPurchaseOrderNumbers(orders: PurchaseOrder[]): string {
    const nums = orders.map((o) => o.poNumber?.trim()).filter(Boolean);
    return [...new Set(nums)].join(', ');
}

export function parseLinkedPurchaseOrderNumbers(raw: string): string[] {
    return raw
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
}

export function getPurchaseOrderNumbersForPr(prSlug: string): string[] {
    return getPurchaseOrdersByPrSlug(prSlug).map((o) => o.poNumber.trim()).filter(Boolean);
}

/** Invoices linked by PR slug or by matching any linked PO number on this request. */
export function getInvoicesForPurchaseRequest(prSlug: string): Invoice[] {
    const slug = prSlug.trim();
    if (!slug) return [];
    const poNumbers = new Set(getPurchaseOrderNumbersForPr(slug));
    return getInvoices()
        .filter((inv) => {
            if (inv.linkedPrSlug.trim() === slug) return true;
            if (!poNumbers.size) return false;
            return parseLinkedPurchaseOrderNumbers(inv.linkedPurchaseOrder).some((n) => poNumbers.has(n));
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export type PrProcurementLinkContext = {
    prSlug: string;
    prNumber: string;
    project: string;
    material: string;
    supplierName: string;
    purchaseOrders: PurchaseOrder[];
    linkedPurchaseOrderLabel: string;
    purchaseOrderOptions: { value: string; label: string }[];
};

export function resolvePrProcurementLinkContext(prSlug: string): PrProcurementLinkContext | null {
    const slug = prSlug.trim();
    if (!slug) return null;
    const pr = getPurchaseRequestIncludingArchived(slug);
    if (!pr) return null;
    const purchaseOrders = getPurchaseOrdersByPrSlug(slug);
    const supplier = pr.supplierSelection?.selectedSupplierId
        ? getAllSupplierRecords().find((s) => s.id === pr.supplierSelection?.selectedSupplierId)
        : undefined;
    const linkedPurchaseOrderLabel = formatLinkedPurchaseOrderNumbers(purchaseOrders);
    const purchaseOrderOptions = purchaseOrders.map((po) => ({
        value: po.poNumber,
        label: `${po.poNumber} · ${po.material} (${po.currency} ${po.totalAmount.toLocaleString('en-IN')})`,
    }));
    return {
        prSlug: slug,
        prNumber: pr.prNumber,
        project: pr.project?.trim() ?? '',
        material: pr.material?.trim() ?? '',
        supplierName: supplier?.name ?? '',
        purchaseOrders,
        linkedPurchaseOrderLabel,
        purchaseOrderOptions,
    };
}
