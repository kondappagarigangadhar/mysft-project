'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
    CustomerCollapsibleSection,
    CustomerFieldRow,
    EMPTY_FIELD,
} from '@/components/customers/CustomerOverviewFieldKit';
import { ProgressBar } from '@/components/projects-inventory/project-view/ProjectRecordCollapsibleSection';
import {
    PROJECT_AMENITY_LABELS,
    type ProjectAmenityKey,
    defaultProjectMediaGallery,
    isImageMediaUrl,
    isVideoMediaUrl,
} from '@/lib/projectEnterpriseHelpers';
import type { Customer } from '@/lib/customersStore';
import { displayValue, resolveCustomerPropertyContext } from '@/lib/customers/customerPropertyIntelligence';
import { formatCurrencyINR } from '@/lib/projectsInventoryStore';
import { cn } from '@/lib/utils';
import { LuFileText, LuGavel, LuImage, LuLayers, LuReceipt, LuSparkles, LuTrendingUp } from 'react-icons/lu';

const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';

/** Buyer-facing amenities only (compact grid). */
const PRIORITY_AMENITY_KEYS: ProjectAmenityKey[] = [
    'swimming_pool',
    'clubhouse',
    'gym',
    'security',
    'cctv',
    'lift',
    'park',
    'visitor_parking',
    'power_backup',
    'ev_charging',
];

function fmtInr(n: number) {
    return formatCurrencyINR(n);
}

function Subheading({ children }: { children: React.ReactNode }) {
    return (
        <p className="border-b border-gray-100 bg-slate-50/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {children}
        </p>
    );
}

function hasReraData(project: ReturnType<typeof resolveCustomerPropertyContext>['project']) {
    if (!project) return false;
    return Boolean(
        project.rera_number?.trim() ||
            project.legal_status?.trim() ||
            project.registration_status?.trim() ||
            project.approval_authority?.trim(),
    );
}

export type CustomerPropertySectionsOpen = {
    propertySummary: boolean;
    amenities: boolean;
    construction: boolean;
    bookingPayment: boolean;
    reraLegal: boolean;
    media: boolean;
};

type Props = {
    customer: Customer;
    sectionsOpen: CustomerPropertySectionsOpen;
    onSectionsOpenChange: (patch: Partial<CustomerPropertySectionsOpen>) => void;
    /** When true, property blocks show sync hint (values follow project/unit from header). */
    isEditing?: boolean;
};

