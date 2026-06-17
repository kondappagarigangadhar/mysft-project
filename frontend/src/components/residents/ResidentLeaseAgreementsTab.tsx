'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditableField } from '@/components/leads/detail/InlineEditableSection';
import { ResidentAIPanel } from '@/components/residents/ResidentAIPanel';
import { EMPTY_FIELD, ResidentCollapsibleSection, ResidentFieldRow } from '@/components/residents/ResidentOverviewFieldKit';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useRentalLeaseStoreBump } from '@/hooks/useRentalLeaseStoreBump';
import {
    canEditLeaseTerms,
    ensureLeaseDocumentBlob,
    formatLeaseCurrency,
    formatLeasePeriod,
    getLeaseAgreementsForResident,
    isLeaseExpiringSoon,
    leaseStatusBadgeClass,
    resendLeaseAgreement,
    sendLeaseAgreement,
    triggerLeasePdfDownload,
    updateLeaseAgreement,
    uploadLeaseAgreementFile,
    type LeaseAgreementStatus,
    type RentalLeaseAgreement,
} from '@/lib/rentalLeaseAgreementStore';
import { InlineWorkspaceSection } from '@/components/workspace/InlineWorkspaceSection';
import type { Resident } from '@/lib/residentStore';
import { LeaseDocumentPreview } from '@/modules/resident-portal/documents/LeaseDocumentPreview';
import { cn } from '@/lib/utils';
import {
    CTA_CARD_EDITING_RING,
    CTA_EDITING_BADGE,
    CTA_UTILITY_BTN,
} from '@/lib/theme/ctaThemeClasses';
import {
    LuCalendar,
    LuDownload,
    LuFileText,
    LuMail,
    LuPhone,
    LuRefreshCw,
    LuSend,
    LuSignature,
    LuUpload,
    LuUser,
} from 'react-icons/lu';

export type LeaseWorkspaceDraft = {
    agreementName: string;
    leaseStartDate: string;
    leaseEndDate: string;
    monthlyRent: string;
    securityDeposit: string;
    sendOnSave: boolean;
};

