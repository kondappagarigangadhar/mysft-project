'use client';

import type { BreadcrumbItem } from '@/components/ui/Breadcrumb';
import { getPurchaseRequestIncludingArchived } from '@/lib/purchaseRequestStore';

const PROCUREMENT_ROOT: BreadcrumbItem = { label: 'Procurement Management' };
const PR_LIST: BreadcrumbItem = { label: 'Purchase Requests', href: '/procurement/requests' };
const PO_LIST: BreadcrumbItem = { label: 'Purchase Orders', href: '/procurement/purchase-orders' };
const INVOICE_LIST: BreadcrumbItem = { label: 'Invoice & Payments', href: '/company-admin/invoices' };

export function procurementReturnPrHref(prSlug: string): string {
    const slug = prSlug.trim();
    return `/procurement/requests/view/${encodeURIComponent(slug)}?tab=overview`;
}

function purchaseRequestBreadcrumb(prSlug: string): BreadcrumbItem | null {
    const pr = getPurchaseRequestIncludingArchived(prSlug.trim());
    if (!pr) return null;
    return {
        label: pr.prNumber?.trim() || 'Purchase request',
        href: procurementReturnPrHref(pr.slug),
    };
}

/** Breadcrumbs for PO create/view when opened from a purchase request (`returnPrSlug` / `prSlug`). */
export function buildPurchaseOrderBreadcrumbs(opts: {
    createMode: boolean;
    returnPrSlug?: string;
    poNumber?: string;
}): BreadcrumbItem[] {
    const prSlug = opts.returnPrSlug?.trim();
    const prCrumb = prSlug ? purchaseRequestBreadcrumb(prSlug) : null;

    if (prCrumb) {
        if (opts.createMode) {
            return [PROCUREMENT_ROOT, PR_LIST, prCrumb, { label: 'Create PO' }];
        }
        return [PROCUREMENT_ROOT, PR_LIST, prCrumb, PO_LIST, { label: opts.poNumber?.trim() || 'Purchase order' }];
    }

    if (opts.createMode) {
        return [PROCUREMENT_ROOT, PO_LIST, { label: 'Create PO' }];
    }
    return [PROCUREMENT_ROOT, PO_LIST, { label: opts.poNumber?.trim() || 'Purchase order' }];
}

/** Breadcrumbs for invoice create when opened from a purchase request (`returnPrSlug`). */
export function buildInvoiceBreadcrumbs(opts: {
    createMode: boolean;
    returnPrSlug?: string;
    title: string;
    returnPoNumber?: string;
}): BreadcrumbItem[] {
    const prSlug = opts.returnPrSlug?.trim();
    const prCrumb = prSlug ? purchaseRequestBreadcrumb(prSlug) : null;

    if (opts.createMode && prCrumb) {
        const po = opts.returnPoNumber?.trim();
        const lastLabel = po ? `Create invoice · ${po}` : 'Create invoice';
        return [PROCUREMENT_ROOT, PR_LIST, prCrumb, { label: lastLabel }];
    }

    return [PROCUREMENT_ROOT, INVOICE_LIST, { label: opts.title }];
}
