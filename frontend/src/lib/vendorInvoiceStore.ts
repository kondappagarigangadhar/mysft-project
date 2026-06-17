'use client';

import {
    buildRealisticLineItemsForCategory,
} from '@/lib/vendor-invoices/vendorInvoiceServiceCatalog';
import { lineItemsDraftToStore } from '@/lib/vendor-invoices/vendorInvoiceWorkOrderBridge';

export type VendorInvoiceApprovalStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Paid';
export type VendorInvoicePaymentStatus = 'Pending' | 'Partial' | 'Paid';
export type VendorInvoiceAiStatus = 'Passed' | 'Needs Review' | 'High Risk';
export type VendorInvoiceCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export type VendorInvoiceLineItem = {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitRate: number;
    amount: number;
};

export type VendorInvoiceAttachmentCategory =
    | 'Vendor Invoice PDF'
    | 'Tax Invoice'
    | 'Completion Photos'
    | 'Before Photos'
    | 'After Photos'
    | 'Resident Signoff'
    | 'Completion Certificate'
    | 'Inspection Report';

export type VendorInvoiceAttachment = {
    id: string;
    category: VendorInvoiceAttachmentCategory;
    fileName: string;
    sizeLabel: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
};

export type VendorInvoiceAiValidation = {
    status: VendorInvoiceAiStatus;
    workOrderApprovedAmount: number;
    varianceAmount: number;
    variancePercent: number;
    riskScore: number;
    confidenceScore: number;
    recommendedAction: string;
    findings: string[];
};

export type VendorInvoiceApproval = {
    submittedBy: string;
    submittedAt: string;
    reviewedBy: string;
    approvedBy: string;
    approvedAt: string;
    comments: string;
};

export type VendorInvoicePayment = {
    paymentDate: string;
    paymentMethod: string;
    transactionReference: string;
    amount: number;
};

export type VendorInvoice = {
    id: number;
    slug: string;
    invoiceId: string;
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
    currency: VendorInvoiceCurrency;
    assignedFinanceUser: string;
    servicePerformed: string;
    lineItems: VendorInvoiceLineItem[];
    subtotal: number;
    gstPercent: number;
    gstAmount: number;
    discount: number;
    invoiceAmount: number;
    approvedAmount: number;
    paidAmount: number;
    balanceAmount: number;
    paymentStatus: VendorInvoicePaymentStatus;
    approvalStatus: VendorInvoiceApprovalStatus;
    aiValidation: VendorInvoiceAiValidation;
    approval: VendorInvoiceApproval;
    payment: VendorInvoicePayment;
    notes: string;
    attachments: VendorInvoiceAttachment[];
    workOrderRef: {
        residentName: string;
        unit: string;
        issueCategory: string;
        completionDate: string;
        vendorAssigned: string;
        workOrderValue: number;
    };
    vendorDetails: {
        vendorType: string;
        contactPerson: string;
        phone: string;
        email: string;
        gstNumber: string;
        panNumber: string;
        complianceStatus: string;
        contractStatus: string;
    };
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
};

export const VENDOR_INVOICE_APPROVAL_STATUSES: VendorInvoiceApprovalStatus[] = [
    'Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Paid',
];
export const VENDOR_INVOICE_PAYMENT_STATUSES: VendorInvoicePaymentStatus[] = ['Pending', 'Partial', 'Paid'];
export const VENDOR_INVOICE_AI_STATUSES: VendorInvoiceAiStatus[] = ['Passed', 'Needs Review', 'High Risk'];
export const VENDOR_INVOICE_CURRENCIES: VendorInvoiceCurrency[] = ['INR', 'USD', 'EUR', 'GBP', 'AED'];

const STORAGE_KEY = 'arris-vendor-invoices-v1';
const CODE_BASE = 2000;

function nowIso() { return new Date().toISOString(); }
function toYmd(d: Date) { return d.toISOString().slice(0, 10); }
function toNum(v: unknown) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

export function formatVendorInvoiceCode(id: number) {
    return `VINV-${CODE_BASE + Math.max(0, Math.floor(id))}`;
}

export function formatMoney(amount: number, currency = 'INR') {
    try {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
    } catch {
        return `${currency} ${amount.toLocaleString('en-IN')}`;
    }
}

function slugify(input: string) {
    return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'vendor-invoice';
}

