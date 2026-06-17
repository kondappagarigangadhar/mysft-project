'use client';

import type { BreadcrumbItem } from '@/components/ui/Breadcrumb';

export const WORK_ORDERS_LIST_HREF = '/work-orders' as const;
export const VENDOR_MANAGEMENT_LIST_HREF = '/company-admin/vendors/list' as const;

const VENDOR_MANAGEMENT_ROOT: BreadcrumbItem = {
    label: 'Vendor Management',
    href: VENDOR_MANAGEMENT_LIST_HREF,
};

const VENDOR_ASSIGNMENTS_LIST: BreadcrumbItem = {
    label: 'Vendor Assignments',
    href: WORK_ORDERS_LIST_HREF,
};

/** Breadcrumbs for `/work-orders` list hub. */
export function buildVendorAssignmentsListBreadcrumbs(): BreadcrumbItem[] {
    return [VENDOR_MANAGEMENT_ROOT, { label: 'Vendor Assignments' }];
}

/** Breadcrumbs for `/work-orders/view/[slug]` (create, view, and edit modes). */
export function buildVendorAssignmentDetailBreadcrumbs(opts: {
    createMode: boolean;
    title?: string;
    workOrderId?: string;
}): BreadcrumbItem[] {
    if (opts.createMode) {
        return [VENDOR_MANAGEMENT_ROOT, VENDOR_ASSIGNMENTS_LIST, { label: 'Create Vendor Assignment' }];
    }

    const label = opts.title?.trim() || opts.workOrderId?.trim() || 'Vendor Assignment';
    return [VENDOR_MANAGEMENT_ROOT, VENDOR_ASSIGNMENTS_LIST, { label }];
}

/** Breadcrumbs for `/work-orders/drafts`. */
export function buildVendorAssignmentDraftsBreadcrumbs(): BreadcrumbItem[] {
    return [VENDOR_MANAGEMENT_ROOT, VENDOR_ASSIGNMENTS_LIST, { label: 'Drafts' }];
}
