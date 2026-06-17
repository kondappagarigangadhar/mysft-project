'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/projects-inventory/FormField';
import { TextInput } from '@/components/projects-inventory/TextInput';
import { InventoryStatusBadge } from '@/components/projects-inventory/InventoryStatusBadge';
import {
    applyDirectUnitPricing,
    canUpdatePricingDirectly,
    computeFinalUnitPrice,
    decodeUnitSlugParam,
    decidePriceApproval,
    formatCurrencyINR,
    getPriceApprovals,
    getUnits,
    requestPriceUpdate,
    type InventoryUnit,
    type PriceUpdateApproval,
    type Project,
} from '@/lib/projectsInventoryStore';
import { LuCheck, LuCircleDollarSign, LuClipboardList, LuSearch, LuX } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { CTA_CARD_EDITING_RING, CTA_INPUT_FOCUS, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';
import { ProjectPricingEnterpriseSections } from '@/components/projects-inventory/project-view/ProjectPricingEnterpriseSections';

type Props = {
    project: Project;
    projectSlug: string;
    storeVersion: number;
    onStoreRefresh: () => void;
};

function CardHeader({ icon: Icon, title, subtitle }: { icon: typeof LuCircleDollarSign; title: string; subtitle?: string }) {
    return (
        <div className="flex items-start gap-2 border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
            <Icon className="mt-0.5 shrink-0 text-[var(--cta-button-bg)]" size={18} aria-hidden />
            <div className="min-w-0">
                {/* <h3 className="text-sm font-semibold text-gray-900">{title}</h3> */}
                {subtitle ? <p className="mt-0.5 text-sm font-medium text-gray-800">{subtitle}</p> : null}
            </div>
        </div>
    );
}

export function ProjectPricingTab({ project, projectSlug, storeVersion, onStoreRefresh }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const allUnits = useMemo(() => getUnits(), [storeVersion]);
    const projectUnits = useMemo(() => allUnits.filter((u) => u.projectSlug === projectSlug), [allUnits, projectSlug]);
    const approvals = useMemo(() => getPriceApprovals(), [storeVersion]);

    const pendingProjectApprovals = useMemo(() => {
        return approvals.filter((a) => {
            const u = allUnits.find((x) => x.slug === a.unitSlug);
            return u?.projectSlug === projectSlug && a.status === 'pending';
        });
    }, [approvals, allUnits, projectSlug]);

    const [pricingSearch, setPricingSearch] = useState('');
    const [pricingPickSlug, setPricingPickSlug] = useState<string | null>(null);

    const filteredUnits = useMemo(() => {
        const q = pricingSearch.trim().toLowerCase();
        return projectUnits.filter((u) => {
            if (!q) return true;
            return (
                u.unit_number.toLowerCase().includes(q) ||
                u.unit_id.toLowerCase().includes(q) ||
                String(u.unit_size).includes(q) ||
                (u.configuration ?? '').toLowerCase().includes(q)
            );
        });
    }, [projectUnits, pricingSearch]);

    useEffect(() => {
        const raw = searchParams.get('unit');
        if (raw === null || raw === '') return;
        const decoded = decodeUnitSlugParam(raw);
        if (projectUnits.some((u) => u.slug === decoded)) {
            setPricingPickSlug(decoded);
        }
    }, [searchParams, projectUnits]);

    const syncUrl = (nextUnitSlug: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', 'pricing');
        if (nextUnitSlug) params.set('unit', encodeURIComponent(nextUnitSlug));
        else params.delete('unit');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const pricingResolvedSlug = pricingPickSlug ?? projectUnits[0]?.slug ?? '';
    const pricingUnit = useMemo(
        () => (pricingResolvedSlug ? projectUnits.find((u) => u.slug === pricingResolvedSlug) : undefined),
        [projectUnits, pricingResolvedSlug],
    );

    const [basePrice, setBasePrice] = useState('');
    const [offerPrice, setOfferPrice] = useState('');
    const [discountPct, setDiscountPct] = useState('');
    const [plcCharges, setPlcCharges] = useState('');
    const [gstPct, setGstPct] = useState('5');
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [notes, setNotes] = useState('');

    const [pricingBusy, setPricingBusy] = useState<'request' | 'direct' | null>(null);
    const [processingApprovalId, setProcessingApprovalId] = useState<string | null>(null);

    useEffect(() => {
        if (!pricingPickSlug && projectUnits[0]?.slug) {
            setPricingPickSlug(projectUnits[0].slug);
        }
    }, [projectUnits, pricingPickSlug]);

    useEffect(() => {
        if (!pricingUnit) return;
        setBasePrice(String(pricingUnit.price));
        setOfferPrice(pricingUnit.offer_price != null ? String(pricingUnit.offer_price) : '');
        setPlcCharges(pricingUnit.plc_charges != null ? String(pricingUnit.plc_charges) : '');
        setGstPct(pricingUnit.gst_tax_percent != null ? String(pricingUnit.gst_tax_percent) : '5');
    }, [pricingUnit?.slug, storeVersion]);

    const finalPreview = useMemo(() => {
        const base = Number(basePrice);
        if (!Number.isFinite(base) || base <= 0) return 0;
        const offer = offerPrice.trim() ? Number(offerPrice) : undefined;
        const disc = discountPct.trim() ? Number(discountPct) : undefined;
        const plc = plcCharges.trim() ? Number(plcCharges) : undefined;
        const gst = gstPct.trim() ? Number(gstPct) : undefined;
        return computeFinalUnitPrice({ basePrice: base, offerPrice: offer, discountPct: disc, plcCharges: plc, gstPct: gst });
    }, [basePrice, offerPrice, discountPct, plcCharges, gstPct]);

    const directAllowed = canUpdatePricingDirectly();

    const buildPayload = () => {
        const base = Number(basePrice);
        const offer = offerPrice.trim() ? Number(offerPrice) : undefined;
        return {
            base_price: base,
            offer_price: offer,
            discount_pct: discountPct.trim() ? Number(discountPct) : undefined,
            plc_charges: plcCharges.trim() ? Number(plcCharges) : undefined,
            gst_pct: gstPct.trim() ? Number(gstPct) : undefined,
            effective_from: effectiveFrom.trim() || undefined,
            notes: notes.trim() || undefined,
            updated_by: 'You',
        };
    };

    const submitRequest = () => {
        if (!pricingUnit || pricingBusy) return;
        const base = Number(basePrice);
        if (!Number.isFinite(base) || base <= 0) {
            alert('Base price must be positive.');
            return;
        }
        flushSync(() => {
            setPricingBusy('request');
        });
        try {
            if (!requestPriceUpdate(pricingUnit.slug, buildPayload())) {
                alert('Check pricing rules (offer must be ≤ base).');
                return;
            }
            onStoreRefresh();
        } finally {
            setPricingBusy(null);
        }
    };

    const submitDirect = () => {
        if (!pricingUnit || !directAllowed || pricingBusy) return;
        const base = Number(basePrice);
        if (!Number.isFinite(base) || base <= 0) {
            alert('Base price must be positive.');
            return;
        }
        flushSync(() => {
            setPricingBusy('direct');
        });
        try {
            if (!applyDirectUnitPricing(pricingUnit.slug, buildPayload())) {
                alert('Direct update not available or invalid pricing.');
                return;
            }
            onStoreRefresh();
        } finally {
            setPricingBusy(null);
        }
    };

    const selectUnit = (u: InventoryUnit) => {
        setPricingPickSlug(u.slug);
        syncUrl(u.slug);
    };

    return (
        <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-5">
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 ring-1 ring-gray-200/80">
                            <LuCircleDollarSign size={20} aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold text-gray-900">Pricing</h2>
                            <p className="mt-0.5 text-sm text-gray-500">
                                Click a unit on the right to load its pricing. Same layout as Inventory.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 lg:divide-x lg:divide-gray-100">
                    <div className="order-2 min-w-0 bg-white lg:order-1 lg:col-span-8 xl:col-span-9">
                        <div className="overflow-hidden border-b border-gray-100 lg:border-b-0">
                            <CardHeader
                                icon={LuCircleDollarSign}
                                title="Update pricing"
                                subtitle={
                                    pricingUnit
                                        ? `Unit ${pricingUnit.unit_number} · ${pricingUnit.unit_id} · ${pricingUnit.configuration}`
                                        : 'Select a unit from the list.'
                                }
                            />
                            <div className="p-4 sm:p-5">
                                {projectUnits.length === 0 ? (
                                    <p className="text-sm text-gray-600">Add inventory units before pricing.</p>
                                ) : !pricingUnit ? (
                                    <p className="py-8 text-center text-sm text-gray-500">Select a unit from the list.</p>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                            <FormField label="Base price" required hint="INR">
                                                <TextInput
                                                    name="basePrice"
                                                    value={basePrice}
                                                    onChange={setBasePrice}
                                                    type="number"
                                                    placeholder="e.g. 5000000"
                                                />
                                            </FormField>
                                            <FormField label="Offer price" hint="Optional · ≤ base">
                                                <TextInput
                                                    name="offerPrice"
                                                    value={offerPrice}
                                                    onChange={setOfferPrice}
                                                    type="number"
                                                    placeholder="Leave empty if none"
                                                />
                                            </FormField>
                                            <FormField label="Discount %" hint="Optional">
                                                <TextInput
                                                    name="discountPct"
                                                    value={discountPct}
                                                    onChange={setDiscountPct}
                                                    type="number"
                                                    placeholder="e.g. 5"
                                                />
                                            </FormField>
                                            <FormField label="PLC charges" hint="INR · optional">
                                                <TextInput
                                                    name="plcCharges"
                                                    value={plcCharges}
                                                    onChange={setPlcCharges}
                                                    type="number"
                                                    placeholder="Preferred location charges"
                                                />
                                            </FormField>
                                            <FormField label="GST / tax %" hint="0–100">
                                                <TextInput name="gstPct" value={gstPct} onChange={setGstPct} type="number" placeholder="e.g. 5" />
                                            </FormField>
                                            <FormField label="Effective from" hint="Date">
                                                <TextInput
                                                    name="effectiveFrom"
                                                    value={effectiveFrom}
                                                    onChange={setEffectiveFrom}
                                                    type="date"
                                                />
                                            </FormField>
                                            <FormField label="Notes" hint="For approvers" className="md:col-span-2">
                                                <textarea
                                                    name="pricingNotes"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    rows={2}
                                                    className={cn(
                                                        'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all',
                                                        CTA_INPUT_FOCUS,
                                                    )}
                                                    placeholder="Optional context for approvers"
                                                />
                                            </FormField>
                                            <FormField
                                                label="Calculated final price"
                                                hint="Offer/discount + PLC + GST"
                                                className="md:col-span-2"
                                            >
                                                <div className="rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-4 py-3">
                                                    <p className="text-xl font-bold tabular-nums text-[var(--cta-button-bg)]">
                                                        {formatCurrencyINR(finalPreview)}
                                                    </p>
                                                </div>
                                            </FormField>
                                        </div>
                                        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                                            <Button
                                                type="button"
                                                variant="companyOutline"
                                                size="cta"
                                                className="h-10"
                                                disabled={Boolean(pricingBusy)}
                                                onClick={() => {
                                                    if (pricingUnit) {
                                                        setBasePrice(String(pricingUnit.price));
                                                        setOfferPrice(pricingUnit.offer_price != null ? String(pricingUnit.offer_price) : '');
                                                        setDiscountPct('');
                                                        setNotes('');
                                                    }
                                                }}
                                            >
                                                Reset
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="company"
                                                size="cta"
                                                className={cn('h-10', CTA_SHADOW_SOFT)}
                                                disabled={Boolean(pricingBusy)}
                                                isLoading={pricingBusy === 'request'}
                                                onClick={submitRequest}
                                            >
                                                {pricingBusy === 'request' ? 'Working…' : 'Request approval'}
                                            </Button>
                                            {directAllowed ? (
                                                <Button
                                                    type="button"
                                                    variant="companyOutline"
                                                    size="cta"
                                                    className="h-10 border-emerald-200 text-emerald-900"
                                                    disabled={Boolean(pricingBusy)}
                                                    isLoading={pricingBusy === 'direct'}
                                                    onClick={submitDirect}
                                                >
                                                    {pricingBusy === 'direct' ? 'Working…' : 'Update directly'}
                                                </Button>
                                            ) : null}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="order-1 flex min-w-0 flex-col bg-gray-50/40 lg:order-2 lg:col-span-4 xl:col-span-3">
                        <div className="border-b border-gray-100 p-3 sm:p-4">
                            <FormField label="Search units" hint="Filter list">
                                <div className="relative">
                                    <LuSearch
                                        className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-gray-400"
                                        aria-hidden
                                    />
                                    <input
                                        id="pricing-unit-search"
                                        type="search"
                                        placeholder="Unit number, ID, configuration…"
                                        value={pricingSearch}
                                        onChange={(e) => setPricingSearch(e.target.value)}
                                        className={cn(
                                            'h-10 w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400',
                                            CTA_INPUT_FOCUS,
                                        )}
                                    />
                                </div>
                            </FormField>
                        </div>
                        <div className="max-h-[min(60vh,560px)] min-h-[200px] overflow-y-auto overscroll-y-contain p-3 sm:p-4 [scrollbar-gutter:stable]">
                            {projectUnits.length === 0 ? (
                                <p className="py-8 text-center text-sm text-gray-500">No units in this project.</p>
                            ) : filteredUnits.length === 0 ? (
                                <p className="py-8 text-center text-sm text-gray-500">No matches.</p>
                            ) : (
                                <ul className="space-y-1.5">
                                    {filteredUnits.map((u) => {
                                        const active = pricingResolvedSlug === u.slug;
                                        return (
                                            <li key={u.slug}>
                                                <button
                                                    type="button"
                                                    onClick={() => selectUnit(u)}
                                                    className={cn(
                                                        'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                                                        active
                                                            ? cn(
                                                                  'bg-white font-medium text-gray-900 shadow-sm',
                                                                  CTA_CARD_EDITING_RING,
                                                              )
                                                            : 'border-transparent bg-transparent text-gray-700 hover:border-gray-200 hover:bg-white',
                                                    )}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate tabular-nums">Unit {u.unit_number}</p>
                                                        <p className="truncate text-xs text-gray-500">{formatCurrencyINR(u.price)}</p>
                                                    </div>
                                                    <InventoryStatusBadge status={u.availability_status} />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        <div className="border-t border-gray-100 p-3 sm:p-4">
                            <p className="text-xs text-gray-500">
                                Pending approvals:{' '}
                                <span className="font-semibold text-amber-800">{pendingProjectApprovals.length}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ProjectPricingEnterpriseSections project={project} />

            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
                <CardHeader icon={LuClipboardList} title="Pending approvals" subtitle="Approve to apply new prices to inventory." />
                <div className="p-4 sm:p-5">
                    {pendingProjectApprovals.length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-500">Nothing waiting for approval.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                            {pendingProjectApprovals.map((a: PriceUpdateApproval) => {
                                const unit = projectUnits.find((u) => u.slug === a.unitSlug);
                                return (
                                    <li key={a.slug} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900">
                                                Unit {unit?.unit_number} · {project.project_name}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">{a.requested_at}</p>
                                            <p className="mt-2 text-sm text-gray-700">
                                                Base {formatCurrencyINR(a.requested_base_price)}
                                                {a.requested_offer_price != null ? ` · Offer ${formatCurrencyINR(a.requested_offer_price)}` : ''}
                                                {' · '}
                                                Final {formatCurrencyINR(a.final_price ?? a.requested_base_price)}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            <Button
                                                type="button"
                                                variant="company"
                                                size="sm"
                                                className={cn('h-9 gap-1', CTA_SHADOW_SOFT)}
                                                disabled={processingApprovalId !== null}
                                                isLoading={processingApprovalId === a.slug}
                                                onClick={() => {
                                                    if (processingApprovalId) return;
                                                    flushSync(() => {
                                                        setProcessingApprovalId(a.slug);
                                                    });
                                                    try {
                                                        decidePriceApproval(a.slug, 'approved');
                                                        onStoreRefresh();
                                                    } finally {
                                                        setProcessingApprovalId(null);
                                                    }
                                                }}
                                            >
                                                <LuCheck size={14} />
                                                Approve
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="companyOutline"
                                                size="sm"
                                                className="h-9 gap-1"
                                                disabled={processingApprovalId !== null}
                                                isLoading={processingApprovalId === `${a.slug}-rej`}
                                                onClick={() => {
                                                    if (processingApprovalId) return;
                                                    flushSync(() => {
                                                        setProcessingApprovalId(`${a.slug}-rej`);
                                                    });
                                                    try {
                                                        decidePriceApproval(a.slug, 'rejected');
                                                        onStoreRefresh();
                                                    } finally {
                                                        setProcessingApprovalId(null);
                                                    }
                                                }}
                                            >
                                                <LuX size={14} />
                                                Reject
                                            </Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