export function CustomerPropertyWorkspaceSections({ customer, sectionsOpen, onSectionsOpenChange, isEditing }: Props) {
    const ctx = useMemo(() => resolveCustomerPropertyContext(customer), [customer]);
    const project = ctx.project;
    const unit = ctx.unit;
    const unitType = ctx.unitType;
    const pb = ctx.priceBreakdown;

    const projectHref = project ? `/projects-inventory/projects/view/${encodeURIComponent(project.slug)}?tab=overview` : null;
    const unitHref =
        project && unit
            ? `/projects-inventory/projects/view/${encodeURIComponent(project.slug)}?tab=inventory&unit=${encodeURIComponent(unit.slug)}`
            : null;

    const media = project ? defaultProjectMediaGallery(project) : null;
    const amenities = project?.amenities ?? {};
    const construction = project?.construction_status ?? {};

    const configuration =
        unitType === 'Plot'
            ? displayValue(unit?.configuration ?? 'Plot')
            : displayValue(unit?.configuration ?? ctx.booking?.unitConfiguration);

    const areaDisplay =
        unit?.unit_size != null
            ? `${unit.unit_size.toLocaleString('en-IN')} sq.ft`
            : unitType === 'Villa' && unit?.built_up_area
              ? `${unit.built_up_area.toLocaleString('en-IN')} sq.ft`
              : EMPTY_FIELD;

    const showTowerFloor = unitType === 'Apartment' || unitType === 'Commercial' || !unitType;

    return (
        <div className="space-y-4">
            {isEditing ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-600">
                    Property details refresh from the project and unit above. Edit inventory or project setup for structural changes.
                </p>
            ) : null}
            <CustomerCollapsibleSection
                title="Property & Unit Summary"
                icon={LuLayers}
                tone="blue"
                open={sectionsOpen.propertySummary}
                onOpenChange={(o) => onSectionsOpenChange({ propertySummary: o })}
                headerRight={
                    projectHref ? (
                        <Link href={projectHref} className="text-[11px] font-semibold text-[var(--cta-button-bg)] hover:underline">
                            View project
                        </Link>
                    ) : null
                }
            >
                <Subheading>Project</Subheading>
                <div className={fieldGrid}>
                    <CustomerFieldRow label="Project Name">
                        {projectHref ? (
                            <Link href={projectHref} className="font-semibold text-[var(--cta-button-bg)] hover:underline">
                                {displayValue(project?.project_name ?? customer.projectName)}
                            </Link>
                        ) : (
                            displayValue(project?.project_name ?? customer.projectName)
                        )}
                    </CustomerFieldRow>
                    <CustomerFieldRow label="Builder">{displayValue(project?.developer_name)}</CustomerFieldRow>
                    <CustomerFieldRow label="City">{displayValue(project?.city ?? project?.location)}</CustomerFieldRow>
                    <CustomerFieldRow label="Possession Date">{displayValue(project?.possession_date)}</CustomerFieldRow>
                </div>

                <Subheading>Unit</Subheading>
                <div className={fieldGrid}>
                    <CustomerFieldRow label="Unit Number">
                        {unitHref ? (
                            <Link href={unitHref} className="font-semibold text-[var(--cta-button-bg)] hover:underline">
                                {displayValue(unit?.unit_number ?? customer.unitNumber)}
                            </Link>
                        ) : (
                            displayValue(unit?.unit_number ?? customer.unitNumber)
                        )}
                    </CustomerFieldRow>
                    {showTowerFloor ? (
                        <>
                            <CustomerFieldRow label="Tower / Block">{displayValue(unit?.tower_block ?? unit?.block_phase)}</CustomerFieldRow>
                            <CustomerFieldRow label="Floor">{displayValue(unit?.floor)}</CustomerFieldRow>
                        </>
                    ) : null}
                    <CustomerFieldRow label="Configuration (BHK)">{configuration}</CustomerFieldRow>
                    <CustomerFieldRow label="Area">{areaDisplay}</CustomerFieldRow>
                    <CustomerFieldRow label="Facing">{displayValue(unit?.facing)}</CustomerFieldRow>
                    <CustomerFieldRow label="Parking">{displayValue(unit?.parking_type)}</CustomerFieldRow>
                </div>

                <Subheading>Property</Subheading>
                <div className={fieldGrid}>
                    <CustomerFieldRow label="Property Type">{displayValue(project?.property_type ?? unit?.unit_type ?? unitType)}</CustomerFieldRow>
                    <CustomerFieldRow label="Development Type">{displayValue(project?.development_type)}</CustomerFieldRow>
                    <CustomerFieldRow label="Furnishing">{displayValue(unit?.furnishing_status)}</CustomerFieldRow>
                    <CustomerFieldRow label="Possession Status">{displayValue(project?.possession_status)}</CustomerFieldRow>
                </div>
            </CustomerCollapsibleSection>

            <CustomerCollapsibleSection
                title="Project Amenities"
                icon={LuSparkles}
                tone="slate"
                open={sectionsOpen.amenities}
                onOpenChange={(o) => onSectionsOpenChange({ amenities: o })}
            >
                <div className="flex flex-wrap gap-1.5 p-3">
                    {PRIORITY_AMENITY_KEYS.map((key) => {
                        const active = Boolean(amenities[key]);
                        return (
                            <span
                                key={key}
                                className={cn(
                                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                                    active
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        : 'border-slate-200 bg-slate-50 text-slate-500',
                                )}
                            >
                                {PROJECT_AMENITY_LABELS[key]}
                                <span className="text-[10px] opacity-80">{active ? 'Yes' : 'No'}</span>
                            </span>
                        );
                    })}
                </div>
            </CustomerCollapsibleSection>

            <CustomerCollapsibleSection
                title="Construction Status"
                icon={LuTrendingUp}
                tone="amber"
                open={sectionsOpen.construction}
                onOpenChange={(o) => onSectionsOpenChange({ construction: o })}
            >
                <div className="space-y-2.5 px-3 py-3">
                    <ProgressBar value={construction.completion_pct ?? 0} label="Overall completion" />
                    <ProgressBar value={construction.structure_pct ?? 0} label="Structure" />
                    <ProgressBar value={construction.plumbing_pct ?? 0} label="Plumbing" />
                    <ProgressBar value={construction.finishing_pct ?? 0} label="Finishing" />
                    <p className="text-xs text-slate-600">
                        Last updated:{' '}
                        <span className="font-semibold text-slate-900">{displayValue(construction.last_site_update)}</span>
                    </p>
                </div>
            </CustomerCollapsibleSection>

            <CustomerCollapsibleSection
                title="Booking & Payment Details"
                icon={LuReceipt}
                tone="amber"
                open={sectionsOpen.bookingPayment}
                onOpenChange={(o) => onSectionsOpenChange({ bookingPayment: o })}
            >
                <div className={fieldGrid}>
                    <CustomerFieldRow label="Booking ID">{displayValue(customer.bookingId)}</CustomerFieldRow>
                    <CustomerFieldRow label="Booking Date">{displayValue(customer.bookingDate)}</CustomerFieldRow>
                    <CustomerFieldRow label="Payment Plan">{displayValue(ctx.paymentPlanLabel)}</CustomerFieldRow>
                    <CustomerFieldRow label="Token Amount">{fmtInr(ctx.tokenAmount)}</CustomerFieldRow>
                    <CustomerFieldRow label="Final Sale Value">
                        {pb ? fmtInr(pb.final_sale_value) : fmtInr(customer.totalAmount)}
                    </CustomerFieldRow>
                    <CustomerFieldRow label="Discount">{pb ? fmtInr(pb.discount) : EMPTY_FIELD}</CustomerFieldRow>
                    <CustomerFieldRow label="GST">{pb ? fmtInr(pb.gst) : EMPTY_FIELD}</CustomerFieldRow>
                    <CustomerFieldRow label="Registration">{pb ? fmtInr(pb.registration_charges) : EMPTY_FIELD}</CustomerFieldRow>
                </div>
            </CustomerCollapsibleSection>

            <CustomerCollapsibleSection
                title="RERA & Legal"
                icon={LuGavel}
                tone="slate"
                open={sectionsOpen.reraLegal}
                onOpenChange={(o) => onSectionsOpenChange({ reraLegal: o })}
            >
                {hasReraData(project) ? (
                    <div className={fieldGrid}>
                        <CustomerFieldRow label="RERA Number">{displayValue(project?.rera_number)}</CustomerFieldRow>
                        <CustomerFieldRow label="Legal Status">{displayValue(project?.legal_status)}</CustomerFieldRow>
                        <CustomerFieldRow label="Registration Status">{displayValue(project?.registration_status)}</CustomerFieldRow>
                        <CustomerFieldRow label="Approval Authority">{displayValue(project?.approval_authority)}</CustomerFieldRow>
                    </div>
                ) : (
                    <p className="px-4 py-3 text-sm text-slate-600">Legal details will appear when linked to a project with RERA records.</p>
                )}
            </CustomerCollapsibleSection>

            <CustomerCollapsibleSection
                title="Media & Gallery"
                icon={LuImage}
                tone="blue"
                open={sectionsOpen.media}
                onOpenChange={(o) => onSectionsOpenChange({ media: o })}
            >
                <div className="space-y-3 p-3">
                    {media?.cover_image ? (
                        <div className="overflow-hidden rounded-lg border border-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={media.cover_image} alt="Cover" className="h-28 w-full object-cover" />
                        </div>
                    ) : null}
                    {(media?.gallery_images?.length ?? 0) > 0 ? (
                        <div className="grid grid-cols-4 gap-1.5">
                            {media!.gallery_images!.slice(0, 4).map((src, i) => (
                                <div key={i} className="overflow-hidden rounded-md border border-slate-200">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={src} alt="" className="h-16 w-full object-cover" />
                                </div>
                            ))}
                        </div>
                    ) : null}
                    <div className="flex flex-wrap gap-3 text-xs font-semibold">
                        {media?.master_plan && isImageMediaUrl(media.master_plan) ? (
                            <a href={media.master_plan} target="_blank" rel="noreferrer" className="text-[var(--cta-button-bg)] hover:underline">
                                Master plan
                            </a>
                        ) : null}
                        {media?.walkthrough_video && isVideoMediaUrl(media.walkthrough_video) ? (
                            <a href={media.walkthrough_video} target="_blank" rel="noreferrer" className="text-[var(--cta-button-bg)] hover:underline">
                                Walkthrough
                            </a>
                        ) : null}
                        {media?.floor_plan_pdf ? (
                            <span className="inline-flex items-center gap-1 text-slate-700">
                                <LuFileText size={12} />
                                {displayValue(media.floor_plan_pdf)}
                            </span>
                        ) : null}
                    </div>
                </div>
            </CustomerCollapsibleSection>
        </div>
    );
}

export const DEFAULT_CUSTOMER_PROPERTY_SECTIONS_OPEN: CustomerPropertySectionsOpen = {
    propertySummary: true,
    amenities: false,
    construction: true,
    bookingPayment: true,
    reraLegal: false,
    media: false,
};
