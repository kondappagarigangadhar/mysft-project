'use client';

import { buildRealisticLineItemsFromWorkOrder } from '@/lib/vendor-invoices/vendorInvoiceServiceCatalog';
import type { VendorInvoice, VendorInvoiceAiValidation, VendorInvoiceLineItem } from '@/lib/vendorInvoiceStore';
import type { WorkOrder } from '@/lib/workOrderStore';
import { getWorkOrdersForVendor } from '@/lib/vendors/vendorWorkOrders';
import type { VendorRecord } from '@/lib/vendors/vendorStore';

export const BILLABLE_WORK_ORDER_STATUSES = ['Completed', 'Verified'] as const;
export const DEFAULT_GST_PERCENT = 18;

export type VendorInvoiceLineItemDraft = {
    id: string;
    description: string;
    quantity: string;
    unit: string;
    unitRate: string;
};

export type VendorInvoiceOverviewDraft = {
    invoiceNumber: string;
    vendorId: string;
    vendorName: string;
    vendorCategory: string;
    linkedProject: string;
    linkedTower: string;
    linkedWorkOrderId: string;
    linkedWorkOrderSlug: string;
    linkedServiceRequestId: string;
    linkedServiceRequestSlug: string;
    invoiceDate: string;
    dueDate: string;
    currency: string;
    assignedFinanceUser: string;
    servicePerformed: string;
    lineItems: VendorInvoiceLineItemDraft[];
    discount: string;
    gstPercent: string;
    notes: string;
    /** When set, key fields are sourced from a completed work order. */
    sourceWorkOrderId: string;
};

export type WorkOrderRefSlice = {
    residentName: string;
    unit: string;
    issueCategory: string;
    completionDate: string;
    vendorAssigned: string;
    workOrderValue: number;
};

export type ServiceExecutionSlice = {
    servicePerformed: string;
    completionDate: string;
    project: string;
    tower: string;
    unit: string;
    residentName: string;
    serviceCategory: string;
    vendorName: string;
};

export function isWorkOrderBillable(wo: WorkOrder): boolean {
    if (wo.archivedAt) return false;
    const status = wo.lifecycle?.status ?? '';
    if (!BILLABLE_WORK_ORDER_STATUSES.includes(status as (typeof BILLABLE_WORK_ORDER_STATUSES)[number])) {
        return false;
    }
    return Boolean(wo.vendor?.vendorName?.trim());
}

export function parseWorkOrderEstimatedCost(wo: WorkOrder): number {
    const fromVendor = wo.vendor?.estimatedCost ? parseInt(wo.vendor.estimatedCost.replace(/\D/g, ''), 10) : 0;
    if (fromVendor > 0) return fromVendor;
    const fromFinance = wo.finance?.actualCost ? parseInt(String(wo.finance.actualCost).replace(/\D/g, ''), 10) : 0;
    return fromFinance || 0;
}

export function formatVendorInvoiceDisplayDate(ymd: string | undefined | null): string {
    if (!ymd?.trim()) return '—';
    try {
        const d = new Date(`${ymd.slice(0, 10)}T12:00:00`);
        if (Number.isNaN(d.getTime())) return ymd;
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return ymd;
    }
}

export function buildWorkOrderRefFromWorkOrder(wo: WorkOrder): WorkOrderRefSlice {
    return {
        residentName: wo.requestedBy?.trim() ?? '',
        unit: wo.location?.flat?.trim() || wo.location?.block?.trim() || '',
        issueCategory: wo.workType?.trim() || wo.issueType?.trim() || '',
        completionDate: wo.completion?.completionDate?.trim() ?? '',
        vendorAssigned: wo.vendor?.vendorName?.trim() ?? '',
        workOrderValue: parseWorkOrderEstimatedCost(wo),
    };
}

export function buildServiceExecutionFromWorkOrder(wo: WorkOrder, vendorName?: string): ServiceExecutionSlice {
    const ref = buildWorkOrderRefFromWorkOrder(wo);
    return {
        servicePerformed: wo.title?.trim() || 'Service work',
        completionDate: ref.completionDate,
        project: wo.projectOrProperty?.trim() ?? '',
        tower: wo.location?.tower?.trim() || wo.location?.block?.trim() || '',
        unit: ref.unit,
        residentName: ref.residentName,
        serviceCategory: ref.issueCategory,
        vendorName: vendorName?.trim() || ref.vendorAssigned,
    };
}

