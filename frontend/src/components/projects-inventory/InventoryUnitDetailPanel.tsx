'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { EditableField, EditableSelect } from '@/components/leads/detail/InlineEditableSection';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InventoryStatusBadge } from '@/components/projects-inventory/InventoryStatusBadge';
import { InventorySyncLockingSection } from '@/components/projects-inventory/InventorySyncLockingSection';
import {
    computeDemandScorePercent,
    computeFinalUnitPrice,
    configurationOptionsForUnitType,
    duplicateUnit,
    formatCurrencyINR,
    getLeadDemandCountForProjectName,
    lockInventory,
    unlockInventory,
    updateUnit,
    type InventoryUnit,
    type Project,
    type UnitAvailabilityStatus,
    type UnitType,
} from '@/lib/projectsInventoryStore';
import { cn } from '@/lib/utils';
import {
    CTA_EDITING_BADGE,
    CTA_FLOW_LINK,
    CTA_UTILITY_BTN,
} from '@/lib/theme/ctaThemeClasses';
import {
    LuBan,
    LuBuilding2,
    LuCalendar,
    LuChevronDown,
    LuClock3,
    LuCopy,
    LuDownload,
    LuEllipsis,
    LuLayers,
    LuLock,
    LuMapPin,
    LuPackage,
    LuPencil,
    LuPrinter,
    LuShare2,
    LuSparkles,
    LuTag,
} from 'react-icons/lu';
import { WorkspaceUtilityToolbar, PROJECT_WORKSPACE_HELP } from '@/components/workspace-help';
import {
    buildUnitEnterpriseDraft,
    DEFAULT_UNIT_ENTERPRISE_SECTIONS_OPEN,
    InventoryDemandEnhancements,
    InventoryEnterpriseSections,
    InventoryLockEnhancements,
    unitEnterpriseDraftToPatch,
    type UnitEnterpriseDraft,
} from '@/components/projects-inventory/InventoryEnterpriseSections';

const EMPTY = '—';
const UNIT_TYPE_OPTIONS: UnitType[] = ['Plot', 'Apartment', 'Villa'];
const AVAILABILITY_OPTIONS: UnitAvailabilityStatus[] = ['available', 'reserved', 'sold', 'pending'];

type SectionTone = 'blue' | 'amber' | 'slate';

function initialsUnit(unitNumber: string) {
    const t = unitNumber.trim();
    if (t.length >= 2) return t.slice(0, 2).toUpperCase();
    return (t || 'U').slice(0, 2).toUpperCase();
}

function InlineCollapsibleSection({
    title,
    icon: Icon,
    tone,
    open,
    onOpenChange,
    headerRight,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: SectionTone;
    open: boolean;
    onOpenChange: (next: boolean) => void;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
}) {
    const toneClasses =
        tone === 'blue'
            ? {
                  head: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)]',
                  icon: 'text-[var(--cta-button-bg)]',
                  ring: 'ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]',
              }
            : tone === 'amber'
              ? { head: 'bg-amber-50/80', icon: 'text-amber-800', ring: 'ring-amber-100/80' }
              : { head: 'bg-slate-50/80', icon: 'text-slate-700', ring: 'ring-slate-200/70' };

    return (
        <section className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                className={cn(
                    'flex w-full items-center gap-2.5 border-b border-gray-100 px-3 py-2.5 text-left transition hover:bg-white/60',
                    toneClasses.head,
                )}
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
                <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-xs font-bold uppercase tracking-wider text-gray-700">{title}</span>
                        {headerRight ? <span className="ml-auto shrink-0">{headerRight}</span> : null}
                    </span>
                </span>
                <LuChevronDown className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
            </button>
            <div hidden={!open}>{children}</div>
        </section>
    );
}

function FieldRow({
    label,
    required,
    children,
    className,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50 md:odd:border-r md:odd:border-gray-100',
                className,
            )}
        >
            <div className="w-44 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <span className="inline-flex items-baseline gap-0.5">
                    {label}
                    {required ? (
                        <span className="text-rose-500" aria-hidden>
                            *
                        </span>
                    ) : null}
                </span>
            </div>
            <div className="flex w-full items-center gap-2 text-[15px] font-medium text-gray-900">
                <span className="text-gray-300" aria-hidden>
                    :
                </span>
                <span className="w-full min-w-0">{children}</span>
            </div>
        </div>
    );
}

type UnitInlineDraft = {
    unit_number: string;
    unit_type: UnitType;
    configuration: string;
    unit_size: string;
    price: string;
    offer_price: string;
    availability_status: UnitAvailabilityStatus;
    block_phase: string;
    tower_block: string;
    floor: string;
    facing: string;
    plc_charges: string;
    gst_tax_percent: string;
};

type UnitInlineErrorKey =
    | 'unit_number'
    | 'unit_type'
    | 'configuration'
    | 'unit_size'
    | 'price'
    | 'availability_status';

const UNIT_INLINE_FIELD_IDS: Record<UnitInlineErrorKey, string> = {
    unit_number: 'unit-inline-unit-number',
    unit_type: 'unit-inline-unit-type',
    configuration: 'unit-inline-configuration',
    unit_size: 'unit-inline-unit-size',
    price: 'unit-inline-price',
    availability_status: 'unit-inline-availability',
};

