'use client';

import type { VendorInvoiceLineItemDraft } from '@/lib/vendor-invoices/vendorInvoiceWorkOrderBridge';
import type { WorkOrder } from '@/lib/workOrderStore';

type ServiceTemplate = { description: string; quantity: number; unit: string; share: number };

const CATALOG: Record<string, ServiceTemplate[]> = {
    Plumbing: [
        { description: 'Kitchen Sink Pipe Replacement', quantity: 1, unit: 'Job', share: 0.45 },
        { description: 'Labour Charges', quantity: 6, unit: 'Hrs', share: 0.25 },
        { description: 'CPVC Pipes & Fittings', quantity: 1, unit: 'Set', share: 0.2 },
        { description: 'Sealant & Consumables', quantity: 1, unit: 'Set', share: 0.1 },
    ],
    Electrical: [
        { description: 'DB Panel & MCB Replacement', quantity: 1, unit: 'Job', share: 0.4 },
        { description: 'Electrical Labour', quantity: 8, unit: 'Hrs', share: 0.3 },
        { description: 'Copper Wiring & Conduits', quantity: 1, unit: 'Set', share: 0.2 },
        { description: 'Testing & Commissioning', quantity: 1, unit: 'Job', share: 0.1 },
    ],
    HVAC: [
        { description: 'AC Unit Servicing & Gas Refill', quantity: 2, unit: 'Nos', share: 0.35 },
        { description: 'Cooling Tower Cleaning', quantity: 1, unit: 'Job', share: 0.25 },
        { description: 'Filter & Spare Parts', quantity: 1, unit: 'Set', share: 0.2 },
        { description: 'Technician Labour', quantity: 10, unit: 'Hrs', share: 0.2 },
    ],
    Security: [
        { description: 'CCTV Camera Calibration', quantity: 4, unit: 'Nos', share: 0.35 },
        { description: 'Access Control Panel Service', quantity: 1, unit: 'Job', share: 0.3 },
        { description: 'Security Labour', quantity: 6, unit: 'Hrs', share: 0.2 },
        { description: 'Cable & Connector Replacement', quantity: 1, unit: 'Set', share: 0.15 },
    ],
    Cleaning: [
        { description: 'Deep Cleaning — Common Areas', quantity: 1, unit: 'Job', share: 0.4 },
        { description: 'Housekeeping Charges', quantity: 12, unit: 'Hrs', share: 0.35 },
        { description: 'Cleaning Chemicals & Supplies', quantity: 1, unit: 'Set', share: 0.25 },
    ],
    Civil: [
        { description: 'Wall Crack Repair & Patching', quantity: 1, unit: 'Job', share: 0.4 },
        { description: 'Masonry Labour', quantity: 16, unit: 'Hrs', share: 0.35 },
        { description: 'Cement, Sand & Material', quantity: 1, unit: 'Set', share: 0.25 },
    ],
    default: [
        { description: 'Service Execution', quantity: 1, unit: 'Job', share: 0.55 },
        { description: 'Labour Charges', quantity: 4, unit: 'Hrs', share: 0.25 },
        { description: 'Material Cost', quantity: 1, unit: 'Set', share: 0.2 },
    ],
};

function resolveCategory(wo: WorkOrder): string {
    const wt = (wo.workType || '').trim();
    if (wt && CATALOG[wt]) return wt;
    const title = (wo.title || '').toLowerCase();
    if (title.includes('plumb') || title.includes('pipe') || title.includes('sink')) return 'Plumbing';
    if (title.includes('electr') || title.includes('mcb') || title.includes('wiring')) return 'Electrical';
    if (title.includes('hvac') || title.includes('ac ') || title.includes('cooling')) return 'HVAC';
    if (title.includes('cctv') || title.includes('security') || title.includes('access')) return 'Security';
    if (title.includes('clean') || title.includes('housekeep')) return 'Cleaning';
    if (title.includes('civil') || title.includes('crack') || title.includes('masonry')) return 'Civil';
    return 'default';
}

export function buildRealisticLineItemsFromWorkOrder(
    wo: WorkOrder,
    estimatedTotal: number,
): VendorInvoiceLineItemDraft[] {
    const category = resolveCategory(wo);
    const templates = CATALOG[category] ?? CATALOG.default!;
    const total = estimatedTotal > 0 ? estimatedTotal : 23000;

    return templates.map((t, i) => {
        const lineTotal = Math.round(total * t.share);
        const unitRate = t.quantity > 0 ? Math.round(lineTotal / t.quantity) : lineTotal;
        return {
            id: `li-${wo.workOrderId}-${i + 1}`,
            description: t.description,
            quantity: String(t.quantity),
            unit: t.unit,
            unitRate: String(unitRate),
        };
    });
}

export function buildRealisticLineItemsForCategory(
    category: string,
    totalAmount: number,
    idPrefix: string,
): VendorInvoiceLineItemDraft[] {
    const templates = CATALOG[category] ?? CATALOG.default!;
    return templates.map((t, i) => {
        const lineTotal = Math.round(totalAmount * t.share);
        const unitRate = t.quantity > 0 ? Math.round(lineTotal / t.quantity) : lineTotal;
        return {
            id: `${idPrefix}-${i + 1}`,
            description: t.description,
            quantity: String(t.quantity),
            unit: t.unit,
            unitRate: String(unitRate),
        };
    });
}

export const SERVICE_DESCRIPTION_SUGGESTIONS = [
    'Pipe Replacement',
    'Labour Charges',
    'Painting Work',
    'Electrical Repair',
    'Garden Maintenance',
    'Security Service',
    'Housekeeping Charges',
    'Material Cost',
    'Spare Parts',
    'AC Gas Refill',
    'CCTV Calibration',
    'Deep Cleaning',
];
