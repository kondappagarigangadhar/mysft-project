'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { LuArrowDown, LuArrowUp, LuChevronsUpDown, LuGripVertical } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { CTA_CHECKBOX_SM } from '@/lib/theme/ctaThemeClasses';
import type { DataTableColumn, DataTableSelectionState, DataTableSortState, SortDirection } from './types';

const CHECKBOX_COL_PX = 48;

/** Selection + hover use primary CTA tint (replaces `blue-50` row chrome). */
const DT_ROW_SELECTED =
    'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_14%,white)]';
const DT_ROW_HOVER = 'hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_6%,white)]';
const DT_STICKY_SELECTED =
    'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] group-hover/row:bg-[color-mix(in_srgb,var(--cta-button-bg)_14%,white)]';
const DT_STICKY_DEFAULT = 'bg-white group-hover/row:bg-[color-mix(in_srgb,var(--cta-button-bg)_6%,white)]';

function rowKeyOf<T>(row: T, rowKey: DataTableSelectionState<T>['rowKey']): string {
    if (typeof rowKey === 'function') return rowKey(row);
    const v = row[rowKey];
    return String(v ?? '');
}

type DataTableProps<T> = {
    columns: DataTableColumn<T>[];
    data: T[];
    getRowId: (row: T, index: number) => string;
    sort: DataTableSortState;
    onSortChange: (next: DataTableSortState) => void;
    columnVisibility: Record<string, boolean>;
    columnWidths: Record<string, number>;
    onColumnWidthsChange: (next: Record<string, number>) => void;
    storageKey?: string;
    selection?: DataTableSelectionState<T>;
    className?: string;
    emptyMessage?: string;
    /** Column id that stays frozen (typically name) — appears after checkbox when selection is on. */
    stickyColumnId?: string;
    /** When false, `data` is already sorted (e.g. parent sorts full list before pagination). */
    enableClientSort?: boolean;
    /** Pin header row on vertical scroll inside the table container. */
    stickyHeader?: boolean;
    /** Whole-row click (checkbox column stops propagation). */
    onRowClick?: (row: T, rowIndex: number) => void;
};

