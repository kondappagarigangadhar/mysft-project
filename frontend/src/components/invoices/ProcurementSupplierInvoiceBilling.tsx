'use client';



import React, { useCallback, useRef, useState } from 'react';

import Link from 'next/link';

import { cn } from '@/lib/utils';

import type { Invoice } from '@/lib/invoiceStore';

import {

    formatProcurementMoney,

    PROCUREMENT_MATERIAL_CATEGORIES,

    PROCUREMENT_UNIT_OPTIONS,

    createEmptyMaterialDraft,

    normalizeMaterialDraft,

    type MaterialInspectionStatus,

    type ProcurementChargesDraft,

    type ProcurementInvoiceBillingBundle,

    type ProcurementMaterialDraft,

} from '@/lib/procurement/procurementInvoiceBilling';

import { procurementReturnPrHref } from '@/lib/procurement/procurementBreadcrumbs';

import {

    LuBot,

    LuChevronDown,

    LuClipboardCheck,

    LuLink2,

    LuPackage,

    LuPlus,

    LuScale,

    LuShieldCheck,

    LuTrash2,

} from 'react-icons/lu';



const INSPECTION_STATUS_CLASS: Record<MaterialInspectionStatus, string> = {

    'Pending Inspection': 'bg-amber-50 text-amber-800 border-amber-200',

    Approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',

    Rejected: 'bg-rose-50 text-rose-800 border-rose-200',

    'Partial Approval': 'bg-sky-50 text-sky-800 border-sky-200',

};



const inputClass =

    'w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-1 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]';



function ProcSection({

    title,

    icon: Icon,

    tone = 'slate',

    open,

    onOpenChange,

    children,

    action,

}: {

    title: string;

    icon: React.ComponentType<{ className?: string }>;

    tone?: 'blue' | 'amber' | 'slate' | 'emerald';

    open: boolean;

    onOpenChange: (open: boolean) => void;

    children: React.ReactNode;

    action?: React.ReactNode;

}) {

    const toneClasses =

        tone === 'blue'

            ? { head: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]', icon: 'text-[var(--cta-button-bg)]', ring: 'ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]' }

            : tone === 'amber'

              ? { head: 'bg-amber-50/80', icon: 'text-amber-800', ring: 'ring-amber-100/80' }

              : tone === 'emerald'

                ? { head: 'bg-emerald-50/80', icon: 'text-emerald-800', ring: 'ring-emerald-100/80' }

                : { head: 'bg-slate-50/80', icon: 'text-slate-700', ring: 'ring-slate-200/70' };



    return (

        <section className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-none">

            <div

                className={cn(

                    'flex w-full items-center gap-2.5 border-b border-gray-300 px-3 py-2',

                    toneClasses.head,

                )}

            >

                <button

                    type="button"

                    onClick={() => onOpenChange(!open)}

                    aria-expanded={open}

                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left transition hover:brightness-[0.99]"

                >

                    <span

                        className={cn(

                            'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/90 ring-1',

                            toneClasses.ring,

                        )}

                        aria-hidden

                    >

                        <Icon className={cn('h-4 w-4', toneClasses.icon)} />

                    </span>

                    <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-wide text-gray-800">{title}</span>

                    <LuChevronDown

                        className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')}

                        aria-hidden

                    />

                </button>

                {action ? <div className="shrink-0">{action}</div> : null}

            </div>

            <div hidden={!open} className="bg-white">

                {children}

            </div>

        </section>

    );

}



const thClass =

    'whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50';

const tdClass = 'border-t border-gray-100 px-3 py-2.5 text-sm text-gray-800';



function SummaryRow({

    label,

    value,

    emphasize,

    editable,

    onChange,

}: {

    label: string;

    value: string;

    emphasize?: boolean;

    editable?: boolean;

    onChange?: (v: string) => void;

}) {

    return (

        <div className="flex items-center justify-between gap-3 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50">

            <span className="text-sm font-medium text-gray-500">{label}</span>

            {editable && onChange ? (

                <input

                    type="number"

                    min={0}

                    value={value}

                    onChange={(e) => onChange(e.target.value)}

                    className="w-32 rounded border border-gray-200 px-2 py-1.5 text-right text-sm tabular-nums"

                />

            ) : (

                <span className={cn('text-sm tabular-nums', emphasize ? 'font-bold text-gray-900' : 'font-semibold text-gray-800')}>

                    {value}

                </span>

            )}

        </div>

    );

}



