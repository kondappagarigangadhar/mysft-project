'use client';

import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { SupplierStatusBadge } from '@/components/suppliers/SupplierShared';
import { Button } from '@/components/ui/Button';
import { materialKey } from '@/lib/suppliers/supplierComplianceUtils';
import { appendSupplierRecordActivity } from '@/lib/suppliers/supplierRecordActivityLog';
import { getAllSupplierCapacity, getAllSupplierPricing, SUPPLIER_RELATIONS_UPDATED_EVENT } from '@/lib/suppliers/supplierRelationsStore';
import { getAllSupplierRecords, getSupplierRecordById } from '@/lib/suppliers/supplierStore';
import { cn } from '@/lib/utils';
import { LuGitCompare, LuShoppingCart } from 'react-icons/lu';

export type ProcurementCompareRow = {
    id: string;
    material: string;
    supplierId: string;
    supplierName: string;
    supplierStatus: string;
    unitPrice: number;
    currency: string;
    dailyCapacity: number | null;
    leadTimeDays: number | null;
    availability: string | null;
    isFocusSupplier: boolean;
    isBestPrice: boolean;
};

type Toast = { msg: string; err: boolean };

export function SupplierProcurementTabPanel({
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

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'material', direction: 'asc' });

    const rows = useMemo((): ProcurementCompareRow[] => {
        const focus = supplierId.trim();
        const activeIds = new Set(getAllSupplierRecords().filter((s) => s.status === 'Active').map((s) => s.id));
        const myPricing = getAllSupplierPricing().filter((p) => p.supplierId === focus);
        const myMaterialKeys = new Set(myPricing.map((p) => materialKey(p.material)));
        if (myMaterialKeys.size === 0) return [];

        const allPricing = getAllSupplierPricing().filter(
            (p) => activeIds.has(p.supplierId) && (p.status === 'Active' || p.status === 'Ending Soon') && myMaterialKeys.has(materialKey(p.material)),
        );

        const minByMaterial = new Map<string, number>();
        for (const p of allPricing) {
            const k = materialKey(p.material);
            const prev = minByMaterial.get(k);
            if (prev === undefined || p.unitPrice < prev) minByMaterial.set(k, p.unitPrice);
        }

        const capIndex = new Map<string, (typeof caps)[number]>();
        const caps = getAllSupplierCapacity();
        for (const c of caps) {
            capIndex.set(`${c.supplierId}|${materialKey(c.material)}`, c);
        }

        const out: ProcurementCompareRow[] = [];
        for (const p of allPricing) {
            const rec = getSupplierRecordById(p.supplierId);
            const name = rec?.name ?? p.supplierId;
            const st = rec?.status ?? '—';
            const cap = capIndex.get(`${p.supplierId}|${materialKey(p.material)}`);
            const mk = materialKey(p.material);
            const best = minByMaterial.get(mk) ?? p.unitPrice;
            out.push({
                id: `${p.id}-${p.supplierId}`,
                material: p.material,
                supplierId: p.supplierId,
                supplierName: name,
                supplierStatus: st,
                unitPrice: p.unitPrice,
                currency: p.currency,
                dailyCapacity: cap?.dailyCapacity ?? null,
                leadTimeDays: cap?.leadTimeDays ?? null,
                availability: cap?.availabilityStatus ?? null,
                isFocusSupplier: p.supplierId === focus,
                isBestPrice: p.unitPrice === best,
            });
        }

        out.sort((a, b) => a.material.localeCompare(b.material) || a.unitPrice - b.unitPrice || a.supplierName.localeCompare(b.supplierName));
        return out;
    }, [supplierId, tick]);

    const columns = useMemo((): DataTableColumn<ProcurementCompareRow>[] => {
        return [
            {
                id: 'material',
                header: 'Material',
                sortable: true,
                sortValue: (r) => r.material,
                minWidth: 220,
                sticky: true,
                render: (r) => <span className="font-semibold text-slate-900">{r.material}</span>,
            },
            {
                id: 'supplier',
                header: 'Supplier',
                sortable: true,
                sortValue: (r) => r.supplierName,
                minWidth: 200,
                render: (r) => (
                    <div className="flex flex-col gap-1">
                        <span className={cn('font-medium', r.isFocusSupplier ? 'text-slate-800' : 'text-slate-900')}>
                            {r.supplierName}
                            {r.isFocusSupplier ? (
                                <span className="ml-2 rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2 py-0.5 text-[10px] font-semibold text-[var(--cta-button-bg)]">
                                    This record
                                </span>
                            ) : null}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">{r.supplierId}</span>
                    </div>
                ),
            },
            {
                id: 'status',
                header: 'Supplier status',
                sortable: true,
                sortValue: (r) => r.supplierStatus,
                minWidth: 120,
                render: (r) => {
                    const allowed = r.supplierStatus === 'Active' || r.supplierStatus === 'Inactive' || r.supplierStatus === 'Pending' || r.supplierStatus === 'Suspended';
                    return allowed ? (
                        <SupplierStatusBadge status={r.supplierStatus as 'Active' | 'Inactive' | 'Pending' | 'Suspended'} />
                    ) : (
                        <span className="text-xs text-slate-500">{r.supplierStatus}</span>
                    );
                },
            },
            {
                id: 'unitPrice',
                header: 'Unit price',
                sortable: true,
                sortValue: (r) => r.unitPrice,
                minWidth: 140,
                render: (r) => (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular-nums font-semibold text-slate-900">
                            {r.currency} {r.unitPrice.toLocaleString('en-IN')}
                        </span>
                        {r.isBestPrice ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                                Best price
                            </span>
                        ) : null}
                    </div>
                ),
            },
            {
                id: 'capacity',
                header: 'Capacity / day',
                sortable: true,
                sortValue: (r) => r.dailyCapacity ?? 0,
                minWidth: 130,
                render: (r) => (
                    <span className="tabular-nums text-slate-800">{r.dailyCapacity != null ? r.dailyCapacity.toLocaleString('en-IN') : '—'}</span>
                ),
            },
            {
                id: 'availability',
                header: 'Availability',
                sortable: true,
                sortValue: (r) => r.availability ?? '',
                minWidth: 130,
                render: (r) => {
                    if (!r.availability) return <span className="text-slate-400">—</span>;
                    const tone =
                        r.availability === 'Available'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : r.availability === 'Limited'
                              ? 'border-amber-200 bg-amber-50 text-amber-900'
                              : 'border-slate-200 bg-slate-50 text-slate-700';
                    return (
                        <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', tone)}>{r.availability}</span>
                    );
                },
            },
            {
                id: 'lead',
                header: 'Lead time',
                sortable: true,
                sortValue: (r) => r.leadTimeDays ?? 1e9,
                minWidth: 110,
                render: (r) => <span className="tabular-nums text-slate-800">{r.leadTimeDays != null ? `${r.leadTimeDays} days` : '—'}</span>,
            },
        ];
    }, []);

    const logSelection = () => {
        appendSupplierRecordActivity({
            user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
            recordId: supplierId,
            recordLabel: supplierName,
            action: 'Procurement focus logged',
            changes: 'Supplier highlighted for purchase / sourcing workflow (demo)',
            severity: 'info',
            actionType: 'supplier_selected',
        });
        onToast({ msg: 'Procurement selection logged to History.', err: false });
    };

    return (
        <article className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <LuGitCompare className="text-[var(--cta-button-bg)]" size={18} />
                        <h3 className="text-sm font-semibold text-slate-900">Procurement · Supplier selection</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        Compare active suppliers for materials this supplier carries. Best unit price is highlighted; capacity comes from the Capacity tab.
                    </p>
                </div>
                <Button type="button" variant="company" size="cta" className="gap-2" onClick={logSelection}>
                    <LuShoppingCart size={16} /> Log procurement focus
                </Button>
            </div>

            {!rows.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center">
                    <p className="text-sm font-semibold text-slate-800">No comparable pricing rows</p>
                    <p className="mt-1 text-xs text-slate-500">Add materials &amp; pricing for this supplier, and ensure other active suppliers publish pricing for the same material names.</p>
                </div>
            ) : (
                <DataTable<ProcurementCompareRow>
                    columns={columns}
                    data={rows}
                    getRowId={(r) => r.id}
                    sort={sort}
                    onSortChange={setSort}
                    columnVisibility={{
                        material: true,
                        supplier: true,
                        status: true,
                        unitPrice: true,
                        capacity: true,
                        availability: true,
                        lead: true,
                    }}
                    columnWidths={{
                        material: 240,
                        supplier: 220,
                        status: 130,
                        unitPrice: 200,
                        capacity: 140,
                        availability: 140,
                        lead: 120,
                    }}
                    onColumnWidthsChange={() => {}}
                    storageKey={`${supplierId}-supplier-procurement-compare-v1`}
                    stickyColumnId="material"
                    emptyMessage="No rows."
                />
            )}
        </article>
    );
}
