'use client';

import type { PurchaseOrder, PurchaseOrderStatus, PoDeliveryStatus } from '@/lib/purchaseOrderStore';
import { getPurchaseOrdersByPrSlug } from '@/lib/purchaseOrderStore';

export type PrProcurementSummary = {
    totalLinked: number;
    totalValue: number;
    currency: string;
    deliveredCount: number;
    pendingDeliveries: number;
};

export function computePrProcurementSummary(prSlug: string): PrProcurementSummary {
    const orders = getPurchaseOrdersByPrSlug(prSlug);
    const currency = orders[0]?.currency?.trim() || 'INR';
    let totalValue = 0;
    let deliveredCount = 0;
    let pendingDeliveries = 0;

    for (const po of orders) {
        totalValue += po.totalAmount;
        const isDelivered = po.status === 'Delivered' || po.delivery.status === 'Completed';
        if (isDelivered) deliveredCount += 1;
        else pendingDeliveries += 1;
    }

    return {
        totalLinked: orders.length,
        totalValue,
        currency,
        deliveredCount,
        pendingDeliveries,
    };
}

export function formatPrLinkedPoCreatedDate(iso: string): string {
    if (!iso?.trim()) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const yr = d.getFullYear();
    return `${day}-${mon}-${yr}`;
}

export function deliveryStatusLabel(po: PurchaseOrder): PoDeliveryStatus | 'Delivered' {
    if (po.status === 'Delivered' || po.delivery.status === 'Completed') return 'Completed';
    return po.delivery.status;
}

export function poStatusFilterOptions(): PurchaseOrderStatus[] {
    return ['Created', 'Sent', 'Delivered'];
}

export function poDeliveryFilterOptions(): Array<PoDeliveryStatus | 'Delivered'> {
    return ['Pending', 'Partial', 'Completed', 'Delivered'];
}
