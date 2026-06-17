import type { HistoryLogEntry } from '@/lib/historyLogs/types';
import type { HistoryModule } from '@/lib/historyLogs/types';
import type { Company } from '@/data/mockData';

/** Demo tenant timeline rows → unified history log (matches other record adapters). */
export function tenantSyntheticHistoryEntries(company: Company): HistoryLogEntry[] {
    const mod = 'tenants' as HistoryModule;
    const label = company.name;
    const rid = String(company.id);
    const base = company.createdAt;
    return [
        {
            id: `tenant-${company.id}-created`,
            at: `${base}T10:00:00.000Z`,
            user: { id: 'u-platform', name: 'Platform Admin', role: 'Admin' },
            module: mod,
            recordId: rid,
            recordLabel: label,
            action: 'Tenant created',
            changes: `Code ${company.tenantCode} · Plan ${company.plan}`,
            severity: 'info',
            actionType: 'created',
        },
        {
            id: `tenant-${company.id}-sub`,
            at: `${company.lastUpdated ?? base}T14:20:00.000Z`,
            user: { id: 'u-billing', name: 'Billing', role: 'System' },
            module: mod,
            recordId: rid,
            recordLabel: label,
            action: 'Subscription snapshot',
            changes: `Plan ${company.plan} · Status ${company.status}`,
            severity: 'info',
            actionType: 'updated',
        },
        {
            id: `tenant-${company.id}-users`,
            at: `${company.lastUpdated ?? base}T16:05:00.000Z`,
            user: { id: 'u-admin', name: company.adminName || 'Tenant Admin', role: 'Company Admin' },
            module: mod,
            recordId: rid,
            recordLabel: label,
            action: 'Directory sync',
            changes: `${company.usersCount} active seat(s)`,
            severity: 'info',
            actionType: 'updated',
        },
    ];
}
