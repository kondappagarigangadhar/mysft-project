'use client';

import React from 'react';
import { EditableField, EditableSelect } from '@/components/leads/detail/InlineEditableSection';
import {
    INVENTORY_WORKFLOW_STATUSES,
    computeUnitPriceBreakdown,
    enrichUnitWithDefaults,
    type InventoryWorkflowStatus,
} from '@/lib/projectEnterpriseHelpers';
import { formatCurrencyINR, type InventoryUnit } from '@/lib/projectsInventoryStore';
import { cn } from '@/lib/utils';
import {
    LuCar,
    LuChartLine,
    LuFileText,
    LuGitBranch,
    LuLayers,
    LuLink,
    LuRuler,
    LuSparkles,
    LuUser,
} from 'react-icons/lu';
import {
    ProjectRecordCollapsibleSection,
    ProjectRecordFieldRow,
    YesNoBadge,
} from './project-view/ProjectRecordCollapsibleSection';

const EMPTY = '—';

export type UnitEnterpriseDraft = {
    carpet_area: string;
    built_up_area: string;
    super_built_up_area: string;
    balcony_area: string;
    terrace_area: string;
    uds_area: string;
    furnishing_status: string;
    view_type: string;
    corner_unit: string;
    balcony_count: string;
    washroom_count: string;
    smart_home_enabled: string;
    ventilation_rating: string;
    parking_type: string;
    parking_slot_number: string;
    parking_covered_open: string;
    parking_ev_charging: string;
    inventory_workflow_status: string;
    booking_customer: string;
    booking_id: string;
    booking_status: string;
    lead_source: string;
    assigned_salesperson: string;
    floor_rise_charges: string;
    registration_charges: string;
    parking_charges: string;
    clubhouse_charges: string;
    lock_reason: string;
    locked_by_user: string;
    lock_expiry: string;
    auto_unlock: string;
};

export function buildUnitEnterpriseDraft(u: InventoryUnit): UnitEnterpriseDraft {
    const e = enrichUnitWithDefaults(u);
    return {
        carpet_area: e.carpet_area != null ? String(e.carpet_area) : '',
        built_up_area: e.built_up_area != null ? String(e.built_up_area) : '',
        super_built_up_area: e.super_built_up_area != null ? String(e.super_built_up_area) : '',
        balcony_area: e.balcony_area != null ? String(e.balcony_area) : '',
        terrace_area: e.terrace_area != null ? String(e.terrace_area) : '',
        uds_area: e.uds_area != null ? String(e.uds_area) : '',
        furnishing_status: e.furnishing_status ?? '',
        view_type: e.view_type ?? '',
        corner_unit: e.corner_unit ? 'Yes' : 'No',
        balcony_count: e.balcony_count != null ? String(e.balcony_count) : '',
        washroom_count: e.washroom_count != null ? String(e.washroom_count) : '',
        smart_home_enabled: e.smart_home_enabled ? 'Yes' : 'No',
        ventilation_rating: e.ventilation_rating ?? '',
        parking_type: e.parking_type ?? '',
        parking_slot_number: e.parking_slot_number ?? '',
        parking_covered_open: e.parking_covered_open ?? '',
        parking_ev_charging: e.parking_ev_charging ? 'Yes' : 'No',
        inventory_workflow_status: e.inventory_workflow_status ?? 'Available',
        booking_customer: e.booking_customer ?? '',
        booking_id: e.booking_id ?? '',
        booking_status: e.booking_status ?? '',
        lead_source: e.lead_source ?? '',
        assigned_salesperson: e.assigned_salesperson ?? '',
        floor_rise_charges: e.floor_rise_charges != null ? String(e.floor_rise_charges) : '',
        registration_charges: e.registration_charges != null ? String(e.registration_charges) : '',
        parking_charges: e.parking_charges != null ? String(e.parking_charges) : '',
        clubhouse_charges: e.clubhouse_charges != null ? String(e.clubhouse_charges) : '',
        lock_reason: e.lock_reason ?? '',
        locked_by_user: e.locked_by_user ?? '',
        lock_expiry: e.lock_expiry ?? '',
        auto_unlock: e.auto_unlock !== false ? 'Yes' : 'No',
    };
}

