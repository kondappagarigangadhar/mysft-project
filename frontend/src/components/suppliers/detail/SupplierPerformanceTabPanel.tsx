'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { SupplierKpiCard } from '@/components/suppliers/common/SupplierKpiCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { appendSupplierRecordActivity } from '@/lib/suppliers/supplierRecordActivityLog';
import type { SupplierPerformanceDeliveryRow } from '@/lib/suppliers/types';
import {
    addSupplierPerformanceDelivery,
    deleteSupplierPerformanceDelivery,
    getSupplierPerformanceBySupplierId,
    SUPPLIER_RELATIONS_UPDATED_EVENT,
    updateSupplierPerformanceDelivery,
    validatePerformanceDeliveryRow,
} from '@/lib/suppliers/supplierRelationsStore';
import { cn } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LuActivity, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';

type Toast = { msg: string; err: boolean };

function StarRow({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(n)}
                    className={cn(
                        'text-lg leading-none transition',
                        n <= value ? 'text-amber-500' : 'text-slate-200',
                        disabled ? 'cursor-not-allowed opacity-60' : 'hover:text-amber-400',
                    )}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}

export function SupplierPerformanceTabPanel({
    supplierId,
    supplierName,
    onToast,
}: {
    supplierId: string;
    supplierName: string;
    onToast: (t: Toast) => void;
}) {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const fn = () => setTick((x) => x + 1);
        window.addEventListener(SUPPLIER_RELATIONS_UPDATED_EVENT, fn);
        return () => window.removeEventListener(SUPPLIER_RELATIONS_UPDATED_EVENT, fn);
    }, []);

    const rows = useMemo(() => getSupplierPerformanceBySupplierId(supplierId), [supplierId, tick]);

    const kpis = useMemo(() => {
        const total = rows.length;
        const delayed = rows.filter((r) => r.delayDays > 0).length;
        const onTimePct = total === 0 ? 0 : Math.round(((total - delayed) / total) * 100);
        const avgRating = total === 0 ? 0 : rows.reduce((s, r) => s + r.rating, 0) / total;
        return { total, delayed, onTimePct, avgRating };
    }, [rows]);

    const ratingChart = useMemo(() => {
        const dist = [1, 2, 3, 4, 5].map((star) => ({
            star: `${star}★`,
            count: rows.filter((r) => r.rating === star).length,
        }));
        return dist;
    }, [rows]);

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'deliveryDate', direction: 'desc' });
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState<SupplierPerformanceDeliveryRow | null>(null);
    const [form, setForm] = useState<Omit<SupplierPerformanceDeliveryRow, 'id' | 'supplierId'>>({
        project: '',
        material: '',
        deliveryDate: new Date().toISOString().slice(0, 10),
        delayDays: 0,
        rating: 5,
        remarks: '',
    });
    const [formError, setFormError] = useState<string | null>(null);

    const log = useCallback(
        (action: string, changes: string, actionType: string) => {
            appendSupplierRecordActivity({
                user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
                recordId: supplierId,
                recordLabel: supplierName,
                action,
                changes,
                severity: 'info',
                actionType,
            });
        },
        [supplierId, supplierName],
    );

    const openCreate = () => {
        setEditing(null);
        setForm({
            project: '',
            material: '',
            deliveryDate: new Date().toISOString().slice(0, 10),
            delayDays: 0,
            rating: 5,
            remarks: '',
        });
        setFormError(null);
        setEditorOpen(true);
    };

    const submit = () => {
        const payload = { supplierId, ...form };
        if (editing) {
            const next = { ...editing, ...form };
            const err = validatePerformanceDeliveryRow(next);
            setFormError(err);
            if (err) return;
            const res = updateSupplierPerformanceDelivery(next);
            if (!res.ok) return setFormError(res.error);
            log('Performance delivery updated', `${next.project} · ${next.material}`, 'performance_edited');
            onToast({ msg: 'Performance row updated.', err: false });
            setEditorOpen(false);
            return;
        }
        const err = validatePerformanceDeliveryRow(payload);
        setFormError(err);
        if (err) return;
        const res = addSupplierPerformanceDelivery(payload);
        if (!res.ok) return setFormError(res.error);
        log('Performance delivery recorded', `${form.project} · ${form.material}`, 'performance_added');
        onToast({ msg: 'Delivery recorded.', err: false });
        setEditorOpen(false);
    };

    const cols = useMemo((): DataTableColumn<SupplierPerformanceDeliveryRow>[] => {
        return [
            {
                id: 'project',
                header: 'Project',
                sortable: true,
                sortValue: (r) => r.project,
                minWidth: 160,
                sticky: true,
                render: (r) => <span className="font-semibold text-slate-900">{r.project}</span>,
            },
            {
                id: 'material',
                header: 'Material',
                sortable: true,
                sortValue: (r) => r.material,
                minWidth: 180,
                render: (r) => <span className="text-slate-800">{r.material}</span>,
            },
            {
                id: 'deliveryDate',
                header: 'Delivery date',
                sortable: true,
                sortValue: (r) => r.deliveryDate,
                minWidth: 120,
                render: (r) => <span className="tabular-nums text-slate-800">{r.deliveryDate}</span>,
            },
            {
                id: 'delay',
                header: 'Delay (days)',
                sortable: true,
                sortValue: (r) => r.delayDays,
                minWidth: 110,
                render: (r) => (
                    <span
                        className={cn(
                            'tabular-nums font-semibold',
                            r.delayDays === 0 ? 'text-emerald-700' : r.delayDays <= 3 ? 'text-amber-700' : 'text-rose-700',
                        )}
                    >
                        {r.delayDays}
                    </span>
                ),
            },
            {
                id: 'rating',
                header: 'Rating',
                sortable: true,
                sortValue: (r) => r.rating,
                minWidth: 120,
                render: (r) => <StarRow value={r.rating} onChange={() => {}} disabled />,
            },
            {
                id: 'remarks',
                header: 'Remarks',
                sortable: true,
                sortValue: (r) => r.remarks,
                minWidth: 200,
                render: (r) => <span className="text-slate-700">{r.remarks || '—'}</span>,
            },
            {
                id: 'actions',
                header: '',
                minWidth: 72,
                stickyEnd: true,
                cellClassName: 'text-right',
                render: (r) => (
                    <PortaledRowActionsMenu estimatedMenuHeight={120} minMenuWidth={180}>
                        {({ close }) => (
                            <>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => {
                                        close();
                                        setEditing(r);
                                        const { id: _id, supplierId: _sid, ...rest } = r;
                                        setForm(rest);
                                        setFormError(null);
                                        setEditorOpen(true);
                                    }}
                                >
                                    <LuPencil size={16} className="text-slate-400" /> Edit
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                                    onClick={() => {
                                        close();
                                        const ok = window.confirm('Delete this performance row?');
                                        if (!ok) return;
                                        deleteSupplierPerformanceDelivery(r.id);
                                        log('Performance delivery removed', `${r.project} · ${r.material}`, 'performance_deleted');
                                        onToast({ msg: 'Row deleted.', err: false });
                                    }}
                                >
                                    <LuTrash2 size={16} /> Delete
                                </button>
                            </>
                        )}
                    </PortaledRowActionsMenu>
                ),
            },
        ];
    }, [log, onToast]);

    return (
        <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                    <LuActivity className="text-[var(--cta-button-bg)]" size={18} />
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Performance analytics</h3>
                        <p className="text-xs text-slate-500">KPIs are computed from delivery records below.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <SupplierKpiCard
                        label="Average rating"
                        value={kpis.total === 0 ? '—' : kpis.avgRating.toFixed(2)}
                        hint="1–5 scale"
                        tone={kpis.avgRating >= 4 ? 'good' : kpis.avgRating >= 3 ? 'warn' : kpis.total ? 'risk' : 'neutral'}
                    />
                    <SupplierKpiCard
                        label="On-time delivery"
                        value={`${kpis.onTimePct}%`}
                        hint="Share of deliveries with zero delay days"
                        tone={kpis.onTimePct >= 90 ? 'good' : kpis.onTimePct >= 75 ? 'warn' : kpis.total ? 'risk' : 'neutral'}
                    />
                    <SupplierKpiCard label="Total deliveries" value={String(kpis.total)} hint="Recorded drops" tone="neutral" />
                    <SupplierKpiCard
                        label="Delayed deliveries"
                        value={String(kpis.delayed)}
                        hint="Delay days &gt; 0"
                        tone={kpis.delayed === 0 ? 'good' : 'warn'}
                    />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">On-time progress</p>
                        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${kpis.total ? kpis.onTimePct : 0}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-600">{kpis.onTimePct}% of recorded deliveries had no slip days.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Rating mix</p>
                        <div className="mt-2 h-48 w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ratingChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                                    <XAxis dataKey="star" tick={{ fontSize: 11 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                                        formatter={(v) => [v == null ? 0 : v, 'Deliveries']}
                                    />
                                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>

            <article className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Delivery performance log</h3>
                        <p className="mt-1 text-xs text-slate-500">Projects, delays, and quality ratings.</p>
                    </div>
                    <Button type="button" variant="company" size="cta" className="gap-2" onClick={openCreate}>
                        <LuPlus size={16} /> Add delivery
                    </Button>
                </div>

                <DataTable<SupplierPerformanceDeliveryRow>
                    columns={cols}
                    data={rows}
                    getRowId={(r) => r.id}
                    sort={sort}
                    onSortChange={setSort}
                    columnVisibility={{ project: true, material: true, deliveryDate: true, delay: true, rating: true, remarks: true, actions: true }}
                    columnWidths={{
                        project: 170,
                        material: 200,
                        deliveryDate: 130,
                        delay: 120,
                        rating: 130,
                        remarks: 220,
                        actions: 72,
                    }}
                    onColumnWidthsChange={() => {}}
                    storageKey={`${supplierId}-supplier-performance-v1`}
                    stickyColumnId="project"
                    emptyMessage="No performance rows yet."
                />
            </article>

            <Modal
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                title={editing ? 'Edit performance row' : 'Record delivery performance'}
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setEditorOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={submit}>
                            {editing ? 'Save' : 'Add'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    {formError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">{formError}</div> : null}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-600">Project *</label>
                            <input
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                value={form.project}
                                onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-600">Material *</label>
                            <input
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                value={form.material}
                                onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-600">Delivery date *</label>
                            <input
                                type="date"
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                value={form.deliveryDate}
                                onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-600">Delay days</label>
                            <input
                                type="number"
                                min={0}
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                value={String(form.delayDays)}
                                onChange={(e) => setForm((f) => ({ ...f, delayDays: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-600">Rating (1–5) *</label>
                            <div className="mt-2">
                                <StarRow value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-600">Remarks</label>
                            <textarea
                                rows={3}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                value={form.remarks}
                                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
