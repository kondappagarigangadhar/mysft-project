'use client';

import React, { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
    formatComplianceFileSize,
    getComplianceStatus,
    getCurrentVersion,
    getDocumentById,
    getUploadDateYmd,
    logDownload,
    logView,
    type ComplianceDocumentRecord,
} from '@/lib/complianceDocumentsMockStore';
import { COMPLIANCE_ROLE_LABELS, type ComplianceDemoRole } from '@/lib/complianceRbac';
import { formatShortDate } from '@/lib/formatDate';
import {
    CTA_CHIP_SUBTLE,
    CTA_COLLAPSE_HEADER_ICON,
    CTA_COLLAPSE_HEADER_RING,
    CTA_COLLAPSE_HEADER_TINT,
    CTA_FOCUS_VISIBLE_RING,
    CTA_INFO_STRIP,
    CTA_UTILITY_BTN,
} from '@/lib/theme/ctaThemeClasses';
import { useComplianceStoreBump } from '@/hooks/useComplianceStoreBump';
import { computeComplianceAlerts } from '@/lib/documentComplianceFormUi';
import { PreviousVersionReadonlyValue } from '@/components/documents-compliance/DocumentCoreFieldsBlock';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import {
    LuArrowLeft,
    LuCalendar,
    LuChevronDown,
    LuClock3,
    LuDownload,
    LuEllipsis,
    LuFileText,
    LuGitBranch,
    LuHistory,
    LuLayoutGrid,
    LuMail,
    LuLink2,
    LuLock,
    LuPlus,
    LuCopy,
    LuTrash2,
    LuPencil,
    LuPrinter,
    LuShieldCheck,
} from 'react-icons/lu';
import { WorkspaceHelp, DOCUMENT_WORKSPACE_HELP } from '@/components/workspace-help';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { DocumentUploadForm } from '@/components/documents-compliance/DocumentUploadForm';
import { DocumentEditForm } from '@/components/documents-compliance/DocumentEditForm';
import { StatusModal } from '@/components/ui/StatusModal';
import { ARRIS_DOCUMENT_UPLOAD_DRAFT_KEY } from '@/lib/documentUploadDraftStorage';

type DocumentDetailTabId = 'overview' | 'history';

function normalizeDocumentDetailTab(v: string | null): DocumentDetailTabId {
    return v === 'history' ? 'history' : 'overview';
}

function ReadRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('space-y-1', className)}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <div className="text-sm font-medium text-slate-900">{children}</div>
        </div>
    );
}

