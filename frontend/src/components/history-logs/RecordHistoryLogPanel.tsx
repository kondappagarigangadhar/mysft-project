'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableSortState } from '@/components/data-table/types';
import { HistoryLogDetailDrawer } from '@/components/history-logs/HistoryLogDetailDrawer';
import { Pagination } from '@/components/ui/Pagination';
import { getHistoryLogDataTableColumns } from '@/lib/historyLogs/historyLogDataTableColumns';
import { getLogsForRecord, mergeRecordHistoryLogEntries } from '@/lib/historyLogs/mockHistoryLogs';
import { sortHistoryEntries } from '@/lib/historyLogs/sortHistoryEntries';
import type { HistoryLogEntry, HistoryModule } from '@/lib/historyLogs/types';
import { LuExternalLink, LuHistory } from 'react-icons/lu';

const PAGE_SIZE = 15;

const TABLE_DATA_COLUMN_IDS = ['time', 'user', 'module', 'record', 'action', 'changes'] as const;
const DEFAULT_COLUMNS_ON = new Set<string>([...TABLE_DATA_COLUMN_IDS]);

function tableStorageKey(module: HistoryModule, recordId: string) {
    const safe = `${module}-${recordId}`.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 120);
    return `arris-record-history-table-v1:${safe}`;
}

type Props = {
    module: HistoryModule;
    /** Primary key for this record (lead slug, payment slug, document id, vendor id, project slug, customer lead slug). */
    recordId: string;
    /** Shown in header / empty state. */
    recordTitle: string;
    /** CRM / vendor / project-local rows merged with global audit rows for this record. */
    supplementalEntries?: HistoryLogEntry[];
    /** Additional global audit rows (e.g. related `payments` rows for this booking). */
    extraGlobalEntries?: HistoryLogEntry[];
    /** Optional link to company-admin History log pre-filtered by module. */
    globalHistoryHref?: string;
    className?: string;
};

export function RecordHistoryLogPanel({
    module,
    recordId,
    recordTitle,
    supplementalEntries = [],
    extraGlobalEntries = [],
    globalHistoryHref,
    className,
}: Props) {
    const columns = useMemo(() => getHistoryLogDataTableColumns(), []);
    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'time', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [detail, setDetail] = useState<HistoryLogEntry | null>(null);

    const [columnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...TABLE_DATA_COLUMN_IDS];
        return Object.fromEntries(allIds.map((id) => [id, DEFAULT_COLUMNS_ON.has(id)])) as Record<string, boolean>;
    });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        time: 200,
        user: 150,
        module: 120,
        record: 200,
        action: 200,
        changes: 220,
    });

    const entries = useMemo(() => {
        const fromGlobal = getLogsForRecord(module, recordId);
        return mergeRecordHistoryLogEntries([fromGlobal, supplementalEntries, extraGlobalEntries]);
    }, [module, recordId, supplementalEntries, extraGlobalEntries]);

    const entriesKey = useMemo(() => entries.map((e) => e.id).join('|'), [entries]);
    useEffect(() => {
        setPage(1);
    }, [entriesKey, module, recordId]);

    const sortedEntries = useMemo(() => sortHistoryEntries(entries, sort), [entries, sort]);
    const total = sortedEntries.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
    const currentPage = Math.min(page, totalPages);

    useEffect(() => {
        setPage((p) => Math.min(p, totalPages));
    }, [totalPages]);

    const pagedEntries = useMemo(
        () => sortedEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [sortedEntries, currentPage],
    );

    const defaultGlobalHref = `/company-admin/history-logs?module=${encodeURIComponent(module)}`;
    const historyHref = globalHistoryHref ?? defaultGlobalHref;

    const emptyMsg =
        module === 'payments'
            ? 'No history entries for this payment yet. Ledger and receipt actions will appear here when logged.'
            : module === 'documents'
              ? 'No history entries for this document yet. Uploads and approvals will appear here when logged.'
              : 'No history entries for this record yet. Related changes will appear here when logged.';

    return (
        <section className={className}>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-2">
                    <LuHistory className="mt-0.5 shrink-0 text-blue-600" size={20} aria-hidden />
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">History log</h2>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Same table as company History logs — scoped to{' '}
                            <span className="font-medium text-slate-700">{recordTitle}</span>.
                        </p>
                    </div>
                </div>
                <Link
                    href={historyHref}
                    className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35"
                >
                    Open History log
                    <LuExternalLink size={14} aria-hidden />
                </Link>
            </div>

            <div className="mb-2">
                <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">{total}</span> event{total === 1 ? '' : 's'}
                </p>
            </div>

            <div className="mt-1">
                <DataTable<HistoryLogEntry>
                    columns={columns}
                    data={pagedEntries}
                    getRowId={(row) => row.id}
                    sort={sort}
                    onSortChange={(next) => {
                        setSort(next);
                        setPage(1);
                    }}
                    columnVisibility={columnVisibility}
                    columnWidths={columnWidths}
                    onColumnWidthsChange={setColumnWidths}
                    storageKey={tableStorageKey(module, recordId)}
                    stickyColumnId="time"
                    enableClientSort={false}
                    emptyMessage={emptyMsg}
                    onRowClick={(row) => setDetail(row)}
                />
                <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalItems={total}
                        itemsPerPage={PAGE_SIZE}
                        label="events"
                    />
                </div>
            </div>

            <HistoryLogDetailDrawer entry={detail} onClose={() => setDetail(null)} />
        </section>
    );
}
