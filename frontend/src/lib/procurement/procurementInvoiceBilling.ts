import type { Invoice } from '@/lib/invoiceStore';
import { formatMoney } from '@/lib/invoiceStore';

export const PROCUREMENT_MATERIAL_CATEGORIES = [
    'Cement',
    'Steel',
    'Sand',
    'Electrical',
    'Plumbing',
    'Paint',
    'Tiles',
    'Hardware',
    'HVAC Materials',
] as const;

export type ProcurementMaterialCategory = (typeof PROCUREMENT_MATERIAL_CATEGORIES)[number];

export type ProcurementMaterialRow = {
    id: string;
    materialName: string;
    category: ProcurementMaterialCategory | string;
    gradeQuality: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unit: string;
    unitCost: number;
    lineAmount: number;
};

/** String-backed form row for inline edit / create flows. */
export type ProcurementMaterialDraft = {
    id: string;
    materialName: string;
    category: string;
    gradeQuality: string;
    orderedQuantity: string;
    receivedQuantity: string;
    unit: string;
    unitCost: string;
};

export type ProcurementChargesDraft = {
    transportCharges: string;
    loadingCharges: string;
    discount: string;
};

export const PROCUREMENT_UNIT_OPTIONS = ['Bags', 'MT', 'Cu.m', 'Mtr', 'Nos', 'Set', 'Kg', 'Ltr'] as const;

export type ProcurementBillingSummary = {
    materialValue: number;
    transportCharges: number;
    loadingCharges: number;
    discount: number;
    gst: number;
    finalInvoiceAmount: number;
};

export type MaterialInspectionStatus =
    | 'Pending Inspection'
    | 'Approved'
    | 'Rejected'
    | 'Partial Approval';

export type MaterialInspectionRow = {
    id: string;
    materialName: string;
    inspectionStatus: MaterialInspectionStatus;
    qualityGrade: string;
    remarks: string;
};

export type LinkedProcurementRecords = {
    purchaseRequisition: string;
    purchaseOrder: string;
    goodsReceiptNote: string;
    supplierContract: string;
    project: string;
};

export type ProcurementAiValidation = {
    poMatchPercent: number;
    quantityVariancePercent: number;
    costVariancePercent: number;
    supplierComplianceStatus: 'Compliant' | 'Review Required' | 'Non-Compliant';
    riskAlerts: string[];
    recommendation: string;
};

export type ProcurementInvoiceBillingBundle = {
    materials: ProcurementMaterialRow[];
    summary: ProcurementBillingSummary;
    inspections: MaterialInspectionRow[];
    linkedRecords: LinkedProcurementRecords;
    aiValidation: ProcurementAiValidation;
};

function lineAmount(qty: number, unitCost: number) {
    return Math.round(qty * unitCost * 100) / 100;
}

export function createEmptyMaterialDraft(category: string = 'Hardware'): ProcurementMaterialDraft {
    return {
        id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        materialName: '',
        category,
        gradeQuality: '',
        orderedQuantity: '',
        receivedQuantity: '',
        unit: 'Nos',
        unitCost: '',
    };
}

export function materialRowToDraft(row: ProcurementMaterialRow): ProcurementMaterialDraft {
    return {
        id: row.id,
        materialName: row.materialName,
        category: String(row.category),
        gradeQuality: row.gradeQuality,
        orderedQuantity: String(row.orderedQuantity),
        receivedQuantity: String(row.receivedQuantity),
        unit: row.unit,
        unitCost: String(row.unitCost),
    };
}

export function normalizeMaterialDraft(draft: ProcurementMaterialDraft): ProcurementMaterialRow {
    const orderedQuantity = Number(draft.orderedQuantity) || 0;
    const receivedQuantity = Number(draft.receivedQuantity) || 0;
    const unitCost = Number(draft.unitCost) || 0;
    return {
        id: draft.id,
        materialName: draft.materialName.trim() || '—',
        category: draft.category.trim() || 'Hardware',
        gradeQuality: draft.gradeQuality.trim() || '—',
        orderedQuantity,
        receivedQuantity,
        unit: draft.unit.trim() || 'Nos',
        unitCost,
        lineAmount: lineAmount(receivedQuantity, unitCost),
    };
}