function DocumentMainTabBar({
    active,
    onChange,
    hideHistory,
}: {
    active: DocumentDetailTabId;
    onChange: (id: DocumentDetailTabId) => void;
    hideHistory?: boolean;
}) {
    const items: { id: DocumentDetailTabId; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
        { id: 'overview', label: 'Overview', Icon: LuLayoutGrid },
        ...(hideHistory ? [] : [{ id: 'history' as const, label: 'History', Icon: LuHistory }]),
    ];

    return (
        <div className="sticky top-26 z-40 -mx-6 border-b border-gray-200 bg-white">
            <nav className="flex min-w-0 divide-x divide-gray-200" aria-label="Document record sections">
                {items.map(({ id, label, Icon }) => {
                    const isActive = active === id;
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => onChange(id)}
                            className={cn(
                                'inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                CTA_FOCUS_VISIBLE_RING,
                                isActive ? 'font-semibold text-[var(--cta-button-bg)]' : 'font-medium text-gray-500 hover:text-gray-800',
                            )}
                        >
                            <Icon
                                size={16}
                                className={cn('shrink-0', isActive ? 'text-[var(--cta-button-bg)]' : 'opacity-80')}
                                aria-hidden
                            />
                            {label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}

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
    tone?: 'blue' | 'amber' | 'slate';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
}) {
    const toneClasses =
        tone === 'blue'
            ? { head: CTA_COLLAPSE_HEADER_TINT, icon: CTA_COLLAPSE_HEADER_ICON, ring: CTA_COLLAPSE_HEADER_RING }
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
                    'transition hover:brightness-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                    CTA_FOCUS_VISIBLE_RING,
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
                        <span className="truncate text-sm font-semibold tracking-wide text-gray-800">{title}</span>
                        {headerRight ? <span className="ml-auto shrink-0">{headerRight}</span> : null}
                    </span>
                </span>
                <LuChevronDown
                    className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')}
                    aria-hidden
                />
            </button>
            <div hidden={!open} className="bg-white">
                {children}
            </div>
        </section>
    );
}

function DocumentDetailBody({ doc }: { doc: ComplianceDocumentRecord }) {
    const v = getCurrentVersion(doc);
    const uploadYmd = getUploadDateYmd(doc);
    const status = getComplianceStatus(doc.expiryDate);
    const expiry = doc.expiryDate ?? '';
    const rera = doc.reraNumber;

    const complianceAlerts = useMemo(() => computeComplianceAlerts({ rera, expiry }), [rera, expiry]);
    const [sectionsOpen, setSectionsOpen] = React.useState({
        basic: true,
        file: true,
        linked: true,
        access: true,
        compliance: true,
    });

    return (
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
                <InlineCollapsibleSection
                    title="Basic info"
                    icon={LuFileText}
                    tone="blue"
                    open={sectionsOpen.basic}
                    onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, basic: o }))}
                >
                    <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2 rounded-lg border border-sky-100 bg-sky-50/50 px-3 py-2 text-xs text-sky-900">
                                <span className="font-semibold text-slate-600">Document ID</span>
                                <span className="ml-2 font-mono text-slate-800">{doc.id}</span>
                            </div>
                            <ReadRow label="Document name">{doc.name}</ReadRow>
                            <ReadRow label="Document type">{doc.documentType}</ReadRow>
                            <div className="md:col-span-2 space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Categories</p>
                                {doc.categories.length ? (
                                    <div className="flex flex-wrap gap-2">
                                        {doc.categories.map((c) => (
                                            <span key={c} className={CTA_CHIP_SUBTLE}>
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-500">—</span>
                                )}
                            </div>
                        </div>
                    </div>
                </InlineCollapsibleSection>

                <InlineCollapsibleSection
                    title="File"
                    icon={LuFileText}
                    tone="slate"
                    open={sectionsOpen.file}
                    onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, file: o }))}
                    headerRight={
                        v?.version ? (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                                v{v.version}
                            </span>
                        ) : null
                    }
                >
                    <div className="p-4 sm:p-5">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-6">
                            <div className="flex flex-wrap items-start gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
                                    <LuFileText className="h-6 w-6 text-slate-600" aria-hidden />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-900">{v?.fileName ?? '—'}</p>
                                    <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                                        <p>
                                            <span className="text-slate-500">Size:</span> {v ? formatComplianceFileSize(v.sizeBytes) : '—'}
                                        </p>
                                        <p>
                                            <span className="text-slate-500">Uploaded:</span> {formatShortDate(uploadYmd)}
                                        </p>
                                        <p className="sm:col-span-2">
                                            <span className="text-slate-500">Uploaded by:</span> {v?.uploadedBy ?? '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-3 border-t border-slate-200/80 pt-4 text-xs text-slate-700 sm:grid-cols-2">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Version</p>
                                    <p className="mt-1 font-mono text-sm text-slate-900">{v?.version ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Previous version</p>
                                    <div className="mt-1">
                                        <PreviousVersionReadonlyValue doc={doc} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </InlineCollapsibleSection>

                <InlineCollapsibleSection
                    title="Linked data"
                    icon={LuLink2}
                    tone="amber"
                    open={sectionsOpen.linked}
                    onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, linked: o }))}
                >
                    <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <ReadRow label="Booking ID">
                                {doc.bookingId ? <span className="font-mono text-xs">{doc.bookingId}</span> : '—'}
                            </ReadRow>
                            <ReadRow label="Customer ID">
                                {doc.customerId ? <span className="font-mono text-xs">{doc.customerId}</span> : '—'}
                            </ReadRow>
                            <ReadRow label="Project ID" className="md:col-span-2">
                                {doc.projectId || '—'}
                            </ReadRow>
                        </div>
                    </div>
                </InlineCollapsibleSection>

                <InlineCollapsibleSection
                    title="Access control"
                    icon={LuLock}
                    tone="slate"
                    open={sectionsOpen.access}
                    onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, access: o }))}
                >
                    <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <ReadRow label="Access level">
                                <span className="capitalize">{doc.accessLevel}</span>
                            </ReadRow>
                            <div className="md:col-span-2 space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Allowed roles</p>
                                <div className="flex flex-wrap gap-2">
                                    {doc.allowedRoles.map((r: ComplianceDemoRole) => (
                                        <span key={r} className={cn(CTA_CHIP_SUBTLE, 'px-2.5 py-1 text-[11px]')}>
                                            {COMPLIANCE_ROLE_LABELS[r]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </InlineCollapsibleSection>

                <InlineCollapsibleSection
                    title="Compliance info"
                    icon={LuShieldCheck}
                    tone={status === 'Expired' ? 'amber' : 'blue'}
                    open={sectionsOpen.compliance}
                    onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, compliance: o }))}
                    headerRight={
                        <span
                            className={
                                status === 'Expired'
                                    ? 'inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800'
                                    : 'inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800'
                            }
                        >
                            {status}
                        </span>
                    }
                >
                    <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <ReadRow label="Compliance status">
                                <span
                                    className={
                                        status === 'Expired'
                                            ? 'inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800'
                                            : 'inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800'
                                    }
                                >
                                    {status}
                                </span>
                            </ReadRow>
                            <ReadRow label="RERA number">{rera || '—'}</ReadRow>
                            <ReadRow label="Expiry date">{doc.expiryDate ? formatShortDate(doc.expiryDate) : '—'}</ReadRow>
                            {complianceAlerts.length > 0 ? (
                                <div className="md:col-span-2 rounded-lg border border-amber-200/80 bg-amber-50/40 px-3 py-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Compliance notes</p>
                                    <ul className="mt-2 space-y-1.5 text-xs">
                                        {complianceAlerts.map((a) => (
                                            <li
                                                key={a.id}
                                                className={cn(
                                                    'flex gap-2 font-medium',
                                                    a.severity === 'danger' ? 'text-rose-800' : 'text-amber-900',
                                                )}
                                            >
                                                <span aria-hidden>⚠</span>
                                                <span>{a.message}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </InlineCollapsibleSection>

        </div>
    );
}

/** Full-page read-only body: document metadata and file details only. */
export function DocumentDetailView({
    documentId,
    actorName,
    actorRole,
    onOpenVersions,
    showEdit,
    editHref,
    onBackToList,
    onDownload,
    initialTab,
}: {
    documentId: string;
    actorName: string;
    actorRole: ComplianceDemoRole;
    onOpenVersions: () => void;
    showEdit: boolean;
    editHref: string;
    onBackToList: () => void;
    onDownload?: () => void;
    initialTab?: string | null;
}) {
    useComplianceStoreBump();
    const router = useRouter();
    const pathname = usePathname() ?? '';
    const searchParams = useSearchParams();
    const createMode = documentId === 'new';
    const inlineEdit = searchParams.get('edit') === '1' && !createMode;
    const doc = useMemo(() => (createMode ? null : getDocumentById(documentId)), [documentId, createMode]);
    const tab = createMode ? 'overview' : normalizeDocumentDetailTab(searchParams.get('tab') ?? initialTab ?? null);
    const [statusModal, setStatusModal] = React.useState<{
        open: boolean;
        type: 'success' | 'error';
        title: string;
        subtitle?: string;
    }>({ open: false, type: 'success', title: '' });

    if (!doc && !createMode) {
        return <p className="text-sm text-slate-500">Document not found.</p>;
    }

    const v = doc ? getCurrentVersion(doc) : undefined;
    const complianceStatus = doc ? getComplianceStatus(doc.expiryDate) : 'Active';

    const setTab = (next: DocumentDetailTabId) => {
        if (createMode) return;
        const sp = new URLSearchParams(searchParams.toString());
        sp.set('tab', next);
        router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    };

    const docHref = typeof window !== 'undefined' ? window.location.href : '';

    const onDownloadClick = () => {
        if (onDownload) return onDownload();
        if (!doc || !v) return;
        logView(doc.id, { name: actorName, role: actorRole });
        logDownload(doc.id, { name: actorName, role: actorRole });
        window.open(v.storageUrl, '_blank', 'noopener,noreferrer');
    };

    const formatIso = (iso: string) => {
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return iso;
            return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
        } catch {
            return iso;
        }
    };

    const docStatus = doc ? getComplianceStatus(doc.expiryDate) : 'Active';
    const expiry = doc?.expiryDate ?? '';
    const rera = doc?.reraNumber ?? '';
    const complianceAlerts = computeComplianceAlerts({ rera, expiry });

    const actionBtnBase = cn(
        'inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md px-2.25 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        CTA_FOCUS_VISIBLE_RING,
    );

    return (
        <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
            <DocumentMainTabBar active={tab} onChange={setTab} hideHistory={createMode} />
            <div className="pt-3">
                {tab === 'overview' ? (
                    <>
                        {createMode ? (
                            <div className={cn(CTA_INFO_STRIP, 'mb-4')}>You are creating a new document</div>
                        ) : null}
                        {/* Full-width action bar under tabs */}
                        {!createMode && !inlineEdit ? (
                        <div className="mt-0 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="hidden h-6  sm:block" aria-hidden />
                                    {showEdit ? (
                                        <Button
                                            type="button"
                                            variant="company"
                                            size="md"
                                            className="min-h-9 gap-1.5 px-3 text-sm"
                                            onClick={() => router.push(editHref)}
                                        >
                                            <LuPencil size={16} className="shrink-0" aria-hidden />
                                            <span className="whitespace-nowrap">Edit</span>
                                        </Button>
                                    ) : null}
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="md"
                                        className="min-h-9 gap-1.5 px-3 text-sm"
                                        onClick={() =>
                                            router.push(`/company-admin/documents-compliance/new?clone=${encodeURIComponent(doc!.id)}`)
                                        }
                                    >
                                        <LuGitBranch size={16} className="shrink-0" aria-hidden />
                                        <span className="whitespace-nowrap">Clone</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="md"
                                        className="min-h-9 gap-1.5 px-3 text-sm"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(docHref || pathname);
                                            } catch {
                                                // ignore
                                            }
                                        }}
                                    >
                                        <LuCopy size={16} className="shrink-0" aria-hidden />
                                        <span className="whitespace-nowrap">Share</span>
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const ok = window.confirm('Delete this document? (demo)');
                                            if (!ok) return;
                                            onBackToList();
                                        }}
                                        className={cn(
                                            actionBtnBase,
                                            'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50',
                                        )}
                                    >
                                        <LuTrash2 size={16} className="shrink-0" aria-hidden />
                                        <span className="whitespace-nowrap">Archive</span>
                                    </button>
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="md"
                                        className="min-h-9 gap-1.5 px-3 text-sm"
                                        onClick={() => router.push('/company-admin/documents-compliance/view/new')}
                                    >
                                        <LuPlus size={16} className="shrink-0" aria-hidden />
                                        <span className="whitespace-nowrap">New</span>
                                    </Button>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                    <span
                                        className={cn(
                                            'mr-1 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                                            complianceStatus === 'Expired'
                                                ? 'border-rose-200 bg-rose-50 text-rose-800'
                                                : 'border-emerald-200 bg-emerald-50 text-emerald-800',
                                        )}
                                    >
                                        {complianceStatus}
                                    </span>
                                    <a
                                        href={`mailto:?subject=${encodeURIComponent(`Document: ${doc!.name}`)}&body=${encodeURIComponent(docHref || pathname)}`}
                                        className={CTA_UTILITY_BTN}
                                    >
                                        <LuMail size={16} className="shrink-0" aria-hidden />
                                        <span className="whitespace-nowrap">Email</span>
                                    </a>
                                    <button
                                        type="button"
                                        onClick={onDownloadClick}
                                        disabled={!v}
                                        className={cn(CTA_UTILITY_BTN, 'disabled:opacity-60')}
                                    >
                                        <LuDownload size={16} className="shrink-0" aria-hidden />
                                        <span className="whitespace-nowrap">Export</span>
                                    </button>
                                    <button type="button" onClick={() => window.print()} className={CTA_UTILITY_BTN}>
                                        <LuPrinter size={16} className="shrink-0" aria-hidden />
                                        <span className="whitespace-nowrap">Print</span>
                                    </button>
                                    <WorkspaceHelp {...DOCUMENT_WORKSPACE_HELP} triggerLabel="Document workspace help" />
                                </div>
                            </div>
                        </div>
                        ) : null}

                        {!createMode && !inlineEdit ? (
                        <div className="my-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                                <span className="inline-flex items-center gap-2">
                                    <LuCalendar size={14} className="text-gray-500" aria-hidden />
                                    <span className="text-gray-600">Date Created</span>
                                    <span className="font-medium text-gray-900">{formatIso(doc!.createdAt)}</span>
                                </span>
                                <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                <span className="inline-flex items-center gap-2">
                                    <LuClock3 size={14} className="text-gray-500" aria-hidden />
                                    <span className="text-gray-600">Last updated</span>
                                    <span className="font-medium text-gray-900">{formatIso(v?.uploadedAt ?? doc!.createdAt)}</span>
                                </span>
                            </div>
                        </div>
                        ) : null}

                        {createMode || inlineEdit ? (
                            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-3">
                                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                                    {createMode ? (
                                        <DocumentUploadForm
                                            open
                                            draftStorageKey={ARRIS_DOCUMENT_UPLOAD_DRAFT_KEY}
                                            onCancel={onBackToList}
                                            onSuccess={(createdId?: string) => {
                                                setStatusModal({
                                                    open: true,
                                                    type: 'success',
                                                    title: 'Document created',
                                                    subtitle: 'Redirecting to document…',
                                                });
                                                window.setTimeout(() => {
                                                    if (createdId) router.replace(`/company-admin/documents-compliance/view/${encodeURIComponent(createdId)}`);
                                                    else onBackToList();
                                                }, 1700);
                                            }}
                                            uploadedBy={actorName}
                                            userRole={actorRole}
                                        />
                                    ) : (
                                        <DocumentEditForm
                                            open
                                            documentId={documentId}
                                            onCancel={() => router.replace(`/company-admin/documents-compliance/view/${encodeURIComponent(documentId)}`)}
                                            onSuccess={() => {
                                                setStatusModal({
                                                    open: true,
                                                    type: 'success',
                                                    title: 'Changes saved',
                                                    subtitle: 'Returning to document…',
                                                });
                                                window.setTimeout(() => {
                                                    router.replace(`/company-admin/documents-compliance/view/${encodeURIComponent(documentId)}`);
                                                }, 1700);
                                            }}
                                            actorName={actorName}
                                            actorRole={actorRole}
                                        />
                                    )}
                                </div>

                                <AICopilotPanel title="AI Document Copilot" className="w-full lg:sticky lg:top-44 lg:self-start">
                                    <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Create / edit guidance</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {createMode
                                                ? 'Fill required metadata and upload the file. Validation will guide you to missing fields.'
                                                : 'Review fields carefully. Save will validate required compliance metadata.'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Tip</p>
                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                            Use Categories + Allowed roles to control compliance visibility across teams.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className={cn(CTA_UTILITY_BTN, 'disabled:opacity-60')}
                                        onClick={onOpenVersions}
                                        disabled={createMode}
                                    >
                                        <LuGitBranch size={16} className="shrink-0" aria-hidden />
                                        <span className="whitespace-nowrap">Review versions</span>
                                    </button>
                                </AICopilotPanel>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-3">
                                {/* Left: simple neat details */}
                                <DocumentDetailBody doc={doc!} />

                                {/* Right: AI copilot (same pattern as Leads) */}
                                <AICopilotPanel title="AI Document Copilot" className="w-full lg:sticky lg:top-44 lg:self-start">
                                    <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Next action</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {docStatus === 'Expired'
                                                ? 'Renew / replace the document and upload the latest version.'
                                                : !doc!.expiryDate
                                                    ? 'Add an expiry date to enable compliance monitoring.'
                                                    : 'Review access roles and confirm the latest file version is correct.'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Risk signals</p>
                                        <ul className="mt-2 space-y-1 text-sm text-slate-700">
                                            <li className="flex gap-2">
                                                <span className="text-slate-500">Status:</span>
                                                <span className={cn('font-semibold', docStatus === 'Expired' ? 'text-rose-700' : 'text-emerald-700')}>
                                                    {docStatus}
                                                </span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-slate-500">Expiry:</span>
                                                <span className="font-medium text-slate-800">{doc!.expiryDate ? formatShortDate(doc!.expiryDate) : '—'}</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-slate-500">Access:</span>
                                                <span className="font-medium text-slate-800 capitalize">
                                                    {doc!.accessLevel} ({doc!.allowedRoles.length} role{doc!.allowedRoles.length === 1 ? '' : 's'})
                                                </span>
                                            </li>
                                        </ul>
                                    </div>

                                    {complianceAlerts.length > 0 ? (
                                        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 px-3 py-2">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">Compliance notes</p>
                                            <ul className="mt-2 space-y-1 text-sm">
                                                {complianceAlerts.slice(0, 4).map((a) => (
                                                    <li key={a.id} className={cn('font-medium', a.severity === 'danger' ? 'text-rose-800' : 'text-amber-900')}>
                                                        {a.message}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Insight</p>
                                            <p className="mt-1 text-sm font-medium text-slate-800">No compliance alerts detected for the current fields.</p>
                                        </div>
                                    )}

                                    <button type="button" className={CTA_UTILITY_BTN} onClick={onOpenVersions}>
                                        <LuGitBranch size={16} className="shrink-0" aria-hidden />
                                        <span className="whitespace-nowrap">Review versions</span>
                                    </button>
                                </AICopilotPanel>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                        <RecordHistoryLogPanel
                            module="documents"
                            recordId={doc!.id}
                            recordTitle={doc!.name}
                            globalHistoryHref="/company-admin/history-logs?module=documents"
                        />
                    </div>
                )}
            </div>

            <StatusModal
                open={statusModal.open}
                onClose={() => setStatusModal((s) => ({ ...s, open: false }))}
                type={statusModal.type}
                title={statusModal.title}
                subtitle={statusModal.subtitle}
            />
        </div>
    );
}
