import type {
    ProcurementChargesDraft,
    ProcurementMaterialDraft,
} from '@/lib/procurement/procurementInvoiceBilling';

const STORAGE_PREFIX = 'procurement-invoice-billing:';

export type StoredProcurementInvoiceBilling = {
    materials: ProcurementMaterialDraft[];
    charges: ProcurementChargesDraft;
};

export function procurementBillingStorageKey(slugOrDraftId: string) {
    return `${STORAGE_PREFIX}${slugOrDraftId}`;
}

export function loadStoredProcurementBilling(key: string): StoredProcurementInvoiceBilling | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredProcurementInvoiceBilling;
        if (!parsed?.materials?.length) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function saveStoredProcurementBilling(key: string, data: StoredProcurementInvoiceBilling) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(data));
    } catch {
        /* ignore quota errors */
    }
}

export function clearStoredProcurementBilling(key: string) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(key);
    } catch {
        /* ignore */
    }
}
