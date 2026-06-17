import type { HistoryLogEntry, HistoryLogFilterState, HistoryModule, HistorySeverity } from '@/lib/historyLogs/types';

/** Deterministic mock catalog — global timeline */
export const MOCK_HISTORY_LOGS: HistoryLogEntry[] = [
    {
        id: 'h-001',
        at: '2026-04-24T14:45:00+05:30',
        user: { id: 'u-amit', name: 'Amit Sales', role: 'Sales' },
        module: 'leads',
        recordId: 'vikram-kapoor',
        recordLabel: 'Vikram Kapoor',
        action: 'Status changed',
        changes: 'New → Qualified',
        severity: 'info',
        actionType: 'status_changed',
    },
    {
        id: 'h-002',
        at: '2026-04-24T10:20:00+05:30',
        user: { id: 'u-rajesh', name: 'Rajesh Kumar', role: 'PM' },
        module: 'projects',
        recordId: 'skyline-residency',
        recordLabel: 'Skyline Residency',
        action: 'Project created',
        changes: '—',
        severity: 'success',
        actionType: 'created',
    },
    {
        id: 'h-003',
        at: '2026-04-24T11:00:00+05:30',
        user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
        module: 'inventory',
        recordId: 'unit-a-102',
        recordLabel: 'Unit A-102',
        action: 'Availability changed',
        changes: 'Reserved → Available',
        severity: 'warning',
        actionType: 'availability_changed',
    },
    {
        id: 'h-004',
        at: '2026-04-24T11:12:00+05:30',
        user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
        module: 'pricing',
        recordId: 'unit-a-102',
        recordLabel: 'Unit A-102',
        action: 'Price updated',
        changes: '₹65,00,000 → ₹66,00,000',
        severity: 'info',
        actionType: 'price_updated',
    },
    {
        id: 'h-005',
        at: '2026-04-24T12:30:00+05:30',
        user: { id: 'u-sneha', name: 'Sneha Patil', role: 'Accounts' },
        module: 'payments',
        recordId: 'payment-bank-500k-rcp77821',
        recordLabel: 'RCP-77821 · Bank',
        action: 'Status changed',
        changes: 'Pending → Completed',
        severity: 'success',
        actionType: 'status_changed',
    },
    {
        id: 'h-006',
        at: '2026-04-24T09:00:00+05:30',
        user: { id: 'u-rajesh', name: 'Rajesh Kumar', role: 'PM' },
        module: 'projects',
        recordId: 'urban-flux-apartments',
        recordLabel: 'Urban Flux Apartments',
        action: 'Project manager changed',
        changes: 'Anita → Rajesh',
        severity: 'info',
        actionType: 'manager_changed',
    },
    {
        id: 'h-007',
        at: '2026-04-23T16:20:00+05:30',
        user: { id: 'u-amit', name: 'Amit Sales', role: 'Sales' },
        module: 'leads',
        recordId: 'meena-iyer',
        recordLabel: 'Meena Iyer',
        action: 'Assigned to changed',
        changes: 'Pool → Sales Team A',
        severity: 'info',
        actionType: 'assigned_changed',
    },
    {
        id: 'h-008',
        at: '2026-04-23T18:00:00+05:30',
        user: { id: 'u-amit', name: 'Amit Sales', role: 'Sales' },
        module: 'leads',
        recordId: 'meena-iyer',
        recordLabel: 'Meena Iyer',
        action: 'Lead created',
        changes: '—',
        severity: 'success',
        actionType: 'created',
    },
    {
        id: 'h-009',
        at: '2026-04-24T15:00:00+05:30',
        user: { id: 'u-priya', name: 'Priya Nair', role: 'Ops' },
        module: 'bookings',
        recordId: 'skyline-residency-101',
        recordLabel: 'Ramesh Kumar · Unit 101',
        action: 'Booking updated',
        changes: 'Installment plan adjusted',
        severity: 'info',
        actionType: 'updated',
    },
    {
        id: 'h-010',
        at: '2026-04-22T11:00:00+05:30',
        user: { id: 'u-priya', name: 'Priya Nair', role: 'Ops' },
        module: 'bookings',
        recordId: 'urban-flux-apartments-102',
        recordLabel: 'Anita Sharma · Unit 102',
        action: 'Booking created',
        changes: '—',
        severity: 'success',
        actionType: 'created',
    },
    {
        id: 'h-011',
        at: '2026-04-24T14:00:00+05:30',
        user: { id: 'u-sneha', name: 'Sneha Patil', role: 'Accounts' },
        module: 'payments',
        recordId: 'payment-ufa-anita-bank-800k',
        recordLabel: 'RCP-UF-90001 · Bank',
        action: 'Refund processed',
        changes: '₹50,000 to source account',
        severity: 'warning',
        actionType: 'refund',
    },
    {
        id: 'h-012',
        at: '2026-04-24T13:00:00+05:30',
        user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
        module: 'pricing',
        recordId: 'unit-b-201',
        recordLabel: 'Unit B-201',
        action: 'Approval requested',
        changes: 'Base ₹72L, offer ₹70L',
        severity: 'info',
        actionType: 'approval_requested',
    },
    {
        id: 'h-013',
        at: '2026-04-24T13:30:00+05:30',
        user: { id: 'u-rajesh', name: 'Rajesh Kumar', role: 'PM' },
        module: 'pricing',
        recordId: 'unit-b-201',
        recordLabel: 'Unit B-201',
        action: 'Price change approved',
        changes: '—',
        severity: 'success',
        actionType: 'approved',
    },
    {
        id: 'h-014',
        at: '2026-04-24T10:00:00+05:30',
        user: { id: 'u-rajesh', name: 'Rajesh Kumar', role: 'PM' },
        module: 'pricing',
        recordId: 'unit-c-050',
        recordLabel: 'Unit C-050',
        action: 'Price change rejected',
        changes: 'Offer above policy threshold',
        severity: 'critical',
        actionType: 'rejected',
    },
    {
        id: 'h-018',
        at: '2026-04-24T16:00:00+05:30',
        user: { id: 'u-legal', name: 'Kavita Legal', role: 'Compliance' },
        module: 'documents',
        recordId: 'DOC-2026-0001',
        recordLabel: 'RERA Project Registration',
        action: 'Document uploaded',
        changes: 'v2',
        severity: 'info',
        actionType: 'uploaded',
    },
    {
        id: 'h-019',
        at: '2026-04-24T16:10:00+05:30',
        user: { id: 'u-legal', name: 'Kavita Legal', role: 'Compliance' },
        module: 'documents',
        recordId: 'DOC-2026-0001',
        recordLabel: 'RERA Project Registration',
        action: 'Document approved',
        changes: '—',
        severity: 'success',
        actionType: 'approved',
    },
    {
        id: 'h-020',
        at: '2026-04-21T09:00:00+05:30',
        user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
        module: 'documents',
        recordId: 'DOC-2026-0002',
        recordLabel: 'Booking Agreement — Unit 102',
        action: 'Document deleted',
        changes: 'Superseded',
        severity: 'warning',
        actionType: 'deleted',
    },
    {
        id: 'h-021',
        at: '2026-04-20T10:00:00+05:30',
        user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
        module: 'users',
        recordId: 'u-new-ops',
        recordLabel: 'arjun.ops@mysft.demo',
        action: 'User created',
        changes: 'Role: staff',
        severity: 'success',
        actionType: 'user_created',
    },
    {
        id: 'h-022',
        at: '2026-04-20T11:00:00+05:30',
        user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
        module: 'users',
        recordId: 'u-new-ops',
        recordLabel: 'arjun.ops@mysft.demo',
        action: 'Role changed',
        changes: 'staff → company_admin',
        severity: 'warning',
        actionType: 'role_changed',
    },
    {
        id: 'h-023',
        at: '2026-04-19T15:00:00+05:30',
        user: { id: 'u-priya', name: 'Priya Nair', role: 'Ops' },
        module: 'bookings',
        recordId: 'urban-flux-apartments-102',
        recordLabel: 'Anita Sharma · Unit 102',
        action: 'Booking cancelled',
        changes: 'Customer request',
        severity: 'critical',
        actionType: 'cancelled',
    },
    {
        id: 'h-024',
        at: '2026-04-24T17:00:00+05:30',
        user: { id: 'u-ops2', name: 'Harish Iyer', role: 'Ops' },
        module: 'inventory',
        recordId: 'unit-d-10',
        recordLabel: 'Unit D-10',
        action: 'Unit blocked',
        changes: 'Legal hold',
        severity: 'warning',
        actionType: 'blocked',
    },
    {
        id: 'h-025',
        at: '2026-04-24T17:20:00+05:30',
        user: { id: 'u-ops2', name: 'Harish Iyer', role: 'Ops' },
        module: 'inventory',
        recordId: 'unit-d-10',
        recordLabel: 'Unit D-10',
        action: 'Unit unblocked',
        changes: 'Hold released',
        severity: 'info',
        actionType: 'unblocked',
    },
    {
        id: 'h-026',
        at: '2026-04-24T09:15:00+05:30',
        user: { id: 'u-amit', name: 'Amit Sales', role: 'Sales' },
        module: 'leads',
        recordId: 'vikram-kapoor',
        recordLabel: 'Vikram Kapoor',
        action: 'Lead edited',
        changes: 'Notes updated',
        severity: 'info',
        actionType: 'updated',
    },
    {
        id: 'h-027',
        at: '2026-04-23T14:00:00+05:30',
        user: { id: 'u-rajesh', name: 'Rajesh Kumar', role: 'PM' },
        module: 'projects',
        recordId: 'skyline-residency',
        recordLabel: 'Skyline Residency',
        action: 'Status changed',
        changes: 'Upcoming → Active',
        severity: 'success',
        actionType: 'status_changed',
    },
    {
        id: 'h-028',
        at: '2026-04-22T10:30:00+05:30',
        user: { id: 'u-amit', name: 'Amit Sales', role: 'Sales' },
        module: 'leads',
        recordId: 'pallavi-joshi',
        recordLabel: 'Pallavi Joshi',
        action: 'Converted',
        changes: 'Lead → Customer',
        severity: 'success',
        actionType: 'converted',
    },
    {
        id: 'h-029',
        at: '2026-04-24T18:00:00+05:30',
        user: { id: 'u-sneha', name: 'Sneha Patil', role: 'Accounts' },
        module: 'payments',
        recordId: 'payment-installment-demo-10l',
        recordLabel: 'RCP-77899 · Installment',
        action: 'Payment added',
        changes: 'Cheque · ₹2,00,000',
        severity: 'info',
        actionType: 'created',
    },
    {
        id: 'h-030',
        at: '2026-04-18T10:00:00+05:30',
        user: { id: 'u-dev', name: 'System', role: 'System' },
        module: 'projects',
        recordId: 'skyline-residency',
        recordLabel: 'Skyline Residency',
        action: 'Project updated',
        changes: 'Metadata sync',
        severity: 'info',
        actionType: 'updated',
    },
    {
        id: 'h-031',
        at: '2026-04-17T11:00:00+05:30',
        user: { id: 'u-amit', name: 'Amit Sales', role: 'Sales' },
        module: 'leads',
        recordId: 'old-candidate-9',
        recordLabel: 'Old candidate',
        action: 'Lead archived',
        changes: 'Removed from active pipeline',
        severity: 'info',
        actionType: 'archived',
    },
    {
        id: 'h-032',
        at: '2026-04-16T09:30:00+05:30',
        user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
        module: 'users',
        recordId: 'u-new-ops',
        recordLabel: 'arjun.ops@mysft.demo',
        action: 'Permissions changed',
        changes: 'Documents: view → edit',
        severity: 'warning',
        actionType: 'permission_changed',
    },
    {
        id: 'h-033',
        at: '2026-04-15T14:00:00+05:30',
        user: { id: 'u-rajesh', name: 'Rajesh Kumar', role: 'PM' },
        module: 'projects',
        recordId: 'urban-flux-apartments',
        recordLabel: 'Urban Flux Apartments',
        action: 'Project owner changed',
        changes: 'Nexus Dev → Requanto Technologies',
        severity: 'info',
        actionType: 'owner_changed',
    },
    {
        id: 'h-034',
        at: '2026-04-14T10:00:00+05:30',
        user: { id: 'u-ops2', name: 'Harish Iyer', role: 'Ops' },
        module: 'inventory',
        recordId: 'unit-501',
        recordLabel: 'Unit 501',
        action: 'Unit booked',
        changes: 'Available → Booked (BK-24102)',
        severity: 'success',
        actionType: 'booked',
    },
    {
        id: 'h-035',
        at: '2026-04-21T11:00:00+05:30',
        user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
        module: 'vendors',
        recordId: 'VND-1001',
        recordLabel: 'Prime Electrical Works',
        action: 'Compliance review completed',
        changes: 'Score 88% → 92%',
        severity: 'success',
        actionType: 'updated',
    },
    {
        id: 'h-036',
        at: '2026-04-11T14:20:00+05:30',
        user: { id: 'u-priya', name: 'Priya Nair', role: 'Ops' },
        module: 'vendors',
        recordId: 'VND-1001',
        recordLabel: 'Prime Electrical Works',
        action: 'Work order assigned',
        changes: 'WO-9001 · Basement cable routing',
        severity: 'info',
        actionType: 'assigned_changed',
    },
    {
        id: 'h-037',
        at: '2026-04-08T09:45:00+05:30',
        user: { id: 'u-legal', name: 'Kavita Legal', role: 'Compliance' },
        module: 'vendors',
        recordId: 'VND-1002',
        recordLabel: 'Metro Civil Solutions',
        action: 'Insurance certificate verified',
        changes: 'Valid until 2027-03-31',
        severity: 'success',
        actionType: 'kyc_updated',
    },
    {
        id: 'h-038',
        at: '2026-04-05T16:00:00+05:30',
        user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
        module: 'vendors',
        recordId: 'VND-1002',
        recordLabel: 'Metro Civil Solutions',
        action: 'Vendor category updated',
        changes: 'Civil → Civil, Structural',
        severity: 'info',
        actionType: 'updated',
    },
    {
        id: 'h-039',
        at: '2026-03-28T10:15:00+05:30',
        user: { id: 'u-rajesh', name: 'Rajesh Kumar', role: 'PM' },
        module: 'vendors',
        recordId: 'VND-1003',
        recordLabel: 'SafeGuard Security Services',
        action: 'SLA acknowledgment signed',
        changes: 'Quarterly review pack v2',
        severity: 'info',
        actionType: 'uploaded',
    },
    {
        id: 'h-040',
        at: '2026-03-15T13:30:00+05:30',
        user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
        module: 'vendors',
        recordId: 'VND-1003',
        recordLabel: 'SafeGuard Security Services',
        action: 'Rating updated',
        changes: '4.6 → 4.8',
        severity: 'success',
        actionType: 'updated',
    },
    {
        id: 'h-041',
        at: '2026-04-30T09:15:00+05:30',
        user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
        module: 'suppliers',
        recordId: 'SUP-2401',
        recordLabel: 'MetroBuild Materials Pvt Ltd',
        action: 'Supplier created',
        changes: 'Onboarding started',
        severity: 'success',
        actionType: 'created',
    },
    {
        id: 'h-042',
        at: '2026-04-30T10:05:00+05:30',
        user: { id: 'u-proc', name: 'Sanjana Procurement', role: 'Procurement' },
        module: 'suppliers',
        recordId: 'SUP-2401',
        recordLabel: 'MetroBuild Materials Pvt Ltd',
        action: 'Material added',
        changes: 'OPC 53 Grade cement (MT)',
        severity: 'info',
        actionType: 'created',
    },
    {
        id: 'h-043',
        at: '2026-04-30T11:10:00+05:30',
        user: { id: 'u-proc', name: 'Sanjana Procurement', role: 'Procurement' },
        module: 'suppliers',
        recordId: 'SUP-2401',
        recordLabel: 'MetroBuild Materials Pvt Ltd',
        action: 'Pricing updated',
        changes: 'Cement ₹410 → ₹420',
        severity: 'info',
        actionType: 'updated',
    },
    {
        id: 'h-044',
        at: '2026-04-29T16:30:00+05:30',
        user: { id: 'u-legal', name: 'Kavita Legal', role: 'Compliance' },
        module: 'suppliers',
        recordId: 'SUP-2402',
        recordLabel: 'Southline Electricals',
        action: 'Compliance verified',
        changes: 'GST certificate marked Verified',
        severity: 'success',
        actionType: 'kyc_updated',
    },
    {
        id: 'h-045',
        at: '2026-04-28T12:00:00+05:30',
        user: { id: 'u-ops', name: 'Priya Nair', role: 'Ops' },
        module: 'suppliers',
        recordId: 'SUP-2403',
        recordLabel: 'AquaFlow Plumbing Co',
        action: 'Capacity changed',
        changes: 'Lead time 5 → 4 days',
        severity: 'warning',
        actionType: 'updated',
    },
];

