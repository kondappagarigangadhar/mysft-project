import { HISTORY_MODULES, type HistoryModule } from '@/lib/historyLogs/types';

export function parseHistoryModuleParam(raw: string | null): HistoryModule | 'all' {
    if (raw == null || raw === '' || raw === 'all') return 'all';
    if ((HISTORY_MODULES as readonly string[]).includes(raw)) return raw as HistoryModule;
    return 'all';
}

export const HISTORY_TAB_DEFINITIONS: { id: HistoryModule | 'all'; label: string }[] = [
    { id: 'all', label: 'All logs' },
    { id: 'leads', label: 'Leads' },
    { id: 'projects', label: 'Projects' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'payments', label: 'Payments' },
    { id: 'documents', label: 'Documents' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'work_orders', label: 'Work Orders' },
    { id: 'purchase_requests', label: 'Purchase Requests' },
    { id: 'purchase_orders', label: 'Purchase Orders' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'users', label: 'Users' },
    { id: 'tenants', label: 'Tenants' },
    { id: 'residents', label: 'Residents' },
    { id: 'service_maintenance', label: 'Service Maintenance' },
    { id: 'customers', label: 'Customer & Buyer' },
];