function derivePaymentStatus(total: number, paid: number): VendorInvoicePaymentStatus {
    if (total > 0 && paid >= total) return 'Paid';
    if (paid > 0) return 'Partial';
    return 'Pending';
}

function calcTotals(lineItems: VendorInvoiceLineItem[], discount: number, gstPercent = 18) {
    const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
    const taxable = Math.max(0, subtotal - discount);
    const gstAmount = Math.round(taxable * (gstPercent / 100));
    const invoiceAmount = taxable + gstAmount;
    return { subtotal, gstAmount, invoiceAmount };
}

export function getVendorInvoicesByWorkOrderId(workOrderId: string, excludeSlug?: string): VendorInvoice[] {
    const id = workOrderId.trim();
    if (!id) return [];
    return getVendorInvoices().filter(
        (x) => x.linkedWorkOrderId.trim() === id && (!excludeSlug || x.slug !== excludeSlug),
    );
}

export function hasDuplicateVendorInvoiceForWorkOrder(workOrderId: string, excludeSlug?: string): boolean {
    return getVendorInvoicesByWorkOrderId(workOrderId, excludeSlug).length > 0;
}

export const VENDOR_INVOICE_STORE_UPDATED_EVENT = 'arris-vendor-invoices-updated';

function persist(all: VendorInvoice[]) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new Event(VENDOR_INVOICE_STORE_UPDATED_EVENT));
    } catch {
        /* ignore */
    }
}

function emptyAi(): VendorInvoiceAiValidation {
    return {
        status: 'Needs Review',
        workOrderApprovedAmount: 0,
        varianceAmount: 0,
        variancePercent: 0,
        riskScore: 0,
        confidenceScore: 0,
        recommendedAction: 'Pending AI review',
        findings: [],
    };
}