function buildUnitDraft(u: InventoryUnit): UnitInlineDraft {
    return {
        unit_number: u.unit_number ?? '',
        unit_type: u.unit_type,
        configuration: u.configuration ?? '',
        unit_size: Number.isFinite(u.unit_size) ? String(u.unit_size) : '',
        price: Number.isFinite(u.price) ? String(u.price) : '',
        offer_price: u.offer_price != null && Number.isFinite(u.offer_price) ? String(u.offer_price) : '',
        availability_status: u.availability_status,
        block_phase: u.block_phase ?? '',
        tower_block: u.tower_block ?? '',
        floor: u.floor ?? '',
        facing: u.facing ?? '',
        plc_charges: u.plc_charges != null ? String(u.plc_charges) : '',
        gst_tax_percent: u.gst_tax_percent != null ? String(u.gst_tax_percent) : '',
    };
}

const actionBtn =
    'inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md px-2.25 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]';

export type InventoryUnitDetailPanelProps = {
    unit: InventoryUnit;
    project?: Project;
    projectsCount: number;
    onInventoryMutated?: () => void;
    embedded?: boolean;
    /** When set with `embedded`, toolbar + dates span full width above a 2-column row (detail | sidebar). */
    embeddedSidebar?: React.ReactNode;
    /** When inline save or duplicate changes slug, parent should sync URL + selection. */
    onResolvedSlugChange?: (slug: string | null) => void;
};