export function unitEnterpriseDraftToPatch(draft: UnitEnterpriseDraft): Partial<InventoryUnit> {
    const num = (s: string) => {
        const n = Number(s.replace(/\D/g, ''));
        return Number.isFinite(n) ? n : undefined;
    };
    return {
        carpet_area: num(draft.carpet_area),
        built_up_area: num(draft.built_up_area),
        super_built_up_area: num(draft.super_built_up_area),
        balcony_area: num(draft.balcony_area),
        terrace_area: num(draft.terrace_area),
        uds_area: num(draft.uds_area),
        furnishing_status: draft.furnishing_status.trim() || undefined,
        view_type: draft.view_type.trim() || undefined,
        corner_unit: draft.corner_unit === 'Yes',
        balcony_count: num(draft.balcony_count),
        washroom_count: num(draft.washroom_count),
        smart_home_enabled: draft.smart_home_enabled === 'Yes',
        ventilation_rating: draft.ventilation_rating.trim() || undefined,
        parking_type: draft.parking_type.trim() || undefined,
        parking_slot_number: draft.parking_slot_number.trim() || undefined,
        parking_covered_open: draft.parking_covered_open.trim() || undefined,
        parking_ev_charging: draft.parking_ev_charging === 'Yes',
        inventory_workflow_status: draft.inventory_workflow_status,
        booking_customer: draft.booking_customer.trim() || undefined,
        booking_id: draft.booking_id.trim() || undefined,
        booking_status: draft.booking_status.trim() || undefined,
        lead_source: draft.lead_source.trim() || undefined,
        assigned_salesperson: draft.assigned_salesperson.trim() || undefined,
        floor_rise_charges: num(draft.floor_rise_charges),
        registration_charges: num(draft.registration_charges),
        parking_charges: num(draft.parking_charges),
        clubhouse_charges: num(draft.clubhouse_charges),
        lock_reason: draft.lock_reason.trim() || undefined,
        locked_by_user: draft.locked_by_user.trim() || undefined,
        lock_expiry: draft.lock_expiry.trim() || undefined,
        auto_unlock: draft.auto_unlock === 'Yes',
    };
}

type SectionOpen = {
    dimensions: boolean;
    features: boolean;
    parking: boolean;
    workflow: boolean;
    booking: boolean;
    priceBreakdown: boolean;
    unitDocs: boolean;
};

type Props = {
    unit: InventoryUnit;
    isInlineEditing: boolean;
    draft: UnitEnterpriseDraft;
    onDraftChange: <K extends keyof UnitEnterpriseDraft>(key: K, value: UnitEnterpriseDraft[K]) => void;
    changedByKey: Partial<Record<keyof UnitEnterpriseDraft, boolean>>;
    sectionsOpen: SectionOpen;
    onSectionsOpenChange: (next: SectionOpen) => void;
};

function WorkflowTimeline({ current }: { current: InventoryWorkflowStatus }) {
    const idx = INVENTORY_WORKFLOW_STATUSES.indexOf(current);
    return (
        <ol className="flex flex-wrap gap-1.5 p-3">
            {INVENTORY_WORKFLOW_STATUSES.map((status, i) => {
                const done = i <= idx;
                const active = i === idx;
                return (
                    <li
                        key={status}
                        className={cn(
                            'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                            active
                                ? 'bg-[var(--cta-button-bg)] text-white'
                                : done
                                  ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                                  : 'bg-gray-100 text-gray-500',
                        )}
                    >
                        {status}
                    </li>
                );
            })}
        </ol>
    );
}