function resolveVendorForWorkOrder(wo: WorkOrder, vendors: VendorRecord[]): VendorRecord | undefined {
    if (wo.vendor?.vendorId) {
        const byId = vendors.find((v) => v.id === wo.vendor.vendorId);
        if (byId) return byId;
    }
    const name = wo.vendor?.vendorName?.trim();
    if (!name) return undefined;
    return vendors.find((v) => v.name.trim().toLowerCase() === name.toLowerCase());
}

export function buildVendorInvoiceDraftFromWorkOrder(wo: WorkOrder, vendors: VendorRecord[]): VendorInvoiceOverviewDraft {
    const vendor = resolveVendorForWorkOrder(wo, vendors);
    const est = parseWorkOrderEstimatedCost(wo);
    const srCode = wo.linkedServiceRequestCode?.trim() ?? '';
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date();
    due.setDate(due.getDate() + 30);
    const invSuffix = wo.workOrderId.replace(/^WO-/i, '');

    return {
        invoiceNumber: `VINV-${invSuffix}-${new Date().getFullYear()}`,
        vendorId: vendor?.id ?? wo.vendor?.vendorId ?? '',
        vendorName: vendor?.name ?? wo.vendor?.vendorName ?? '',
        vendorCategory: vendor?.categories[0] ?? wo.workType ?? '',
        linkedProject: wo.projectOrProperty?.trim() ?? vendor?.primaryProject ?? '',
        linkedTower: wo.location?.tower?.trim() || wo.location?.block?.trim() || '',
        linkedWorkOrderId: wo.workOrderId,
        linkedWorkOrderSlug: wo.slug,
        linkedServiceRequestId: srCode,
        linkedServiceRequestSlug: wo.linkedServiceRequestSlug?.trim() ?? '',
        invoiceDate: today,
        dueDate: due.toISOString().slice(0, 10),
        currency: 'INR',
        assignedFinanceUser: '',
        servicePerformed: wo.title?.trim() ?? '',
        lineItems: buildRealisticLineItemsFromWorkOrder(wo, est),
        discount: '0',
        gstPercent: String(DEFAULT_GST_PERCENT),
        notes: '',
        sourceWorkOrderId: wo.workOrderId,
    };
}

export function getBillableWorkOrdersForVendor(
    vendorId: string,
    vendorName: string,
    allWorkOrders?: WorkOrder[],
): WorkOrder[] {
    const source =
        allWorkOrders ??
        getWorkOrdersForVendor(vendorId, vendorName);
    return source.filter((w) => isWorkOrderBillable(w));
}

export type VendorServiceRequestOption = {
    serviceRequestId: string;
    label: string;
    workOrderId: string;
};

export function getServiceRequestOptionsForVendorWorkOrders(workOrders: WorkOrder[]): VendorServiceRequestOption[] {
    const seen = new Set<string>();
    const options: VendorServiceRequestOption[] = [];
    workOrders.forEach((wo) => {
        const sr = wo.linkedServiceRequestCode?.trim();
        if (!sr || seen.has(sr)) return;
        seen.add(sr);
        options.push({
            serviceRequestId: sr,
            label: `${sr} — ${wo.title}`,
            workOrderId: wo.workOrderId,
        });
    });
    return options;
}

export function buildVendorInvoiceDraftFromVendor(vendor: VendorRecord): VendorInvoiceOverviewDraft {
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date();
    due.setDate(due.getDate() + 30);
    return {
        ...buildEmptyVendorInvoiceDraft(),
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorCategory: vendor.categories[0] ?? '',
        linkedProject: vendor.primaryProject?.trim() ?? '',
        invoiceDate: today,
        dueDate: due.toISOString().slice(0, 10),
    };
}

export function buildEmptyVendorInvoiceDraft(): VendorInvoiceOverviewDraft {
    const today = new Date().toISOString().slice(0, 10);
    return {
        invoiceNumber: '',
        vendorId: '',
        vendorName: '',
        vendorCategory: '',
        linkedProject: '',
        linkedTower: '',
        linkedWorkOrderId: '',
        linkedWorkOrderSlug: '',
        linkedServiceRequestId: '',
        linkedServiceRequestSlug: '',
        invoiceDate: today,
        dueDate: '',
        currency: 'INR',
        assignedFinanceUser: '',
        servicePerformed: '',
        lineItems: [],
        discount: '0',
        gstPercent: String(DEFAULT_GST_PERCENT),
        notes: '',
        sourceWorkOrderId: '',
    };
}