export function InventoryUnitDetailPanel({
    unit,
    project,
    projectsCount,
    onInventoryMutated,
    embedded = false,
    embeddedSidebar,
    onResolvedSlugChange,
}: InventoryUnitDetailPanelProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [local, setLocal] = useState(unit);
    const [isLocking, setIsLocking] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);

    const [isInlineEditing, setIsInlineEditing] = useState(false);
    const [inlineDraft, setInlineDraft] = useState<UnitInlineDraft>(() => buildUnitDraft(unit));
    const [inlineBaseline, setInlineBaseline] = useState<UnitInlineDraft>(() => buildUnitDraft(unit));
    const [enterpriseDraft, setEnterpriseDraft] = useState<UnitEnterpriseDraft>(() => buildUnitEnterpriseDraft(unit));
    const [enterpriseBaseline, setEnterpriseBaseline] = useState<UnitEnterpriseDraft>(() => buildUnitEnterpriseDraft(unit));
    const [inlineErrors, setInlineErrors] = useState<Partial<Record<UnitInlineErrorKey, string>>>({});
    const [inlineSaving, setInlineSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err: boolean } | null>(null);

    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    const [sectionsOpen, setSectionsOpen] = useState({
        core: true,
        location: true,
        pricing: true,
        sync: true,
        demand: true,
        ...DEFAULT_UNIT_ENTERPRISE_SECTIONS_OPEN,
    });

    useEffect(() => {
        setLocal(unit);
        setEnterpriseDraft(buildUnitEnterpriseDraft(unit));
        setEnterpriseBaseline(buildUnitEnterpriseDraft(unit));
    }, [unit]);

    const demand = useMemo(() => {
        if (!project) return { leadDemandCount: 0, demandScore: 0, demandPrediction: 0 };
        const leadDemandCount = getLeadDemandCountForProjectName(project.project_name);
        const demandScore = computeDemandScorePercent(leadDemandCount, projectsCount);
        const demandPrediction = Math.max(0, Math.min(100, Math.round(demandScore * 0.9 + 6)));
        return { leadDemandCount, demandScore, demandPrediction };
    }, [project, projectsCount]);

    const finalPrice = useMemo(
        () =>
            computeFinalUnitPrice({
                basePrice: local.price,
                offerPrice: local.offer_price,
                plcCharges: local.plc_charges,
                gstPct: local.gst_tax_percent,
            }),
        [local.price, local.offer_price, local.plc_charges, local.gst_tax_percent],
    );

    const configOptions = useMemo(() => configurationOptionsForUnitType(inlineDraft.unit_type), [inlineDraft.unit_type]);

    const changedByKey = useMemo(() => {
        const next: Partial<Record<keyof UnitInlineDraft, boolean>> = {};
        (Object.keys(inlineDraft) as (keyof UnitInlineDraft)[]).forEach((k) => {
            next[k] = inlineDraft[k] !== inlineBaseline[k];
        });
        return next;
    }, [inlineDraft, inlineBaseline]);

    const enterpriseChangedByKey = useMemo(() => {
        const next: Partial<Record<keyof UnitEnterpriseDraft, boolean>> = {};
        (Object.keys(enterpriseDraft) as (keyof UnitEnterpriseDraft)[]).forEach((k) => {
            next[k] = enterpriseDraft[k] !== enterpriseBaseline[k];
        });
        return next;
    }, [enterpriseDraft, enterpriseBaseline]);

    const isInlineDirty = useMemo(
        () => Object.values(changedByKey).some(Boolean) || Object.values(enterpriseChangedByKey).some(Boolean),
        [changedByKey, enterpriseChangedByKey],
    );

    const afterMutate = useCallback(
        (next: InventoryUnit | undefined) => {
            if (next) {
                setLocal(next);
                if (next.slug !== unit.slug) {
                    onResolvedSlugChange?.(next.slug);
                }
            }
            onInventoryMutated?.();
        },
        [onInventoryMutated, onResolvedSlugChange, unit.slug],
    );

    const onInlineEditStart = useCallback(() => {
        const base = buildUnitDraft(local);
        const entBase = buildUnitEnterpriseDraft(local);
        setInlineBaseline(base);
        setInlineDraft(base);
        setEnterpriseBaseline(entBase);
        setEnterpriseDraft(entBase);
        setInlineErrors({});
        setInlineToast(null);
        setIsInlineEditing(true);
        setInlineSaving(false);
    }, [local]);

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        onInlineEditStart();
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, [searchParams, pathname, router, onInlineEditStart]);

    useEffect(() => {
        if (!isInlineEditing) return;
        const errs: Partial<Record<UnitInlineErrorKey, string>> = {};
        if (!inlineDraft.unit_number.trim()) errs.unit_number = 'Unit number is required';
        if (!inlineDraft.configuration.trim()) errs.configuration = 'Configuration is required';
        const sz = Number(inlineDraft.unit_size);
        if (!Number.isFinite(sz) || sz <= 0) errs.unit_size = 'Enter a positive area';
        const pr = Number(inlineDraft.price.replace(/\D/g, ''));
        if (!Number.isFinite(pr) || pr <= 0) errs.price = 'Enter a valid base price';
        setInlineErrors(errs);
    }, [isInlineEditing, inlineDraft.unit_number, inlineDraft.configuration, inlineDraft.unit_size, inlineDraft.price]);

    const onInlineDraftChange = <K extends keyof UnitInlineDraft>(key: K, value: UnitInlineDraft[K]) => {
        setInlineDraft((prev) => {
            let next: UnitInlineDraft = { ...prev, [key]: value };
            if (key === 'unit_type') {
                const opts = configurationOptionsForUnitType(value as UnitType);
                if (!opts.includes(prev.configuration)) {
                    next = { ...next, configuration: opts[0] ?? prev.configuration };
                }
            }
            return next;
        });
        setInlineErrors((prev) => {
            if (!prev[key as UnitInlineErrorKey]) return prev;
            const n = { ...prev };
            delete n[key as UnitInlineErrorKey];
            return n;
        });
    };

    const scrollToError = (key: UnitInlineErrorKey) => {
        const el = document.getElementById(UNIT_INLINE_FIELD_IDS[key]);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (el && 'focus' in el) (el as HTMLElement).focus();
    };

    const runValidation = (): Partial<Record<UnitInlineErrorKey, string>> => {
        const errs: Partial<Record<UnitInlineErrorKey, string>> = {};
        if (!inlineDraft.unit_number.trim()) errs.unit_number = 'Unit number is required';
        if (!inlineDraft.configuration.trim()) errs.configuration = 'Configuration is required';
        const sz = Number(inlineDraft.unit_size);
        if (!Number.isFinite(sz) || sz <= 0) errs.unit_size = 'Enter a positive area';
        const pr = Number(Number(inlineDraft.price.replace(/\D/g, '')));
        if (!Number.isFinite(pr) || pr <= 0) errs.price = 'Enter a valid base price';
        return errs;
    };

    const onInlineEditCancel = () => {
        setInlineDraft(inlineBaseline);
        setEnterpriseDraft(enterpriseBaseline);
        setInlineErrors({});
        setIsInlineEditing(false);
        setInlineToast(null);
    };

    const onInlineEditSave = async ({ exitAfter }: { exitAfter: boolean }): Promise<boolean> => {
        const errs = runValidation();
        setInlineErrors(errs);
        const first = Object.keys(errs)[0] as UnitInlineErrorKey | undefined;
        if (first) {
            requestAnimationFrame(() => scrollToError(first));
            setInlineToast({ msg: 'Please fix the highlighted fields.', err: true });
            return false;
        }

        const sz = Number(inlineDraft.unit_size);
        const pr = Number(inlineDraft.price.replace(/\D/g, ''));
        const offerRaw = inlineDraft.offer_price.trim();
        const offer = offerRaw ? Number(offerRaw.replace(/\D/g, '')) : undefined;
        const plcRaw = inlineDraft.plc_charges.trim();
        const plc = plcRaw ? Number(plcRaw.replace(/\D/g, '')) : undefined;
        const gstRaw = inlineDraft.gst_tax_percent.trim();
        const gst = gstRaw ? Number(gstRaw.replace(/\D/g, '')) : undefined;

        const patch: Parameters<typeof updateUnit>[1] = {
            unit_number: inlineDraft.unit_number.trim(),
            unit_type: inlineDraft.unit_type,
            configuration: inlineDraft.configuration.trim(),
            unit_size: sz,
            price: pr,
            offer_price: offer !== undefined && Number.isFinite(offer) ? offer : undefined,
            availability_status: inlineDraft.availability_status,
            block_phase: inlineDraft.block_phase.trim() || undefined,
            tower_block: inlineDraft.tower_block.trim() || undefined,
            floor: inlineDraft.floor.trim() || undefined,
            facing: inlineDraft.facing.trim() || undefined,
            plc_charges: plc !== undefined && Number.isFinite(plc) ? plc : undefined,
            gst_tax_percent: gst !== undefined && Number.isFinite(gst) ? gst : undefined,
            ...unitEnterpriseDraftToPatch(enterpriseDraft),
        };

        const baseline = inlineBaseline;
        const entBaseline = enterpriseBaseline;
        const dirty =
            patch.unit_number !== baseline.unit_number.trim() ||
            patch.unit_type !== baseline.unit_type ||
            patch.configuration !== baseline.configuration.trim() ||
            String(patch.unit_size) !== baseline.unit_size ||
            String(patch.price) !== baseline.price.replace(/\D/g, '') ||
            (patch.offer_price ?? '') !== (baseline.offer_price.replace(/\D/g, '') || '') ||
            patch.availability_status !== baseline.availability_status ||
            (patch.block_phase ?? '') !== baseline.block_phase.trim() ||
            (patch.tower_block ?? '') !== baseline.tower_block.trim() ||
            (patch.floor ?? '') !== baseline.floor.trim() ||
            (patch.facing ?? '') !== baseline.facing.trim() ||
            String(patch.plc_charges ?? '') !== baseline.plc_charges.replace(/\D/g, '') ||
            String(patch.gst_tax_percent ?? '') !== baseline.gst_tax_percent.replace(/\D/g, '') ||
            JSON.stringify(unitEnterpriseDraftToPatch(enterpriseDraft)) !== JSON.stringify(unitEnterpriseDraftToPatch(entBaseline));

        if (!dirty) {
            setIsInlineEditing(false);
            if (exitAfter && !embedded) router.push('/projects-inventory/inventory');
            return true;
        }

        setInlineSaving(true);
        try {
            const updated = updateUnit(local.slug, patch);
            if (!updated) {
                setInlineToast({ msg: 'Could not save (duplicate unit number or invalid data).', err: true });
                return false;
            }
            const nd = buildUnitDraft(updated);
            const entNd = buildUnitEnterpriseDraft(updated);
            setInlineDraft(nd);
            setInlineBaseline(nd);
            setEnterpriseDraft(entNd);
            setEnterpriseBaseline(entNd);
            setInlineErrors({});
            setIsInlineEditing(false);
            afterMutate(updated);
            setInlineToast({ msg: 'Unit updated.', err: false });
            if (exitAfter && !embedded) router.push('/projects-inventory/inventory');
            return true;
        } finally {
            setInlineSaving(false);
        }
    };

    const utilityBtn = CTA_UTILITY_BTN;

    const exportUnitJson = () => {
        const blob = new Blob([JSON.stringify(local, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safe =
            (local.slug || local.unit_number || 'unit')
                .toString()
                .trim()
                .replace(/[/\\?%*:|"<>]/g, '-')
                .replace(/\.+$/, '')
                .slice(0, 80) || 'unit';
        a.download = `${safe}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const onClone = () => {
        const copy = duplicateUnit(local.slug);
        if (!copy) {
            setInlineToast({ msg: 'Could not clone unit.', err: true });
            return;
        }
        setInlineToast({ msg: 'Unit cloned.', err: false });
        afterMutate(copy);
    };

    const onShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        try {
            if (navigator.share) {
                await navigator.share({ title: `Unit ${local.unit_number}`, url });
                return;
            }
        } catch {
            /* ignore */
        }
        setShareUrl(url);
        setShareModalOpen(true);
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareModalOpen(false);
        } catch {
            /* keep modal */
        }
    };

    const projectHref = project ? `/projects-inventory/projects/view/${encodeURIComponent(project.slug)}?tab=inventory` : null;

    const splitEmbeddedLayout = Boolean(embedded && embeddedSidebar);

    return (
        <div className={cn('flex min-w-0 flex-col', !splitEmbeddedLayout && 'gap-2 lg:gap-3')}>
            {inlineToast ? (
                <InlineToast message={inlineToast.msg} variant={inlineToast.err ? 'error' : 'success'} onDismiss={() => setInlineToast(null)} />
            ) : null}

            {!embedded ? (
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Unit {local.unit_number}
                        {project ? <span className="text-gray-500"> · {project.project_name}</span> : null}
                    </h1>
                    <p className="text-sm text-gray-500">Inventory record — inline edit, actions, and sync (same pattern as Leads view).</p>
                </div>
            ) : null}

            <div
                className={cn(
                    'text-sm text-gray-700',
                    splitEmbeddedLayout
                        ? 'w-full shrink-0 border-b border-gray-200 bg-gray-50/90 px-4 py-3 sm:px-5'
                        : 'rounded-md bg-gray-100 px-4 py-2',
                )}
            >
                <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3" role="toolbar" aria-label="Unit actions">
                        {!isInlineEditing ? (
                            <button
                                type="button"
                                onClick={onInlineEditStart}
                                disabled={inlineSaving}
                                className={cn(
                                    actionBtn,
                                    'bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] hover:bg-[var(--cta-button-hover-bg)] disabled:bg-gray-300 disabled:text-gray-600',
                                )}
                            >
                                <LuPencil size={16} className="shrink-0" aria-hidden />
                                <span className="whitespace-nowrap">Edit</span>
                            </button>
                        ) : (
                            <button type="button" disabled className={`${actionBtn} border border-slate-200 bg-white text-slate-400`}>
                                <LuPencil size={16} className="shrink-0" aria-hidden />
                                <span className="whitespace-nowrap">Editing</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClone}
                            disabled={inlineSaving || isInlineEditing}
                            className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100`}
                        >
                            <LuCopy size={16} className="shrink-0" aria-hidden />
                            <span className="whitespace-nowrap">Clone</span>
                        </button>
                        <button
                            type="button"
                            onClick={onShare}
                            disabled={inlineSaving || isInlineEditing}
                            className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100`}
                        >
                            <LuShare2 size={16} className="shrink-0" aria-hidden />
                            <span className="whitespace-nowrap">Share</span>
                        </button>
                        {local.inventory_lock_status ? (
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="cta"
                                className="h-10 gap-2 border-amber-200 text-amber-900"
                                disabled={isUnlocking || isInlineEditing}
                                onClick={async () => {
                                    setIsUnlocking(true);
                                    try {
                                        const next = unlockInventory(local.slug);
                                        afterMutate(next);
                                    } finally {
                                        setIsUnlocking(false);
                                    }
                                }}
                            >
                                Unblock unit
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="cta"
                                className="h-10 gap-2"
                                disabled={isLocking || isInlineEditing}
                                onClick={async () => {
                                    setIsLocking(true);
                                    try {
                                        const next = lockInventory(local.slug);
                                        afterMutate(next);
                                    } finally {
                                        setIsLocking(false);
                                    }
                                }}
                            >
                                <LuBan size={16} />
                                Block unit
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700"
                            disabled={local.availability_status === 'sold' || isInlineEditing}
                            onClick={() => {
                                if (!window.confirm(`Mark unit ${local.unit_number} as booked (sold)?`)) return;
                                const next = updateUnit(local.slug, { availability_status: 'sold' });
                                afterMutate(next);
                            }}
                        >
                            Mark booked
                        </Button>
                    </div>

                    <WorkspaceUtilityToolbar
                        help={PROJECT_WORKSPACE_HELP}
                        triggerLabel="Inventory unit workspace help"
                        onExport={exportUnitJson}
                        saving={inlineSaving}
                        isInlineEditing={isInlineEditing}
                    />
                </div>
            </div>

            <div
                className={cn(
                    'text-sm text-gray-700',
                    splitEmbeddedLayout
                        ? 'w-full shrink-0 border-b border-gray-200 bg-white px-4 py-2.5 sm:px-5'
                        : 'rounded-xl border border-gray-200/80 bg-gray-50/50 px-4 py-3 shadow-sm',
                )}
            >
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                    <span className="inline-flex items-center gap-2">
                        <LuCalendar size={14} className="text-gray-500" aria-hidden />
                        <span className="text-gray-600">Date Created</span>
                        <span className="font-medium text-gray-900">{local.created_at ?? EMPTY}</span>
                    </span>
                    <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                    <span className="inline-flex items-center gap-2">
                        <LuClock3 size={14} className="text-gray-500" aria-hidden />
                        <span className="text-gray-600">Last updated</span>
                        <span className="font-medium text-gray-900">{local.updated_at ?? EMPTY}</span>
                    </span>
                </div>
            </div>

            {(() => {
                const detailAndDemand = (
                    <>
                        <div
                            className={cn(
                                // No overflow-hidden here — it breaks sticky bottom bar (same as Leads overview card).
                                'flex min-h-0 min-w-0 flex-col rounded-xl border bg-white shadow-sm',
                                isInlineEditing ? cn('border-[color-mix(in_srgb,var(--cta-button-bg)_32%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]') : 'border-gray-200/80',
                            )}
                        >
                            <div className="min-w-0 bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                    <div className="flex min-w-0 gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-50 text-lg font-semibold text-gray-700 ring-1 ring-gray-200/80">
                            {initialsUnit(local.unit_number)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="truncate text-2xl font-semibold tracking-tight text-gray-900">Unit {local.unit_number}</h2>
                                {isInlineEditing ? (
                                    <span className={CTA_EDITING_BADGE}>Editing Mode</span>
                                ) : null}
                                <InventoryStatusBadge status={local.availability_status} />
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-500">
                                    ID <span className="font-medium text-gray-800">{local.unit_id}</span>
                                </span>
                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                    <LuLayers size={14} className="shrink-0 text-gray-400" aria-hidden />
                                    <span className="truncate font-medium text-gray-800">{local.configuration}</span>
                                </span>
                                {projectHref ? (
                                    <Link
                                        href={projectHref}
                                        className={cn('inline-flex min-w-0 items-center gap-1.5', CTA_FLOW_LINK)}
                                    >
                                        <LuBuilding2 size={14} className="shrink-0 text-[var(--cta-button-bg)]" aria-hidden />
                                        <span className="truncate font-medium">{project?.project_name}</span>
                                    </Link>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-gray-500">
                                        <LuBuilding2 size={14} aria-hidden />
                                        {EMPTY}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50/70 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Pricing snapshot</p>
                        <p className="mt-1 text-sm text-gray-700">
                            Base <strong className="tabular-nums text-gray-900">{formatCurrencyINR(local.price)}</strong>
                            {local.offer_price != null ? (
                                <>
                                    {' '}
                                    · Offer{' '}
                                    <strong className="tabular-nums text-gray-900">{formatCurrencyINR(local.offer_price)}</strong>
                                </>
                            ) : null}
                        </p>
                        <p className="mt-1 text-base font-bold tabular-nums text-[var(--cta-button-bg)]">{formatCurrencyINR(finalPrice)} final</p>
                    </div> */}

                    <div className={cn('mt-4 space-y-4', isInlineEditing && 'rounded-md bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] p-2')}>
                        <InlineCollapsibleSection
                            title="UNIT INFORMATION"
                            icon={LuPackage}
                            tone="blue"
                            open={sectionsOpen.core}
                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, core: o }))}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <FieldRow label="Unit ID">
                                    <span className="font-mono text-sm tracking-tight">{local.unit_id}</span>
                                </FieldRow>
                                <FieldRow label="Unit number" required>
                                    <EditableField
                                        id={UNIT_INLINE_FIELD_IDS.unit_number}
                                        isEditing={isInlineEditing}
                                        error={inlineErrors.unit_number}
                                        isChanged={Boolean(changedByKey.unit_number)}
                                        value={inlineDraft.unit_number}
                                        onChange={(v) => onInlineDraftChange('unit_number', v)}
                                        readValue={<span className="font-semibold text-gray-900">{local.unit_number}</span>}
                                    />
                                </FieldRow>
                                <FieldRow label="Unit type" required>
                                    <EditableSelect
                                        id={UNIT_INLINE_FIELD_IDS.unit_type}
                                        isEditing={isInlineEditing}
                                        error={inlineErrors.unit_type}
                                        isChanged={Boolean(changedByKey.unit_type)}
                                        value={inlineDraft.unit_type}
                                        onChange={(v) => onInlineDraftChange('unit_type', v as UnitType)}
                                        options={[...UNIT_TYPE_OPTIONS]}
                                        readValue={<span className="capitalize">{local.unit_type}</span>}
                                    />
                                </FieldRow>
                                <FieldRow label="Configuration" required>
                                    <EditableSelect
                                        id={UNIT_INLINE_FIELD_IDS.configuration}
                                        isEditing={isInlineEditing}
                                        error={inlineErrors.configuration}
                                        isChanged={Boolean(changedByKey.configuration)}
                                        value={inlineDraft.configuration}
                                        onChange={(v) => onInlineDraftChange('configuration', v)}
                                        options={configOptions}
                                        readValue={local.configuration}
                                    />
                                </FieldRow>
                                <FieldRow label="Area (sq.ft)" required>
                                    <EditableField
                                        id={UNIT_INLINE_FIELD_IDS.unit_size}
                                        isEditing={isInlineEditing}
                                        error={inlineErrors.unit_size}
                                        isChanged={Boolean(changedByKey.unit_size)}
                                        value={inlineDraft.unit_size}
                                        onChange={(v) => onInlineDraftChange('unit_size', v.replace(/\D/g, '').slice(0, 8))}
                                        readValue={<span className="tabular-nums">{local.unit_size}</span>}
                                    />
                                </FieldRow>
                                <FieldRow label="Availability" required>
                                    <EditableSelect
                                        id={UNIT_INLINE_FIELD_IDS.availability_status}
                                        isEditing={isInlineEditing}
                                        error={inlineErrors.availability_status}
                                        isChanged={Boolean(changedByKey.availability_status)}
                                        value={inlineDraft.availability_status}
                                        onChange={(v) => onInlineDraftChange('availability_status', v as UnitAvailabilityStatus)}
                                        options={[...AVAILABILITY_OPTIONS]}
                                        readValue={<InventoryStatusBadge status={local.availability_status} />}
                                    />
                                </FieldRow>
                            </div>
                        </InlineCollapsibleSection>

                        <InlineCollapsibleSection
                            title="LOCATION & BUILDING"
                            icon={LuMapPin}
                            tone="slate"
                            open={sectionsOpen.location}
                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, location: o }))}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <FieldRow label="Tower / block">
                                    <EditableField
                                        id="unit-inline-tower"
                                        isEditing={isInlineEditing}
                                        isChanged={Boolean(changedByKey.tower_block)}
                                        value={inlineDraft.tower_block}
                                        onChange={(v) => onInlineDraftChange('tower_block', v)}
                                        readValue={local.tower_block?.trim() ? local.tower_block : EMPTY}
                                    />
                                </FieldRow>
                                <FieldRow label="Floor">
                                    <EditableField
                                        id="unit-inline-floor"
                                        isEditing={isInlineEditing}
                                        isChanged={Boolean(changedByKey.floor)}
                                        value={inlineDraft.floor}
                                        onChange={(v) => onInlineDraftChange('floor', v)}
                                        readValue={local.floor?.trim() ? local.floor : EMPTY}
                                    />
                                </FieldRow>
                                <FieldRow label="Facing">
                                    <EditableField
                                        id="unit-inline-facing"
                                        isEditing={isInlineEditing}
                                        isChanged={Boolean(changedByKey.facing)}
                                        value={inlineDraft.facing}
                                        onChange={(v) => onInlineDraftChange('facing', v)}
                                        readValue={local.facing?.trim() ? local.facing : EMPTY}
                                    />
                                </FieldRow>
                                <FieldRow label="Block / phase" className="md:col-span-2">
                                    <EditableField
                                        id="unit-inline-block-phase"
                                        isEditing={isInlineEditing}
                                        isChanged={Boolean(changedByKey.block_phase)}
                                        value={inlineDraft.block_phase}
                                        onChange={(v) => onInlineDraftChange('block_phase', v)}
                                        readValue={local.block_phase?.trim() ? local.block_phase : EMPTY}
                                    />
                                </FieldRow>
                            </div>
                        </InlineCollapsibleSection>

                        <InlineCollapsibleSection
                            title="PRICING"
                            icon={LuTag}
                            tone="amber"
                            open={sectionsOpen.pricing}
                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, pricing: o }))}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <FieldRow label="Base price (₹)" required>
                                    <EditableField
                                        id={UNIT_INLINE_FIELD_IDS.price}
                                        isEditing={isInlineEditing}
                                        error={inlineErrors.price}
                                        isChanged={Boolean(changedByKey.price)}
                                        value={inlineDraft.price}
                                        onChange={(v) => onInlineDraftChange('price', v.replace(/\D/g, '').slice(0, 14))}
                                        readValue={<span className="tabular-nums font-medium">{formatCurrencyINR(local.price)}</span>}
                                    />
                                </FieldRow>
                                <FieldRow label="Offer price (₹)">
                                    <EditableField
                                        id="unit-inline-offer"
                                        isEditing={isInlineEditing}
                                        isChanged={Boolean(changedByKey.offer_price)}
                                        value={inlineDraft.offer_price}
                                        onChange={(v) => onInlineDraftChange('offer_price', v.replace(/\D/g, '').slice(0, 14))}
                                        readValue={
                                            local.offer_price != null ? (
                                                <span className="tabular-nums font-medium">{formatCurrencyINR(local.offer_price)}</span>
                                            ) : (
                                                EMPTY
                                            )
                                        }
                                    />
                                </FieldRow>
                                <FieldRow label="PLC charges (₹)">
                                    <EditableField
                                        id="unit-inline-plc"
                                        isEditing={isInlineEditing}
                                        isChanged={Boolean(changedByKey.plc_charges)}
                                        value={inlineDraft.plc_charges}
                                        onChange={(v) => onInlineDraftChange('plc_charges', v.replace(/\D/g, '').slice(0, 12))}
                                        readValue={
                                            local.plc_charges != null ? formatCurrencyINR(local.plc_charges) : EMPTY
                                        }
                                    />
                                </FieldRow>
                                <FieldRow label="GST / tax %">
                                    <EditableField
                                        id="unit-inline-gst"
                                        isEditing={isInlineEditing}
                                        isChanged={Boolean(changedByKey.gst_tax_percent)}
                                        value={inlineDraft.gst_tax_percent}
                                        onChange={(v) => onInlineDraftChange('gst_tax_percent', v.replace(/\D/g, '').slice(0, 3))}
                                        readValue={local.gst_tax_percent != null ? `${local.gst_tax_percent}%` : EMPTY}
                                    />
                                </FieldRow>
                                <FieldRow label="Final price (calc.)" className="md:col-span-2">
                                    <span className="text-base font-bold tabular-nums text-[var(--cta-button-bg)]">{formatCurrencyINR(finalPrice)}</span>
                                </FieldRow>
                            </div>
                        </InlineCollapsibleSection>

                        <InlineCollapsibleSection
                            title="INVENTORY SYNC & LOCKING"
                            icon={LuLock}
                            tone="slate"
                            open={sectionsOpen.sync}
                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, sync: o }))}
                        >
                            <div className="border-t border-gray-100 bg-white px-3 py-4">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <InventoryStatusBadge status={local.inventory_lock_status ? 'pending' : local.availability_status} />
                                    <p className="text-xs text-gray-500">Booking sync timestamps — same as unit forms.</p>
                                </div>
                                <InventorySyncLockingSection
                                    mode="existing"
                                    showTitleAndIntro={false}
                                    className="border-0 bg-transparent p-0 shadow-none"
                                    inventory_lock_status={local.inventory_lock_status}
                                    lock_timestamp={local.lock_timestamp}
                                    unlock_timestamp={local.unlock_timestamp}
                                    showDatetimePickers
                                />
                                <InventoryLockEnhancements
                                    unit={local}
                                    isInlineEditing={isInlineEditing}
                                    draft={enterpriseDraft}
                                    onDraftChange={(key, value) => setEnterpriseDraft((prev) => ({ ...prev, [key]: value }))}
                                    changedByKey={enterpriseChangedByKey}
                                />
                                <p className="mt-3 text-xs text-gray-500">
                                    <LuLock className="mr-1 inline" size={12} aria-hidden />
                                    Use <strong>Block unit</strong> in the toolbar for a fast hold; timestamps stay editable here.
                                </p>
                            </div>
                        </InlineCollapsibleSection>

                        <InventoryEnterpriseSections
                            unit={local}
                            isInlineEditing={isInlineEditing}
                            draft={enterpriseDraft}
                            onDraftChange={(key, value) => setEnterpriseDraft((prev) => ({ ...prev, [key]: value }))}
                            changedByKey={enterpriseChangedByKey}
                            sectionsOpen={{
                                dimensions: sectionsOpen.dimensions,
                                features: sectionsOpen.features,
                                parking: sectionsOpen.parking,
                                workflow: sectionsOpen.workflow,
                                booking: sectionsOpen.booking,
                                priceBreakdown: sectionsOpen.priceBreakdown,
                                unitDocs: sectionsOpen.unitDocs,
                            }}
                            onSectionsOpenChange={(next) => setSectionsOpen((s) => ({ ...s, ...next }))}
                        />
                    </div>

                    {isInlineEditing ? (
                        <div className="sticky bottom-0 z-30 mt-4 pb-1">
                            <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                                <div className="flex items-center gap-3">
                                    <p className="text-sm font-semibold text-gray-900">You have unsaved changes</p>
                                    {!isInlineDirty ? (
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                            Up to date
                                        </span>
                                    ) : null}
                                </div>
                                <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                                    <Button type="button" variant="companyOutline" size="cta" onClick={onInlineEditCancel} disabled={inlineSaving}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="cta"
                                        onClick={() => void onInlineEditSave({ exitAfter: false })}
                                        disabled={inlineSaving || !isInlineDirty}
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="company"
                                        size="cta"
                                        onClick={() => void onInlineEditSave({ exitAfter: true })}
                                        isLoading={inlineSaving}
                                        disabled={!isInlineDirty}
                                    >
                                        Save &amp; Exit
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
                            <button
                                type="button"
                                className="flex w-full items-center gap-2.5 border-b border-gray-100 bg-slate-50/80 px-3 py-2.5 text-left transition hover:bg-white/60"
                                aria-expanded={sectionsOpen.demand}
                                onClick={() => setSectionsOpen((s) => ({ ...s, demand: !s.demand }))}
                            >
                                <span
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/90 ring-1 ring-slate-200/70"
                                    aria-hidden
                                >
                                    <LuSparkles className="h-4 w-4 text-violet-700" />
                                </span>
                                <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Demand insights (project)
                                </span>
                                <LuChevronDown
                                    className={cn('h-4 w-4 text-gray-500 transition-transform', sectionsOpen.demand && 'rotate-180')}
                                    aria-hidden
                                />
                            </button>
                            <div
                                hidden={!sectionsOpen.demand}
                                className="border-t border-gray-100"
                            >
                                <div className="grid grid-cols-1 gap-6 border-b border-gray-100 p-4 sm:grid-cols-3 sm:p-5">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Lead demand count</p>
                                        <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{demand.leadDemandCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Demand score</p>
                                        <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{demand.demandScore}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Demand preview</p>
                                        <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--cta-button-bg)]">{demand.demandPrediction}%</p>
                                        <p className="mt-1 text-xs text-gray-500">Aligned with AI demand trend</p>
                                    </div>
                                </div>
                                <InventoryDemandEnhancements unit={local} />
                            </div>
                        </div>
                    </>
                );

                if (splitEmbeddedLayout) {
                    return (
                        <div className="grid min-w-0 grid-cols-1 lg:grid-cols-12 lg:divide-x lg:divide-gray-100">
                            <div className="order-2 flex min-h-0 min-w-0 flex-col gap-3 p-4 sm:gap-4 sm:p-5 lg:order-1 lg:col-span-8 xl:col-span-9">
                                {detailAndDemand}
                            </div>
                            <div className="order-1 flex min-h-0 min-w-0 flex-col bg-gray-50/40 lg:order-2 lg:col-span-4 xl:col-span-3">
                                {embeddedSidebar}
                            </div>
                        </div>
                    );
                }
                return detailAndDemand;
            })()}

            <Modal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                title="Share link"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setShareModalOpen(false)}>
                            Close
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={copyShareLink}>
                            Copy link
                        </Button>
                    </>
                }
            >
                <p className="mb-2 text-sm text-gray-600">Copy this URL to share this unit context.</p>
                <input
                    readOnly
                    value={shareUrl}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800"
                    onFocus={(e) => e.target.select()}
                />
            </Modal>
        </div>
    );
}
