'use client';

import React, { useMemo, useState } from 'react';
import {
    defaultDiscountRows,
    defaultInstallmentSchedule,
    defaultPricingMasterForProject,
    type PricingDiscountRow,
    type PricingInstallmentRow,
    type ProjectPricingMaster,
} from '@/lib/projectEnterpriseHelpers';
import { formatCurrencyINR, type Project } from '@/lib/projectsInventoryStore';
import { cn } from '@/lib/utils';
import { LuBrain, LuCalendarClock, LuCircleDollarSign, LuPercent, LuSparkles } from 'react-icons/lu';
import { FormField } from '@/components/projects-inventory/FormField';
import { TextInput } from '@/components/projects-inventory/TextInput';
import { ProjectRecordCollapsibleSection } from './ProjectRecordCollapsibleSection';

function CollapsibleBlock({
    title,
    icon: Icon,
    children,
    defaultOpen = true,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <ProjectRecordCollapsibleSection title={title} icon={Icon} tone="slate" open={open} onOpenChange={setOpen}>
            {children}
        </ProjectRecordCollapsibleSection>
    );
}

export function ProjectPricingEnterpriseSections({ project }: { project: Project }) {
    const master = useMemo(() => defaultPricingMasterForProject(project), [project]);
    const [pricingMaster, setPricingMaster] = useState<ProjectPricingMaster>(master);
    const installments = useMemo(() => defaultInstallmentSchedule(pricingMaster.base_price ?? 6500000), [pricingMaster.base_price]);
    const discounts = useMemo(() => defaultDiscountRows(), []);

    return (
        <div className="space-y-4">
            <CollapsibleBlock title="PRICING MASTER" icon={LuCircleDollarSign}>
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
                    {(
                        [
                            ['base_price', 'Base price'],
                            ['offer_price', 'Offer price'],
                            ['plc_charges', 'PLC charges'],
                            ['gst_pct', 'GST %'],
                            ['registration_charges', 'Registration'],
                            ['floor_rise_charges', 'Floor rise'],
                            ['clubhouse_charges', 'Clubhouse'],
                            ['parking_charges', 'Parking'],
                            ['maintenance_charges', 'Maintenance'],
                        ] as const
                    ).map(([key, label]) => (
                        <FormField key={key} label={label}>
                            <TextInput
                                name={key}
                                value={String((pricingMaster as Record<string, number | undefined>)[key] ?? '')}
                                onChange={(v) =>
                                    setPricingMaster((prev) => ({
                                        ...prev,
                                        [key]: Number(v.replace(/\D/g, '')) || undefined,
                                    }))
                                }
                                type="number"
                            />
                        </FormField>
                    ))}
                    <FormField label="Discount rules" className="md:col-span-2 lg:col-span-3">
                        <textarea
                            value={pricingMaster.discount_rules ?? ''}
                            onChange={(e) => setPricingMaster((prev) => ({ ...prev, discount_rules: e.target.value }))}
                            rows={2}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                        />
                    </FormField>
                </div>
            </CollapsibleBlock>

            <CollapsibleBlock title="PAYMENT PLAN CONFIGURATION" icon={LuCalendarClock}>
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    {(
                        [
                            ['construction_linked_plan', 'Construction linked plan'],
                            ['down_payment_plan', 'Down payment plan'],
                            ['flexi_plan', 'Flexi plan'],
                            ['custom_installments', 'Custom installments'],
                        ] as const
                    ).map(([key, label]) => {
                        const on = Boolean(pricingMaster[key]);
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setPricingMaster((prev) => ({ ...prev, [key]: !on }))}
                                className={cn(
                                    'rounded-xl border px-4 py-3 text-left text-sm font-semibold transition',
                                    on
                                        ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-gray-900'
                                        : 'border-gray-200 bg-gray-50 text-gray-600',
                                )}
                            >
                                {label}
                                <span className="mt-1 block text-xs font-normal text-gray-500">{on ? 'Enabled' : 'Disabled'}</span>
                            </button>
                        );
                    })}
                </div>
            </CollapsibleBlock>

            <CollapsibleBlock title="INSTALLMENT SCHEDULE" icon={LuCalendarClock}>
                <div className="overflow-x-auto p-2">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
                                <th className="py-2 pr-3">Installment</th>
                                <th className="py-2 pr-3">Due date</th>
                                <th className="py-2 pr-3">%</th>
                                <th className="py-2 pr-3">Amount</th>
                                <th className="py-2">Trigger</th>
                            </tr>
                        </thead>
                        <tbody>
                            {installments.map((row: PricingInstallmentRow) => (
                                <tr key={row.id} className="border-b border-gray-50 last:border-0">
                                    <td className="py-2.5 pr-3 font-medium text-gray-900">{row.name}</td>
                                    <td className="py-2.5 pr-3 text-gray-600">{row.due_date}</td>
                                    <td className="py-2.5 pr-3 tabular-nums">{row.percentage}%</td>
                                    <td className="py-2.5 pr-3 tabular-nums font-medium">{formatCurrencyINR(row.amount)}</td>
                                    <td className="py-2.5 text-gray-600">{row.trigger_event}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleBlock>

            <CollapsibleBlock title="DISCOUNT MANAGEMENT" icon={LuPercent}>
                <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
                    {discounts.map((d: PricingDiscountRow) => (
                        <div
                            key={d.id}
                            className={cn(
                                'rounded-xl border px-4 py-3',
                                d.active ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50/50',
                            )}
                        >
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{d.type}</p>
                            <p className="mt-1 text-sm font-medium text-gray-900">{d.value}</p>
                            <p className="mt-1 text-xs text-gray-500">{d.active ? 'Active' : 'Inactive'}</p>
                        </div>
                    ))}
                </div>
            </CollapsibleBlock>

            <CollapsibleBlock title="AI PRICING INSIGHTS" icon={LuBrain} defaultOpen={true}>
                <div className="space-y-3 p-4">
                    <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-violet-900">
                            <LuSparkles size={16} aria-hidden />
                            Demand pricing suggestion
                        </p>
                        <p className="mt-1 text-sm text-violet-800">
                            Increase offer price by 2–3% on high-demand {project.project_type === 'Apartment' ? '2 BHK' : 'configurations'} — demand score trending up.
                        </p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
                        <p className="font-semibold">High demand unit alert</p>
                        <p className="mt-1">Corner units with garden view — limited availability, consider hold pricing.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                        <p className="font-semibold">Slow moving inventory</p>
                        <p className="mt-1">Studio and penthouse tiers — review PLC waivers or broker incentives.</p>
                    </div>
                </div>
            </CollapsibleBlock>
        </div>
    );
}
