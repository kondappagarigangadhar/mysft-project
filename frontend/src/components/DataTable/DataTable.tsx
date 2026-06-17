'use client';

import React from 'react';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export type DataTableColumn<T> = {
    key: string;
    header: string;
    className?: string;
    headerClassName?: string;
    /** When `sortConfig` is set, defaults to sortable unless `false`. */
    sortable?: boolean;
    render: (row: T) => React.ReactNode;
};

export type DataTableSortConfig = {
    column: string | null;
    direction: 'asc' | 'desc';
    onSort: (columnKey: string) => void;
};

type DataTableProps<T> = {
    columns: DataTableColumn<T>[];
    rows: T[];
    getRowKey: (row: T) => string;
    emptyMessage?: string;
    loading?: boolean;
    loadingMessage?: string;
    /** When set, prepends a column for selection controls (checkboxes). */
    selectionHeader?: React.ReactNode;
    renderSelectionCell?: (row: T) => React.ReactNode;
    getRowClassName?: (row: T) => string | undefined;
    /** Optional client-side column sorting (click headers). */
    sortConfig?: DataTableSortConfig;
};

export function DataTable<T>({
    columns,
    rows,
    getRowKey,
    emptyMessage = 'No records found',
    loading,
    loadingMessage = 'Loading records…',
    selectionHeader,
    renderSelectionCell,
    getRowClassName,
    sortConfig,
}: DataTableProps<T>) {
    const showSelection = Boolean(selectionHeader && renderSelectionCell);

    return (
        <div className="relative min-h-[12rem] overflow-auto">
            <table className="min-w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 shadow-sm">
                    <tr>
                        {showSelection ? (
                            <th
                                scope="col"
                                className="w-12 whitespace-nowrap px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                            >
                                {selectionHeader}
                            </th>
                        ) : null}
                        {columns.map((c) => {
                            const sortable = sortConfig && (c.sortable !== false);
                            const active = sortConfig && sortConfig.column === c.key;
                            return (
                                <th
                                    key={c.key}
                                    scope="col"
                                    aria-sort={
                                        active ? (sortConfig!.direction === 'asc' ? 'ascending' : 'descending') : undefined
                                    }
                                    className={cn(
                                        'whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500',
                                        c.headerClassName,
                                        c.className
                                    )}
                                >
                                    {sortable ? (
                                        <button
                                            type="button"
                                            onClick={() => sortConfig!.onSort(c.key)}
                                            className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 -mx-1 text-left hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        >
                                            <span>{c.header}</span>
                                            {active ? (
                                                sortConfig!.direction === 'asc' ? (
                                                    <LuChevronUp className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
                                                ) : (
                                                    <LuChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
                                                )
                                            ) : (
                                                <LuChevronUp className="h-3.5 w-3.5 shrink-0 text-slate-600 opacity-0" aria-hidden />
                                            )}
                                        </button>
                                    ) : (
                                        c.header
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                        <tr>
                            <td
                                colSpan={columns.length + (showSelection ? 1 : 0)}
                                className="px-4 py-16 text-center text-sm font-medium text-slate-500"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <span
                                        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
                                        aria-hidden
                                    />
                                    {loadingMessage}
                                </span>
                            </td>
                        </tr>
                    ) : rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + (showSelection ? 1 : 0)}
                                className="px-4 py-14 text-center text-sm font-medium text-slate-500"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr
                                key={getRowKey(row)}
                                className={cn(
                                    'transition-colors hover:bg-slate-50/90',
                                    getRowClassName?.(row)
                                )}
                            >
                                {showSelection ? (
                                    <td className="align-middle px-3 py-2.5">{renderSelectionCell!(row)}</td>
                                ) : null}
                                {columns.map((c) => (
                                    <td
                                        key={c.key}
                                        className={cn('max-w-[14rem] truncate px-4 py-2.5 text-slate-800', c.className)}
                                        title={typeof row === 'object' && row !== null ? String((row as Record<string, unknown>)[c.key] ?? '') : undefined}
                                    >
                                        {c.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