export function chargesDraftFromSummary(summary: ProcurementBillingSummary): ProcurementChargesDraft {
    return {
        transportCharges: String(summary.transportCharges),
        loadingCharges: String(summary.loadingCharges),
        discount: String(summary.discount),
    };
}

function buildSummaryFromMaterials(
    materials: ProcurementMaterialRow[],
    invoice: Invoice,
    transport: number,
    loading: number,
    discount: number,
): ProcurementBillingSummary {
    const materialValue = materials.reduce((s, m) => s + m.lineAmount, 0);
    const gst = invoice.taxAmount > 0 ? invoice.taxAmount : Math.round(materialValue * 0.18 * 100) / 100;
    const finalInvoiceAmount =
        invoice.totalAmount > 0
            ? invoice.totalAmount
            : Math.round((materialValue + transport + loading - discount + gst) * 100) / 100;
    return {
        materialValue,
        transportCharges: transport,
        loadingCharges: loading,
        discount,
        gst,
        finalInvoiceAmount,
    };
}

function inspectionForMaterial(
    material: ProcurementMaterialRow,
    idx: number,
): MaterialInspectionRow {
    const variance =
        material.orderedQuantity > 0
            ? Math.abs(material.receivedQuantity - material.orderedQuantity) / material.orderedQuantity
            : 0;
    let inspectionStatus: MaterialInspectionStatus = 'Approved';
    let qualityGrade = material.gradeQuality;
    let remarks = 'Within specification — cleared for billing.';

    if (variance >= 0.08) {
        inspectionStatus = 'Partial Approval';
        remarks = `${Math.round(variance * 100)}% quantity variance — partial release approved.`;
    } else if (material.receivedQuantity < material.orderedQuantity * 0.92) {
        inspectionStatus = 'Pending Inspection';
        remarks = 'Awaiting site engineer sign-off on received quantity.';
    } else if (idx % 5 === 4) {
        inspectionStatus = 'Rejected';
        remarks = 'Batch failed slump test — hold payment until replacement GRN.';
        qualityGrade = 'Below spec';
    }

    return {
        id: `insp-${material.id}`,
        materialName: material.materialName,
        inspectionStatus,
        qualityGrade,
        remarks,
    };
}

