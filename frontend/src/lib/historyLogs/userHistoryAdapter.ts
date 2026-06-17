import type { HistoryLogEntry } from '@/lib/historyLogs/types';
import type { HistoryModule } from '@/lib/historyLogs/types';
import type { User } from '@/data/mockData';

/** Demo user timeline rows for unified record history. */
export function userSyntheticHistoryEntries(user: User): HistoryLogEntry[] {
    const mod = 'users' as HistoryModule;
    const rid = String(user.id);
    const label = user.name;
    const base = user.joined || '2024-01-01';
    return [
        {
            id: `user-${user.id}-created`,
            at: `${base}T10:00:00.000Z`,
            user: { id: 'u-platform', name: 'Platform Admin', role: 'Admin' },
            module: mod,
            recordId: rid,
            recordLabel: label,
            action: 'User created',
            changes: `Role ${user.role} · ${user.tenantName}`,
            severity: 'info',
            actionType: 'created',
        },
        {
            id: `user-${user.id}-role`,
            at: `${base}T15:30:00.000Z`,
            user: { id: 'u-admin', name: 'Tenant Admin', role: 'Company Admin' },
            module: mod,
            recordId: rid,
            recordLabel: label,
            action: 'Role assigned',
            changes: `${user.role} · ${user.department}`,
            severity: 'info',
            actionType: 'updated',
        },
        {
            id: `user-${user.id}-status`,
            at: `${user.updatedDate ?? base}T11:00:00.000Z`,
            user: { id: 'u-security', name: 'Security', role: 'System' },
            module: mod,
            recordId: rid,
            recordLabel: label,
            action: 'Status / access review',
            changes: `Status ${user.status}`,
            severity: 'info',
            actionType: 'updated',
        },
    ];
}
