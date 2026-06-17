'use client';

import type { Invoice } from '@/lib/invoiceStore';
import type { PurchaseOrder } from '@/lib/purchaseOrderStore';
import type { PurchaseRequestApprovalStatus } from '@/lib/purchaseRequestStore';
import type { PrSupplierQuoteRow } from '@/lib/procurement/prSupplierQuotes';

import {
    applySequentialWorkflowStates,
    attachWorkflowStepNav,
    type WorkflowStep,
    type WorkflowStepNav,
    type WorkflowStepState,
} from '@/lib/workflow/workflowStepTypes';

export const PROCUREMENT_WORKFLOW_NAV: Record<string, WorkflowStepNav> = {
    request: { tab: 'overview', sectionId: 'wf-pr-request' },
    approval: { tab: 'overview', sectionId: 'wf-pr-approval' },
    supplier: { tab: 'overview', sectionId: 'wf-pr-supplier', requiresSaved: true },
    po: { tab: 'overview', sectionId: 'wf-pr-purchase-orders', requiresSaved: true },
    delivery: { tab: 'overview', sectionId: 'wf-pr-purchase-orders', requiresSaved: true },
    invoice: { tab: 'overview', sectionId: 'wf-pr-invoices', requiresSaved: true },
    payment: { tab: 'overview', sectionId: 'wf-pr-invoices', requiresSaved: true },
};

export type { WorkflowStepState };
export type ProcurementWorkflowStep = WorkflowStep;

export type PrAiProcurementInsights = {
    recommendedSupplier: string;
    recommendationNote: string;
    procurementRisk: 'Low' | 'Medium' | 'High';
    deliveryRisk: 'Low' | 'Medium' | 'High';
    slaAlert: string | null;
    bestDecision: string;
    healthScore: number;
    healthLabel: string;
};

export function poDisplayStatus(po: PurchaseOrder): 'Created' | 'Sent' | 'Delivered' {
    if (po.status === 'Delivered' || po.delivery.status === 'Completed') return 'Delivered';
    return po.status;
}

export function poDeliveryProgressPct(po: PurchaseOrder): number {
    if (po.status === 'Delivered' || po.delivery.status === 'Completed') return 100;
    if (po.delivery.status === 'Partial') {
        const q = po.quantity > 0 ? Math.round((po.delivery.receivedQuantity / po.quantity) * 100) : 50;
        return Math.min(99, Math.max(10, q));
    }
    return 0;
}

export function poProcurementCompletionPct(po: PurchaseOrder): number {
    return poDeliveryProgressPct(po);
}

export function computeProcurementWorkflowSteps(input: {
    isCreate: boolean;
    approvalStatus: PurchaseRequestApprovalStatus;
    selectedSupplierId: string | null;
    linkedPoCount: number;
    orders: PurchaseOrder[];
    linkedInvoiceCount: number;
    invoices: Invoice[];
}): ProcurementWorkflowStep[] {
    const { isCreate, approvalStatus, selectedSupplierId, linkedPoCount, orders, linkedInvoiceCount, invoices } = input;
    const approved = approvalStatus === 'Approved';
    const rejected = approvalStatus === 'Rejected';
    const hasSupplier = Boolean(selectedSupplierId?.trim());
    const hasPo = linkedPoCount > 0;
    const allDelivered = hasPo && orders.every((o) => o.status === 'Delivered' || o.delivery.status === 'Completed');
    const hasInvoice = linkedInvoiceCount > 0;
    const allPaid = hasInvoice && invoices.length > 0 && invoices.every((i) => i.paymentStatus === 'Paid');

    const done = [
        !isCreate,
        approved || rejected,
        approved && hasSupplier,
        approved && hasPo,
        approved && hasPo && allDelivered,
        approved && hasPo && hasInvoice,
        approved && hasInvoice && allPaid,
    ];

    const states = applySequentialWorkflowStates(done);
    const labels = [
        'Request',
        approvalStatus === 'Approved' ? 'Approval' : approvalStatus,
        hasSupplier ? 'Supplier Selected' : 'Supplier',
        hasPo ? 'PO Created' : 'PO',
        'Delivery',
        hasInvoice ? 'Invoice' : 'Invoice',
        allPaid ? 'Paid' : 'Payment',
    ];

    return attachWorkflowStepNav(
        ['request', 'approval', 'supplier', 'po', 'delivery', 'invoice', 'payment'].map((id, i) => ({
            id,
            label: labels[i]!,
            state: states[i]!,
        })),
        PROCUREMENT_WORKFLOW_NAV,
    );
}