function loadStoredWidths(key: string | undefined): Record<string, number> | null {
    if (!key || typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(`datatable-widths:${key}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Record<string, number>;
        return typeof parsed === 'object' && parsed ? parsed : null;
    } catch {
        return null;
    }
}

export function DataTable<T>({
    columns,
    data,
    getRowId,
    sort,
    onSortChange,
    columnVisibility,
    columnWidths,
    onColumnWidthsChange,
    storageKey,
    selection,
    className,
    emptyMessage = 'No records match your filters.',
    stickyColumnId = 'name',
    enableClientSort = true,
    stickyHeader = false,
    onRowClick,
}: DataTableProps<T>) {
    const visibleColumns = useMemo(
        () => columns.filter((c) => columnVisibility[c.id] !== false),
        [columns, columnVisibility],
    );

    const widthsRef = useRef(columnWidths);
    useEffect(() => {
        widthsRef.current = columnWidths;
    }, [columnWidths]);

    useEffect(() => {
        const stored = loadStoredWidths(storageKey);
        if (!stored || !Object.keys(stored).length) return;
        onColumnWidthsChange({ ...columnWidths, ...stored });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey]);

    const persistWidths = (next: Record<string, number>) => {
        onColumnWidthsChange(next);
        if (storageKey && typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(`datatable-widths:${storageKey}`, JSON.stringify(next));
            } catch {
                /* ignore */
            }
        }
    };

    const sortedData = useMemo(() => {
        if (!enableClientSort) return data;
        const col = visibleColumns.find((c) => c.id === sort.columnId);
        if (!col?.sortValue || !sort.columnId) return data;
        const dir = sort.direction === 'asc' ? 1 : -1;
        const copy = [...data];
        copy.sort((a, b) => {
            const va = col.sortValue!(a);
            const vb = col.sortValue!(b);
            const na = va === null || va === undefined ? '' : va;
            const nb = vb === null || vb === undefined ? '' : vb;
            if (typeof na === 'number' && typeof nb === 'number') return (na - nb) * dir;
            return String(na).localeCompare(String(nb), undefined, { numeric: true }) * dir;
        });
        return copy;
    }, [data, sort, visibleColumns, enableClientSort]);

    const toggleSort = (columnId: string) => {
        const col = columns.find((c) => c.id === columnId);
        if (!col?.sortable) return;
        if (sort.columnId !== columnId) {
            onSortChange({ columnId, direction: 'asc' });
            return;
        }
        const next: SortDirection = sort.direction === 'asc' ? 'desc' : 'asc';
        onSortChange({ columnId, direction: next });
    };

    const allSelectableIds = useMemo(() => {
        if (!selection) return [];
        return data
            .filter((row) => (selection.isRowSelectable ? selection.isRowSelectable(row) : true))
            .map((row) => rowKeyOf(row, selection.rowKey));
    }, [data, selection]);

    const allSelected =
        selection && allSelectableIds.length > 0 && allSelectableIds.every((id) => selection.selectedIds.has(id));

    const toggleAll = () => {
        if (!selection) return;
        if (allSelected) {
            const next = new Set(selection.selectedIds);
            allSelectableIds.forEach((id) => next.delete(id));
            selection.onSelectedIdsChange(next);
        } else {
            const next = new Set(selection.selectedIds);
            allSelectableIds.forEach((id) => next.add(id));
            selection.onSelectedIdsChange(next);
        }
    };

    const startResize = (columnId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const col = visibleColumns.find((c) => c.id === columnId);
        const startW = widthsRef.current[columnId] || col?.minWidth || 120;
        const min = col?.minWidth ?? 80;
        const startX = e.clientX;

        const onMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX;
            const nextW = Math.max(min, startW + delta);
            const next = { ...widthsRef.current, [columnId]: nextW };
            widthsRef.current = next;
            persistWidths(next);
        };
        const onUp = () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const stickyLeft = (col: DataTableColumn<T>) => {
        if (col.stickyEnd) return undefined;
        const isSticky = col.sticky || col.id === stickyColumnId;
        if (!isSticky) return undefined;
        if (selection) return { left: CHECKBOX_COL_PX };
        return { left: 0 };
    };

    const stickyRight = (col: DataTableColumn<T>) => {
        if (!col.stickyEnd) return undefined;
        return { right: 0 };
    };

    return (
        <div
            className={cn(
                'relative w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm',
                stickyHeader && 'max-h-[min(100vh,720px)] overflow-y-auto',
                className,
            )}
        >
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead className={cn(stickyHeader && 'sticky top-0 z-30 shadow-sm')}>
                    <tr className="border-b border-slate-200 bg-slate-50/95 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {selection ? (
                            <th
                                scope="col"
                                style={{ width: CHECKBOX_COL_PX, minWidth: CHECKBOX_COL_PX }}
                                className="sticky left-0 z-30 border-r border-slate-200 bg-slate-50/95 px-0 py-3 pl-3"
                            >
                                <input
                                    type="checkbox"
                                    className={CTA_CHECKBOX_SM}
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    aria-label="Select all rows"
                                />
                            </th>
                        ) : null}
                        {visibleColumns.map((col) => {
                            const w = columnWidths[col.id] || col.minWidth;
                            const widthStyle = w ? { width: w, minWidth: w } : undefined;
                            const isStickyEnd = col.stickyEnd === true;
                            const isSticky = !isStickyEnd && (col.sticky || col.id === stickyColumnId);
                            const sl = stickyLeft(col);
                            const sr = stickyRight(col);

                            return (
                                <th
                                    key={col.id}
                                    scope="col"
                                    style={{ ...widthStyle, ...sl, ...sr }}
                                    className={cn(
                                        'group relative px-3 py-3 font-semibold text-slate-600',
                                        col.sortable && 'cursor-pointer select-none hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]',
                                        isSticky && 'sticky z-20 border-r border-slate-200 bg-slate-50/95',
                                        isStickyEnd &&
                                            'sticky z-20 border-l border-slate-200 bg-slate-50/95 shadow-[-6px_0_12px_-8px_rgba(15,23,42,0.15)]',
                                        col.headerClassName,
                                    )}
                                    onClick={() => toggleSort(col.id)}
                                >
                                    <div className="flex items-start gap-1.5 pr-3">
                                        <div className="min-w-0 flex-1 leading-tight">
                                            {typeof col.header === 'string' ? (
                                                <span className="block truncate">{col.header}</span>
                                            ) : (
                                                col.header
                                            )}
                                        </div>
                                        {col.sortable ? (
                                            <span className="shrink-0 pt-0.5 text-slate-400">
                                                {sort.columnId === col.id ? (
                                                    sort.direction === 'asc' ? (
                                                        <LuArrowUp size={14} aria-hidden />
                                                    ) : (
                                                        <LuArrowDown size={14} aria-hidden />
                                                    )
                                                ) : (
                                                    <LuChevronsUpDown size={14} className="opacity-0 group-hover:opacity-100" aria-hidden />
                                                )}
                                            </span>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        aria-hidden
                                        className="absolute right-0 top-0 z-10 flex h-full w-2 cursor-col-resize items-center justify-center border-0 bg-transparent p-0 opacity-0 hover:opacity-100 group-hover:opacity-70"
                                        onMouseDown={(e) => startResize(col.id, e)}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <LuGripVertical size={12} className="text-slate-400" />
                                    </button>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {sortedData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={visibleColumns.length + (selection ? 1 : 0)}
                                className="px-6 py-16 text-center text-sm text-slate-500"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        sortedData.map((row, rowIndex) => {
                            const id = getRowId(row, rowIndex);
                            const selectable = selection
                                ? selection.isRowSelectable
                                    ? selection.isRowSelectable(row)
                                    : true
                                : false;
                            const rk = selection ? rowKeyOf(row, selection.rowKey) : '';
                            const checked = selection ? selection.selectedIds.has(rk) : false;

                            return (
                                <tr
                                    key={id}
                                    onClick={() => onRowClick?.(row, rowIndex)}
                                    className={cn(
                                        'group/row transition-colors',
                                        checked ? DT_ROW_SELECTED : DT_ROW_HOVER,
                                        onRowClick && 'cursor-pointer',
                                    )}
                                >
                                    {selection ? (
                                        <td
                                            style={{ width: CHECKBOX_COL_PX, minWidth: CHECKBOX_COL_PX }}
                                            className={cn(
                                                'sticky left-0 z-10 border-r border-slate-100 px-0 py-3 pl-3',
                                                checked ? DT_STICKY_SELECTED : DT_STICKY_DEFAULT,
                                            )}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="checkbox"
                                                className={CTA_CHECKBOX_SM}
                                                checked={checked}
                                                disabled={!selectable}
                                                onChange={() => {
                                                    if (!selection || !selectable) return;
                                                    const next = new Set(selection.selectedIds);
                                                    if (next.has(rk)) next.delete(rk);
                                                    else next.add(rk);
                                                    selection.onSelectedIdsChange(next);
                                                }}
                                                aria-label={`Select row ${id}`}
                                            />
                                        </td>
                                    ) : null}
                                    {visibleColumns.map((col) => {
                                        const w = columnWidths[col.id] || col.minWidth;
                                        const widthStyle = w ? { width: w, minWidth: w } : undefined;
                                        const isStickyEnd = col.stickyEnd === true;
                                        const isSticky = !isStickyEnd && (col.sticky || col.id === stickyColumnId);
                                        const sl = stickyLeft(col);
                                        const sr = stickyRight(col);

                                        return (
                                            <td
                                                key={col.id}
                                                style={{ ...widthStyle, ...sl, ...sr }}
                                                className={cn(
                                                    'px-3 py-3 text-slate-700',
                                                    isSticky &&
                                                        'sticky z-10 border-r border-slate-100',
                                                    isSticky &&
                                                        (checked ? DT_STICKY_SELECTED : DT_STICKY_DEFAULT),
                                                    isStickyEnd &&
                                                        'sticky z-10 border-l border-slate-100 shadow-[-6px_0_12px_-8px_rgba(15,23,42,0.12)]',
                                                    isStickyEnd && (checked ? DT_STICKY_SELECTED : DT_STICKY_DEFAULT),
                                                    col.cellClassName,
                                                )}
                                            >
                                                {col.render(row, rowIndex)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