function buildSeedInvoices(): VendorInvoice[] {
    const finance = ['Sneha Patil', 'Rohit Bansal', 'Amit Mehra'];
    const rows: Array<{
        vendor: string;
        cat: string;
        vid: string;
        project: string;
        tower: string;
        wo: string;
        sr: string;
        amt: number;
        approval: VendorInvoiceApprovalStatus;
        pay: VendorInvoicePaymentStatus;
        ai: VendorInvoiceAiStatus;
    }> = [
        { vendor: 'Prime Electrical Works', cat: 'Electrical', vid: 'VND-1001', project: 'Skyline Residency', tower: 'Tower A', wo: 'WO-1001', sr: 'SR-72001', amt: 85000, approval: 'Approved', pay: 'Paid', ai: 'Passed' },
        { vendor: 'AquaFix Plumbing Co.', cat: 'Plumbing', vid: 'VND-1006', project: 'Skyline Residency', tower: 'Tower B', wo: 'WO-1002', sr: 'SR-72002', amt: 42000, approval: 'Approved', pay: 'Partial', ai: 'Passed' },
        { vendor: 'CoolAir HVAC Specialists', cat: 'HVAC', vid: 'VND-1007', project: 'Urban Flux Apartments', tower: 'Block C', wo: 'WO-1003', sr: 'SR-72003', amt: 125000, approval: 'Under Review', pay: 'Pending', ai: 'Needs Review' },
        { vendor: 'SafeGuard Security Services', cat: 'Security', vid: 'VND-1003', project: 'Summit Woods', tower: 'Tower 1', wo: 'WO-1004', sr: 'SR-72004', amt: 68000, approval: 'Submitted', pay: 'Pending', ai: 'Passed' },
        { vendor: 'SparkClean Facility Services', cat: 'Cleaning', vid: 'VND-1008', project: 'Urban Flux Apartments', tower: 'Block A', wo: 'WO-1005', sr: 'SR-72005', amt: 28000, approval: 'Rejected', pay: 'Pending', ai: 'High Risk' },
    ];
    const base = new Date();
    return rows.map((r, idx) => {
        const i = idx + 1;
        const lineItems: VendorInvoiceLineItem[] = lineItemsDraftToStore(
            buildRealisticLineItemsForCategory(r.cat, r.amt, `li-${i}`),
        );
        const { subtotal, gstAmount, invoiceAmount } = calcTotals(lineItems, 0, 18);
        const woVal = Math.round(r.amt * 0.95);
        const varAmt = invoiceAmount - woVal;
        const paid = r.pay === 'Paid' ? invoiceAmount : r.pay === 'Partial' ? Math.round(invoiceAmount / 2) : 0;
        const approved = r.approval === 'Approved' || r.approval === 'Paid' ? invoiceAmount : r.approval === 'Under Review' ? Math.round(invoiceAmount * 0.9) : 0;
        const invDate = toYmd(new Date(base.getTime() - (10 + i) * 86400000));
        const dueDate = toYmd(new Date(base.getTime() + 20 * 86400000));
        const slug = slugify(`${r.vendor}-${i}`);
        return {
            id: i,
            slug,
            invoiceId: formatVendorInvoiceCode(i),
            invoiceNumber: `VEND-INV-2026${String(i).padStart(3, '0')}`,
            vendorId: r.vid,
            vendorName: r.vendor,
            vendorCategory: r.cat,
            linkedProject: r.project,
            linkedTower: r.tower,
            linkedWorkOrderId: r.wo,
            linkedWorkOrderSlug: slugify(r.wo),
            linkedServiceRequestId: r.sr,
            linkedServiceRequestSlug: slugify(r.sr),
            invoiceDate: invDate,
            dueDate,
            currency: 'INR',
            assignedFinanceUser: finance[i % 3]!,
            servicePerformed: lineItems[0]?.description ?? `${r.cat} — ${r.project}`,
            lineItems,
            subtotal,
            gstPercent: 18,
            gstAmount,
            discount: 0,
            invoiceAmount,
            approvedAmount: approved,
            paidAmount: paid,
            balanceAmount: Math.max(0, approved - paid),
            paymentStatus: r.pay,
            approvalStatus: r.approval,
            aiValidation: {
                status: r.ai,
                workOrderApprovedAmount: woVal,
                varianceAmount: varAmt,
                variancePercent: woVal ? Math.round((varAmt / woVal) * 1000) / 10 : 0,
                riskScore: r.ai === 'Passed' ? 22 : r.ai === 'Needs Review' ? 58 : 82,
                confidenceScore: r.ai === 'Passed' ? 91 : r.ai === 'Needs Review' ? 74 : 61,
                recommendedAction: r.ai === 'Passed' ? 'Approve for payment' : 'Finance review required',
                findings: r.ai === 'Passed' ? ['Invoice within approved tolerance'] : ['Invoice exceeds approved amount'],
            },
            approval: {
                submittedBy: 'Site Manager',
                submittedAt: invDate,
                reviewedBy: r.approval !== 'Draft' ? 'Finance Lead' : '',
                approvedBy: r.approval === 'Approved' || r.approval === 'Paid' ? 'CFO' : '',
                approvedAt: r.approval === 'Approved' || r.approval === 'Paid' ? dueDate : '',
                comments: 'Verified against work order completion.',
            },
            payment: {
                paymentDate: r.pay === 'Paid' ? dueDate : '',
                paymentMethod: r.pay === 'Paid' ? 'Bank Transfer' : '',
                transactionReference: r.pay === 'Paid' ? `UTR-${9000 + i}` : '',
                amount: paid,
            },
            notes: `${r.cat} maintenance invoice for ${r.project}.`,
            attachments: [{
                id: `att-${i}`,
                category: 'Vendor Invoice PDF',
                fileName: `${slug}-invoice.pdf`,
                sizeLabel: '240 KB',
                url: '',
                uploadedAt: invDate,
                uploadedBy: r.vendor,
            }],
            workOrderRef: {
                residentName: `Resident ${i}`,
                unit: `10${i}`,
                issueCategory: r.cat,
                completionDate: invDate,
                vendorAssigned: r.vendor,
                workOrderValue: woVal,
            },
            vendorDetails: {
                vendorType: 'Contractor',
                contactPerson: 'Ops Lead',
                phone: '+91 9876543210',
                email: 'billing@vendor.in',
                gstNumber: '29ABCDE1234F1Z5',
                panNumber: 'ABCDE1234F',
                complianceStatus: 'Compliant',
                contractStatus: 'Active',
            },
            createdAt: `${invDate}T10:00:00.000Z`,
            updatedAt: `${invDate}T14:00:00.000Z`,
            archivedAt: null,
        };
    });
}