function seedMaterialsForInvoice(invoice: Invoice): ProcurementMaterialRow[] {
    const slug = invoice.slug.toLowerCase();

    if (slug.includes('cement')) {
        return [
            {
                id: 'mat-1',
                materialName: 'OPC 53 Grade Cement',
                category: 'Cement',
                gradeQuality: 'IS 269:2015',
                orderedQuantity: 420,
                receivedQuantity: 420,
                unit: 'Bags',
                unitCost: 385,
                lineAmount: lineAmount(420, 385),
            },
            {
                id: 'mat-2',
                materialName: 'PPC Cement',
                category: 'Cement',
                gradeQuality: 'IS 1489',
                orderedQuantity: 80,
                receivedQuantity: 78,
                unit: 'Bags',
                unitCost: 360,
                lineAmount: lineAmount(78, 360),
            },
        ];
    }

    if (slug.includes('steel')) {
        return [
            {
                id: 'mat-1',
                materialName: 'TMT 500D Rebars 12mm',
                category: 'Steel',
                gradeQuality: 'Fe 500D',
                orderedQuantity: 18.5,
                receivedQuantity: 18.5,
                unit: 'MT',
                unitCost: 58500,
                lineAmount: lineAmount(18.5, 58500),
            },
            {
                id: 'mat-2',
                materialName: 'Structural Steel Sections',
                category: 'Steel',
                gradeQuality: 'IS 2062',
                orderedQuantity: 6.2,
                receivedQuantity: 6.0,
                unit: 'MT',
                unitCost: 72000,
                lineAmount: lineAmount(6, 72000),
            },
        ];
    }

    if (slug.includes('rmc')) {
        return [
            {
                id: 'mat-1',
                materialName: 'Ready-Mix Concrete M30',
                category: 'Cement',
                gradeQuality: 'M30 — 150mm slump',
                orderedQuantity: 52,
                receivedQuantity: 52,
                unit: 'Cu.m',
                unitCost: 5200,
                lineAmount: lineAmount(52, 5200),
            },
        ];
    }

    if (slug.includes('electrical') || invoice.linkedProject.toLowerCase().includes('flux')) {
        return [
            {
                id: 'mat-1',
                materialName: 'Copper Cable 4 sq.mm',
                category: 'Electrical',
                gradeQuality: 'IS 694',
                orderedQuantity: 1200,
                receivedQuantity: 1180,
                unit: 'Mtr',
                unitCost: 42,
                lineAmount: lineAmount(1180, 42),
            },
            {
                id: 'mat-2',
                materialName: 'MCB Distribution Board',
                category: 'Electrical',
                gradeQuality: 'IEC 60898',
                orderedQuantity: 24,
                receivedQuantity: 24,
                unit: 'Nos',
                unitCost: 1850,
                lineAmount: lineAmount(24, 1850),
            },
        ];
    }

    const baseAmount = invoice.invoiceAmount > 0 ? invoice.invoiceAmount : 125000;
    const unitCost = Math.round(baseAmount / 100);
    return [
        {
            id: 'mat-1',
            materialName: invoice.notes?.split('.')[0]?.trim() || 'Procurement materials — lot 1',
            category: 'Hardware',
            gradeQuality: 'Commercial grade',
            orderedQuantity: 100,
            receivedQuantity: 98,
            unit: 'Nos',
            unitCost,
            lineAmount: lineAmount(98, unitCost),
        },
        {
            id: 'mat-2',
            materialName: 'Site consumables pack',
            category: 'Plumbing',
            gradeQuality: 'Standard',
            orderedQuantity: 40,
            receivedQuantity: 40,
            unit: 'Set',
            unitCost: Math.round(unitCost * 0.35),
            lineAmount: lineAmount(40, Math.round(unitCost * 0.35)),
        },
    ];
}

function buildLinkedRecords(invoice: Invoice): LinkedProcurementRecords {
    const y = new Date().getFullYear();
    const pr = invoice.linkedPrNumber?.trim() || `PR-${y}-${1000 + (invoice.id % 50)}`;
    const po = invoice.linkedPurchaseOrder?.trim() || `PO-${y}-${1000 + (invoice.id % 30)}`;
    const grn = `GRN-${y}-${2000 + (invoice.id % 40)}`;
    const contract = invoice.partyName?.trim()
        ? `SC-${invoice.partyName.replace(/\s+/g, '').slice(0, 6).toUpperCase()}-${y}`
        : `SC-SUPPLIER-${y}`;

    return {
        purchaseRequisition: pr,
        purchaseOrder: po,
        goodsReceiptNote: grn,
        supplierContract: contract,
        project: invoice.linkedProject?.trim() || '—',
    };
}

function buildAiValidation(invoice: Invoice, materials: ProcurementMaterialRow[]): ProcurementAiValidation {
    const totalOrdered = materials.reduce((s, m) => s + m.orderedQuantity, 0);
    const totalReceived = materials.reduce((s, m) => s + m.receivedQuantity, 0);
    const quantityVariancePercent =
        totalOrdered > 0 ? Math.round(Math.abs(totalReceived - totalOrdered) / totalOrdered * 1000) / 10 : 0;

    const poMatchPercent =
        invoice.linkedPurchaseOrder?.trim() && invoice.linkedPrSlug?.trim()
            ? Math.min(99, 94 + (invoice.id % 6))
            : 72 + (invoice.id % 15);

    const costVariancePercent = invoice.validation?.status === 'Rejected' ? 8.5 : 1.2 + (invoice.id % 3) * 0.4;

    const riskAlerts: string[] = [];
    if (quantityVariancePercent >= 2) {
        riskAlerts.push(`${quantityVariancePercent}% quantity variance detected`);
    }
    if (!invoice.linkedPurchaseOrder?.trim()) {
        riskAlerts.push('Purchase order link missing on invoice');
    }
    if (invoice.validation?.status === 'Pending') {
        riskAlerts.push('Finance validation pending — hold payment');
    }
    if (materials.some((m) => m.receivedQuantity < m.orderedQuantity * 0.95)) {
        riskAlerts.push('GRN quantity short against PO line items');
    }

    let recommendation = 'Invoice aligns with PO and GRN — proceed to finance approval.';
    if (quantityVariancePercent >= 2) {
        recommendation = 'Verify GRN before payment release.';
    } else if (invoice.validation?.status === 'Pending') {
        recommendation = 'Complete material inspection sign-off before payment authorization.';
    } else if (costVariancePercent > 5) {
        recommendation = 'Review unit cost variance against contracted supplier rates.';
    }

    const supplierComplianceStatus: ProcurementAiValidation['supplierComplianceStatus'] =
        invoice.validation?.status === 'Rejected'
            ? 'Non-Compliant'
            : riskAlerts.length >= 2
              ? 'Review Required'
              : 'Compliant';

    return {
        poMatchPercent,
        quantityVariancePercent,
        costVariancePercent,
        supplierComplianceStatus,
        riskAlerts,
        recommendation,
    };
}