export function buildDraftFromVendorInvoice(inv: VendorInvoice): VendorInvoiceOverviewDraft {
    return {
        invoiceNumber: inv.invoiceNumber ?? '',
        vendorId: inv.vendorId ?? '',
        vendorName: inv.vendorName ?? '',
        vendorCategory: inv.vendorCategory ?? '',
        linkedProject: inv.linkedProject ?? '',
        linkedTower: inv.linkedTower ?? '',
        linkedWorkOrderId: inv.linkedWorkOrderId ?? '',
        linkedWorkOrderSlug: inv.linkedWorkOrderSlug ?? '',
        linkedServiceRequestId: inv.linkedServiceRequestId ?? '',
        linkedServiceRequestSlug: inv.linkedServiceRequestSlug ?? '',
        invoiceDate: inv.invoiceDate ?? new Date().toISOString().slice(0, 10),
        dueDate: inv.dueDate ?? '',
        currency: inv.currency ?? 'INR',
        assignedFinanceUser: inv.assignedFinanceUser ?? '',
        servicePerformed: inv.servicePerformed?.trim() || inv.lineItems[0]?.description?.trim() || '',
        lineItems: lineItemsFromInvoice(inv),
        discount: String(inv.discount ?? 0),
        gstPercent: String(inv.gstPercent ?? DEFAULT_GST_PERCENT),
        notes: inv.notes ?? '',
        sourceWorkOrderId: inv.linkedWorkOrderId ?? '',
    };
}

export function lineItemsFromInvoice(inv: VendorInvoice): VendorInvoiceLineItemDraft[] {
    if (!inv.lineItems.length) {
        return [];
    }
    return inv.lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        quantity: String(li.quantity),
        unit: li.unit ?? 'Job',
        unitRate: String(li.unitRate),
    }));
}

export function lineItemDraftAmount(li: VendorInvoiceLineItemDraft): number {
    const qty = Number(li.quantity) || 0;
    const rate = Number(li.unitRate) || 0;
    return qty * rate;
}

export function computeBillingTotals(
    lineItems: VendorInvoiceLineItemDraft[],
    discount: number,
    gstPercent: number,
) {
    const subtotal = lineItems.reduce((s, li) => s + lineItemDraftAmount(li), 0);
    const taxable = Math.max(0, subtotal - discount);
    const gstAmount = Math.round(taxable * (gstPercent / 100));
    const invoiceAmount = taxable + gstAmount;
    return { subtotal, gstAmount, invoiceAmount };
}

export function lineItemsDraftToStore(lineItems: VendorInvoiceLineItemDraft[]): VendorInvoiceLineItem[] {
    return lineItems
        .filter((li) => li.description.trim() || Number(li.unitRate) > 0)
        .map((li) => {
            const amount = lineItemDraftAmount(li);
            return {
                id: li.id,
                description: li.description.trim() || 'Service line',
                quantity: Number(li.quantity) || 0,
                unit: li.unit.trim() || 'Job',
                unitRate: Number(li.unitRate) || 0,
                amount,
            };
        });
}

export function buildVendorDetailsFromVendor(vendor?: VendorRecord) {
    if (!vendor) {
        return {
            vendorType: 'Contractor',
            contactPerson: '',
            phone: '',
            email: '',
            gstNumber: '',
            panNumber: '',
            complianceStatus: 'Pending',
            contractStatus: 'Draft',
        };
    }
    const complianceStatus =
        vendor.compliancePercent >= 85 ? 'Compliant' : vendor.compliancePercent >= 60 ? 'Needs Review' : 'Non-Compliant';
    return {
        vendorType: vendor.type,
        contactPerson: vendor.contactPerson,
        phone: vendor.phone,
        email: vendor.email,
        gstNumber: '',
        panNumber: '',
        complianceStatus,
        contractStatus: vendor.contractStatus,
    };
}

export type AiSignalChip =
    | 'Amount OK'
    | 'Needs Review'
    | 'High Variance'
    | 'Duplicate Suspect'
    | 'Compliance Issue'
    | 'Contract Issue'
    | 'Missing Documents';