let _invoices: VendorInvoice[] = buildSeedInvoices();
let _nextId = _invoices.length + 1;

if (typeof window !== 'undefined') {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as VendorInvoice[];
            if (Array.isArray(parsed) && parsed.length) {
                _invoices = parsed;
                _nextId = Math.max(...parsed.map((x) => x.id), 0) + 1;
            }
        }
    } catch {
        /* use seed */
    }
}

export function getVendorInvoices(): VendorInvoice[] {
    return _invoices.filter((x) => !x.archivedAt);
}

export function getVendorInvoiceBySlug(slug: string): VendorInvoice | undefined {
    return _invoices.find((x) => x.slug === slug);
}

export function getVendorInvoicesByVendorId(vendorId: string): VendorInvoice[] {
    return getVendorInvoices().filter((x) => x.vendorId === vendorId);
}

export function archiveVendorInvoice(slug: string): boolean {
    const idx = _invoices.findIndex((x) => x.slug === slug);
    if (idx < 0) return false;
    _invoices[idx] = { ..._invoices[idx]!, archivedAt: nowIso(), updatedAt: nowIso() };
    persist(_invoices);
    return true;
}

export function duplicateVendorInvoice(slug: string): VendorInvoice | null {
    const src = getVendorInvoiceBySlug(slug);
    if (!src) return null;
    const id = _nextId++;
    const copy: VendorInvoice = {
        ...src,
        id,
        slug: slugify(`${src.vendorName}-copy-${id}`),
        invoiceId: formatVendorInvoiceCode(id),
        invoiceNumber: `${src.invoiceNumber}-COPY`,
        lineItems: src.lineItems.map((li) => ({ ...li, unit: li.unit ?? 'Job' })),
        approvalStatus: 'Draft',
        paymentStatus: 'Pending',
        paidAmount: 0,
        balanceAmount: src.invoiceAmount,
        approvedAmount: 0,
        archivedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
    };
    _invoices = [copy, ..._invoices];
    persist(_invoices);
    return copy;
}

export type VendorInvoiceCreateInput = {
    invoiceNumber: string;
    vendorId: string;
    vendorName: string;
    vendorCategory: string;
    linkedProject: string;
    linkedTower: string;
    linkedWorkOrderId: string;
    linkedWorkOrderSlug?: string;
    linkedServiceRequestId: string;
    linkedServiceRequestSlug?: string;
    invoiceDate: string;
    dueDate: string;
    currency: VendorInvoiceCurrency;
    assignedFinanceUser: string;
    servicePerformed?: string;
    lineItems: VendorInvoiceLineItem[];
    discount: number;
    gstPercent?: number;
    notes: string;
    approvalStatus?: VendorInvoiceApprovalStatus;
    workOrderRef?: VendorInvoice['workOrderRef'];
    vendorDetails?: VendorInvoice['vendorDetails'];
    aiValidation?: VendorInvoiceAiValidation;
};

export function addVendorInvoice(input: VendorInvoiceCreateInput): VendorInvoice {
    const id = _nextId++;
    const slug = slugify(input.invoiceNumber || input.vendorName || `vendor-invoice-${id}`);
    const gstPercent = input.gstPercent ?? 18;
    const { subtotal, gstAmount, invoiceAmount } = calcTotals(input.lineItems, input.discount, gstPercent);
    const created: VendorInvoice = {
        id,
        slug,
        invoiceId: formatVendorInvoiceCode(id),
        invoiceNumber: input.invoiceNumber.trim(),
        vendorId: input.vendorId,
        vendorName: input.vendorName.trim(),
        vendorCategory: input.vendorCategory.trim(),
        linkedProject: input.linkedProject.trim(),
        linkedTower: input.linkedTower.trim(),
        linkedWorkOrderId: input.linkedWorkOrderId.trim(),
        linkedWorkOrderSlug: input.linkedWorkOrderSlug?.trim() || slugify(input.linkedWorkOrderId),
        linkedServiceRequestId: input.linkedServiceRequestId.trim(),
        linkedServiceRequestSlug: input.linkedServiceRequestSlug?.trim() || slugify(input.linkedServiceRequestId),
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate,
        currency: input.currency,
        assignedFinanceUser: input.assignedFinanceUser.trim(),
        servicePerformed: input.servicePerformed?.trim() || input.lineItems[0]?.description?.trim() || '',
        lineItems: input.lineItems,
        subtotal,
        gstPercent,
        gstAmount,
        discount: input.discount,
        invoiceAmount,
        approvedAmount: 0,
        paidAmount: 0,
        balanceAmount: invoiceAmount,
        paymentStatus: 'Pending',
        approvalStatus: input.approvalStatus ?? 'Draft',
        aiValidation: input.aiValidation ?? emptyAi(),
        approval: { submittedBy: '', submittedAt: '', reviewedBy: '', approvedBy: '', approvedAt: '', comments: '' },
        payment: { paymentDate: '', paymentMethod: '', transactionReference: '', amount: 0 },
        notes: input.notes.trim(),
        attachments: [],
        workOrderRef: input.workOrderRef ?? {
            residentName: '',
            unit: '',
            issueCategory: input.vendorCategory,
            completionDate: '',
            vendorAssigned: input.vendorName,
            workOrderValue: 0,
        },
        vendorDetails: input.vendorDetails ?? {
            vendorType: 'Contractor',
            contactPerson: '',
            phone: '',
            email: '',
            gstNumber: '',
            panNumber: '',
            complianceStatus: 'Pending',
            contractStatus: 'Active',
        },
        createdAt: nowIso(),
        updatedAt: nowIso(),
        archivedAt: null,
    };
    _invoices = [created, ..._invoices];
    persist(_invoices);
    return created;
}

