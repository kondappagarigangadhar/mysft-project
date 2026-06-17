'use client';

import { getWorkOrderBySlug, getWorkOrders, updateWorkOrder, type WorkOrder, type WorkOrderStatus } from '@/lib/workOrderStore';
import { MOCK_VENDORS } from '@/lib/vendors/mockData';
import type { Vendor } from '@/lib/vendors/types';

const vendorIdByName = new Map(MOCK_VENDORS.map((v) => [v.name.trim().toLowerCase(), v.id]));

export function resolveVendorIdByName(vendorName: string): string {
    const key = vendorName.trim().toLowerCase();
    if (!key) return '';
    return vendorIdByName.get(key) ?? '';
}

export function getVendorPrimaryProject(vendorId: string): string {
    return MOCK_VENDORS.find((v) => v.id === vendorId)?.primaryProject?.trim() ?? '';
}

export function workOrderMatchesVendor(wo: WorkOrder, vendorId: string, vendorName: string): boolean {
    const id = wo.vendor?.vendorId?.trim();
    if (id) return id === vendorId;
    const name = wo.vendor?.vendorName?.trim().toLowerCase() ?? '';
    return name === vendorName.trim().toLowerCase();
}

/** Work orders assigned to this vendor on their primary project only. */
export function getWorkOrdersForVendor(vendorId: string, vendorName: string): WorkOrder[] {
    const project = getVendorPrimaryProject(vendorId);
    return getWorkOrders().filter((wo) => {
        if (wo.archivedAt) return false;
        if (!workOrderMatchesVendor(wo, vendorId, vendorName)) return false;
        if (project && wo.projectOrProperty !== project) return false;
        return true;
    });
}

export function countOpenWorkOrdersForVendor(vendorId: string, vendorName: string): number {
    const open = new Set(['Draft', 'Open', 'Assigned', 'In Progress', 'On Hold']);
    return getWorkOrdersForVendor(vendorId, vendorName).filter((wo) => open.has(wo.lifecycle?.status ?? '')).length;
}

export function vendorListProjectLabel(vendor: Pick<Vendor, 'primaryProject'>): string {
    return vendor.primaryProject?.trim() || '—';
}

/** Work orders on the vendor's project that are not yet assigned to this vendor. */
export function getAssignableWorkOrdersForVendor(vendorId: string, vendorName: string): WorkOrder[] {
    const project = getVendorPrimaryProject(vendorId);
    return getWorkOrders().filter((wo) => {
        if (wo.archivedAt) return false;
        if (workOrderMatchesVendor(wo, vendorId, vendorName)) return false;
        if (project && wo.projectOrProperty !== project) return false;
        return true;
    });
}

export function assignWorkOrderToVendor(
    slug: string,
    vendor: { id: string; name: string },
): WorkOrder | undefined {
    const wo = getWorkOrderBySlug(slug);
    if (!wo) return undefined;
    const ymd = new Date().toISOString().slice(0, 10);
    const currentStatus = wo.lifecycle?.status ?? 'Draft';
    const nextStatus: WorkOrderStatus =
        currentStatus === 'Draft' || currentStatus === 'Open' ? 'Assigned' : currentStatus;

    return updateWorkOrder(
        slug,
        {
            vendor: {
                vendorId: vendor.id,
                vendorName: vendor.name,
                assignedDate: wo.vendor?.assignedDate?.trim() || ymd,
                assignedBy: wo.vendor?.assignedBy?.trim() || 'Company Admin',
                estimatedCost: wo.vendor?.estimatedCost ?? '',
                estimatedDurationDays: wo.vendor?.estimatedDurationDays ?? null,
            },
            lifecycle: {
                ...wo.lifecycle,
                status: nextStatus,
                statusUpdatedBy: 'Company Admin',
                statusUpdatedAt: new Date().toISOString(),
            },
        },
        {
            actor: 'Company Admin',
            title: 'Vendor assigned',
            body: `${vendor.name} · ${wo.workOrderId}`,
            actionType: 'assigned_changed',
            severity: 'info',
        },
    );
}