export function computeProcurementHealthScore(input: {
    approvalStatus: PurchaseRequestApprovalStatus;
    hasSupplier: boolean;
    linkedPoCount: number;
    orders: PurchaseOrder[];
    linkedInvoiceCount?: number;
    invoices?: Invoice[];
}): { score: number; label: string } {
    let score = 0;
    if (input.approvalStatus === 'Approved') score += 25;
    else if (input.approvalStatus === 'Pending') score += 10;
    if (input.hasSupplier) score += 20;
    if (input.linkedPoCount > 0) score += 20;
    if (input.orders.length) {
        const delivered = input.orders.filter((o) => o.status === 'Delivered' || o.delivery.status === 'Completed').length;
        score += Math.round((delivered / input.orders.length) * 15);
    }
    const invoices = input.invoices ?? [];
    if (invoices.length) {
        const paid = invoices.filter((i) => i.paymentStatus === 'Paid').length;
        score += Math.round((paid / invoices.length) * 20);
    } else if ((input.linkedInvoiceCount ?? 0) > 0) {
        score += 10;
    }
    score = Math.min(100, score);
    const label = score >= 85 ? 'On track' : score >= 55 ? 'In progress' : score >= 30 ? 'Needs attention' : 'At risk';
    return { score, label };
}

export function computeAiProcurementInsights(input: {
    material: string;
    approvalStatus: PurchaseRequestApprovalStatus;
    selectedSupplierId: string | null;
    comparisonRows: PrSupplierQuoteRow[];
    orders: PurchaseOrder[];
    invoices: Invoice[];
    priority: string;
}): PrAiProcurementInsights {
    const selected = input.comparisonRows.find((r) => r.supplierId === input.selectedSupplierId);
    const recommended =
        selected?.supplierName ??
        input.comparisonRows.find((r) => r.isBestPrice)?.supplierName ??
        '—';

    const tags = selected?.recommendationTags ?? [];
    const note =
        selected && tags.length
            ? `${recommended} selected — ${tags.slice(0, 2).join(' + ')}.`
            : selected
              ? `${recommended} selected for ${input.material || 'this material'}.`
              : 'Select a supplier after approval to unlock recommendations.';

    let procurementRisk: PrAiProcurementInsights['procurementRisk'] = 'Low';
    if (input.approvalStatus !== 'Approved') procurementRisk = 'Medium';
    if (!input.selectedSupplierId && input.approvalStatus === 'Approved') procurementRisk = 'High';
    if (input.priority === 'High' && !input.orders.length) procurementRisk = 'High';

    let deliveryRisk: PrAiProcurementInsights['deliveryRisk'] = 'Low';
    const pendingDel = input.orders.filter((o) => o.delivery.status === 'Pending' && o.status !== 'Delivered').length;
    if (pendingDel >= 2) deliveryRisk = 'High';
    else if (pendingDel === 1) deliveryRisk = 'Medium';

    const slaAlert =
        deliveryRisk === 'High'
            ? 'Multiple POs awaiting delivery — review schedules.'
            : input.orders.some((o) => o.delivery.status === 'Partial')
              ? 'Partial delivery in progress on linked PO(s).'
              : null;

    const bestDecision =
        input.comparisonRows.find((r) => r.isBestPrice && r.availabilityStatus === 'Available')?.supplierName != null
            ? `Award to ${input.comparisonRows.find((r) => r.isBestPrice)?.supplierName} for lowest quoted price with availability.`
            : 'Complete supplier comparison before issuing POs.';

    const { score, label } = computeProcurementHealthScore({
        approvalStatus: input.approvalStatus,
        hasSupplier: Boolean(input.selectedSupplierId),
        linkedPoCount: input.orders.length,
        orders: input.orders,
        linkedInvoiceCount: input.invoices.length,
        invoices: input.invoices,
    });

    return {
        recommendedSupplier: recommended,
        recommendationNote: note,
        procurementRisk,
        deliveryRisk,
        slaAlert,
        bestDecision,
        healthScore: score,
        healthLabel: label,
    };
}
