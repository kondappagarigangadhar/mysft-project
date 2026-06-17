'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EditableField, EditableSelect } from '@/components/leads/detail/InlineEditableSection';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { CustomerAIPanel } from '@/components/customers/CustomerAIPanel';
import {
    CustomerPropertyWorkspaceSections,
    DEFAULT_CUSTOMER_PROPERTY_SECTIONS_OPEN,
} from '@/components/customers/CustomerPropertyWorkspaceSections';
import { CustomerDetailMoreMenu } from '@/components/customers/CustomerDetailMoreMenu';
import { CustomerDocumentsTab } from '@/components/customers/CustomerDocumentsTab';
import { CustomerMainTabBar } from '@/components/customers/CustomerMainTabBar';
import { CustomerPaymentsTab } from '@/components/customers/CustomerPaymentsTab';
import { CustomerProjectUpdatesTab } from '@/components/customers/CustomerProjectUpdatesTab';
import { normalizeCustomerWorkspaceTab, type CustomerWorkspaceTabId } from '@/components/customers/customerDetailTabIds';
import { EMPTY_FIELD } from '@/components/customers/CustomerOverviewFieldKit';
import { CustomerOverviewEditableCell } from '@/components/customers/CustomerOverviewEditableCell';
import { getBookingAssigneeOptions } from '@/lib/bookingPaymentMockStore';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusModal } from '@/components/ui/StatusModal';
import { cn } from '@/lib/utils';
import {
    CTA_CARD_EDITING_RING,
    CTA_EDITING_BADGE,
    CTA_INFO_BANNER,
    CTA_INFO_BANNER_BADGE,
} from '@/lib/theme/ctaThemeClasses';
import {
    addCustomer,
    CUSTOMER_BOOKING_STATUS_OPTIONS,
    CUSTOMER_STATUS_OPTIONS,
    updateCustomer,
    deleteCustomerPermanent,
    peekNextCustomerCode,
    type Customer,
    type CustomerDocument,
    type CustomerProjectUpdate,
    type LeadSource,
} from '@/lib/customersStore';
import { customerViewHref, customersListHref } from '@/lib/customerRoutes';
import type { HistoryLogEntry } from '@/lib/historyLogs/types';
import { leadProfileHref } from '@/lib/leadRoutes';
import {
    LuCalendar,
    LuClock3,
} from 'react-icons/lu';
import { WorkspaceUtilityToolbar, CUSTOMER_WORKSPACE_HELP } from '@/components/workspace-help';

type Draft = {
    fullName: string;
    phone: string;
    email: string;
    bookingId: string;
    projectName: string;
    unitNumber: string;
    bookingStatus: Customer['bookingStatus'] | '';
    assignedExecutive: string;
    leadSource: LeadSource | '';
    customerStatus: Customer['customerStatus'] | '';
};

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
    return name.trim().slice(0, 2).toUpperCase() || '?';
}

function buildDraft(c: Customer): Draft {
    return {
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        bookingId: c.bookingId,
        projectName: c.projectName,
        unitNumber: c.unitNumber,
        bookingStatus: c.bookingStatus,
        assignedExecutive: c.assignedExecutive,
        leadSource: c.leadSource,
        customerStatus: c.customerStatus,
    };
}

function emptyDraft(): Draft {
    return {
        fullName: '',
        phone: '',
        email: '',
        bookingId: '',
        projectName: '',
        unitNumber: '',
        bookingStatus: 'Pending',
        assignedExecutive: '',
        leadSource: 'Website',
        customerStatus: 'Onboarding',
    };
}

