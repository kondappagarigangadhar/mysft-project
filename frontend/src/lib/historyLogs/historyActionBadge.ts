import type { HistoryActionBadgeKind, HistoryLogEntry } from '@/lib/historyLogs/types';

const CREATED_TYPES = new Set<string>(['created', 'user_created', 'uploaded', 'booked']);
const DELETED_TYPES = new Set<string>(['deleted', 'archived', 'cancelled']);
const ASSIGNED_TYPES = new Set<string>(['assigned_changed', 'manager_changed', 'owner_changed']);

export function getHistoryActionBadgeKind(e: HistoryLogEntry): HistoryActionBadgeKind {
    const t = e.actionType;
    if (t === 'converted') return 'converted';
    if (ASSIGNED_TYPES.has(t)) return 'assigned';
    if (DELETED_TYPES.has(t)) return 'deleted';
    if (CREATED_TYPES.has(t)) return 'created';

    const editedHints = new Set<string>([
        'updated',
        'status_changed',
        'price_updated',
        'availability_changed',
        'kyc_updated',
        'role_changed',
        'permission_changed',
        'refund',
        'approved',
        'rejected',
        'unblocked',
        'blocked',
    ]);
    if (editedHints.has(t)) return 'edited';

    const a = e.action.toLowerCase();
    if (a.includes('deleted') || a.includes('cancelled') || a.includes('archived')) return 'deleted';
    if (a.includes('convert')) return 'converted';
    if (a.includes('assign') || a.includes('manager changed') || a.includes('owner changed')) {
        return 'assigned';
    }
    if (a.includes('created') || a.includes('uploaded') || a.includes('booked') || a.includes('added')) {
        return 'created';
    }
    if (a.includes('edit') || a.includes('updated') || a.includes('changed') || a.includes('approved')) {
        return 'edited';
    }
    return 'other';
}

const LABEL: Record<HistoryActionBadgeKind, string> = {
    created: 'Created',
    edited: 'Edited',
    deleted: 'Deleted',
    converted: 'Converted',
    assigned: 'Assigned',
    other: 'Event',
};

export function historyActionBadgeLabel(kind: HistoryActionBadgeKind): string {
    return LABEL[kind];
}

/** Tailwind classes for pill (mySFT / enterprise). */
export function historyActionBadgeClass(kind: HistoryActionBadgeKind): string {
    switch (kind) {
        case 'created':
            return 'bg-emerald-50 text-emerald-800 ring-emerald-200/90';
        case 'edited':
            return 'bg-blue-50 text-blue-800 ring-blue-200/90';
        case 'deleted':
            return 'bg-red-50 text-red-800 ring-red-200/90';
        case 'converted':
            return 'bg-violet-50 text-violet-800 ring-violet-200/90';
        case 'assigned':
            return 'bg-amber-50 text-amber-900 ring-amber-200/90';
        default:
            return 'bg-slate-100 text-slate-800 ring-slate-200/90';
    }
}
