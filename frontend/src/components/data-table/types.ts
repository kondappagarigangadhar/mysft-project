import type React from 'react';

export type SortDirection = 'asc' | 'desc';

export type DataTableColumn<T> = {
    id: string;
    header: React.ReactNode;
    /** Cell content */
    render: (row: T, rowIndex: number) => React.ReactNode;
    /** Used for client-side sorting when `sortable` */
    sortValue?: (row: T) => string | number | null | undefined;
    sortable?: boolean;
    /** When true, column stays visible on horizontal scroll (after selection column). */
    sticky?: boolean;
    /** When true, column pins to the right edge on horizontal scroll (e.g. row actions). */
    stickyEnd?: boolean;
    defaultVisible?: boolean;
    /** Initial / min width in px */
    minWidth?: number;
    headerClassName?: string;
    cellClassName?: string;
};

export type DataTableSortState = {
    columnId: string | null;
    direction: SortDirection;
};

export type DataTableSelectionState<T> = {
    rowKey: keyof T | ((row: T) => string);
    selectedIds: Set<string>;
    onSelectedIdsChange: (next: Set<string>) => void;
    /** Optional: disable selection for some rows */
    isRowSelectable?: (row: T) => boolean;
};
