'use client';

import type { PrSupplierQuoteRow } from '@/lib/procurement/prSupplierQuotes';
import { cn } from '@/lib/utils';
import { LuCheck, LuSearch } from 'react-icons/lu';

const INPUT =
    'w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] focus:border-[var(--cta-button-bg)]';

function availabilityTag(status: PrSupplierQuoteRow['availabilityStatus']) {
    const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide';
    if (status === 'Available') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (status === 'Limited') return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
    return cn(base, 'border-rose-200 bg-rose-50 text-rose-800');
}

function bestPriceHighlight(isBest: boolean, hasPrice: boolean) {
    if (isBest && hasPrice) {
        return (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                <LuCheck className="h-3 w-3" aria-hidden />
                Lowest price
            </span>
        );
    }
    return <span className="text-xs text-slate-400">—</span>;
}

export function PrSupplierComparisonTable({
    rows,
    selectedSupplierId,
    locked,
    search,
    onSearchChange,
    onSelectSupplier,
    onQuotePriceChange,
}: {
    rows: PrSupplierQuoteRow[];
    selectedSupplierId: string | null;
    locked: boolean;
    search: string;
    onSearchChange: (v: string) => void;
    onSelectSupplier: (supplierId: string) => void;
    onQuotePriceChange: (supplierId: string, raw: string, currency: string) => void;
}) {
    const q = search.trim().toLowerCase();
    const filtered = q ? rows.filter((r) => r.supplierName.toLowerCase().includes(q)) : rows;

    return (
        <div className="border-t border-gray-200/80 px-3 pb-3 pt-3">
            <p className="mb-3 text-xs leading-relaxed text-slate-600">
                Enter quoted prices for active suppliers. <span className="font-medium text-slate-700">Best price</span> and{' '}
                <span className="font-medium text-slate-700">availability</span> are calculated automatically.
            </p>

            {!locked ? (
                <div className="relative mb-3 max-w-md">
                    <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search supplier…"
                        className={cn(INPUT, 'h-10 pl-9')}
                        aria-label="Search suppliers"
                    />
                </div>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-3 py-2.5">Supplier</th>
                            <th className="px-3 py-2.5">Quoted price</th>
                            <th className="px-3 py-2.5">Best price</th>
                            <th className="px-3 py-2.5">Availability</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {filtered.map((r) => {
                            const selected = selectedSupplierId === r.supplierId;
                            const hasPrice = Number(r.quotedPrice) > 0;
                            return (
                                <tr
                                    key={r.supplierId}
                                    className={cn(
                                        'transition-colors',
                                        selected && 'bg-[color-mix(in_srgb,var(--cta-button-bg)_6%,white)]',
                                        r.isBestPrice && hasPrice && !selected && 'bg-emerald-50/30',
                                        !locked && 'cursor-pointer hover:bg-slate-50/80',
                                    )}
                                    onClick={() => {
                                        if (!locked) onSelectSupplier(r.supplierId);
                                    }}
                                >
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            {selected ? (
                                                <span
                                                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--cta-button-bg)] text-[10px] text-white"
                                                    title="Selected supplier"
                                                >
                                                    ✓
                                                </span>
                                            ) : (
                                                <span className="inline-flex h-5 w-5 shrink-0 rounded-full border border-slate-200 bg-white" />
                                            )}
                                            <span className="font-medium text-gray-900">{r.supplierName}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                                        {locked ? (
                                            <span className="tabular-nums text-gray-800">
                                                {hasPrice ? `${r.currency} ${Number(r.quotedPrice).toLocaleString('en-IN')}` : '—'}
                                            </span>
                                        ) : (
                                            <div className="flex max-w-[10rem] items-center gap-1.5">
                                                <span className="shrink-0 text-xs text-gray-500">{r.currency}</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    className={cn(INPUT, 'h-9 py-1.5 tabular-nums')}
                                                    value={r.quotedPrice ?? ''}
                                                    onChange={(e) => onQuotePriceChange(r.supplierId, e.target.value, r.currency)}
                                                    aria-label={`Quoted price for ${r.supplierName}`}
                                                />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">{bestPriceHighlight(r.isBestPrice, hasPrice)}</td>
                                    <td className="px-3 py-2.5">
                                        <span className={availabilityTag(r.availabilityStatus)}>{r.availabilityStatus}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!filtered.length ? (
                    <p className="px-3 py-6 text-center text-sm text-gray-500">
                        {rows.length ? 'No suppliers match your search.' : 'No active suppliers found.'}
                    </p>
                ) : null}
            </div>
        </div>
    );
}