function entryDate(entry: HistoryLogEntry): Date {
    return new Date(entry.at);
}

function inDateRange(entry: HistoryLogEntry, from: string, to: string): boolean {
    const d = entryDate(entry);
    if (from) {
        const f = new Date(from);
        f.setHours(0, 0, 0, 0);
        if (d < f) return false;
    }
    if (to) {
        const t = new Date(to);
        t.setHours(23, 59, 59, 999);
        if (d > t) return false;
    }
    return true;
}

export function filterHistoryLogs(
    logs: HistoryLogEntry[],
    f: HistoryLogFilterState,
): HistoryLogEntry[] {
    const q = f.search.trim().toLowerCase();
    return logs
        .filter((e) => (f.module === 'all' ? true : e.module === f.module))
        .filter((e) => (f.userId === 'all' ? true : e.user.id === f.userId))
        .filter((e) => (f.severity === 'all' ? true : e.severity === f.severity))
        .filter((e) => (f.actionType === 'all' ? true : e.actionType === f.actionType))
        .filter((e) => inDateRange(e, f.dateFrom, f.dateTo))
        .filter((e) => {
            if (!q) return true;
            const blob = [e.user.name, e.recordLabel, e.action, e.changes ?? '', e.module, e.actionType].join(' ').toLowerCase();
            return blob.includes(q);
        })
        .sort((a, b) => entryDate(b).getTime() - entryDate(a).getTime());
}

