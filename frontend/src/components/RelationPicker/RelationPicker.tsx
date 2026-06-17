'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LookupShell, LookupShellFooter, LookupShellHeader } from '@/components/Modal/LookupShell';
import { DataTable, type DataTableColumn } from '@/components/DataTable/DataTable';
import { Button } from '@/components/ui/Button';
import { CTA_CHECKBOX_SM, CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import { LuPlus } from 'react-icons/lu';

export type RelationPickerProps<T> = {
    title: string;
    description?: string;
    triggerLabel: string;
    fetchRows: () => Promise<T[]>;
    columns: DataTableColumn<T>[];
    getRowId: (row: T) => string;
    selected: T[];
    onSelectedChange: (rows: T[]) => void;
    multiSelect?: boolean;
    variant?: 'center' | 'drawer';
    searchPlaceholder?: string;
    /** Lowercased substring match when omitted. */
    getSearchText?: (row: T) => string;
    excludeIds?: Set<string>;
    onCreateNew?: () => void;
    createNewLabel?: string;
    triggerClassName?: string;
    /** Extra actions (e.g. “Add new”) rendered inside the modal footer. */
    modalFooterExtra?: React.ReactNode;
    /** Filters applied after exclusions and before search (e.g. project dropdown). */
    rowFilter?: (row: T) => boolean;
    /** Rendered below the search row inside the modal (e.g. filter controls). */
    modalHeaderExtras?: React.ReactNode;
    /** Called when the modal opens or closes. */
    onOpenChange?: (open: boolean) => void;
    /** When set, open state is controlled by the parent (update it via `onOpenChange`). */
    open?: boolean;
    /** Hide the default trigger button (parent opens the modal another way, e.g. header action). */
    hideTrigger?: boolean;
};

function defaultSearchText<T>(row: T): string {
    if (row && typeof row === 'object') {
        return Object.values(row as object)
            .filter((v) => v != null)
            .map((v) => String(v))
            .join(' ');
    }
    return '';
}

function mergeById<T>(current: T[], incoming: T[], getRowId: (row: T) => string): T[] {
    const map = new Map(current.map((r) => [getRowId(r), r]));
    for (const r of incoming) {
        map.set(getRowId(r), r);
    }
    return [...map.values()];
}

export function RelationPicker<T>({
    title,
    description,
    triggerLabel,
    fetchRows,
    columns,
    getRowId,
    selected,
    onSelectedChange,
    multiSelect = true,
    variant = 'center',
    searchPlaceholder = 'Search…',
    getSearchText = defaultSearchText,
    excludeIds,
    onCreateNew,
    triggerClassName,
    modalFooterExtra,
    rowFilter,
    modalHeaderExtras,
    onOpenChange,
    open: controlledOpen,
    hideTrigger = false,
}: RelationPickerProps<T>) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;

    const setOpen = useCallback(
        (next: boolean) => {
            if (!isControlled) setUncontrolledOpen(next);
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange],
    );

    const [loading, setLoading] = useState(false);
    const [allRows, setAllRows] = useState<T[]>([]);
    const [query, setQuery] = useState('');
    const [pickIds, setPickIds] = useState<Set<string>>(() => new Set());

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchRows();
            setAllRows(data);
        } finally {
            setLoading(false);
        }
    }, [fetchRows]);

    useEffect(() => {
        if (!open) return;
        setQuery('');
        setPickIds(new Set());
        void load();
    }, [open, load]);

    const availableRows = useMemo(() => {
        if (!excludeIds?.size) return allRows;
        return allRows.filter((r) => !excludeIds.has(getRowId(r)));
    }, [allRows, excludeIds, getRowId]);

    const filteredRows = useMemo(() => {
        let rows = availableRows;
        if (rowFilter) rows = rows.filter(rowFilter);
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) => getSearchText(r).toLowerCase().includes(q));
    }, [availableRows, query, getSearchText, rowFilter]);

    const toggle = (id: string) => {
        if (!multiSelect) {
            setPickIds((prev) => (prev.has(id) && prev.size === 1 ? new Set() : new Set([id])));
            return;
        }
        setPickIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const pickCount = pickIds.size;

    const addSelected = () => {
        const idList = multiSelect ? [...pickIds] : pickIds.size ? [...pickIds] : [];
        const toAdd = allRows.filter((r) => idList.includes(getRowId(r)));
        if (toAdd.length === 0) return;
        onSelectedChange(mergeById(selected, toAdd, getRowId));
        setOpen(false);
    };

    const tableEmptyMessage =
        !loading && availableRows.length === 0 ? 'No records found.' : 'No records match your search.';

    const selectionHeader = multiSelect ? (
        <span className="sr-only">Select</span>
    ) : (
        <span className="sr-only">Choose</span>
    );

    return (
        <div className={cn(!hideTrigger && 'space-y-3')}>
            {!hideTrigger ? (
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="companyOutline"
                        size="cta"
                        className={cn('gap-2 font-semibold', triggerClassName)}
                        onClick={() => setOpen(true)}
                    >
                        <LuPlus size={16} aria-hidden />
                        {triggerLabel}
                    </Button>
                </div>
            ) : null}

            <LookupShell open={open} onClose={() => setOpen(false)} variant={variant} aria-label={title}>
                <LookupShellHeader title={title} description={description} onClose={() => setOpen(false)}>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-4 sm:gap-y-3">
                            <div className="min-w-0 w-full flex-1 sm:min-w-[16rem]">
                                <label className="sr-only" htmlFor="relation-picker-search">
                                    Search records
                                </label>
                                <input
                                    id="relation-picker-search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className={cn(
                                        'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-inner shadow-slate-900/5 placeholder:text-slate-400',
                                        CTA_INPUT_FOCUS,
                                    )}
                                />
                            </div>
                            {modalHeaderExtras ? (
                                <div className="flex shrink-0 flex-wrap items-end gap-3 sm:gap-4">{modalHeaderExtras}</div>
                            ) : null}
                            <div className="shrink-0 self-start whitespace-nowrap text-sm font-medium text-slate-600 sm:self-end">
                                {loading ? '…' : <span className="tabular-nums">{filteredRows.length}</span>} shown
                                {multiSelect ? (
                                    <>
                                        <span className="mx-1.5 text-slate-300">·</span>
                                        <span className="font-medium text-[var(--cta-button-bg)]">{pickCount} selected</span>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </LookupShellHeader>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-1 pb-1 sm:px-2">
                    <DataTable
                        columns={columns}
                        rows={filteredRows}
                        getRowKey={getRowId}
                        loading={loading}
                        emptyMessage={tableEmptyMessage}
                        selectionHeader={selectionHeader}
                        renderSelectionCell={(row) => {
                            const id = getRowId(row);
                            const checked = pickIds.has(id);
                            if (multiSelect) {
                                return (
                                    <input
                                        type="checkbox"
                                        className={CTA_CHECKBOX_SM}
                                        checked={checked}
                                        onChange={() => toggle(id)}
                                        aria-label={`Select row ${id}`}
                                    />
                                );
                            }
                            return (
                                <input
                                    type="radio"
                                    className={CTA_CHECKBOX_SM}
                                    checked={checked}
                                    onChange={() => toggle(id)}
                                    aria-label={`Select row ${id}`}
                                />
                            );
                        }}
                    />
                </div>

                <LookupShellFooter>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {modalFooterExtra ? (
                            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 sm:border-0 sm:pb-0">
                                {modalFooterExtra}
                            </div>
                        ) : null}
                        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                            <p className="text-xs text-slate-500">
                                {multiSelect
                                    ? 'Select one or more rows, then add them to this record.'
                                    : 'Pick a single row to link.'}
                            </p>
                            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                                <Button type="button" variant="companyOutline" size="cta" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="company"
                                    size="cta"
                                    className="min-w-32"
                                    disabled={pickIds.size === 0}
                                    onClick={addSelected}
                                >
                                    {multiSelect ? 'Add selected' : 'Add'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </LookupShellFooter>
            </LookupShell>
        </div>
    );
}