function formatIso(iso: string) {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function fmtCurrency(n: number) {
    return `₹${n.toLocaleString('en-IN')}`;
}

const LEAD_SOURCE_OPTIONS: LeadSource[] = ['Website', 'Facebook Ads', 'Google Ads', 'Referral', 'Walk-in', 'Broker'];

function bookingBadge(s: Customer['bookingStatus']) {
    if (s === 'Confirmed') return 'bg-emerald-100 text-emerald-900';
    if (s === 'Cancelled') return 'bg-rose-100 text-rose-900';
    return 'bg-amber-100 text-amber-950';
}

type Props = {
    customer: Customer;
    createMode: boolean;
    onBump: () => void;
};

export function CustomerRecordTabs({ customer, createMode, onBump }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [tab, setTab] = useState<CustomerWorkspaceTabId>(() => normalizeCustomerWorkspaceTab(searchParams.get('tab')));
    const [isInlineEditing, setIsInlineEditing] = useState(createMode);
    const [inlineSaving, setInlineSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const [statusModal, setStatusModal] = useState<{ open: boolean; type: 'success' | 'error'; title: string }>({
        open: false,
        type: 'success',
        title: '',
    });
    const [permDelOpen, setPermDelOpen] = useState(false);
    const [sectionsOpen, setSectionsOpen] = useState(() => ({ ...DEFAULT_CUSTOMER_PROPERTY_SECTIONS_OPEN }));
    const [paymentTrackingOpen, setPaymentTrackingOpen] = useState(true);

    const [draft, setDraft] = useState<Draft>(() => (createMode ? emptyDraft() : buildDraft(customer)));
    const [documentsDraft, setDocumentsDraft] = useState<CustomerDocument[]>(() => [...customer.documents]);
    const [updatesDraft, setUpdatesDraft] = useState<CustomerProjectUpdate[]>(() => [...customer.projectUpdates]);
    const workspaceEditing = createMode || isInlineEditing;

    const setTabNavigate = useCallback(
        (next: CustomerWorkspaceTabId) => {
            if (createMode && next !== 'overview') {
                setInlineToast({ msg: 'Save the customer record to access other tabs.', err: true });
                return;
            }
            setTab(next);
            const sp = new URLSearchParams(searchParams.toString());
            sp.set('tab', next);
            router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
        },
        [router, searchParams, pathname, createMode],
    );

    useEffect(() => {
        setTab(normalizeCustomerWorkspaceTab(searchParams.get('tab')));
    }, [searchParams]);

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true' || createMode) return;
        setDraft(buildDraft(customer));
        setDocumentsDraft([...customer.documents]);
        setUpdatesDraft([...customer.projectUpdates]);
        setIsInlineEditing(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const base = customerViewHref(customer.slug);
        router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    }, [searchParams, router, createMode, customer]);

    useEffect(() => {
        if (!workspaceEditing) {
            setDraft(buildDraft(customer));
            setDocumentsDraft([...customer.documents]);
            setUpdatesDraft([...customer.projectUpdates]);
        }
    }, [customer, workspaceEditing]);

    const customerHistorySupplemental = useMemo((): HistoryLogEntry[] => {
        if (createMode) return [];
        const entries: HistoryLogEntry[] = [
            {
                id: `cust-${customer.slug}-created`,
                at: customer.createdAt,
                user: { id: 'u-sys', name: 'System', role: 'Lead & Sales' },
                module: 'customers',
                recordId: customer.slug,
                recordLabel: customer.fullName,
                action: 'Customer portal created from lead conversion',
                changes: customer.leadId,
                severity: 'success',
                actionType: 'converted',
            },
        ];
        customer.paymentHistory.forEach((p) => {
            entries.push({
                id: `cust-${customer.slug}-pay-${p.id}`,
                at: `${p.date}T12:00:00.000Z`,
                user: { id: 'u-pay', name: 'Payments', role: 'Finance' },
                module: 'customers',
                recordId: customer.slug,
                recordLabel: customer.fullName,
                action: 'Payment activity',
                changes: `${fmtCurrency(p.amount)} · ${p.status}`,
                severity: p.status === 'Completed' ? 'success' : 'info',
                actionType: 'edited',
            });
        });
        customer.documents.forEach((d) => {
            entries.push({
                id: `cust-${customer.slug}-doc-${d.id}`,
                at: `${d.uploadedAt}T10:00:00.000Z`,
                user: { id: 'u-doc', name: 'Documents', role: 'Compliance' },
                module: 'customers',
                recordId: customer.slug,
                recordLabel: customer.fullName,
                action: 'Document uploaded',
                changes: `${d.type}: ${d.name}`,
                severity: 'info',
                actionType: 'edited',
            });
        });
        return entries;
    }, [createMode, customer]);

    const validate = (): string | null => {
        if (!draft.fullName.trim()) return 'Full name is required.';
        if (!draft.phone.trim()) return 'Phone number is required.';
        if (!draft.email.trim()) return 'Email is required.';
        if (!draft.projectName.trim()) return 'Project name is required.';
        if (!draft.unitNumber.trim()) return 'Unit number is required.';
        return null;
    };

    const onWorkspaceEdit = () => {
        setDraft(buildDraft(customer));
        setDocumentsDraft([...customer.documents]);
        setUpdatesDraft([...customer.projectUpdates]);
        setIsInlineEditing(true);
    };

    const isDirty = useMemo(() => {
        if (createMode) return true;
        const base = buildDraft(customer);
        if ((Object.keys(base) as (keyof Draft)[]).some((k) => draft[k] !== base[k])) return true;
        if (JSON.stringify(documentsDraft) !== JSON.stringify(customer.documents)) return true;
        if (JSON.stringify(updatesDraft) !== JSON.stringify(customer.projectUpdates)) return true;
        return false;
    }, [createMode, draft, customer, documentsDraft, updatesDraft]);

    const onWorkspaceCancel = () => {
        if (createMode) {
            router.push(customersListHref());
            return;
        }
        setIsInlineEditing(false);
        setDraft(buildDraft(customer));
        setDocumentsDraft([...customer.documents]);
        setUpdatesDraft([...customer.projectUpdates]);
    };

    const persist = async ({ exitAfter }: { exitAfter: boolean }) => {
        const err = validate();
        if (err) {
            setInlineToast({ msg: err, err: true });
            return;
        }
        setInlineSaving(true);
        try {
            if (createMode) {
                const created = addCustomer({
                    fullName: draft.fullName.trim(),
                    phone: draft.phone.trim(),
                    email: draft.email.trim(),
                    projectName: draft.projectName.trim(),
                    unitNumber: draft.unitNumber.trim(),
                    assignedExecutive: draft.assignedExecutive.trim() || 'Unassigned',
                    leadSource: (draft.leadSource || 'Website') as LeadSource,
                });
                onBump();
                setStatusModal({ open: true, type: 'success', title: 'Customer workspace created' });
                router.push(customerViewHref(created.slug));
                return;
            }
            updateCustomer(customer.slug, {
                fullName: draft.fullName.trim(),
                phone: draft.phone.trim(),
                email: draft.email.trim(),
                bookingId: draft.bookingId.trim(),
                projectName: draft.projectName.trim(),
                unitNumber: draft.unitNumber.trim(),
                bookingStatus: (draft.bookingStatus || customer.bookingStatus) as Customer['bookingStatus'],
                assignedExecutive: draft.assignedExecutive.trim(),
                leadSource: (draft.leadSource || customer.leadSource) as LeadSource,
                customerStatus: (draft.customerStatus || customer.customerStatus) as Customer['customerStatus'],
                documents: documentsDraft,
                projectUpdates: updatesDraft,
            });
            onBump();
            setIsInlineEditing(false);
            setInlineToast({ msg: 'Customer record saved.' });
            if (exitAfter) router.push(customersListHref());
        } finally {
            setInlineSaving(false);
        }
    };

    const exportJson = () => {
        const blob = new Blob([JSON.stringify(customer, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${customer.slug}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const disabledTabs = createMode ? new Set<CustomerWorkspaceTabId>(['payments', 'documents', 'project-updates', 'history']) : undefined;

    const assigneeOptions = useMemo(() => {
        const base = getBookingAssigneeOptions();
        const current = draft.assignedExecutive.trim();
        if (current && !base.includes(current)) return [current, ...base];
        return base.length ? base : ['Unassigned'];
    }, [draft.assignedExecutive]);

    const propertyCustomer = useMemo((): Customer => {
        if (!createMode && !workspaceEditing) return customer;
        return {
            ...customer,
            fullName: draft.fullName.trim() || customer.fullName,
            phone: draft.phone.trim() || customer.phone,
            email: draft.email.trim() || customer.email,
            projectName: draft.projectName.trim() || customer.projectName,
            unitNumber: draft.unitNumber.trim() || customer.unitNumber,
            bookingId: draft.bookingId.trim() || customer.bookingId,
            assignedExecutive: draft.assignedExecutive.trim() || customer.assignedExecutive,
            leadSource: (draft.leadSource || customer.leadSource) as LeadSource,
            bookingStatus: (draft.bookingStatus || customer.bookingStatus) as Customer['bookingStatus'],
            customerStatus: (draft.customerStatus || customer.customerStatus) as Customer['customerStatus'],
        };
    }, [createMode, workspaceEditing, customer, draft]);

    const nextCode = peekNextCustomerCode();

    const headerBookingStatus = createMode ? (draft.bookingStatus as Customer['bookingStatus']) || 'Pending' : customer.bookingStatus;

    const displayName = workspaceEditing ? draft.fullName.trim() || (createMode ? 'New customer' : customer.fullName) : createMode ? draft.fullName.trim() || 'New customer' : customer.fullName;

    const customerProfileHeader = (
        <div className="space-y-3">
            <div className="flex min-w-0 gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-50 text-base font-semibold text-gray-700 ring-1 ring-gray-200/80">
                    {initials(displayName)}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="min-w-0 flex-1">
                            <CustomerOverviewEditableCell label="Customer name" isEditing={workspaceEditing}>
                                <EditableField
                                    isEditing={workspaceEditing}
                                    value={draft.fullName}
                                    onChange={(v) => setDraft((d) => ({ ...d, fullName: v }))}
                                    readValue={<span className="text-xl font-semibold tracking-tight sm:text-2xl">{displayName}</span>}
                                    placeholder="Full name"
                                />
                            </CustomerOverviewEditableCell>
                        </div>
                        {workspaceEditing ? <span className={CTA_EDITING_BADGE}>Editing</span> : null}
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-slate-600">
                            {createMode ? nextCode : customer.customerCode}
                        </span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-gray-200/60 pt-3 sm:grid-cols-3 lg:grid-cols-4">
                <CustomerOverviewEditableCell label="Booking ID" isEditing={workspaceEditing}>
                    <EditableField
                        isEditing={workspaceEditing}
                        value={draft.bookingId}
                        onChange={(v) => setDraft((d) => ({ ...d, bookingId: v }))}
                        readValue={customer.bookingId || EMPTY_FIELD}
                        placeholder="Booking ID"
                    />
                </CustomerOverviewEditableCell>
                <CustomerOverviewEditableCell label="Project" isEditing={workspaceEditing}>
                    <EditableField
                        isEditing={workspaceEditing}
                        value={draft.projectName}
                        onChange={(v) => setDraft((d) => ({ ...d, projectName: v }))}
                        readValue={customer.projectName || EMPTY_FIELD}
                        placeholder="Project name"
                    />
                </CustomerOverviewEditableCell>
                <CustomerOverviewEditableCell label="Unit" isEditing={workspaceEditing}>
                    <EditableField
                        isEditing={workspaceEditing}
                        value={draft.unitNumber}
                        onChange={(v) => setDraft((d) => ({ ...d, unitNumber: v }))}
                        readValue={customer.unitNumber || EMPTY_FIELD}
                        placeholder="Unit number"
                    />
                </CustomerOverviewEditableCell>
                <CustomerOverviewEditableCell label="Booking status" isEditing={workspaceEditing}>
                    <EditableSelect
                        isEditing={workspaceEditing}
                        value={draft.bookingStatus}
                        options={[...CUSTOMER_BOOKING_STATUS_OPTIONS]}
                        onChange={(v) => setDraft((d) => ({ ...d, bookingStatus: v as Customer['bookingStatus'] }))}
                        readValue={
                            <span className={cn('inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold uppercase', bookingBadge(headerBookingStatus))}>
                                {headerBookingStatus}
                            </span>
                        }
                    />
                </CustomerOverviewEditableCell>
                <CustomerOverviewEditableCell label="Executive" isEditing={workspaceEditing}>
                    <EditableSelect
                        isEditing={workspaceEditing}
                        value={draft.assignedExecutive}
                        options={assigneeOptions.length ? assigneeOptions : [customer.assignedExecutive || 'Unassigned']}
                        onChange={(v) => setDraft((d) => ({ ...d, assignedExecutive: v }))}
                        readValue={customer.assignedExecutive || EMPTY_FIELD}
                    />
                </CustomerOverviewEditableCell>
                <CustomerOverviewEditableCell label="Source" isEditing={workspaceEditing}>
                    <EditableSelect
                        isEditing={workspaceEditing}
                        value={draft.leadSource}
                        options={[...LEAD_SOURCE_OPTIONS]}
                        onChange={(v) => setDraft((d) => ({ ...d, leadSource: v as LeadSource }))}
                        readValue={customer.leadSource || EMPTY_FIELD}
                    />
                </CustomerOverviewEditableCell>
                <CustomerOverviewEditableCell label="Phone" isEditing={workspaceEditing}>
                    <EditableField
                        isEditing={workspaceEditing}
                        type="tel"
                        value={draft.phone}
                        onChange={(v) => setDraft((d) => ({ ...d, phone: v }))}
                        readValue={customer.phone?.trim() ? customer.phone : EMPTY_FIELD}
                        placeholder="Phone"
                    />
                </CustomerOverviewEditableCell>
                <CustomerOverviewEditableCell label="Email" isEditing={workspaceEditing}>
                    <EditableField
                        isEditing={workspaceEditing}
                        type="email"
                        value={draft.email}
                        onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
                        readValue={customer.email?.trim() ? customer.email : EMPTY_FIELD}
                        placeholder="Email"
                    />
                </CustomerOverviewEditableCell>
                <CustomerOverviewEditableCell label="Customer status" isEditing={workspaceEditing}>
                    <EditableSelect
                        isEditing={workspaceEditing}
                        value={draft.customerStatus}
                        options={[...CUSTOMER_STATUS_OPTIONS]}
                        onChange={(v) => setDraft((d) => ({ ...d, customerStatus: v as Customer['customerStatus'] }))}
                        readValue={customer.customerStatus}
                    />
                </CustomerOverviewEditableCell>
                {!createMode && customer.leadId ? (
                    <CustomerOverviewEditableCell label="Lead">
                        <Link href={leadProfileHref(customer.leadSlug)} className="text-[var(--cta-button-bg)] hover:underline">
                            {customer.leadId}
                        </Link>
                    </CustomerOverviewEditableCell>
                ) : null}
            </div>
        </div>
    );

    /** AI Buyer Copilot + quick cards — Overview tab only (matches Leads). */
    const overviewSideRail = (
        <div className="flex flex-col gap-4 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
            <CustomerAIPanel customer={propertyCustomer} disabled={createMode} tabContext="overview" />
           
        </div>
    );

    return (
        <div className="w-full min-w-0 space-y-0">
            <StatusModal open={statusModal.open} type={statusModal.type} title={statusModal.title} onClose={() => setStatusModal((s) => ({ ...s, open: false }))} />
            {inlineToast ? <InlineToast message={inlineToast.msg} variant={inlineToast.err ? 'error' : 'success'} onDismiss={() => setInlineToast(null)} /> : null}

            <CustomerMainTabBar active={tab} onChange={setTabNavigate} disabledTabs={disabledTabs} />

            {createMode ? (
                <div className={cn('mt-3', CTA_INFO_BANNER)}>
                    You are creating a new customer <span className={CTA_INFO_BANNER_BADGE}>Draft</span>
                </div>
            ) : null}

            {!createMode ? (
                <div className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <CustomerDetailMoreMenu
                                customer={customer}
                                onEdit={onWorkspaceEdit}
                                isEditing={workspaceEditing}
                                isSaving={inlineSaving}
                                onRequestPermanentDelete={() => setPermDelOpen(true)}
                            />
                        </div>
                        <WorkspaceUtilityToolbar
                            help={CUSTOMER_WORKSPACE_HELP}
                            triggerLabel="Customer workspace help"
                            email={customer.email}
                            onExport={exportJson}
                            saving={inlineSaving}
                            isInlineEditing={workspaceEditing}
                        />
                    </div>
                </div>
            ) : null}

            {!createMode ? (
                <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                        <span className="inline-flex items-center gap-2">
                            <LuCalendar size={14} className="text-gray-500" aria-hidden />
                            <span className="text-gray-600">Date Created</span>
                            <span className="font-medium text-gray-900">{formatIso(customer.createdAt)}</span>
                        </span>
                        <span className="hidden h-4 w-px bg-gray-300 sm:inline" aria-hidden />
                        <span className="inline-flex items-center gap-2">
                            <LuClock3 size={14} className="text-gray-500" aria-hidden />
                            <span className="text-gray-600">Last updated</span>
                            <span className="font-medium text-gray-900">{formatIso(customer.updatedAt)}</span>
                        </span>
                    </div>
                </div>
            ) : null}

            <div
                className={cn(
                    'min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5',
                    workspaceEditing && 'pb-28',
                )}
            >
                {tab === 'overview' ? (
                    <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
                        <div
                            className={cn(
                                'flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-span-2',
                                workspaceEditing && 'rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_4%,white)] p-2 sm:p-3',
                            )}
                        >
                            <div
                                className={cn(
                                    'flex min-h-0 min-w-0 flex-col rounded-xl border bg-white shadow-sm',
                                    workspaceEditing ? CTA_CARD_EDITING_RING : 'border-gray-200/80',
                                )}
                            >
                                <div className="bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                                    {customerProfileHeader}
                                </div>
                            </div>

                            <CustomerPropertyWorkspaceSections
                                customer={propertyCustomer}
                                isEditing={workspaceEditing}
                                sectionsOpen={{
                                    propertySummary: sectionsOpen.propertySummary,
                                    amenities: sectionsOpen.amenities,
                                    construction: sectionsOpen.construction,
                                    bookingPayment: sectionsOpen.bookingPayment,
                                    reraLegal: sectionsOpen.reraLegal,
                                    media: sectionsOpen.media,
                                }}
                                onSectionsOpenChange={(patch) => setSectionsOpen((s) => ({ ...s, ...patch }))}
                            />
                        </div>
                        {overviewSideRail}
                    </div>
                ) : null}

                {tab === 'payments' ? (
                    <div className="max-w-full">
                        <CustomerPaymentsTab
                            customer={customer}
                            trackingOpen={paymentTrackingOpen}
                            onTrackingOpenChange={setPaymentTrackingOpen}
                        />
                    </div>
                ) : null}

                {tab === 'documents' ? (
                    <div className="max-w-full">
                        <CustomerDocumentsTab customer={customer} editing={workspaceEditing} documents={documentsDraft} onDocumentsChange={setDocumentsDraft} />
                    </div>
                ) : null}

                {tab === 'project-updates' ? (
                    <div className="max-w-full">
                        <CustomerProjectUpdatesTab updates={updatesDraft} editing={workspaceEditing} onChange={setUpdatesDraft} />
                    </div>
                ) : null}

                {tab === 'history' ? (
                    <RecordHistoryLogPanel
                        module="customers"
                        recordId={customer.slug}
                        recordTitle={customer.fullName}
                        supplementalEntries={customerHistorySupplemental}
                    />
                ) : null}

                {workspaceEditing ? (
                    <div className="sticky bottom-0 z-30 mt-4 pb-1">
                        <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                            <div className="flex items-center gap-3">
                                <p className="text-sm font-semibold text-gray-900">
                                    {createMode ? 'Create customer workspace' : 'You have unsaved changes'}
                                </p>
                                {!createMode && !isDirty ? (
                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                        Up to date
                                    </span>
                                ) : null}
                            </div>
                            <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                                <Button type="button" variant="companyOutline" size="cta" onClick={onWorkspaceCancel} disabled={inlineSaving}>
                                    Cancel
                                </Button>
                                {createMode ? (
                                    <Button
                                        type="button"
                                        variant="company"
                                        size="cta"
                                        onClick={() => void persist({ exitAfter: true })}
                                        isLoading={inlineSaving}
                                    >
                                        {inlineSaving ? 'Creating...' : 'Create customer'}
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            variant="companyOutline"
                                            size="cta"
                                            onClick={() => void persist({ exitAfter: false })}
                                            disabled={inlineSaving || !isDirty}
                                            isLoading={inlineSaving}
                                        >
                                            {inlineSaving ? 'Saving...' : 'Save'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="company"
                                            size="cta"
                                            onClick={() => void persist({ exitAfter: true })}
                                            isLoading={inlineSaving}
                                            disabled={!isDirty}
                                        >
                                            {inlineSaving ? 'Saving...' : 'Save & Exit'}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <Modal isOpen={permDelOpen} onClose={() => setPermDelOpen(false)} title="Delete customer permanently?">
                <p className="text-sm text-slate-600">This removes the customer workspace from the demo store.</p>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="companyOutline" onClick={() => setPermDelOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="company"
                        onClick={() => {
                            deleteCustomerPermanent(customer.slug);
                            setPermDelOpen(false);
                            router.push(customersListHref());
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
