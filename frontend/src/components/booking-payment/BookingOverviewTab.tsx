'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EditableDate, EditableField, EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import { Button } from '@/components/ui/Button';
import { BpStatusBadge, statusToTone } from '@/components/booking-payment/BpStatusBadge';
import {
    getAvailableUnitOptions,
    getBookingAssigneeOptions,
    getLeadOptions,
    getDocumentsForBooking,
    getBookingPaymentSummary,
    getProjectOptions,
    addBookingDocument,
    createBooking,
    deleteBooking,
    type BookingRecord,
} from '@/lib/bookingPaymentMockStore';
import { getLeadByLeadCode } from '@/lib/leadStore';
import { Modal } from '@/components/ui/Modal';
import {
    CTA_CARD_EDITING_RING,
    CTA_EDITING_BADGE,
    CTA_FLOW_LINK,
    CTA_FOCUS_VISIBLE_RING,
    CTA_LINK_UNDERLINE,
    CTA_SHADOW_SOFT,
    CTA_UTILITY_BTN,
} from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import {
    LuBuilding2,
    LuCalendar,
    LuChevronDown,
    LuClock3,
    LuCreditCard,
    LuDownload,
    LuFileText,
    LuLayers,
    LuMail,
    LuMapPin,
    LuPhone,
    LuPrinter,
    LuScale,
    LuTag,
    LuCopy,
    LuShare2,
    LuTrash2,
    LuPlus,
    LuUpload,
    LuUser,
} from 'react-icons/lu';
import { WorkspaceUtilityToolbar, BOOKING_WORKSPACE_HELP } from '@/components/workspace-help';

const EMPTY = '—';

type Tone = 'blue' | 'amber' | 'slate';

const actionBtn = `inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md px-2.25 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${CTA_FOCUS_VISIBLE_RING}`;

function InlineCollapsibleSection({
    title,
    icon: Icon,
    tone = 'slate',
    open,
    onOpenChange,
    headerRight,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: Tone;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
}) {
    const toneClasses =
        tone === 'blue'
            ? {
                  head: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]',
                  icon: 'text-[var(--cta-button-bg)]',
                  ring: 'ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]',
              }
            : tone === 'amber'
              ? { head: 'bg-amber-50/80', icon: 'text-amber-800', ring: 'ring-amber-100/80' }
              : { head: 'bg-slate-50/80', icon: 'text-slate-700', ring: 'ring-slate-200/70' };

    return (
        <section className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-none">
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                className={cn(
                    'flex w-full items-center gap-2.5 border-b border-gray-300 px-3 py-2 text-left',
                    'transition hover:brightness-[0.99]',
                    toneClasses.head,
                )}
            >
                <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/90 ring-1', toneClasses.ring)} aria-hidden>
                    <Icon className={cn('h-4 w-4', toneClasses.icon)} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold tracking-wide text-gray-800">{title}</span>
                        {headerRight ? <span className="ml-auto shrink-0">{headerRight}</span> : null}
                    </span>
                </span>
                <LuChevronDown className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
            </button>
            <div hidden={!open} className="bg-white">
                {children}
            </div>
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
                'flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5',
                'odd:bg-gray-50/50',
                className,
            )}
        >
            <div className="w-44 shrink-0 text-sm font-medium text-gray-500">
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

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
    const short = name.trim().slice(0, 2).toUpperCase();
    return short || '?';
}

export type BookingDraft = {
    leadId: string;
    assignedTo: string;
    customerName: string;
    phone: string;
    projectName: string;
    unitId: string;
    unitConfiguration: string;
    unitPrice: string;
    /** Optional: records first payment on create/edit. */
    advanceAmount: string;
    bookingDate: string;
    status: BookingRecord['status'] | '';
    dealPaymentMode: 'milestone' | 'direct' | '';
    notes: string;
};

type ErrKey = keyof Pick<
    BookingDraft,
    | 'leadId'
    | 'assignedTo'
    | 'customerName'
    | 'phone'
    | 'projectName'
    | 'unitId'
    | 'unitPrice'
    | 'bookingDate'
    | 'dealPaymentMode'