function formatIso(iso: string | null) {
    if (!iso) return EMPTY_FIELD;
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function addYearsYmd(startYmd: string, years: number): string {
    const d = new Date(`${startYmd.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(d.getTime())) return startYmd;
    d.setFullYear(d.getFullYear() + years);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

function defaultLeaseRentForResident(resident: Resident): number {
    if (resident.residentType === 'Tenant') return 28500;
    if (resident.residentType === 'Owner') return 42000;
    return 25000;
}

export function buildDefaultLeaseDraft(resident: Resident, agreements: RentalLeaseAgreement[]): LeaseWorkspaceDraft {
    const start = resident.moveInDate?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    const latest = agreements[0];
    const monthlyRent = latest?.monthlyRent && latest.monthlyRent > 0 ? latest.monthlyRent : defaultLeaseRentForResident(resident);
    const securityDeposit =
        latest?.securityDeposit && latest.securityDeposit > 0 ? latest.securityDeposit : monthlyRent * 2;

    return {
        agreementName: `Residential Lease — ${resident.propertyUnit}`,
        leaseStartDate: start,
        leaseEndDate: addYearsYmd(start, 1),
        monthlyRent: monthlyRent > 0 ? String(monthlyRent) : '',
        securityDeposit: securityDeposit > 0 ? String(securityDeposit) : '',
        sendOnSave: false,
    };
}

type Props = {
    resident: Resident;
    canMutate: boolean;
    leaseDraft: LeaseWorkspaceDraft;
    onLeaseDraftChange: (draft: LeaseWorkspaceDraft) => void;
    /** View mode: enter workspace edit then show new-lease draft when resident has no agreements. */
    onRequestEdit?: () => void;
};

export function ResidentLeaseAgreementsTab({ resident, canMutate, leaseDraft, onLeaseDraftChange, onRequestEdit }: Props) {
    useRentalLeaseStoreBump();
    const agreements = useMemo(() => getLeaseAgreementsForResident(resident.slug), [resident.slug]);

    const stats = useMemo(() => {
        const pending = agreements.filter((a) => ['Sent', 'Pending Signature', 'Viewed'].includes(a.status)).length;
        const signed = agreements.filter((a) => a.status === 'Signed').length;
        const draft = agreements.filter((a) => a.status === 'Draft').length;
        const total = canMutate && agreements.length === 0 ? 1 : agreements.length;
        return { total, pending, signed, draft };
    }, [agreements, canMutate]);

    const showNewDraft = canMutate && agreements.length === 0;
    const canAddFromView = Boolean(onRequestEdit && agreements.length === 0 && !canMutate);

    const summaryBadges = (
        <>
            {stats.signed > 0 ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                    {stats.signed} signed
                </span>
            ) : null}
            {stats.pending > 0 ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-950">
                    {stats.pending} pending
                </span>
            ) : null}
            {stats.draft > 0 ? (
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                    {stats.draft} draft
                </span>
            ) : null}
        </>
    );

    const emptyState = (
        <div className="rounded-xl border border-gray-200/80 bg-white px-4 py-10 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-700">No lease agreements added yet.</p>
            {canAddFromView ? (
                <p className="mt-1 text-sm text-gray-500">Click Add Lease to create one, or use Edit on the workspace.</p>
            ) : (
                <p className="mt-1 text-sm text-gray-500">No rental lease on file for this resident.</p>
            )}
        </div>
    );

    return (
        <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
            <InlineWorkspaceSection
                className="lg:col-span-2"
                summaryLabel={`${stats.total} lease agreement${stats.total === 1 ? '' : 's'} · rental & e-sign`}
                summaryBadges={summaryBadges}
                editingHint={
                    canMutate ? (
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--cta-button-bg)]">
                            Workspace edit
                        </p>
                    ) : null
                }
                canAdd={canAddFromView}
                addButtonLabel="Add Lease"
                onAdd={onRequestEdit}
                isEmpty={agreements.length === 0 && !showNewDraft}
                emptyState={emptyState}
            >
                {showNewDraft ? (
                    <LeaseDraftCard resident={resident} draft={leaseDraft} onDraftChange={onLeaseDraftChange} />
                ) : null}

                {agreements.map((agreement, idx) => (
                    <LeaseAgreementCard
                        key={agreement.id}
                        resident={resident}
                        agreement={agreement}
                        index={idx}
                        workspaceEditing={canMutate}
                    />
                ))}
            </InlineWorkspaceSection>

            <div className="min-w-0 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
                <ResidentAIPanel resident={resident} disabled={canMutate} tabContext="default" />
            </div>
        </div>
    );
}

function LeaseDraftCard({
    resident,
    draft,
    onDraftChange,
}: {
    resident: Resident;
    draft: LeaseWorkspaceDraft;
    onDraftChange: (d: LeaseWorkspaceDraft) => void;
}) {
    const fieldGrid = 'grid grid-cols-1 gap-0 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';
    const patch = (p: Partial<LeaseWorkspaceDraft>) => onDraftChange({ ...draft, ...p });

    return (
        <div className={cn('rounded-xl border bg-white shadow-sm', CTA_CARD_EDITING_RING)}>
            <div className="bg-[#7185a217] px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/60 pb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Rental lease agreement</h2>
                    <span className={CTA_EDITING_BADGE}>Editing mode</span>
                </div>
                <div className="mt-4 space-y-4">
                    <ResidentCollapsibleSection title="Resident information" icon={LuUser} tone="slate" open onOpenChange={() => {}}>
                        <ResidentInfoGrid resident={resident} fieldGrid={fieldGrid} />
                    </ResidentCollapsibleSection>
                    <ResidentCollapsibleSection title="Lease terms" icon={LuCalendar} tone="blue" open onOpenChange={() => {}}>
                        <LeaseTermsFields draft={draft} resident={resident} canMutate onChange={patch} fieldGrid={fieldGrid} />
                    </ResidentCollapsibleSection>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                        <input
                            type="checkbox"
                            checked={draft.sendOnSave}
                            onChange={(e) => patch({ sendOnSave: e.target.checked })}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-600"
                        />
                        <span className="text-sm text-slate-700">
                            <span className="font-semibold text-slate-900">Send to resident portal when saved</span>
                            <span className="mt-0.5 block text-xs text-slate-500">{resident.email}</span>
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
}

function LeaseAgreementCard({
    resident,
    agreement,
    index,
    workspaceEditing,
}: {
    resident: Resident;
    agreement: RentalLeaseAgreement;
    index: number;
    workspaceEditing: boolean;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [sendOpen, setSendOpen] = useState(false);
    const termsEditable = workspaceEditing && canEditLeaseTerms(agreement);
    const viewMode = !workspaceEditing;
    const showDetailSections = viewMode || agreement.status !== 'Draft' || !termsEditable;

    const [sectionsOpen, setSectionsOpen] = useState({
        info: true,
        terms: true,
        signature: true,
        timeline: true,
        preview: true,
    });
    const fieldGrid = 'grid grid-cols-1 gap-0 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';

    const [draft, setDraft] = useState({
        agreementName: agreement.agreementName,
        leaseStartDate: agreement.leaseStartDate,
        leaseEndDate: agreement.leaseEndDate,
        monthlyRent: String(agreement.monthlyRent || ''),
        securityDeposit: String(agreement.securityDeposit || ''),
    });

    useEffect(() => {
        setDraft({
            agreementName: agreement.agreementName,
            leaseStartDate: agreement.leaseStartDate,
            leaseEndDate: agreement.leaseEndDate,
            monthlyRent: String(agreement.monthlyRent || ''),
            securityDeposit: String(agreement.securityDeposit || ''),
        });
    }, [agreement.id, agreement.agreementName, agreement.leaseStartDate, agreement.leaseEndDate, agreement.monthlyRent, agreement.securityDeposit]);

    useEffect(() => {
        ensureLeaseDocumentBlob(agreement.id, agreement.status === 'Signed');
    }, [agreement.id, agreement.status]);

    const patchDraft = (p: Partial<typeof draft>) => {
        const next = { ...draft, ...p };
        setDraft(next);
        if (termsEditable) {
            updateLeaseAgreement(agreement.id, {
                agreementName: next.agreementName.trim() || agreement.agreementName,
                leaseStartDate: next.leaseStartDate,
                leaseEndDate: next.leaseEndDate || next.leaseStartDate,
                monthlyRent: Number(next.monthlyRent) || 0,
                securityDeposit: Number(next.securityDeposit) || 0,
            });
        }
    };

    const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadLeaseAgreementFile(agreement.id, file);
        e.target.value = '';
    };

    const title = termsEditable
        ? `Lease ${index + 1}${draft.agreementName.trim() ? ` · ${draft.agreementName}` : ''}`
        : `${agreement.agreementCode}${agreement.agreementName ? ` · ${agreement.agreementName}` : ''}`;

    return (
        <>
            <div
                className={cn(
                    'rounded-xl border bg-white shadow-sm',
                    termsEditable ? CTA_CARD_EDITING_RING : 'border-gray-200/80',
                )}
            >
                <div className="bg-[#7185a217] px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/60 pb-3">
                        <div className="min-w-0">
                            <h2 className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
                            <p className="mt-0.5 text-xs text-slate-500">{agreement.propertyUnit}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {termsEditable ? (
                                <span className={CTA_EDITING_BADGE}>Editing mode</span>
                            ) : workspaceEditing && !termsEditable ? (
                                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                                    Read-only · {agreement.status}
                                </span>
                            ) : (
                                <StatusChip status={agreement.status} />
                            )}
                            {viewMode && isLeaseExpiringSoon(agreement) ? (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-950">
                                    Expiring soon
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {viewMode ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onUpload} />
                            <button type="button" className={CTA_UTILITY_BTN} onClick={() => fileInputRef.current?.click()}>
                                <LuUpload className="h-4 w-4" aria-hidden />
                                Upload
                            </button>
                            <button
                                type="button"
                                className={CTA_UTILITY_BTN}
                                disabled={agreement.status === 'Signed'}
                                onClick={() => setSendOpen(true)}
                            >
                                <LuSend className="h-4 w-4" aria-hidden />
                                Send
                            </button>
                            <button type="button" className={CTA_UTILITY_BTN} onClick={() => resendLeaseAgreement(agreement.id)}>
                                <LuRefreshCw className="h-4 w-4" aria-hidden />
                                Resend
                            </button>
                            <button type="button" className={CTA_UTILITY_BTN} onClick={() => triggerLeasePdfDownload(agreement, false)}>
                                <LuDownload className="h-4 w-4" aria-hidden />
                                PDF
                            </button>
                        </div>
                    ) : null}

                    <div className="mt-4 space-y-4">
                        <ResidentCollapsibleSection
                            title="Resident information"
                            icon={LuUser}
                            tone="slate"
                            open={sectionsOpen.info}
                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, info: o }))}
                        >
                            <ResidentInfoGrid resident={resident} fieldGrid={fieldGrid} />
                        </ResidentCollapsibleSection>

                        <ResidentCollapsibleSection
                            title={viewMode ? 'VIEW LEASE TERMS' : 'Lease terms'}
                            icon={LuCalendar}
                            tone="blue"
                            open={sectionsOpen.terms}
                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, terms: o }))}
                        >
                            <LeaseTermsFields
                                draft={draft}
                                resident={resident}
                                canMutate={termsEditable}
                                onChange={patchDraft}
                                fieldGrid={fieldGrid}
                                grouped={viewMode || showDetailSections}
                            />
                            {showDetailSections ? (
                                <div className={cn(fieldGrid, 'mt-0 border-t border-gray-100')}>
                                    <ResidentFieldRow label="Agreement ID">
                                        <span className="font-semibold text-gray-900">{agreement.agreementCode}</span>
                                    </ResidentFieldRow>
                                    <ResidentFieldRow label="Status">
                                        <StatusChip status={agreement.status} />
                                    </ResidentFieldRow>
                                    <ResidentFieldRow label="Sent date">{formatIso(agreement.sentDate)}</ResidentFieldRow>
                                    <ResidentFieldRow label="Signed date">{formatIso(agreement.signedDate)}</ResidentFieldRow>
                                </div>
                            ) : null}
                        </ResidentCollapsibleSection>

                        {showDetailSections ? (
                            <>
                                <ResidentCollapsibleSection
                                    title="Signature status"
                                    icon={LuSignature}
                                    tone="amber"
                                    open={sectionsOpen.signature}
                                    onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, signature: o }))}
                                >
                                    <div className={fieldGrid}>
                                        <ResidentFieldRow label="DocuSign envelope">
                                            {agreement.docusignEnvelopeId ?? EMPTY_FIELD}
                                        </ResidentFieldRow>
                                        <ResidentFieldRow label="DocuSign status">
                                            <span className="capitalize">{agreement.docusignStatus ?? '—'}</span>
                                        </ResidentFieldRow>
                                        <ResidentFieldRow label="Signed by">{agreement.signedBy ?? EMPTY_FIELD}</ResidentFieldRow>
                                        <ResidentFieldRow label="Signed document">
                                            {agreement.signedFile?.fileName ?? EMPTY_FIELD}
                                        </ResidentFieldRow>
                                    </div>
                                </ResidentCollapsibleSection>

                                <ResidentCollapsibleSection
                                    title="Activity timeline"
                                    icon={LuCalendar}
                                    tone="slate"
                                    open={sectionsOpen.timeline}
                                    onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, timeline: o }))}
                                >
                                    <ActivityTimeline agreement={agreement} />
                                </ResidentCollapsibleSection>

                                <ResidentCollapsibleSection
                                    title="Document preview"
                                    icon={LuFileText}
                                    tone="blue"
                                    open={sectionsOpen.preview}
                                    onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, preview: o }))}
                                >
                                    {agreement.agreementFile ? (
                                        <div className="p-3">
                                            <LeaseDocumentPreview agreement={agreement} signed={agreement.status === 'Signed'} />
                                        </div>
                                    ) : (
                                        <p className="px-3 py-6 text-center text-sm text-gray-500">No document attached yet.</p>
                                    )}
                                </ResidentCollapsibleSection>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            <Modal isOpen={sendOpen} onClose={() => setSendOpen(false)} title="Send lease agreement">
                <p className="text-sm text-slate-600">
                    Notify <strong>{resident.fullName}</strong> via email, resident portal, and DocuSign.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSendOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            sendLeaseAgreement(agreement.id);
                            setSendOpen(false);
                        }}
                    >
                        <LuSend className="mr-1.5 h-4 w-4" aria-hidden />
                        Send now
                    </Button>
                </div>
            </Modal>
        </>
    );
}

function ResidentInfoGrid({ resident, fieldGrid }: { resident: Resident; fieldGrid: string }) {
    return (
        <div className={fieldGrid}>
            <ResidentFieldRow label="Resident name">
                <span className="text-sm font-semibold text-gray-900">{resident.fullName}</span>
            </ResidentFieldRow>
            <ResidentFieldRow label="Resident code">
                <span className="font-mono text-sm text-gray-800">{resident.residentCode}</span>
            </ResidentFieldRow>
            <ResidentFieldRow label="Email">
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-800">
                    <LuMail className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                    {resident.email}
                </span>
            </ResidentFieldRow>
            <ResidentFieldRow label="Phone">
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-800">
                    <LuPhone className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                    {resident.phoneNumber}
                </span>
            </ResidentFieldRow>
            <ResidentFieldRow label="Property / Unit">
                <span className="text-sm text-gray-800">{resident.propertyUnit}</span>
            </ResidentFieldRow>
            <ResidentFieldRow label="Resident type">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">{resident.residentType}</span>
            </ResidentFieldRow>
        </div>
    );
}

function FormSectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="border-b border-gray-200/80 bg-gray-50/70 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-600">{children}</p>
        </div>
    );
}

function LeaseTermsFields({
    draft,
    resident,
    canMutate,
    onChange,
    fieldGrid,
    grouped,
}: {
    draft: { agreementName: string; leaseStartDate: string; leaseEndDate: string; monthlyRent: string; securityDeposit: string };
    resident: Resident;
    canMutate: boolean;
    onChange: (p: Partial<typeof draft>) => void;
    fieldGrid: string;
    grouped?: boolean;
}) {
    const rentNum = Number(draft.monthlyRent) || 0;
    const depositNum = Number(draft.securityDeposit) || 0;

    const fields = (
        <>
            <ResidentFieldRow label="Agreement name" required className="xl:col-span-2">
                <EditableField
                    isEditing={canMutate}
                    value={draft.agreementName}
                    onChange={(v) => onChange({ agreementName: v })}
                    placeholder={`Residential Lease — ${resident.propertyUnit}`}
                    readValue={<span className="font-semibold text-gray-900">{draft.agreementName}</span>}
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Lease start date" required>
                <EditableField
                    isEditing={canMutate}
                    type="date"
                    value={draft.leaseStartDate}
                    onChange={(v) => onChange({ leaseStartDate: v })}
                    readValue={draft.leaseStartDate}
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Lease end date" required>
                <EditableField
                    isEditing={canMutate}
                    type="date"
                    value={draft.leaseEndDate}
                    onChange={(v) => onChange({ leaseEndDate: v })}
                    readValue={draft.leaseEndDate}
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Monthly rent (INR)" required>
                <EditableField
                    isEditing={canMutate}
                    value={draft.monthlyRent}
                    onChange={(v) => onChange({ monthlyRent: v })}
                    readValue={
                        rentNum > 0 ? (
                            formatLeaseCurrency(rentNum)
                        ) : (
                            <span className="text-sm text-gray-600">No monthly rent (owner / N/A)</span>
                        )
                    }
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Security deposit (INR)" required>
                <EditableField
                    isEditing={canMutate}
                    value={draft.securityDeposit}
                    onChange={(v) => onChange({ securityDeposit: v })}
                    readValue={
                        depositNum > 0 ? (
                            formatLeaseCurrency(depositNum)
                        ) : (
                            <span className="text-sm text-gray-600">No deposit on file</span>
                        )
                    }
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Lease period" className="xl:col-span-2">
                <span className="text-sm font-medium text-gray-800">
                    {draft.leaseStartDate && draft.leaseEndDate
                        ? formatLeasePeriod(draft.leaseStartDate, draft.leaseEndDate)
                        : '—'}
                </span>
            </ResidentFieldRow>
        </>
    );

    if (!grouped) {
        return <div className={fieldGrid}>{fields}</div>;
    }

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200/80">
            <FormSectionLabel>Lease details</FormSectionLabel>
            <div className={fieldGrid}>{fields}</div>
        </div>
    );
}

function ActivityTimeline({ agreement }: { agreement: RentalLeaseAgreement }) {
    if (agreement.activityLog.length === 0) {
        return <p className="px-3 py-4 text-sm text-slate-600">No activity recorded yet.</p>;
    }
    return (
        <ul className="space-y-3 px-1">
            {agreement.activityLog.map((entry) => (
                <li key={entry.id} className="flex gap-3 rounded-lg border border-gray-100 bg-slate-50/50 px-3 py-2.5">
                    <LuCalendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{entry.action}</p>
                        <p className="text-xs text-slate-500">
                            {formatIso(entry.at)} · {entry.actor}
                        </p>
                        {entry.detail ? <p className="mt-1 text-xs text-slate-600">{entry.detail}</p> : null}
                    </div>
                </li>
            ))}
        </ul>
    );
}

function StatusChip({ status, large }: { status: LeaseAgreementStatus; large?: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full font-bold',
                leaseStatusBadgeClass(status),
                large ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs',
            )}
        >
            {status}
        </span>
    );
}