export function getProcurementInvoiceBilling(invoice: Invoice): ProcurementInvoiceBillingBundle {
    const materials = seedMaterialsForInvoice(invoice);
    const transport = Math.round(materials.reduce((s, m) => s + m.lineAmount, 0) * 0.012);
    const loading = Math.round(materials.reduce((s, m) => s + m.lineAmount, 0) * 0.006);
    const discount = invoice.id % 3 === 0 ? Math.round(materials.reduce((s, m) => s + m.lineAmount, 0) * 0.01) : 0;
    const summary = buildSummaryFromMaterials(materials, invoice, transport, loading, discount);
    const inspections = materials.map((m, i) => inspectionForMaterial(m, i));
    const linkedRecords = buildLinkedRecords(invoice);
    const aiValidation = buildAiValidation(invoice, materials);

    return { materials, summary, inspections, linkedRecords, aiValidation };
}

export function computeProcurementBillingBundle(
    invoice: Invoice,
    materialDrafts: ProcurementMaterialDraft[],
    charges: ProcurementChargesDraft,
    liveTotals = false,
): ProcurementInvoiceBillingBundle {
    const materials = materialDrafts.length
        ? materialDrafts.map(normalizeMaterialDraft)
        : seedMaterialsForInvoice(invoice);
    const transport = Number(charges.transportCharges) || 0;
    const loading = Number(charges.loadingCharges) || 0;
    const discount = Number(charges.discount) || 0;

    let summary: ProcurementBillingSummary;
    if (liveTotals) {
        const materialValue = materials.reduce((s, m) => s + m.lineAmount, 0);
        const gst = Math.round(materialValue * 0.18 * 100) / 100;
        const finalInvoiceAmount = Math.round((materialValue + transport + loading - discount + gst) * 100) / 100;
        summary = {
            materialValue,
            transportCharges: transport,
            loadingCharges: loading,
            discount,
            gst,
            finalInvoiceAmount,
        };
    } else {
        summary = buildSummaryFromMaterials(materials, invoice, transport, loading, discount);
    }

    const inspections = materials.map((m, i) => inspectionForMaterial(m, i));
    const linkedRecords = buildLinkedRecords(invoice);
    const aiValidation = buildAiValidation(invoice, materials);

    return { materials, summary, inspections, linkedRecords, aiValidation };
}

export function procurementBillingStateFromInvoice(invoice: Invoice) {
    const seed = getProcurementInvoiceBilling(invoice);
    return {
        materials: seed.materials.map(materialRowToDraft),
        charges: chargesDraftFromSummary(seed.summary),
    };
}

export function createEmptyProcurementBillingState() {
    return {
        materials: [createEmptyMaterialDraft()],
        charges: { transportCharges: '', loadingCharges: '', discount: '' } satisfies ProcurementChargesDraft,
    };
}

export function formatProcurementMoney(amount: number, currency: Invoice['currency'] = 'INR') {
    return formatMoney(amount, currency);
}
