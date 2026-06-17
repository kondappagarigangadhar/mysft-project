/**
 * Global audit / history log — client-side mock today; server shape compatible.
 */
export const HISTORY_MODULES = [
    'leads',
    'projects',
    'inventory',
    'pricing',
    'bookings',
    'payments',
    'documents',
    'users',
    /** Vendor profile audit — scoped rows; global list may be empty until backend wiring. */
    'vendors',
    /** Supplier profile audit — scoped rows; global list may be empty until backend wiring. */
    'suppliers',
    /** Procurement / operations — work orders. */
    'work_orders',
    /** Procurement — purchase requests (Step 1). */
    'purchase_requests',
    /** Procurement — purchase orders (PO). */
    'purchase_orders',
    /** Procurement / finance — vendor & supplier invoices and payment tracking. */
    'invoices',
    /** Platform — tenant / organization records. */
    'tenants',
    /** Community Hub — resident profiles. */
    'residents',
    /** Community Hub — service requests & maintenance tickets. */
    'service_maintenance',
    /** Lead & Sales — customer / buyer portal workspaces. */
    'customers',
] as const;

export type HistoryModule = (typeof HISTORY_MODULES)[number];

export const HISTORY_SEVERITIES = ['info', 'success', 'warning', 'critical'] as const;
export type HistorySeverity = (typeof HISTORY_SEVERITIES)[number];

export type HistoryUserRef = {
    id: string;
    name: string;
    role?: string;
};

export type HistoryLogEntry = {
    id: string;
    at: string; // ISO 8601
    user: HistoryUserRef;
    module: HistoryModule;
    recordId: string;
    recordLabel: string;
    action: string;
    changes?: string;
    /** Optional structured diff (when not set, UI may derive from `changes`). */
    beforeValue?: string;
    afterValue?: string;
    severity: HistorySeverity;
    /** Normalized category for filters (e.g. status_changed, price_updated) */
    actionType: string;
};

export type HistoryLogFilterState = {
    search: string;
    module: HistoryModule | 'all';
    userId: string | 'all';
    actionType: string | 'all';
    severity: HistorySeverity | 'all';
    dateFrom: string; // yyyy-mm-dd or ''
    dateTo: string;
};

/** For colored action labels (ServiceNow / Salesforce style). */
export type HistoryActionBadgeKind =
    | 'created'
    | 'edited'
    | 'deleted'
    | 'converted'
    | 'assigned'
    | 'other';