export function uniqueHistoryUsers(logs: HistoryLogEntry[]): { id: string; name: string; role?: string }[] {
    const byId = new Map<string, { id: string; name: string; role?: string }>();
    logs.forEach((e) => {
        if (!byId.has(e.user.id)) byId.set(e.user.id, e.user);
    });
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function normRecordId(s: string) {
    return s.trim().toLowerCase();
}

export function getLogsForRecord(
    module: HistoryModule,
    recordId: string,
    all: HistoryLogEntry[] = MOCK_HISTORY_LOGS,
): HistoryLogEntry[] {
    const rid = normRecordId(recordId);
    return all
        .filter((e) => e.module === module && normRecordId(e.recordId) === rid)
        .sort((a, b) => entryDate(b).getTime() - entryDate(a).getTime());
}

/** Dedupe by id, newest first — merges global audit rows with record-local supplemental rows. */
export function mergeRecordHistoryLogEntries(lists: HistoryLogEntry[][]): HistoryLogEntry[] {
    const byId = new Map<string, HistoryLogEntry>();
    for (const list of lists) {
        for (const e of list) {
            byId.set(e.id, e);
        }
    }
    return Array.from(byId.values()).sort((a, b) => entryDate(b).getTime() - entryDate(a).getTime());
}

export function allActionTypesInLogs(logs: HistoryLogEntry[]): string[] {
    const s = new Set<string>();
    logs.forEach((e) => s.add(e.actionType));
    return Array.from(s).sort();
}

export function actionTypesForModule(logs: HistoryLogEntry[], module: HistoryModule | 'all'): string[] {
    const subset = module === 'all' ? logs : logs.filter((e) => e.module === module);
    return allActionTypesInLogs(subset);
}

export const MODULE_LABEL: Record<HistoryModule, string> = {
    leads: 'Leads',
    projects: 'Projects',
    inventory: 'Inventory',
    pricing: 'Pricing',
    bookings: 'Bookings',
    payments: 'Payments',
    documents: 'Documents',
    users: 'Users / Roles',
    vendors: 'Vendors',
    suppliers: 'Suppliers',
    work_orders: 'Work Orders',
    purchase_requests: 'Purchase Requests',
    purchase_orders: 'Purchase Orders',
    invoices: 'Invoices',
    tenants: 'Tenants',
    residents: 'Residents',
    customers: 'Customer & Buyer',
    service_maintenance: 'Service Maintenance',
};

export function recordHistoryModuleLabel(m: HistoryModule): string {
    return MODULE_LABEL[m];
}

export function formatHistoryWhen(iso: string): string {
    try {
        return new Date(iso).toLocaleString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}
