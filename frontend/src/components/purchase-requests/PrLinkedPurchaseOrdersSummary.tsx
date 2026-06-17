'use client';

import type { PrProcurementSummary } from '@/lib/procurement/prLinkedPurchaseOrders';
import { cn } from '@/lib/utils';

function KpiCard({
    label,
    value,
    tone = 'slate',
}: {
    label: string;
    value: string;
    tone?: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose';
}) {
    const toneCls =
        tone === 'blue'
            ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]'
            : tone === 'emerald'
              ? 'border-emerald-200/80 bg-emerald-50/50'
              : tone === 'amber'
                ? 'border-amber-200/80 bg-amber-50/40'
                : tone === 'rose'
                  ? 'border-rose-200/80 bg-rose-50/40'
                  : 'border-slate-200/90 bg-slate-50/50';
    return (
        <div className={cn('flex h-[4.25rem] flex-col justify-center rounded-lg border px-2.5 py-2', toneCls)}>
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-slate-900">{value}</p>
        </div>
    );
}

export function PrLinkedPurchaseOrdersSummary({ summary }: { summary: PrProcurementSummary }) {
    const valueFmt = `${summary.currency} ${summary.totalValue.toLocaleString('en-IN')}`;
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Linked POs" value={String(summary.totalLinked)} tone="blue" />
            <KpiCard label="Procurement value" value={valueFmt} />
            <KpiCard label="Delivered" value={String(summary.deliveredCount)} tone="emerald" />
            <KpiCard label="Pending delivery" value={String(summary.pendingDeliveries)} tone="amber" />
        </div>
    );
}