export function computeVendorInvoiceAiSignals(input: {
    invoiceTotal: number;
    workOrderValue: number;
    approvedAmount: number;
    vendorCompliance: string;
    vendorContract: string;
    vendorRiskScore: number;
    hasDuplicateForWorkOrder: boolean;
    hasMandatoryDocuments: boolean;
    currency?: string;
}): {
    chips: AiSignalChip[];
    validation: Partial<VendorInvoiceAiValidation>;
    bullets: string[];
    recommendation: string;
    confidence: number;
    variancePercent: number;
} {
    const { invoiceTotal, workOrderValue, approvedAmount, vendorCompliance, vendorContract, vendorRiskScore } = input;
    const chips: AiSignalChip[] = [];
    const bullets: string[] = [];

    let variancePercent = 0;
    if (workOrderValue > 0) {
        variancePercent = Math.round((Math.abs(invoiceTotal - workOrderValue) / workOrderValue) * 1000) / 10;
    }

    if (workOrderValue > 0 && variancePercent <= 8) chips.push('Amount OK');
    else if (variancePercent > 15) chips.push('High Variance');
    else chips.push('Needs Review');

    if (approvedAmount > 0 && invoiceTotal > approvedAmount * 1.05) {
        if (!chips.includes('Needs Review')) chips.push('Needs Review');
        bullets.push(`Invoice exceeds approved amount by ${Math.round(((invoiceTotal - approvedAmount) / approvedAmount) * 100)}%.`);
    }

    if (input.hasDuplicateForWorkOrder) {
        chips.push('Duplicate Suspect');
        bullets.push('Another vendor invoice is already linked to this work order.');
    }

    if (vendorCompliance !== 'Compliant') {
        chips.push('Compliance Issue');
        bullets.push(`Vendor compliance status: ${vendorCompliance || 'Unknown'}.`);
    }

    if (vendorContract !== 'Active') {
        chips.push('Contract Issue');
        bullets.push(`Vendor contract status: ${vendorContract || 'Unknown'}.`);
    }

    if (!input.hasMandatoryDocuments) {
        chips.push('Missing Documents');
        bullets.push('Mandatory vendor invoice PDF or tax invoice not attached.');
    }

    if (vendorRiskScore >= 70) {
        if (!chips.includes('Needs Review')) chips.push('Needs Review');
        bullets.push(`Vendor risk score elevated at ${vendorRiskScore}%.`);
    }

    if (workOrderValue > 0 && variancePercent <= 8 && bullets.length === 0) {
        bullets.push('Invoice amount aligns with completed work order value.');
    }

    let status: VendorInvoiceAiValidation['status'] = 'Passed';
    if (chips.includes('Duplicate Suspect') || chips.includes('High Variance') || chips.includes('Compliance Issue')) {
        status = 'High Risk';
    } else if (chips.includes('Needs Review') || chips.includes('Missing Documents') || chips.includes('Contract Issue')) {
        status = 'Needs Review';
    }

    const confidence = Math.max(
        45,
        Math.min(
            96,
            92 -
                (variancePercent > 15 ? 18 : variancePercent > 8 ? 10 : 0) -
                (input.hasDuplicateForWorkOrder ? 22 : 0) -
                (vendorCompliance !== 'Compliant' ? 12 : 0) -
                (!input.hasMandatoryDocuments ? 8 : 0),
        ),
    );

    const recommendation =
        status === 'Passed'
            ? 'Proceed to finance validation and approval workflow.'
            : status === 'High Risk'
              ? 'Hold payment — resolve variance, compliance, or duplicate billing before approval.'
              : 'Finance review recommended before submitting for approval.';

    return {
        chips,
        validation: {
            status,
            workOrderApprovedAmount: workOrderValue,
            varianceAmount: workOrderValue > 0 ? invoiceTotal - workOrderValue : 0,
            variancePercent,
            riskScore: Math.max(vendorRiskScore, variancePercent > 15 ? 78 : variancePercent > 8 ? 52 : 24),
            confidenceScore: confidence,
            recommendedAction: recommendation,
            findings: bullets.slice(0, 5),
        },
        bullets: bullets.slice(0, 4),
        recommendation,
        confidence,
        variancePercent,
    };
}
