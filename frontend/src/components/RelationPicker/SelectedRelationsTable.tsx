'use client';

import React from 'react';
import { LuTrash2 } from 'react-icons/lu';
import { DataTable, type DataTableColumn } from '@/components/DataTable/DataTable';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type SelectedRelationsTableProps<T> = {
    title?: string;
    rows: T[];
    columns: DataTableColumn<T>[];
    /** Inserted after `columns` and before the remove action (e.g. row-level links). */
    extraColumns?: DataTableColumn<T>[];
    getRowId: (row: T) => string;
    onRemove: (id: string) => void;
    /** When false, the row still renders but has no remove control (e.g. system-linked records). */
    canRemoveRow?: (row: T) => boolean;
    /** Shown above the remove control (e.g. “Delete”); keeps the column discoverable when using icon-only buttons. */
    removeColumnHeader?: string;
    /** When true, the built-in remove column is omitted (use custom actions in `extraColumns`). */
    hideRemoveColumn?: boolean;
    emptyHint?: string;
    className?: string;
};

export function SelectedRelationsTable<T>({
    title = 'Selected',
    rows,
    columns,
    extraColumns,
    getRowId,
    onRemove,
    canRemoveRow,
    removeColumnHeader,
    hideRemoveColumn,
    emptyHint = 'Nothing linked yet. Use the action above to add records.',
    className,
}: SelectedRelationsTableProps<T>) {
    const actionCol: DataTableColumn<T> = {
        key: '__actions',
        header: removeColumnHeader ?? '',
        headerClassName: removeColumnHeader
            ? 'min-w-[4.5rem] text-right text-[10px] font-bold uppercase tracking-wide text-slate-500'
            : 'w-14',
        className: 'w-14 text-right',
        render: (row) => {
            const removable = canRemoveRow ? canRemoveRow(row) : true;
            if (!removable) return <span className="inline-block w-9" aria-hidden />;
            return (
                <Button
                    type="button"
                    variant="companyGhost"
                    size="cta"
                    className="h-9 w-9 min-h-0 p-0 text-slate-500 hover:bg-red-50 hover:text-red-700"
                    aria-label="Remove"
                    title="Remove"
                    onClick={() => onRemove(getRowId(row))}
                >
                    <LuTrash2 size={16} aria-hidden />
                </Button>
            );
        },
    };

    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04]',
                className
            )}
        >
            <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
            </div>
            {rows.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">{emptyHint}</div>
            ) : (
                <DataTable
                    columns={[...columns, ...(extraColumns ?? []), ...(hideRemoveColumn ? [] : [actionCol])]}
                    rows={rows}
                    getRowKey={getRowId}
                    emptyMessage=""
                />
            )}
        </div>
    );
}
