'use client';

import React, { useMemo, useState } from 'react';
import { PfCollapsibleSection } from '@/components/platform-foundation/PlatformFoundationFormPrimitives';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { MOCK_PLATFORM_AUDIT_LOGS } from '@/lib/platformFoundationStore';
import type { PlatformAuditLogEntry } from '@/lib/platformFoundationTypes';
import { LuDownload, LuFilter, LuHistory, LuSearch } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 8;

function formatTimestamp(iso: string) {
    try {
        return new Date(iso).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return iso;
    }
}

function actionBadgeClass(action: string) {
    const a = action.toLowerCase();
    if (a.includes('login')) return 'bg-blue-100 text-blue-800';
    if (a.includes('created')) return 'bg-emerald-100 text-emerald-800';
    if (a.includes('deleted')) return 'bg-rose-100 text-rose-800';
    return 'bg-slate-100 text-slate-800';
}

export function AuditLogsTab() {
    const [open, setOpen] = useState(true);
    const [search, setSearch] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);

    const userOptions = useMemo(
        () => [...new Set(MOCK_PLATFORM_AUDIT_LOGS.map((e) => e.updatedBy))].sort(),
        [],
    );
    const moduleOptions = useMemo(
        () => [...new Set(MOCK_PLATFORM_AUDIT_LOGS.map((e) => e.module))].sort(),
        [],
    );
    const actionOptions = useMemo(
        () => [...new Set(MOCK_PLATFORM_AUDIT_LOGS.map((e) => e.actionType))].sort(),
        [],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return MOCK_PLATFORM_AUDIT_LOGS.filter((e) => {
            if (userFilter && e.updatedBy !== userFilter) return false;
            if (actionFilter && e.actionType !== actionFilter) return false;
            if (moduleFilter && e.module !== moduleFilter) return false;
            if (dateFrom && e.timestamp.slice(0, 10) < dateFrom) return false;
            if (dateTo && e.timestamp.slice(0, 10) > dateTo) return false;
            if (!q) return true;
            return (
                e.actionType.toLowerCase().includes(q) ||
                e.module.toLowerCase().includes(q) ||
                e.updatedBy.toLowerCase().includes(q) ||
                e.previousValue.toLowerCase().includes(q) ||
                e.newValue.toLowerCase().includes(q) ||
                e.ipAddress.includes(q)
            );
        });
    }, [search, userFilter, actionFilter, moduleFilter, dateFrom, dateTo]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const exportCsv = () => {
        const header = ['Action Type', 'Module', 'Updated By', 'Previous Value', 'New Value', 'Timestamp', 'IP Address'];
        const rows = filtered.map((e) =>
            [e.actionType, e.module, e.updatedBy, e.previousValue, e.newValue, e.timestamp, e.ipAddress]
                .map((c) => `"${String(c).replace(/"/g, '""')}"`)
                .join(','),
        );
        const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'platform-audit-logs.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const resetFilters = () => {
        setSearch('');
        setUserFilter('');
        setActionFilter('');
        setModuleFilter('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    return (
        <PfCollapsibleSection
            title="AUDIT TABLE"
            icon={LuHistory}
            tone="blue"
            open={open}
            onOpenChange={setOpen}
        >
            <div className="border-t border-gray-200/80 p-3">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-md flex-1">
                    <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search audit logs…"
                        className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_20%,transparent)]"
                    />
                </div>
                <Button type="button" variant="companyOutline" size="cta" className="gap-2 shrink-0" onClick={exportCsv}>
                    <LuDownload size={18} aria-hidden />
                    Export
                </Button>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200/80 bg-gray-50/50 p-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Date from</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                            setDateFrom(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Date to</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                            setDateTo(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">User</label>
                    <select
                        value={userFilter}
                        onChange={(e) => {
                            setUserFilter(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white"
                    >
                        <option value="">All users</option>
                        {userOptions.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Action</label>
                    <select
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white"
                    >
                        <option value="">All actions</option>
                        {actionOptions.map((a) => (
                            <option key={a} value={a}>
                                {a}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Module</label>
                    <select
                        value={moduleFilter}
                        onChange={(e) => {
                            setModuleFilter(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white"
                    >
                        <option value="">All modules</option>
                        {moduleOptions.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {(userFilter || actionFilter || moduleFilter || dateFrom || dateTo || search) && (
                <button
                    type="button"
                    onClick={resetFilters}
                    className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--cta-button-bg)] hover:underline"
                >
                    <LuFilter size={14} />
                    Clear filters
                </button>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="max-h-[min(28rem,60vh)] overflow-auto">
                    <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="border-b border-slate-200 px-3 py-2.5">Action</th>
                                <th className="border-b border-slate-200 px-3 py-2.5">Module</th>
                                <th className="border-b border-slate-200 px-3 py-2.5">Updated by</th>
                                <th className="border-b border-slate-200 px-3 py-2.5">Previous</th>
                                <th className="border-b border-slate-200 px-3 py-2.5">New</th>
                                <th className="border-b border-slate-200 px-3 py-2.5">Timestamp</th>
                                <th className="border-b border-slate-200 px-3 py-2.5">IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                                        No audit entries match your filters.
                                    </td>
                                </tr>
                            ) : (
                                pageItems.map((row: PlatformAuditLogEntry) => (
                                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                                        <td className="px-3 py-2.5">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                                    actionBadgeClass(row.actionType),
                                                )}
                                            >
                                                {row.actionType}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-slate-800">{row.module}</td>
                                        <td className="px-3 py-2.5 text-slate-700">{row.updatedBy}</td>
                                        <td className="max-w-[140px] truncate px-3 py-2.5 text-slate-500" title={row.previousValue}>
                                            {row.previousValue}
                                        </td>
                                        <td className="max-w-[140px] truncate px-3 py-2.5 text-slate-800" title={row.newValue}>
                                            {row.newValue}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                                            {formatTimestamp(row.timestamp)}
                                        </td>
                                        <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{row.ipAddress}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4">
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalItems={filtered.length}
                    itemsPerPage={PAGE_SIZE}
                    label="entries"
                />
            </div>
            </div>
        </PfCollapsibleSection>
    );
}