export function InventoryEnterpriseSections({
    unit,
    isInlineEditing,
    draft,
    onDraftChange,
    changedByKey,
    sectionsOpen,
    onSectionsOpenChange,
}: Props) {
    const enriched = enrichUnitWithDefaults(unit);
    const breakdown = computeUnitPriceBreakdown({ ...unit, ...unitEnterpriseDraftToPatch(draft) });

    const demandTrend = enriched.demand_trend ?? [40, 48, 55, 61, 58, 67];
    const maxTrend = Math.max(...demandTrend, 1);

    return (
        <>
            <ProjectRecordCollapsibleSection
                title="UNIT DIMENSIONS"
                icon={LuRuler}
                tone="slate"
                open={sectionsOpen.dimensions}
                onOpenChange={(o) => onSectionsOpenChange({ ...sectionsOpen, dimensions: o })}
            >
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {(
                        [
                            ['carpet_area', 'Carpet area (sq.ft)'],
                            ['built_up_area', 'Built-up area'],
                            ['super_built_up_area', 'Super built-up'],
                            ['balcony_area', 'Balcony area'],
                            ['terrace_area', 'Terrace area'],
                            ['uds_area', 'UDS area'],
                        ] as const
                    ).map(([key, label]) => (
                        <ProjectRecordFieldRow key={key} label={label}>
                            <EditableField
                                isEditing={isInlineEditing}
                                isChanged={Boolean(changedByKey[key])}
                                value={draft[key]}
                                onChange={(v) => onDraftChange(key, v.replace(/\D/g, '').slice(0, 8))}
                                readValue={
                                    <span className="tabular-nums">
                                        {draft[key]?.trim()
                                            ? draft[key]
                                            : (() => {
                                                  const map: Record<typeof key, number | undefined> = {
                                                      carpet_area: enriched.carpet_area,
                                                      built_up_area: enriched.built_up_area,
                                                      super_built_up_area: enriched.super_built_up_area,
                                                      balcony_area: enriched.balcony_area,
                                                      terrace_area: enriched.terrace_area,
                                                      uds_area: enriched.uds_area,
                                                  };
                                                  const n = map[key];
                                                  return n != null ? String(n) : EMPTY;
                                              })()}
                                    </span>
                                }
                            />
                        </ProjectRecordFieldRow>
                    ))}
                </div>
            </ProjectRecordCollapsibleSection>

            <ProjectRecordCollapsibleSection
                title="UNIT FEATURES"
                icon={LuLayers}
                tone="blue"
                open={sectionsOpen.features}
                onOpenChange={(o) => onSectionsOpenChange({ ...sectionsOpen, features: o })}
            >
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <ProjectRecordFieldRow label="Furnishing">
                        <EditableSelect
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.furnishing_status)}
                            value={draft.furnishing_status}
                            onChange={(v) => onDraftChange('furnishing_status', v)}
                            options={['Unfurnished', 'Semi-furnished', 'Fully furnished']}
                            readValue={enriched.furnishing_status ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Facing">
                        <EditableField
                            isEditing={isInlineEditing}
                            value={unit.facing ?? ''}
                            onChange={() => {}}
                            readValue={unit.facing?.trim() ? unit.facing : EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="View type">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.view_type)}
                            value={draft.view_type}
                            onChange={(v) => onDraftChange('view_type', v)}
                            readValue={enriched.view_type ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Corner unit">
                        <EditableSelect
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.corner_unit)}
                            value={draft.corner_unit}
                            onChange={(v) => onDraftChange('corner_unit', v)}
                            options={['Yes', 'No']}
                            readValue={<YesNoBadge value={Boolean(enriched.corner_unit)} />}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Balconies">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.balcony_count)}
                            value={draft.balcony_count}
                            onChange={(v) => onDraftChange('balcony_count', v.replace(/\D/g, '').slice(0, 2))}
                            readValue={String(enriched.balcony_count ?? EMPTY)}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Washrooms">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.washroom_count)}
                            value={draft.washroom_count}
                            onChange={(v) => onDraftChange('washroom_count', v.replace(/\D/g, '').slice(0, 2))}
                            readValue={String(enriched.washroom_count ?? EMPTY)}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Smart home">
                        <EditableSelect
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.smart_home_enabled)}
                            value={draft.smart_home_enabled}
                            onChange={(v) => onDraftChange('smart_home_enabled', v)}
                            options={['Yes', 'No']}
                            readValue={<YesNoBadge value={Boolean(enriched.smart_home_enabled)} />}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Ventilation">
                        <EditableSelect
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.ventilation_rating)}
                            value={draft.ventilation_rating}
                            onChange={(v) => onDraftChange('ventilation_rating', v)}
                            options={['Excellent', 'Good', 'Average', 'Poor']}
                            readValue={enriched.ventilation_rating ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                </div>
            </ProjectRecordCollapsibleSection>

            <ProjectRecordCollapsibleSection
                title="PARKING DETAILS"
                icon={LuCar}
                tone="slate"
                open={sectionsOpen.parking}
                onOpenChange={(o) => onSectionsOpenChange({ ...sectionsOpen, parking: o })}
            >
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <ProjectRecordFieldRow label="Parking type">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.parking_type)}
                            value={draft.parking_type}
                            onChange={(v) => onDraftChange('parking_type', v)}
                            readValue={enriched.parking_type ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Slot number">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.parking_slot_number)}
                            value={draft.parking_slot_number}
                            onChange={(v) => onDraftChange('parking_slot_number', v)}
                            readValue={enriched.parking_slot_number?.trim() ? enriched.parking_slot_number : EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Covered / open">
                        <EditableSelect
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.parking_covered_open)}
                            value={draft.parking_covered_open}
                            onChange={(v) => onDraftChange('parking_covered_open', v)}
                            options={['Covered', 'Open']}
                            readValue={enriched.parking_covered_open ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="EV charging">
                        <EditableSelect
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.parking_ev_charging)}
                            value={draft.parking_ev_charging}
                            onChange={(v) => onDraftChange('parking_ev_charging', v)}
                            options={['Yes', 'No']}
                            readValue={<YesNoBadge value={Boolean(enriched.parking_ev_charging)} />}
                        />
                    </ProjectRecordFieldRow>
                </div>
            </ProjectRecordCollapsibleSection>

            <ProjectRecordCollapsibleSection
                title="INVENTORY WORKFLOW"
                icon={LuGitBranch}
                tone="amber"
                open={sectionsOpen.workflow}
                onOpenChange={(o) => onSectionsOpenChange({ ...sectionsOpen, workflow: o })}
            >
                {isInlineEditing ? (
                    <div className="p-3">
                        <EditableSelect
                            isEditing
                            isChanged={Boolean(changedByKey.inventory_workflow_status)}
                            value={draft.inventory_workflow_status}
                            onChange={(v) => onDraftChange('inventory_workflow_status', v)}
                            options={[...INVENTORY_WORKFLOW_STATUSES]}
                            readValue={enriched.inventory_workflow_status ?? EMPTY}
                        />
                    </div>
                ) : null}
                <WorkflowTimeline current={(enriched.inventory_workflow_status ?? 'Available') as InventoryWorkflowStatus} />
            </ProjectRecordCollapsibleSection>

            <ProjectRecordCollapsibleSection
                title="BOOKING RELATION"
                icon={LuLink}
                tone="blue"
                open={sectionsOpen.booking}
                onOpenChange={(o) => onSectionsOpenChange({ ...sectionsOpen, booking: o })}
            >
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {(
                        [
                            ['booking_customer', 'Current customer'],
                            ['booking_id', 'Booking ID'],
                            ['booking_status', 'Booking status'],
                            ['lead_source', 'Lead source'],
                            ['assigned_salesperson', 'Assigned salesperson'],
                        ] as const
                    ).map(([key, label]) => {
                        const bookingVal =
                            key === 'booking_customer'
                                ? enriched.booking_customer
                                : key === 'booking_id'
                                  ? enriched.booking_id
                                  : key === 'booking_status'
                                    ? enriched.booking_status
                                    : key === 'lead_source'
                                      ? enriched.lead_source
                                      : enriched.assigned_salesperson;
                        return (
                        <ProjectRecordFieldRow key={key} label={label}>
                            <EditableField
                                isEditing={isInlineEditing}
                                isChanged={Boolean(changedByKey[key])}
                                value={draft[key]}
                                onChange={(v) => onDraftChange(key, v)}
                                readValue={
                                    bookingVal?.trim() ? (
                                        <span className="inline-flex items-center gap-1 text-[var(--cta-button-bg)]">
                                            <LuUser size={14} aria-hidden />
                                            {bookingVal}
                                        </span>
                                    ) : (
                                        EMPTY
                                    )
                                }
                            />
                        </ProjectRecordFieldRow>
                        );
                    })}
                </div>
            </ProjectRecordCollapsibleSection>

            <ProjectRecordCollapsibleSection
                title="PRICE BREAKDOWN"
                icon={LuChartLine}
                tone="amber"
                open={sectionsOpen.priceBreakdown}
                onOpenChange={(o) => onSectionsOpenChange({ ...sectionsOpen, priceBreakdown: o })}
            >
                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                    {[
                        { label: 'Base price', value: breakdown.base_price, key: null },
                        { label: 'PLC', value: breakdown.plc_charges, key: null },
                        { label: 'Floor rise', value: breakdown.floor_rise_charges, key: 'floor_rise_charges' as const },
                        { label: 'GST', value: breakdown.gst, key: null },
                        { label: 'Registration', value: breakdown.registration_charges, key: 'registration_charges' as const },
                        { label: 'Parking', value: breakdown.parking_charges, key: 'parking_charges' as const },
                        { label: 'Clubhouse', value: breakdown.clubhouse_charges, key: 'clubhouse_charges' as const },
                        { label: 'Discount', value: breakdown.discount, key: null },
                        { label: 'Final sale value', value: breakdown.final_sale_value, key: null, highlight: true },
                    ].map((row) => (
                        <div
                            key={row.label}
                            className={cn(
                                'rounded-xl border px-3 py-2.5',
                                row.highlight
                                    ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] sm:col-span-3'
                                    : 'border-gray-100 bg-gray-50/70',
                            )}
                        >
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{row.label}</p>
                            {isInlineEditing && row.key ? (
                                <EditableField
                                    isEditing
                                    isChanged={Boolean(changedByKey[row.key])}
                                    value={draft[row.key]}
                                    onChange={(v) => onDraftChange(row.key!, v.replace(/\D/g, '').slice(0, 12))}
                                    readValue={formatCurrencyINR(row.value)}
                                />
                            ) : (
                                <p className={cn('mt-1 tabular-nums font-bold', row.highlight ? 'text-lg text-[var(--cta-button-bg)]' : 'text-gray-900')}>
                                    {formatCurrencyINR(row.value)}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </ProjectRecordCollapsibleSection>

            <ProjectRecordCollapsibleSection
                title="UNIT DOCUMENTS"
                icon={LuFileText}
                tone="slate"
                open={sectionsOpen.unitDocs}
                onOpenChange={(o) => onSectionsOpenChange({ ...sectionsOpen, unitDocs: o })}
            >
                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
                    {['Floor Plan', 'Unit Layout', 'Brochure', 'Legal Docs'].map((doc) => (
                        <div key={doc} className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-3 py-4 text-center">
                            <LuFileText className="mx-auto text-gray-400" size={20} aria-hidden />
                            <p className="mt-2 text-xs font-semibold text-gray-700">{doc}</p>
                            <p className="mt-1 text-[10px] text-gray-400">{isInlineEditing ? 'Upload on save' : 'Preview / download'}</p>
                        </div>
                    ))}
                </div>
            </ProjectRecordCollapsibleSection>
        </>
    );
}

export function InventoryLockEnhancements({
    unit,
    isInlineEditing,
    draft,
    onDraftChange,
    changedByKey,
}: Pick<Props, 'unit' | 'isInlineEditing' | 'draft' | 'onDraftChange' | 'changedByKey'>) {
    const enriched = enrichUnitWithDefaults(unit);
    return (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ProjectRecordFieldRow label="Locked by">
                    <EditableField
                        isEditing={isInlineEditing}
                        isChanged={Boolean(changedByKey.locked_by_user)}
                        value={draft.locked_by_user}
                        onChange={(v) => onDraftChange('locked_by_user', v)}
                        readValue={enriched.locked_by_user?.trim() ? enriched.locked_by_user : EMPTY}
                    />
                </ProjectRecordFieldRow>
                <ProjectRecordFieldRow label="Lock reason">
                    <EditableField
                        isEditing={isInlineEditing}
                        isChanged={Boolean(changedByKey.lock_reason)}
                        value={draft.lock_reason}
                        onChange={(v) => onDraftChange('lock_reason', v)}
                        readValue={enriched.lock_reason?.trim() ? enriched.lock_reason : EMPTY}
                    />
                </ProjectRecordFieldRow>
                <ProjectRecordFieldRow label="Lock expiry">
                    <EditableField
                        isEditing={isInlineEditing}
                        isChanged={Boolean(changedByKey.lock_expiry)}
                        value={draft.lock_expiry}
                        onChange={(v) => onDraftChange('lock_expiry', v)}
                        readValue={enriched.lock_expiry?.trim() ? enriched.lock_expiry : 'No expiry set'}
                    />
                </ProjectRecordFieldRow>
                <ProjectRecordFieldRow label="Auto unlock">
                    <EditableSelect
                        isEditing={isInlineEditing}
                        isChanged={Boolean(changedByKey.auto_unlock)}
                        value={draft.auto_unlock}
                        onChange={(v) => onDraftChange('auto_unlock', v)}
                        options={['Yes', 'No']}
                        readValue={<YesNoBadge value={enriched.auto_unlock !== false} />}
                    />
                </ProjectRecordFieldRow>
            </div>
            {(enriched.lock_activity?.length ?? 0) > 0 ? (
                <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Lock activity</p>
                    <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-gray-600">
                        {enriched.lock_activity!.slice(-5).reverse().map((a, i) => (
                            <li key={i} className="rounded-lg bg-gray-50 px-2 py-1.5">
                                <span className="font-semibold text-gray-800">{a.action}</span> · {a.user} · {a.at}
                                {a.note ? ` — ${a.note}` : ''}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}

export function InventoryDemandEnhancements({ unit }: { unit: InventoryUnit }) {
    const enriched = enrichUnitWithDefaults(unit);
    const demandTrend = enriched.demand_trend ?? [40, 48, 55, 61, 58, 67];
    const maxTrend = Math.max(...demandTrend, 1);

    return (
        <div className="grid grid-cols-1 gap-4 border-t border-gray-100 p-4 sm:grid-cols-2">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Demand trend</p>
                <div className="mt-2 flex h-16 items-end gap-1">
                    {demandTrend.map((v, i) => (
                        <div
                            key={i}
                            className="flex-1 rounded-t bg-[color-mix(in_srgb,var(--cta-button-bg)_70%,white)]"
                            style={{ height: `${Math.round((v / maxTrend) * 100)}%` }}
                            title={`${v}%`}
                        />
                    ))}
                </div>
            </div>
            <div className="space-y-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Booking prediction</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{enriched.booking_prediction_pct ?? 0}%</p>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pricing recommendation</p>
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-700">
                        <LuSparkles className="mt-0.5 shrink-0 text-violet-600" size={14} aria-hidden />
                        {enriched.pricing_recommendation?.trim() || 'Hold current pricing — demand stable for this configuration.'}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Fastest selling type</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{enriched.fastest_selling_unit_type ?? unit.configuration}</p>
                </div>
            </div>
        </div>
    );
}

export const DEFAULT_UNIT_ENTERPRISE_SECTIONS_OPEN = {
    dimensions: true,
    features: true,
    parking: true,
    workflow: true,
    booking: true,
    priceBreakdown: true,
    unitDocs: false,
};