export function updateVendorInvoice(slug: string, patch: Partial<VendorInvoice>): VendorInvoice | null {
    const idx = _invoices.findIndex((x) => x.slug === slug);
    if (idx < 0) return null;
    const prev = _invoices[idx]!;
    const next = { ...prev, ...patch, updatedAt: nowIso() };
    if (patch.lineItems || patch.discount !== undefined) {
        const items = patch.lineItems ?? prev.lineItems;
        const discount = patch.discount ?? prev.discount;
        const gstPercent = patch.gstPercent ?? prev.gstPercent ?? 18;
        const totals = calcTotals(items, discount, gstPercent);
        next.gstPercent = gstPercent;
        next.subtotal = totals.subtotal;
        next.gstAmount = totals.gstAmount;
        next.invoiceAmount = totals.invoiceAmount;
        next.balanceAmount = Math.max(0, (next.approvedAmount || next.invoiceAmount) - next.paidAmount);
        next.paymentStatus = derivePaymentStatus(next.invoiceAmount, next.paidAmount);
    }
    _invoices[idx] = next;
    persist(_invoices);
    return next;
}

export function getDemoFinanceUsers(): string[] {
    return ['Sneha Patil', 'Rohit Bansal', 'Amit Mehra', 'Priya Sharma'];
}

export function getDemoVendorInvoiceCategories(): string[] {
    return ['Plumbing', 'Electrical', 'Civil', 'HVAC', 'Security', 'Cleaning', 'Gardening', 'Pest Control', 'Painting', 'Lift Maintenance', 'Facility Management'];
}

export function buildEmptyVendorInvoice(): VendorInvoice {
    const id = 0;
    return {
        id,
        slug: 'new',
        invoiceId: formatVendorInvoiceCode(_nextId),
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
        invoiceDate: toYmd(new Date()),
        dueDate: '',
        currency: 'INR',
        assignedFinanceUser: '',
        servicePerformed: '',
        lineItems: [],
        subtotal: 0,
        gstPercent: 18,
        gstAmount: 0,
        discount: 0,
        invoiceAmount: 0,
        approvedAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        paymentStatus: 'Pending',
        approvalStatus: 'Draft',
        aiValidation: emptyAi(),
        approval: { submittedBy: '', submittedAt: '', reviewedBy: '', approvedBy: '', approvedAt: '', comments: '' },
        payment: { paymentDate: '', paymentMethod: '', transactionReference: '', amount: 0 },
        notes: '',
        attachments: [],
        workOrderRef: { residentName: '', unit: '', issueCategory: '', completionDate: '', vendorAssigned: '', workOrderValue: 0 },
        vendorDetails: { vendorType: '', contactPerson: '', phone: '', email: '', gstNumber: '', panNumber: '', complianceStatus: '', contractStatus: '' },
        createdAt: nowIso(),
        updatedAt: nowIso(),
        archivedAt: null,
    };
}
