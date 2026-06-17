import type { DataTableSortState } from '@/components/data-table/types';
import type { HistoryLogEntry } from '@/lib/historyLogs/types';

/** Same sort semantics as the main History logs `DataTable`. */
export function sortHistoryEntries(entries: HistoryLogEntry[], sort: DataTableSortState): HistoryLogEntry[] {
    if (!sort.columnId) return [...entries];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const col = sort.columnId;
    const copy = [...entries];
    copy.sort((a, b) => {
        switch (col) {
            case 'time': {
                const va = new Date(a.at).getTime();
                const vb = new Date(b.at).getTime();
                return (va - vb) * dir;
            }
            case 'user': {
                const va = a.user.name.toLowerCase();
                const vb = b.user.name.toLowerCase();
                return va.localeCompare(vb) * dir;
            }
            case 'module': {
                return a.module.localeCompare(b.module) * dir;
            }
            case 'record': {
                const va = a.recordLabel.toLowerCase();
                const vb = b.recordLabel.toLowerCase();
                return va.localeCompare(vb) * dir;
            }
            case 'action': {
                const va = a.action.toLowerCase();
                const vb = b.action.toLowerCase();
                return va.localeCompare(vb) * dir;
            }
            case 'changes': {
                const va = (a.changes ?? '').toLowerCase();
                const vb = (b.changes ?? '').toLowerCase();
                return va.localeCompare(vb) * dir;
            }
            default:
                return 0;
        }
    });
    return copy;
}
