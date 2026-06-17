import type { DataTableColumn } from '@/components/data-table/types';
import { HistoryLogActionBadge } from '@/components/history-logs/HistoryLogActionBadge';
import { HistoryTimeCell } from '@/components/history-logs/HistoryTimeCell';
import { MODULE_LABEL } from '@/lib/historyLogs/mockHistoryLogs';
import type { HistoryLogEntry } from '@/lib/historyLogs/types';

/** Columns for `DataTable<HistoryLogEntry>` — shared by History logs page and record-scoped panels. */
export function getHistoryLogDataTableColumns(): DataTableColumn<HistoryLogEntry>[] {
    return [
        {
            id: 'time',
            header: 'Time',
            sortable: true,
            sticky: true,
            sortValue: (row) => new Date(row.at).getTime(),
            minWidth: 180,
            render: (row) => <HistoryTimeCell iso={row.at} />,
        },
        {
            id: 'user',
            header: 'User',
            sortable: true,
            sortValue: (row) => row.user.name.toLowerCase(),
            minWidth: 140,
            render: (row) => (
                <div className="text-slate-900">
                    <span className="font-medium">{row.user.name}</span>
                    {row.user.role ? <span className="mt-0.5 block text-[11px] text-slate-500">{row.user.role}</span> : null}
                </div>
            ),
        },
        {
            id: 'module',
            header: 'Module',
            sortable: true,
            sortValue: (row) => row.module,
            minWidth: 110,
            render: (row) => (
                <span className="inline-flex max-w-full truncate rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800 ring-1 ring-slate-200/80">
                    {MODULE_LABEL[row.module]}
                </span>
            ),
        },
        {
            id: 'record',
            header: 'Record',
            sortable: true,
            sortValue: (row) => row.recordLabel.toLowerCase(),
            minWidth: 160,
            render: (row) => (
                <span className="block max-w-[220px] truncate text-slate-800" title={row.recordLabel}>
                    {row.recordLabel}
                </span>
            ),
        },
        {
            id: 'action',
            header: 'Action',
            sortable: true,
            sortValue: (row) => row.action.toLowerCase(),
            minWidth: 160,
            render: (row) => <HistoryLogActionBadge entry={row} />,
        },
        {
            id: 'changes',
            header: 'Changes',
            sortable: true,
            sortValue: (row) => (row.changes ?? '').toLowerCase(),
            minWidth: 200,
            render: (row) => (
                <span className="max-w-[240px] text-slate-600" title={row.changes ?? ''}>
                    {row.changes && row.changes !== '—' ? row.changes : '—'}
                </span>
            ),
        },
    ];
}