function LinkedDocRow({ label, value, href }: { label: string; value: string; href?: string }) {

    return (

        <div className="flex items-center justify-between gap-3 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50">

            <span className="text-sm font-medium text-gray-500">{label}</span>

            {href ? (

                <Link href={href} className="font-mono text-sm font-semibold text-[var(--cta-button-bg)] hover:underline">

                    {value}

                </Link>

            ) : (

                <span className="font-mono text-sm font-semibold text-gray-900">{value}</span>

            )}

        </div>

    );

}



export function ProcurementSupplierInvoiceBillingSections({

    invoice,

    billing,

    currency,

    isEditing = false,

    materialDrafts,

    onMaterialDraftsChange,

    charges,

    onChargesChange,

}: {

    invoice: Invoice;

    billing: ProcurementInvoiceBillingBundle;

    currency: Invoice['currency'];

    isEditing?: boolean;

    materialDrafts?: ProcurementMaterialDraft[];

    onMaterialDraftsChange?: (rows: ProcurementMaterialDraft[]) => void;

    charges?: ProcurementChargesDraft;

    onChargesChange?: (charges: ProcurementChargesDraft) => void;

}) {

    const [open, setOpen] = React.useState({

        materials: true,

        summary: true,

        inspection: true,

        linked: true,

    });

    const [highlightId, setHighlightId] = useState<string | null>(null);

    const nameRefs = useRef<Map<string, HTMLInputElement>>(new Map());



    const fmt = (n: number) => formatProcurementMoney(n, currency);

    const { summary, inspections, linkedRecords } = billing;

    const prSlug = invoice.linkedPrSlug?.trim();



    const rows = materialDrafts ?? billing.materials.map((m) => ({

        id: m.id,

        materialName: m.materialName,

        category: String(m.category),

        gradeQuality: m.gradeQuality,

        orderedQuantity: String(m.orderedQuantity),

        receivedQuantity: String(m.receivedQuantity),

        unit: m.unit,

        unitCost: String(m.unitCost),

    }));



    const updateRow = useCallback(

        (id: string, patch: Partial<ProcurementMaterialDraft>) => {

            if (!onMaterialDraftsChange) return;

            onMaterialDraftsChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

        },

        [onMaterialDraftsChange, rows],

    );



    const addMaterial = useCallback(() => {

        if (!onMaterialDraftsChange) return;

        const category =
            PROCUREMENT_MATERIAL_CATEGORIES[rows.length % PROCUREMENT_MATERIAL_CATEGORIES.length] ?? 'Hardware';
        const newRow = createEmptyMaterialDraft(category);
        onMaterialDraftsChange([...rows, newRow]);
        setHighlightId(newRow.id);
        window.setTimeout(() => {
            const el = nameRefs.current.get(newRow.id);
            el?.focus();
            el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 60);
        window.setTimeout(() => setHighlightId((prev) => (prev === newRow.id ? null : prev)), 1400);

    }, [onMaterialDraftsChange, rows]);



    const removeRow = useCallback(

        (id: string) => {

            if (!onMaterialDraftsChange || rows.length <= 1) return;

            onMaterialDraftsChange(rows.filter((r) => r.id !== id));

        },

        [onMaterialDraftsChange, rows],

    );



    const addMaterialButton = isEditing ? (

        <button

            type="button"

            onClick={addMaterial}

            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--cta-button-bg)] shadow-sm transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_42%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]"

        >

            <LuPlus size={14} aria-hidden />

            Add Material

        </button>

    ) : null;



    return (

        <div className="space-y-4">

            <ProcSection

                title="MATERIAL DELIVERY & BILLING DETAILS"

                icon={LuPackage}

                tone="blue"

                open={open.materials}

                onOpenChange={(o) => setOpen((s) => ({ ...s, materials: o }))}

                action={addMaterialButton}

            >

                <div className="overflow-x-auto">

                    <table className="min-w-full text-sm">

                        <thead>

                            <tr>

                                <th className={thClass}>Material Name</th>

                                <th className={thClass}>Category</th>

                                <th className={thClass}>Grade / Quality</th>

                                <th className={cn(thClass, 'text-right')}>Ordered Qty</th>

                                <th className={cn(thClass, 'text-right')}>Received Qty</th>

                                <th className={thClass}>Unit</th>

                                <th className={cn(thClass, 'text-right')}>Unit Cost</th>

                                <th className={cn(thClass, 'text-right')}>Line Amount</th>

                                {isEditing ? <th className="w-10 px-2 py-2" aria-label="Actions" /> : null}

                            </tr>

                        </thead>

                        <tbody>

                            {!rows.length ? (

                                <tr>

                                    <td

                                        colSpan={isEditing ? 9 : 8}

                                        className="px-3 py-6 text-center text-xs font-medium text-gray-500"

                                    >

                                        No materials added yet. Click Add Material to bill delivered items.

                                    </td>

                                </tr>

                            ) : (

                                rows.map((row) => {

                                    const normalized = normalizeMaterialDraft(row);

                                    const isHighlighted = highlightId === row.id;

                                    return (

                                        <tr

                                            key={row.id}

                                            className={cn(

                                                'odd:bg-gray-50/40 transition-colors',

                                                isHighlighted &&

                                                    'bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] ring-2 ring-inset ring-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)]',

                                            )}

                                        >

                                            <td className={tdClass}>

                                                {isEditing ? (

                                                    <input

                                                        ref={(el) => {

                                                            if (el) nameRefs.current.set(row.id, el);

                                                            else nameRefs.current.delete(row.id);

                                                        }}

                                                        value={row.materialName}

                                                        onChange={(e) => updateRow(row.id, { materialName: e.target.value })}

                                                        placeholder="e.g. OPC 53 Grade Cement"

                                                        className={cn(inputClass, 'min-w-[140px] font-medium')}

                                                    />

                                                ) : (

                                                    <span className="font-semibold">{normalized.materialName}</span>

                                                )}

                                            </td>

                                            <td className={tdClass}>

                                                {isEditing ? (

                                                    <select

                                                        value={row.category}

                                                        onChange={(e) => updateRow(row.id, { category: e.target.value })}

                                                        className={cn(inputClass, 'min-w-[100px]')}

                                                    >

                                                        {PROCUREMENT_MATERIAL_CATEGORIES.map((c) => (

                                                            <option key={c} value={c}>

                                                                {c}

                                                            </option>

                                                        ))}

                                                    </select>

                                                ) : (

                                                    normalized.category

                                                )}

                                            </td>

                                            <td className={tdClass}>

                                                {isEditing ? (

                                                    <input

                                                        value={row.gradeQuality}

                                                        onChange={(e) => updateRow(row.id, { gradeQuality: e.target.value })}

                                                        placeholder="IS 269:2015"

                                                        className={cn(inputClass, 'min-w-[110px]')}

                                                    />

                                                ) : (

                                                    normalized.gradeQuality

                                                )}

                                            </td>

                                            <td className={cn(tdClass, 'text-right')}>

                                                {isEditing ? (

                                                    <input

                                                        type="number"

                                                        min={0}

                                                        value={row.orderedQuantity}

                                                        onChange={(e) => updateRow(row.id, { orderedQuantity: e.target.value })}

                                                        className={cn(inputClass, 'w-20 text-right tabular-nums')}

                                                    />

                                                ) : (

                                                    <span className="tabular-nums">{normalized.orderedQuantity}</span>

                                                )}

                                            </td>

                                            <td className={cn(tdClass, 'text-right')}>

                                                {isEditing ? (

                                                    <input

                                                        type="number"

                                                        min={0}

                                                        value={row.receivedQuantity}

                                                        onChange={(e) => updateRow(row.id, { receivedQuantity: e.target.value })}

                                                        className={cn(inputClass, 'w-20 text-right tabular-nums')}

                                                    />

                                                ) : (

                                                    <span className="tabular-nums">{normalized.receivedQuantity}</span>

                                                )}

                                            </td>

                                            <td className={tdClass}>

                                                {isEditing ? (

                                                    <select

                                                        value={row.unit}

                                                        onChange={(e) => updateRow(row.id, { unit: e.target.value })}

                                                        className={cn(inputClass, 'min-w-[72px]')}

                                                    >

                                                        {PROCUREMENT_UNIT_OPTIONS.map((u) => (

                                                            <option key={u} value={u}>

                                                                {u}

                                                            </option>

                                                        ))}

                                                    </select>

                                                ) : (

                                                    normalized.unit

                                                )}

                                            </td>

                                            <td className={cn(tdClass, 'text-right')}>

                                                {isEditing ? (

                                                    <input

                                                        type="number"

                                                        min={0}

                                                        value={row.unitCost}

                                                        onChange={(e) => updateRow(row.id, { unitCost: e.target.value })}

                                                        className={cn(inputClass, 'w-24 text-right tabular-nums')}

                                                    />

                                                ) : (

                                                    <span className="tabular-nums">{fmt(normalized.unitCost)}</span>

                                                )}

                                            </td>

                                            <td className={cn(tdClass, 'text-right font-semibold tabular-nums')}>

                                                {fmt(normalized.lineAmount)}

                                            </td>

                                            {isEditing ? (

                                                <td className="border-t border-gray-100 px-2 py-2 text-center">

                                                    <button

                                                        type="button"

                                                        onClick={() => removeRow(row.id)}

                                                        disabled={rows.length <= 1}

                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"

                                                        aria-label="Remove material"

                                                    >

                                                        <LuTrash2 size={15} />

                                                    </button>

                                                </td>

                                            ) : null}

                                        </tr>

                                    );

                                })

                            )}

                        </tbody>

                    </table>

                </div>

            </ProcSection>



            <ProcSection

                title="PROCUREMENT SUMMARY"

                icon={LuScale}

                tone="emerald"

                open={open.summary}

                onOpenChange={(o) => setOpen((s) => ({ ...s, summary: o }))}

            >

                <div className="overflow-hidden rounded-lg border border-gray-200/80">

                    <SummaryRow label="Material Value" value={fmt(summary.materialValue)} />

                    <SummaryRow

                        label="Transport Charges"

                        value={isEditing && charges && onChargesChange ? charges.transportCharges : fmt(summary.transportCharges)}

                        editable={isEditing && !!charges && !!onChargesChange}

                        onChange={(v) => onChargesChange?.({ ...charges!, transportCharges: v })}

                    />

                    <SummaryRow

                        label="Loading Charges"

                        value={isEditing && charges && onChargesChange ? charges.loadingCharges : fmt(summary.loadingCharges)}

                        editable={isEditing && !!charges && !!onChargesChange}

                        onChange={(v) => onChargesChange?.({ ...charges!, loadingCharges: v })}

                    />

                    <SummaryRow

                        label="Discount"

                        value={isEditing && charges && onChargesChange ? charges.discount : summary.discount > 0 ? `− ${fmt(summary.discount)}` : fmt(0)}

                        editable={isEditing && !!charges && !!onChargesChange}

                        onChange={(v) => onChargesChange?.({ ...charges!, discount: v })}

                    />

                    <SummaryRow label="GST" value={fmt(summary.gst)} />

                    <SummaryRow label="Final Invoice Amount" value={fmt(summary.finalInvoiceAmount)} emphasize />

                </div>

            </ProcSection>



            <ProcSection

                title="MATERIAL INSPECTION & QUALITY VERIFICATION"

                icon={LuClipboardCheck}

                tone="amber"

                open={open.inspection}

                onOpenChange={(o) => setOpen((s) => ({ ...s, inspection: o }))}

            >

                <div className="overflow-x-auto">

                    <table className="min-w-full text-sm">

                        <thead>

                            <tr>

                                <th className={thClass}>Material</th>

                                <th className={thClass}>Inspection Status</th>

                                <th className={thClass}>Quality Grade</th>

                                <th className={thClass}>Remarks</th>

                            </tr>

                        </thead>

                        <tbody>

                            {inspections.map((row) => (

                                <tr key={row.id} className="odd:bg-gray-50/40">

                                    <td className={cn(tdClass, 'font-semibold')}>{row.materialName}</td>

                                    <td className={tdClass}>

                                        <span

                                            className={cn(

                                                'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold',

                                                INSPECTION_STATUS_CLASS[row.inspectionStatus],

                                            )}

                                        >

                                            {row.inspectionStatus}

                                        </span>

                                    </td>

                                    <td className={tdClass}>{row.qualityGrade}</td>

                                    <td className={cn(tdClass, 'max-w-xs text-gray-600')}>{row.remarks}</td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </ProcSection>



            <ProcSection

                title="LINKED PROCUREMENT RECORDS"

                icon={LuLink2}

                tone="slate"

                open={open.linked}

                onOpenChange={(o) => setOpen((s) => ({ ...s, linked: o }))}

            >

                <div className="overflow-hidden rounded-lg border border-gray-200/80">

                    <LinkedDocRow

                        label="Purchase Requisition"

                        value={linkedRecords.purchaseRequisition}

                        href={prSlug ? procurementReturnPrHref(prSlug) : undefined}

                    />

                    <LinkedDocRow label="Purchase Order" value={linkedRecords.purchaseOrder} />

                    <LinkedDocRow label="Goods Receipt Note (GRN)" value={linkedRecords.goodsReceiptNote} />

                    <LinkedDocRow label="Supplier Contract" value={linkedRecords.supplierContract} />

                    <LinkedDocRow label="Project" value={linkedRecords.project} />

                </div>

            </ProcSection>

        </div>

    );

}



export function ProcurementInvoiceAIPanel({

    billing,

}: {

    billing: ProcurementInvoiceBillingBundle;

    currency: Invoice['currency'];

}) {

    const { aiValidation } = billing;

    const complianceClass =

        aiValidation.supplierComplianceStatus === 'Compliant'

            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'

            : aiValidation.supplierComplianceStatus === 'Review Required'

              ? 'bg-amber-50 text-amber-800 border-amber-200'

              : 'bg-rose-50 text-rose-800 border-rose-200';



    const metrics = [

        { label: 'PO Match %', value: `${aiValidation.poMatchPercent}%`, warn: false },

        {

            label: 'Quantity Variance',

            value: `${aiValidation.quantityVariancePercent}%`,

            warn: aiValidation.quantityVariancePercent >= 2,

        },

        { label: 'Cost Variance', value: `${aiValidation.costVariancePercent}%`, warn: aiValidation.costVariancePercent > 3 },

    ];



    return (

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

            <div className="flex items-start gap-2.5">

                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_20%,transparent)]">

                    <LuBot size={18} aria-hidden />

                </span>

                <div className="min-w-0">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Procurement Validation</p>

                    <p className="mt-0.5 text-sm font-semibold text-slate-900">Pre-payment compliance check</p>

                </div>

            </div>



            <dl className="mt-4 space-y-2.5">

                {metrics.map((m) => (

                    <div key={m.label} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">

                        <dt className="text-xs font-medium text-slate-600">{m.label}</dt>

                        <dd className={cn('text-sm font-bold tabular-nums', m.warn ? 'text-amber-800' : 'text-slate-900')}>

                            {m.value}

                        </dd>

                    </div>

                ))}

                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">

                    <dt className="text-xs font-medium text-slate-600">Supplier Compliance</dt>

                    <dd>

                        <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase', complianceClass)}>

                            {aiValidation.supplierComplianceStatus}

                        </span>

                    </dd>

                </div>

            </dl>



            {aiValidation.riskAlerts.length > 0 ? (

                <div className="mt-4">

                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Risk Alerts</p>

                    <ul className="mt-2 space-y-1.5">

                        {aiValidation.riskAlerts.map((alert) => (

                            <li

                                key={alert}

                                className="flex items-start gap-2 rounded-md border border-amber-200/80 bg-amber-50/70 px-2.5 py-2 text-xs font-medium text-amber-900"

                            >

                                <LuShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden />

                                {alert}

                            </li>

                        ))}

                    </ul>

                </div>

            ) : null}



            <div className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_6%,white)] px-3 py-2.5">

                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">AI Recommendation</p>

                <p className="mt-1 text-xs leading-relaxed text-slate-800">{aiValidation.recommendation}</p>

                <p className="mt-2 text-[11px] font-medium text-slate-500">

                    Invoice matches PO {aiValidation.poMatchPercent}%

                    {aiValidation.quantityVariancePercent >= 2

                        ? ` · ${aiValidation.quantityVariancePercent}% quantity variance detected`

                        : ''}

                </p>

            </div>

        </div>

    );

}