>;

export function BookingOverviewTab({
    booking,
    listHref,
    editHref,
    isEditing,
    isCreate,
    draft,
    errors,
    onDraftChange,
    onCancel,
    onSaveDraft,
    onSubmit,
    isSubmitting,
    showEditButton,
}: {
    booking: BookingRecord;
    listHref: string;
    editHref: string;
    isEditing: boolean;
    isCreate: boolean;
    draft: BookingDraft;
    errors: Partial<Record<ErrKey, string>>;
    onDraftChange: <K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) => void;
    onCancel?: () => void;
    onSaveDraft?: () => void;
    onSubmit?: () => void;
    isSubmitting?: boolean;
    showEditButton?: boolean;
}) {
    const router = useRouter();
    const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';

    const [sectionsOpen, setSectionsOpen] = React.useState({
        basic: true,
        customer: true,
        property: true,
        plan: true,
        compliance: true,
    });

    const requiredBasicErrors = ['leadId', 'assignedTo', 'customerName', 'phone'].filter((k) => Boolean(errors[k as ErrKey])).length;
    const requiredPropertyErrors = ['projectName', 'unitId', 'unitPrice', 'bookingDate'].filter((k) => Boolean(errors[k as ErrKey])).length;
    const requiredPlanErrors = ['dealPaymentMode'].filter((k) => Boolean(errors[k as ErrKey])).length;

    const assigneeOptions = React.useMemo(() => {
        const list = getBookingAssigneeOptions();
        if (list.length === 0) return ['Sales Team'];
        return list;
    }, []);

    const leadOptions = React.useMemo(() => getLeadOptions(), []);

    const projectOptions = React.useMemo(() => getProjectOptions(), []);

    const unitOptions = React.useMemo(() => {
        const project = (draft.projectName ?? '').trim();
        if (!project) return [];
        return getAvailableUnitOptions(project);
    }, [draft.projectName]);

    const unitIdOptions = React.useMemo(() => unitOptions.map((u) => u.id), [unitOptions]);

    const headerName = isCreate ? 'New booking' : booking.customerName?.trim() || booking.slug;
    const statusLabel = isCreate ? 'Pending' : booking.status;

    const [archiveOpen, setArchiveOpen] = React.useState(false);
    const [shareOpen, setShareOpen] = React.useState(false);
    const [shareUrl, setShareUrl] = React.useState('');

    const leadEmail = React.useMemo(() => {
        if (isCreate) return '';
        const lead = booking.leadId?.trim() ? getLeadByLeadCode(booking.leadId.trim()) : undefined;
        return lead?.email?.trim() || '';
    }, [booking.leadId, isCreate]);

    const paymentSummary = React.useMemo(() => {
        if (isCreate) return null;
        return getBookingPaymentSummary(booking.slug);
    }, [booking.slug, isCreate]);

    const hasPassportOnRecord = React.useMemo(() => {
        if (isCreate) return false;
        return getDocumentsForBooking(booking.slug).some((d) => /passport/i.test(d.fileName));
    }, [booking.slug, isCreate]);

    const kycDocs = React.useMemo(() => {
        if (isCreate) return [];
        return getDocumentsForBooking(booking.slug);
    }, [booking.slug, isCreate]);

    const hasAadhaarOnRecord = React.useMemo(() => kycDocs.some((d) => /aadhar|aadhaar/i.test(d.fileName)), [kycDocs]);
    const hasPanOnRecord = React.useMemo(() => kycDocs.some((d) => /\bpan\b/i.test(d.fileName)), [kycDocs]);
    const hasOtherKycOnRecord = React.useMemo(() => kycDocs.some((d) => /other|kyc/i.test(d.fileName)), [kycDocs]);

    const uploadKyc = React.useCallback(
        (slot: 'passport' | 'aadhaar' | 'pan' | 'other', file: File) => {
            if (isCreate) return;
            const name = file.name?.trim() || `${slot}.bin`;
            const tagged = `${slot}-${name}`;
            addBookingDocument(booking.slug, tagged, 'uploaded');
        },
        [booking.slug, isCreate],
    );

    return (
        <div className="flex w-full min-w-0 flex-col gap-2 sm:gap-3">
            {!isCreate ? (
                <>
                    <div className="mt-0 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-3" role="toolbar" aria-label="Booking actions">
                                {!isEditing ? (
                                    <Link
                                        href={editHref}
                                        className={`${actionBtn} bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] hover:bg-[var(--cta-button-hover-bg)] ${CTA_SHADOW_SOFT} ${isEditing ? 'pointer-events-none opacity-60' : ''}`}
                                        aria-disabled={isEditing}
                                    >
                                        <LuTag size={16} className="shrink-0" aria-hidden />
                                        <span className="whitespace-nowrap">Edit</span>
                                    </Link>
                                ) : (
                                    <span className={`${actionBtn} border border-slate-200 bg-white text-slate-400`}>
                                        <LuTag size={16} className="shrink-0" aria-hidden />
                                        <span className="whitespace-nowrap">Editing</span>
                                    </span>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        const copy = createBooking({
                                            leadId: booking.leadId,
                                            assignedTo: booking.assignedTo,
                                            customerName: booking.customerName,
                                            phone: booking.phone,
                                            projectName: booking.projectName,
                                            unitId: booking.unitId,
                                            unitConfiguration: booking.unitConfiguration ?? '',
                                            unitPrice: booking.unitPrice,
                                            bookingDate: booking.bookingDate,
                                            status: 'Pending',
                                            dealPaymentMode: booking.dealPaymentMode ?? 'milestone',
                                            notes: booking.notes ?? '',
                                        });
                                        router.push(`/company-admin/booking-payment/booking/view/${encodeURIComponent(copy.slug)}`);
                                    }}
                                    disabled={isEditing}
                                    className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100 disabled:opacity-60`}
                                >
                                    <LuCopy size={16} className="shrink-0" aria-hidden />
                                    <span className="whitespace-nowrap">Clone</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        const url = typeof window !== 'undefined' ? window.location.href : '';
                                        try {
                                            if (navigator.share) {
                                                await navigator.share({ title: `${booking.customerName} · Booking`, url });
                                                return;
                                            }
                                        } catch {
                                            /* ignore */
                                        }
                                        setShareUrl(url);
                                        setShareOpen(true);
                                    }}
                                    disabled={isEditing}
                                    className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100 disabled:opacity-60`}
                                >
                                    <LuShare2 size={16} className="shrink-0" aria-hidden />
                                    <span className="whitespace-nowrap">Share</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setArchiveOpen(true)}
                                    disabled={isEditing}
                                    className={`${actionBtn} border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-60`}
                                >
                                    <LuTrash2 size={16} className="shrink-0" aria-hidden />
                                    <span className="whitespace-nowrap">Archive</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => router.push('/company-admin/booking-payment/booking/view/new')}
                                    disabled={isEditing}
                                    className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100 disabled:opacity-60`}
                                >
                                    <LuPlus size={16} className="shrink-0" aria-hidden />
                                    <span className="whitespace-nowrap">New</span>
                                </button>
                            </div>

                            <WorkspaceUtilityToolbar
                                help={BOOKING_WORKSPACE_HELP}
                                triggerLabel="Booking workspace help"
                                email={leadEmail ?? undefined}
                                onExport={() => {
                                    const blob = new Blob([JSON.stringify(booking, null, 2)], {
                                        type: 'application/json;charset=utf-8',
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    const safe =
                                        (booking.slug || booking.customerName || 'booking')
                                            .toString()
                                            .trim()
                                            .replace(/[/\\?%*:|"<>]/g, '-')
                                            .replace(/\.+$/, '')
                                            .slice(0, 80) || 'booking';
                                    a.download = `${safe}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                isInlineEditing={isEditing}
                                disabled={isEditing}
                            />
                        </div>
                    </div>

                    <div className="mt-0 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                        <div className="flex justify-center flex-wrap items-center gap-x-6 gap-y-1">
                            <span className="inline-flex items-center gap-2">
                                <LuCalendar size={14} className="text-gray-500" aria-hidden />
                                <span className="text-gray-600">Date Created</span>
                                <span className="font-medium text-gray-900">{booking.created_at?.slice(0, 10) || EMPTY}</span>
                            </span>
                            <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                            <span className="inline-flex items-center gap-2">
                                <LuClock3 size={14} className="text-gray-500" aria-hidden />
                                <span className="text-gray-600">Last updated</span>
                                <span className="font-medium text-gray-900">{booking.updated_at?.slice(0, 10) || EMPTY}</span>
                            </span>
                        </div>
                    </div>
                </>
            ) : null}
            <Modal
                isOpen={archiveOpen}
                onClose={() => setArchiveOpen(false)}
                title="Archive booking"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setArchiveOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={() => {
                                setArchiveOpen(false);
                                const res = deleteBooking(booking.slug);
                                if (res.ok) router.push(listHref);
                            }}
                        >
                            Archive
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Archive <span className="font-semibold text-slate-900">{booking.customerName}</span>? This removes the booking from your active
                    list.
                </p>
            </Modal>

            <Modal
                isOpen={shareOpen}
                onClose={() => setShareOpen(false)}
                title="Share link"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setShareOpen(false)}>
                            Close
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(shareUrl);
                                    setShareOpen(false);
                                } catch {
                                    /* keep modal open */
                                }
                            }}
                        >
                            Copy link
                        </Button>
                    </>
                }
            >
                <p className="mb-2 text-sm text-slate-600">Copy this URL to share this booking record.</p>
                <input
                    readOnly
                    value={shareUrl}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800"
                    onFocus={(e) => e.target.select()}
                />
            </Modal>

            <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
                <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-span-2">
                    <div
                        className={cn(
                            'flex min-h-0 min-w-0 flex-col rounded-xl border bg-white shadow-sm',
                            isEditing ? CTA_CARD_EDITING_RING : 'border-gray-200/80',
                        )}
                    >
                        <div className="px-4 py-4 sm:px-5 sm:py-5 bg-[#7185a217]">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                <div className="flex min-w-0 gap-4">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-50 text-lg font-semibold text-gray-700 ring-1 ring-gray-200/80">
                                        {initials(headerName)}
                                    </div>
                                    <div className="min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="truncate text-2xl font-semibold tracking-tight text-gray-900">{headerName}</h2>
                                            {isEditing ? (
                                                <span className={CTA_EDITING_BADGE}>
                                                    {isCreate ? 'Create Mode' : 'Editing Mode'}
                                                </span>
                                            ) : null}
                                            <BpStatusBadge tone={statusToTone(statusLabel as BookingRecord['status'])}>
                                                {statusLabel}
                                            </BpStatusBadge>
                                        </div>
                                        {!isCreate ? (
                                            <p className="text-xs text-gray-500">
                                                <Link href={listHref} className={CTA_FLOW_LINK}>
                                                    Booking list
                                                </Link>
                                                <span className="mx-1.5 text-gray-300">·</span>
                                                <span className="font-mono text-gray-600">{booking.slug}</span>
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <InlineCollapsibleSection
                            title="BOOKING INFORMATION"
                            icon={LuTag}
                            tone="blue"
                            open={sectionsOpen.basic}
                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, basic: o }))}
                            headerRight={
                                isEditing && requiredBasicErrors > 0 ? (
                                    <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                        {requiredBasicErrors} field{requiredBasicErrors === 1 ? '' : 's'} required
                                    </span>
                                ) : null
                            }
                        >
                            <div className={fieldGrid}>
                                <FieldRow label="Lead ID" required>
                                    <EditableSelect
                                        isEditing={isEditing}
                                        error={errors.leadId}
                                        value={draft.leadId}
                                        onChange={(v) => {
                                            onDraftChange('leadId', v);
                                            const lead = getLeadByLeadCode(v);
                                            if (lead) {
                                                onDraftChange('assignedTo', (lead.assignedTo?.trim() || 'Sales Team') as any);
                                                onDraftChange('customerName', (lead.name?.trim() || '') as any);
                                                onDraftChange('phone', (lead.phone?.replace(/\D/g, '').slice(0, 15) || '') as any);
                                                const project = lead.project?.trim() || '';
                                                if (project) onDraftChange('projectName', project as any);
                                            }
                                        }}
                                        options={leadOptions.map((l) => l.id)}
                                        placeholder="Select lead"
                                        readValue={<span className="font-mono text-sm tracking-tight text-gray-900">{booking.leadId || EMPTY}</span>}
                                    />
                                </FieldRow>
                                <FieldRow label="Assigned to" required>
                                    <EditableSelect
                                        isEditing={isEditing}
                                        error={errors.assignedTo}
                                        value={draft.assignedTo}
                                        onChange={(v) => onDraftChange('assignedTo', v)}
                                        options={assigneeOptions}
                                        placeholder="Select owner"
                                        readValue={booking.assignedTo || EMPTY}
                                    />
                                </FieldRow>
                                <FieldRow label="Customer name" required className="xl:col-span-2">
                                    <EditableField
                                        isEditing={isEditing}
                                        error={errors.customerName}
                                        value={draft.customerName}
                                        onChange={(v) => onDraftChange('customerName', v)}
                                        placeholder="Customer name"
                                        readValue={<span className="text-base font-semibold text-gray-900">{booking.customerName || EMPTY}</span>}
                                    />
                                </FieldRow>
                                <FieldRow label="Phone" required className="xl:col-span-2">
                                    <EditableField
                                        isEditing={isEditing}
                                        error={errors.phone}
                                        value={draft.phone}
                                        onChange={(v) => onDraftChange('phone', v.replace(/\D/g, '').slice(0, 15))}
                                        placeholder="10–15 digits"
                                        readValue={
                                            booking.phone?.trim() ? (
                                                <a
                                                    href={`tel:${booking.phone.replace(/\s/g, '')}`}
                                                    className={cn('font-mono', CTA_LINK_UNDERLINE)}
                                                >
                                                    {booking.phone}
                                                </a>
                                            ) : (
                                                EMPTY
                                            )
                                        }
                                    />
                                </FieldRow>
                            </div>
                        </InlineCollapsibleSection>

                        <InlineCollapsibleSection
                            title="PROPERTY DETAILS"
                            icon={LuBuilding2}
                            tone="slate"
                            open={sectionsOpen.property}
                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, property: o }))}
                            headerRight={
                                isEditing && requiredPropertyErrors > 0 ? (
                                    <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                        {requiredPropertyErrors} field{requiredPropertyErrors === 1 ? '' : 's'} required
                                    </span>
                                ) : null
                            }
                        >
                            <div className={fieldGrid}>
                                <FieldRow label="Project" required>
                                    <EditableSelect
                                        isEditing={isEditing}
                                        error={errors.projectName}
                                        value={draft.projectName}
                                        onChange={(v) => {
                                            onDraftChange('projectName', v);
                                            onDraftChange('unitId', '' as any);
                                            onDraftChange('unitConfiguration', '' as any);
                                            onDraftChange('unitPrice', '' as any);
                                        }}
                                        options={projectOptions}
                                        placeholder="Select project"
                                        readValue={booking.projectName || EMPTY}
                                    />
                                </FieldRow>
                                <FieldRow label="Unit ID" required>
                                    <EditableSelect
                                        isEditing={isEditing}
                                        error={errors.unitId}
                                        value={draft.unitId}
                                        onChange={(v) => {
                                            onDraftChange('unitId', v);
                                            const u = unitOptions.find((x) => x.id === v);
                                            if (u) {
                                                onDraftChange('unitPrice', String(u.price) as any);
                                                onDraftChange('unitConfiguration', u.configuration as any);
                                            }
                                        }}
                                        options={unitIdOptions}
                                        placeholder={draft.projectName?.trim() ? 'Select unit' : 'Select project first'}
                                        readValue={<span className="font-mono text-sm tracking-tight">{booking.unitId || EMPTY}</span>}
                                    />
                                </FieldRow>
                                <FieldRow label="Configuration (BHK)">
                                    <EditableField
                                        isEditing={isEditing}
                                        value={draft.unitConfiguration}
                                        onChange={(v) => onDraftChange('unitConfiguration', v)}
                                        placeholder="e.g. 2 BHK"
                                        readValue={booking.unitConfiguration?.trim() || EMPTY}
                                    />
                                </FieldRow>
                                <FieldRow label="Unit price (₹)" required>
                                    <EditableField
                                        isEditing={isEditing}
                                        error={errors.unitPrice}
                                        value={draft.unitPrice}
                                        onChange={(v) => onDraftChange('unitPrice', v.replace(/\D/g, '').slice(0, 12) as any)}
                                        placeholder="e.g. 6200000"
                                        readValue={
                                            booking.unitPrice ? (
                                                <span className="font-semibold tabular-nums">₹{booking.unitPrice.toLocaleString('en-IN')}</span>
                                            ) : (
                                                EMPTY
                                            )
                                        }
                                    />
                                </FieldRow>
                                <FieldRow label="Booking date" required>
                                    <EditableDate
                                        isEditing={isEditing}
                                        error={errors.bookingDate}
                                        value={draft.bookingDate}
                                        onChange={(v) => onDraftChange('bookingDate', v)}
                                        readValue={<span className="tabular-nums">{booking.bookingDate?.slice(0, 10) || EMPTY}</span>}
                                    />
                                </FieldRow>
                                <FieldRow label="Status">
                                    <EditableSelect
                                        isEditing={isEditing && !isCreate}
                                        value={draft.status || booking.status}
                                        onChange={(v) => onDraftChange('status', v as any)}
                                        options={['Pending', 'Confirmed', 'Cancelled']}
                                        readValue={<BpStatusBadge tone={statusToTone(booking.status)}>{booking.status}</BpStatusBadge>}
                                    />
                                </FieldRow>
                            </div>
                        </InlineCollapsibleSection>

                        <InlineCollapsibleSection
                            title="PAYMENT PLAN"
                            icon={LuCreditCard}
                            tone="amber"
                            open={sectionsOpen.plan}
                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, plan: o }))}
                            headerRight={
                                isEditing && requiredPlanErrors > 0 ? (
                                    <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                        {requiredPlanErrors} field required
                                    </span>
                                ) : null
                            }
                        >
                            <div className={fieldGrid}>
                                <FieldRow label="Buyer payment plan" required className="xl:col-span-2">
                                    <EditableSelect
                                        isEditing={isEditing}
                                        error={errors.dealPaymentMode}
                                        value={draft.dealPaymentMode}
                                        onChange={(v) => onDraftChange('dealPaymentMode', v as any)}
                                        options={['milestone', 'direct']}
                                        placeholder="Select plan"
                                        readValue={
                                            booking.dealPaymentMode === 'direct'
                                                ? 'Direct (lump payments)'
                                                : 'Milestone (installment schedule)'
                                        }
                                    />
                                </FieldRow>
                                <FieldRow label="Advance payment (₹)" className="xl:col-span-2">
                                    <EditableField
                                        isEditing={isEditing}
                                        value={draft.advanceAmount}
                                        onChange={(v) => onDraftChange('advanceAmount', v.replace(/\D/g, '').slice(0, 12) as any)}
                                        placeholder="Optional"
                                        readValue={<span className="text-gray-600">{EMPTY}</span>}
                                    />
                                </FieldRow>
                            </div>
                        </InlineCollapsibleSection>

                        <InlineCollapsibleSection
                            title="KYC & COMPLIANCE"
                            icon={LuScale}
                            tone="slate"
                            open={sectionsOpen.compliance}
                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, compliance: o }))}
                        >
                            <div className="rounded-lg border border-gray-200/80">
                                <FieldRow label="Passport on file">
                                    <span className={cn('text-sm font-semibold', hasPassportOnRecord ? 'text-emerald-700' : 'text-rose-700')}>
                                        {hasPassportOnRecord ? 'Yes' : 'No'}
                                    </span>
                                    <span className="ml-auto shrink-0">
                                        {!isCreate ? (
                                            <label className={cn(CTA_UTILITY_BTN, 'cursor-pointer')}>
                                                <LuUpload size={16} aria-hidden />
                                                Upload
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        e.target.value = '';
                                                        if (!f) return;
                                                        uploadKyc('passport', f);
                                                    }}
                                                />
                                            </label>
                                        ) : (
                                            <span className={cn(CTA_UTILITY_BTN, 'opacity-50 cursor-not-allowed')}>
                                                <LuUpload size={16} aria-hidden />
                                                Upload
                                            </span>
                                        )}
                                    </span>
                                </FieldRow>
                                <FieldRow label="Aadhaar on file">
                                    <span className={cn('text-sm font-semibold', hasAadhaarOnRecord ? 'text-emerald-700' : 'text-rose-700')}>
                                        {hasAadhaarOnRecord ? 'Yes' : 'No'}
                                    </span>
                                    <span className="ml-auto shrink-0">
                                        {!isCreate ? (
                                            <label className={cn(CTA_UTILITY_BTN, 'cursor-pointer')}>
                                                <LuUpload size={16} aria-hidden />
                                                Upload
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        e.target.value = '';
                                                        if (!f) return;
                                                        uploadKyc('aadhaar', f);
                                                    }}
                                                />
                                            </label>
                                        ) : (
                                            <span className={cn(CTA_UTILITY_BTN, 'opacity-50 cursor-not-allowed')}>
                                                <LuUpload size={16} aria-hidden />
                                                Upload
                                            </span>
                                        )}
                                    </span>
                                </FieldRow>
                                <FieldRow label="PAN on file">
                                    <span className={cn('text-sm font-semibold', hasPanOnRecord ? 'text-emerald-700' : 'text-rose-700')}>
                                        {hasPanOnRecord ? 'Yes' : 'No'}
                                    </span>
                                    <span className="ml-auto shrink-0">
                                        {!isCreate ? (
                                            <label className={cn(CTA_UTILITY_BTN, 'cursor-pointer')}>
                                                <LuUpload size={16} aria-hidden />
                                                Upload
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        e.target.value = '';
                                                        if (!f) return;
                                                        uploadKyc('pan', f);
                                                    }}
                                                />
                                            </label>
                                        ) : (
                                            <span className={cn(CTA_UTILITY_BTN, 'opacity-50 cursor-not-allowed')}>
                                                <LuUpload size={16} aria-hidden />
                                                Upload
                                            </span>
                                        )}
                                    </span>
                                </FieldRow>
                                <FieldRow label="Other KYC file">
                                    <span className={cn('text-sm font-semibold', hasOtherKycOnRecord ? 'text-emerald-700' : 'text-gray-600')}>
                                        {hasOtherKycOnRecord ? 'Uploaded' : 'Optional'}
                                    </span>
                                    <span className="ml-auto shrink-0">
                                        {!isCreate ? (
                                            <label className={cn(CTA_UTILITY_BTN, 'cursor-pointer')}>
                                                <LuUpload size={16} aria-hidden />
                                                Upload
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        e.target.value = '';
                                                        if (!f) return;
                                                        uploadKyc('other', f);
                                                    }}
                                                />
                                            </label>
                                        ) : (
                                            <span className={cn(CTA_UTILITY_BTN, 'opacity-50 cursor-not-allowed')}>
                                                <LuUpload size={16} aria-hidden />
                                                Upload
                                            </span>
                                        )}
                                    </span>
                                </FieldRow>
                                <FieldRow label="KYC notes" className="border-b-0">
                                    <EditableTextarea
                                        isEditing={isEditing}
                                        value={draft.notes}
                                        onChange={(v) => onDraftChange('notes', v)}
                                        rows={4}
                                        placeholder="KYC/compliance notes (optional)…"
                                        readValue={
                                            booking.notes?.trim() ? (
                                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-gray-800">
                                                    {booking.notes.trim()}
                                                </p>
                                            ) : (
                                                <span className="text-gray-500">No notes</span>
                                            )
                                        }
                                    />
                                </FieldRow>
                            </div>
                        </InlineCollapsibleSection>
                    </div>

                    {isEditing ? (
                        <div className="sticky bottom-0 z-30 mt-4 pb-1">
                            <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                                <div className="flex items-center gap-3">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {isCreate ? 'Create booking to enable related sections' : 'You have unsaved changes'}
                                    </p>
                                </div>
                                <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="cta"
                                        onClick={onCancel ?? (() => router.push(listHref))}
                                        disabled={Boolean(isSubmitting)}
                                    >
                                        Cancel
                                    </Button>
                                    {isCreate ? (
                                        <Button
                                            type="button"
                                            variant="companyOutline"
                                            size="cta"
                                            onClick={onSaveDraft}
                                            disabled={Boolean(isSubmitting)}
                                        >
                                            Save Draft
                                        </Button>
                                    ) : null}
                                    <Button
                                        type="button"
                                        variant="company"
                                        size="cta"
                                        onClick={onSubmit}
                                        isLoading={Boolean(isSubmitting)}
                                        disabled={Boolean(isSubmitting)}
                                    >
                                        {isCreate ? (isSubmitting ? 'Creating...' : 'Create Booking') : isSubmitting ? 'Saving...' : 'Save'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                <aside className="min-w-0 lg:sticky lg:top-44 lg:self-start">
                    {isCreate ? (
                        <div>
                            <p className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                                Available after booking is created
                            </p>
                            <div className="opacity-50 pointer-events-none">
                                <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-gray-900">AI &amp; Insights</p>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Create booking to unlock payment insights and reminders.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-gray-200/80 bg-[#7185a217] shadow-sm">
                                <div className="divide-y divide-gray-100">
                                    <div className="p-4 sm:p-5">
                                        <div className="mb-2 flex items-center gap-2">
                                            <LuMapPin className="text-[var(--cta-button-bg)]" size={18} aria-hidden />
                                            <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium text-gray-800">Project:</span>{' '}
                                            {booking.projectName?.trim() || EMPTY}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-600">
                                            <span className="font-medium text-gray-800">Unit:</span> {booking.unitId || EMPTY}
                                        </p>
                                    </div>
                                    <div className="p-4 sm:p-5">
                                        <div className="mb-2 flex items-center gap-2">
                                            <LuCreditCard className="text-violet-600" size={18} aria-hidden />
                                            <h3 className="text-sm font-semibold text-gray-900">Payments</h3>
                                        </div>
                                        {paymentSummary ? (
                                            <>
                                                <p className="text-xs text-gray-500">Collected</p>
                                                <p className="text-2xl font-bold tabular-nums text-gray-900">
                                                    ₹{paymentSummary.paidCompleted.toLocaleString('en-IN')}
                                                </p>
                                                <p className="mt-2 text-xs text-gray-500">Outstanding</p>
                                                <p className="text-lg font-bold tabular-nums text-gray-900">
                                                    ₹{paymentSummary.outstanding.toLocaleString('en-IN')}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-600">No payment summary yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm">
                                <p className="text-sm font-semibold text-gray-900">AI suggestions</p>
                                <p className="mt-1 text-sm text-gray-600">
                                    Use the Payments tab to view ledger-level AI insights and generate reminders.
                                </p>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

