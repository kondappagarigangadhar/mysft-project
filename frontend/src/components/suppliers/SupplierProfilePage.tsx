'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { SupplierKpiCard } from '@/components/suppliers/common/SupplierKpiCard';
import { normalizeSupplierDetailTab, type SupplierMainTabId } from '@/components/suppliers/detail/supplierDetailTabIds';
import {
    buildSupplierInlineDraft,
    SupplierInlineOverviewEditor,
    type SupplierInlineDraft,
    type SupplierInlineErrorKey,
} from '@/components/suppliers/SupplierInlineOverviewEditor';
import { SupplierOverviewProcurementSections } from '@/components/suppliers/SupplierOverviewProcurementSections';
import {
    loadSupplierRelationsDraft,
    persistSupplierRelationsDraft,
    relationsDraftIsDirty,
    validateRelationsDraft,
    type RelationsFieldErrors,
    type SupplierRelationsDraft,
} from '@/lib/suppliers/supplierOverviewRelations';
import { SupplierMainTabBar } from '@/components/suppliers/SupplierMainTabBar';
import { SupplierRatingBadge, SupplierStatusBadge } from '@/components/suppliers/SupplierShared';
import { SupplierPerformanceTabPanel } from '@/components/suppliers/detail/SupplierPerformanceTabPanel';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import type { SupplierStatus, SupplierType } from '@/lib/suppliers/types';
import {
    cloneSupplierRecord,
    deleteSupplierRecord,
    getAllSupplierRecords,
    getSupplierRecordById,
    patchSupplierRecord,
    saveSupplierFromForm,
    SUPPLIER_STORE_UPDATED_EVENT,
} from '@/lib/suppliers/supplierStore';
import {
    getSupplierPerformanceBySupplierId,
    SUPPLIER_RELATIONS_UPDATED_EVENT,
} from '@/lib/suppliers/supplierRelationsStore';
import { getSupplierRecordActivityLogs, SUPPLIER_RECORD_ACTIVITY_EVENT, appendSupplierRecordActivity } from '@/lib/suppliers/supplierRecordActivityLog';
import { cn } from '@/lib/utils';
import { WorkspaceUtilityToolbar, SUPPLIER_WORKSPACE_HELP } from '@/components/workspace-help';
import { LuArrowRight, LuBot, LuCopy, LuDownload, LuMail, LuPencil, LuPlus, LuPrinter, LuShare2, LuTrash2, LuCheck, LuClock } from 'react-icons/lu';

const utilityBtn =
    'inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-slate-800';

const SUPPLIER_TYPE_OPTIONS: SupplierType[] = ['Manufacturer', 'Distributor', 'Trader', 'Service'];
const SUPPLIER_STATUS_OPTIONS: SupplierStatus[] = ['Pending', 'Active', 'Inactive', 'Suspended'];
const NAME_REGEX = /^[A-Za-z][A-Za-z\s.&'-]*$/;
const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SupplierNote = { id: string; text: string; by: string; at: string };
function notesKey(supplierId: string) {
    return `arris-supplier-notes-v1:${supplierId}`;
}
function loadNotes(supplierId: string): SupplierNote[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(notesKey(supplierId));
        if (!raw) return [];
        const parsed = JSON.parse(raw) as SupplierNote[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}
function persistNotes(supplierId: string, next: SupplierNote[]) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(notesKey(supplierId), JSON.stringify(next));
}

function downloadSupplierJson(record: NonNullable<ReturnType<typeof getSupplierRecordById>>) {
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.id}-supplier.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function downloadJson(filename: string, rows: unknown) {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function makeCreateSupplierId(existingIds: Set<string>): string {
    let attempts = 0;
    while (attempts < 20000) {
        const candidate = `SUP-${Math.floor(3000 + Math.random() * 7000)}`;
        if (!existingIds.has(candidate)) return candidate;
        attempts += 1;
    }
    return `SUP-${Date.now()}`;
}

export function SupplierProfilePage({ supplierId }: { supplierId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const createMode = supplierId === 'new';
    const [listVersion, setListVersion] = useState(0);
    const supplier = useMemo(() => getSupplierRecordById(supplierId), [supplierId, listVersion]);
    const [createSupplierId] = useState(() => {
        const existingIds = new Set(getAllSupplierRecords().map((r) => r.id));
        return makeCreateSupplierId(existingIds);
    });
    const createSupplierRecord = useMemo(() => {
        const nowIso = new Date().toISOString();
        const ymd = nowIso.slice(0, 10);
        return {
            id: createSupplierId,
            name: '',
            type: 'Distributor' as SupplierType,
            categories: [],
            contactPerson: '',
            phone: '',
            email: '',
            city: '',
            status: 'Pending' as SupplierStatus,
            rating: 0,
            createdAt: ymd,
            updatedAt: ymd,
            address: '',
        };
    }, [createSupplierId]);

    const supplierRecord = useMemo(() => (createMode ? createSupplierRecord : supplier), [createMode, createSupplierRecord, supplier]);

    const bump = useCallback(() => setListVersion((x) => x + 1), []);

    useEffect(() => {
        const sync = () => bump();
        window.addEventListener(SUPPLIER_STORE_UPDATED_EVENT, sync);
        return () => window.removeEventListener(SUPPLIER_STORE_UPDATED_EVENT, sync);
    }, [bump]);

    useEffect(() => {
        const sync = () => bump();
        window.addEventListener(SUPPLIER_RELATIONS_UPDATED_EVENT, sync);
        return () => window.removeEventListener(SUPPLIER_RELATIONS_UPDATED_EVENT, sync);
    }, [bump]);

    const [tab, setTabState] = useState<SupplierMainTabId>(() => {
        const initial = normalizeSupplierDetailTab(searchParams.get('tab'));
        return createMode ? 'overview' : initial;
    });

    const setTab = useCallback(
        (next: SupplierMainTabId) => {
            if (createMode && next !== 'overview') return;
            setTabState(next);
            const qs = new URLSearchParams(searchParams.toString());
            qs.set('tab', next);
            const q = qs.toString();
            router.replace(
                q ? `/company-admin/suppliers/${encodeURIComponent(supplierId)}?${q}` : `/company-admin/suppliers/${encodeURIComponent(supplierId)}`,
                { scroll: false },
            );
        },
        [router, searchParams, supplierId, createMode],
    );

    useEffect(() => {
        const next = normalizeSupplierDetailTab(searchParams.get('tab'));
        setTabState(createMode ? 'overview' : next);
    }, [searchParams, createMode]);

    const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null);
    const [banner, setBanner] = useState<string | null>(null);

    const s = supplierRecord ?? createSupplierRecord;

    const [notes, setNotes] = useState<SupplierNote[]>(() => []);
    const [notesDraft, setNotesDraft] = useState('');
    useEffect(() => {
        setNotes(loadNotes(supplierId));
    }, [supplierId]);

    const addNote = useCallback(() => {
        const text = notesDraft.trim();
        if (!text) return;
        const now = new Date();
        const next: SupplierNote = { id: `sn-${now.getTime()}`, text, by: 'Admin', at: now.toISOString().slice(0, 10) };
        setNotes((prev) => {
            const updated = [next, ...prev];
            persistNotes(supplierId, updated);
            return updated;
        });
        setNotesDraft('');
        appendSupplierRecordActivity({
            user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
            recordId: supplierId,
            recordLabel: s.name,
            action: 'Internal note added',
            changes: text.length > 120 ? `${text.slice(0, 120)}…` : text,
            severity: 'info',
            actionType: 'note_added',
        });
        setToast({ msg: 'Note saved.', err: false });
    }, [notesDraft, supplierId, s.name]);

    const notFound = !supplierRecord && !createMode;

    const performanceDeliveries = useMemo(
        () => (createMode ? [] : getSupplierPerformanceBySupplierId(supplierId)),
        [createMode, supplierId, listVersion],
    );
    const onTimePctDisplay = useMemo(() => {
        const total = performanceDeliveries.length;
        if (!total) return null;
        const delayed = performanceDeliveries.filter((r) => r.delayDays > 0).length;
        return Math.round(((total - delayed) / total) * 100);
    }, [performanceDeliveries]);

    const [activityLogVersion, setActivityLogVersion] = useState(0);
    useEffect(() => {
        const fn = () => setActivityLogVersion((x) => x + 1);
        window.addEventListener(SUPPLIER_RECORD_ACTIVITY_EVENT, fn);
        return () => window.removeEventListener(SUPPLIER_RECORD_ACTIVITY_EVENT, fn);
    }, []);

    const supplementalHistoryEntries = useMemo(() => getSupplierRecordActivityLogs(s.id), [s.id, activityLogVersion]);

    const [isInlineEditing, setIsInlineEditing] = useState<boolean>(() => createMode);
    const [inlineDraft, setInlineDraft] = useState<SupplierInlineDraft>(() => buildSupplierInlineDraft(s));
    const [inlineErrors, setInlineErrors] = useState<Partial<Record<SupplierInlineErrorKey, string>>>({});
    const [inlineSaving, setInlineSaving] = useState(false);
    const [showInlineErrors, setShowInlineErrors] = useState<boolean>(() => !createMode);
    const [savedDraft, setSavedDraft] = useState(false);

    const [relationsDraft, setRelationsDraft] = useState<SupplierRelationsDraft>(() =>
        createMode ? { materials: [], pricing: [], capacity: [], compliance: [], selections: [] } : loadSupplierRelationsDraft(supplierId),
    );
    const [relationsBaseline, setRelationsBaseline] = useState<SupplierRelationsDraft>(() =>
        createMode ? { materials: [], pricing: [], capacity: [], compliance: [], selections: [] } : loadSupplierRelationsDraft(supplierId),
    );
    const [relationsErrors, setRelationsErrors] = useState<RelationsFieldErrors>({});

    useEffect(() => {
        if (createMode) return;
        const loaded = loadSupplierRelationsDraft(s.id);
        if (!isInlineEditing) {
            setRelationsDraft(loaded);
            setRelationsBaseline(loaded);
            setRelationsErrors({});
        }
    }, [createMode, isInlineEditing, s.id, listVersion]);

    useEffect(() => {
        if (createMode || !isInlineEditing) return;
        const loaded = loadSupplierRelationsDraft(s.id);
        setRelationsDraft(loaded);
        setRelationsBaseline(loaded);
        setRelationsErrors({});
    }, [createMode, isInlineEditing, s.id]);

    useEffect(() => {
        if (isInlineEditing) return;
        setInlineDraft(buildSupplierInlineDraft(s));
        setInlineErrors({});
        setShowInlineErrors(!createMode);
    }, [isInlineEditing, s.id, s.name, s.type, s.status, s.city, s.phone, s.email, s.contactPerson, s.address, s.categories]);

    /** URL-driven edit entry (same idea as Leads/Vendors using query flags). */
    useEffect(() => {
        const wantsEdit = searchParams.get('edit') === '1';
        if (!wantsEdit) return;
        if (createMode) return;
        setIsInlineEditing(true);
        setShowInlineErrors(true);
    }, [searchParams]);

    const changedByKey = useMemo(() => {
        return {
            name: inlineDraft.name.trim() !== s.name.trim(),
            type: inlineDraft.type !== s.type,
            categories: inlineDraft.categories.join('|') !== s.categories.join('|'),
            contactPerson: inlineDraft.contactPerson.trim() !== s.contactPerson.trim(),
            phone: inlineDraft.phone.trim() !== s.phone.trim(),
            email: inlineDraft.email.trim() !== s.email.trim(),
            city: inlineDraft.city.trim() !== s.city.trim(),
            status: inlineDraft.status !== s.status,
            address: inlineDraft.address.trim() !== (s.address ?? '').trim(),
        } satisfies Partial<Record<SupplierInlineErrorKey, boolean>>;
    }, [inlineDraft, s]);

    const isInlineDirty = useMemo(() => Object.values(changedByKey).some(Boolean), [changedByKey]);
    const relationsDirty = useMemo(
        () => relationsDraftIsDirty(relationsBaseline, relationsDraft),
        [relationsBaseline, relationsDraft],
    );
    const hasUnsavedChanges = isInlineDirty || relationsDirty;

    const onboarding = useMemo(() => {
        const profile = createMode
            ? {
                  name: inlineDraft.name,
                  contactPerson: inlineDraft.contactPerson,
                  phone: inlineDraft.phone,
                  type: inlineDraft.type,
                  status: inlineDraft.status,
                  city: inlineDraft.city,
                  categories: inlineDraft.categories,
              }
            : s;
        const detailsComplete =
            Boolean(profile.name?.trim()) &&
            Boolean(profile.contactPerson?.trim()) &&
            Boolean(profile.phone?.trim()) &&
            Boolean(profile.type?.trim()) &&
            Boolean(profile.status?.trim()) &&
            Boolean(profile.city?.trim()) &&
            Boolean(profile.categories?.length);
        const materialsAdded = (relationsDraft.materials?.length ?? 0) > 0;
        const pricingAdded = (relationsDraft.pricing?.length ?? 0) > 0;
        const capacityAdded = (relationsDraft.capacity?.length ?? 0) > 0;
        const complianceAdded = (relationsDraft.compliance?.length ?? 0) > 0;
        const activated = createMode ? inlineDraft.status === 'Active' : s.status === 'Active';
        const steps = [
            { label: 'Supplier Details', done: detailsComplete },
            { label: 'Materials Added', done: materialsAdded },
            { label: 'Pricing Added', done: pricingAdded },
            { label: 'Pending Activation', done: activated },
        ];
        const readinessScore =
            (detailsComplete ? 20 : 0) +
            (materialsAdded ? 20 : 0) +
            (pricingAdded ? 20 : 0) +
            (complianceAdded ? 20 : 0) +
            (capacityAdded ? 20 : 0);
        return { steps, readinessScore };
    }, [s, relationsDraft, createMode, inlineDraft]);

    const scrollToAnchor = useCallback((anchor: string) => {
        const el = document.querySelector(`[data-supplier-overview-anchor=\"${anchor}\"]`) as HTMLElement | null;
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const validateInline = useCallback((d: SupplierInlineDraft) => {
        const e: Partial<Record<SupplierInlineErrorKey, string>> = {};
        if (!d.name.trim()) e.name = 'Supplier name is required.';
        else if (!NAME_REGEX.test(d.name.trim())) e.name = 'Use letters and common name characters only.';
        if (!d.type?.trim()) e.type = 'Supplier type is required.';
        if (!d.categories?.length) e.categories = 'Select at least one category.';
        if (!d.contactPerson.trim()) e.contactPerson = 'Contact person is required.';
        else if (!NAME_REGEX.test(d.contactPerson.trim())) e.contactPerson = 'Use letters and common name characters only.';
        if (!d.phone.trim()) e.phone = 'Phone is required (10 digits).';
        else if (!PHONE_REGEX.test(d.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number.';
        if (d.email.trim() && !EMAIL_REGEX.test(d.email.trim())) e.email = 'Enter a valid email address.';
        if (!d.city.trim()) e.city = 'City is required.';
        if (!d.status?.trim()) e.status = 'Status is required.';
        return e;
    }, []);

    const onInlineDraftChange = useCallback(<K extends SupplierInlineErrorKey>(key: K, value: SupplierInlineDraft[K]) => {
        setInlineDraft((prev) => ({ ...prev, [key]: value }));
        if (showInlineErrors) {
            setInlineErrors((prev) => {
                if (!prev[key]) return prev;
                const copy = { ...prev };
                delete copy[key];
                return copy;
            });
        }
    }, [showInlineErrors]);

    const onInlineEditCancel = useCallback(() => {
        if (createMode) {
            router.push('/company-admin/suppliers/list');
            return;
        }
        if (hasUnsavedChanges) {
            const ok = window.confirm('You have unsaved changes. Discard them?');
            if (!ok) return;
        }
        setIsInlineEditing(false);
        setInlineDraft(buildSupplierInlineDraft(s));
        setInlineErrors({});
        if (!createMode) {
            const loaded = loadSupplierRelationsDraft(s.id);
            setRelationsDraft(loaded);
            setRelationsBaseline(loaded);
            setRelationsErrors({});
        }
    }, [buildSupplierInlineDraft, hasUnsavedChanges, s, createMode, router]);

    const onInlineEditSave = useCallback(async () => {
        setShowInlineErrors(true);
        const nextErrors = validateInline(inlineDraft);
        setInlineErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setToast({ msg: 'Please fix the highlighted fields.', err: true });
            return;
        }

        const relErrors = validateRelationsDraft(relationsDraft);
        setRelationsErrors(relErrors);
        if (Object.keys(relErrors).length > 0) {
            const sections = new Set<string>();
            Object.keys(relErrors).forEach((k) => {
                const section = k.split(':')[0] ?? '';
                if (section) sections.add(section);
            });
            const label =
                sections.size > 0
                    ? Array.from(sections)
                          .map((sec) =>
                              sec === 'material'
                                  ? 'Materials'
                                  : sec === 'pricing'
                                    ? 'Pricing'
                                    : sec === 'capacity'
                                      ? 'Capacity'
                                      : sec === 'compliance'
                                        ? 'Compliance'
                                        : sec === 'selection'
                                          ? 'Procurement selection'
                                          : sec,
                          )
                          .join(', ')
                    : 'the sections';
            setToast({ msg: `Please fix fields in: ${label}.`, err: true });
            return;
        }

        if (createMode) {
            setInlineSaving(true);
            try {
                saveSupplierFromForm({
                    supplierId: createSupplierId,
                    supplierName: inlineDraft.name,
                    supplierType: inlineDraft.type,
                    categories: inlineDraft.categories,
                    contactPerson: inlineDraft.contactPerson,
                    phone: inlineDraft.phone,
                    email: inlineDraft.email,
                    address: inlineDraft.address,
                    city: inlineDraft.city,
                    status: inlineDraft.status,
                });
                if (relationsDirty) {
                    const relRes = persistSupplierRelationsDraft(createSupplierId, relationsDraft, relationsBaseline);
                    if (!relRes.ok) {
                        setToast({ msg: relRes.error, err: true });
                        return;
                    }
                }
                setSavedDraft(false);
                setToast({ msg: 'Supplier created.', err: false });
                window.setTimeout(() => {
                    router.replace(`/company-admin/suppliers/${encodeURIComponent(createSupplierId)}?tab=overview`);
                }, 500);
            } finally {
                setInlineSaving(false);
            }
            return;
        }

        setInlineSaving(true);
        try {
            const patch = {
                name: inlineDraft.name.trim(),
                type: inlineDraft.type,
                categories: inlineDraft.categories,
                contactPerson: inlineDraft.contactPerson.trim(),
                phone: inlineDraft.phone.trim(),
                email: inlineDraft.email.trim(),
                city: inlineDraft.city.trim(),
                status: inlineDraft.status,
                address: inlineDraft.address.trim(),
            };
            const updated = patchSupplierRecord(s.id, patch);
            if (!updated) {
                setToast({ msg: 'Could not save supplier changes.', err: true });
                return;
            }
            if (relationsDirty) {
                const relRes = persistSupplierRelationsDraft(s.id, relationsDraft, relationsBaseline);
                if (!relRes.ok) {
                    setToast({ msg: relRes.error, err: true });
                    return;
                }
                bump();
            }
            const loadedRelations = loadSupplierRelationsDraft(s.id);
            setRelationsDraft(loadedRelations);
            setRelationsBaseline(loadedRelations);
            setToast({ msg: 'Supplier updated.', err: false });
            setIsInlineEditing(false);
            setRelationsErrors({});
        } finally {
            setInlineSaving(false);
        }
    }, [inlineDraft, s.id, validateInline, createMode, createSupplierId, router, relationsDraft, relationsBaseline, relationsDirty, bump]);

    if (notFound) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                <p>Supplier not found.</p>
                <Link href="/company-admin/suppliers/list" className="mt-3 inline-block font-medium text-[var(--cta-button-bg)] underline-offset-2 hover:underline">
                    Back to supplier list
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 space-y-0">
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={() => setToast(null)} /> : null}
            <Breadcrumb items={[{ label: 'Supplier List', href: '/company-admin/suppliers/list' }, { label: createMode ? 'Create supplier' : s.name }]} />
            <SupplierMainTabBar
                active={tab}
                onChange={setTab}
                disabledTabs={
                    createMode
                        ? {
                              performance: true,
                              notes: true,
                              history: true,
                          }
                        : undefined
                }
            />

            {banner ? (
                <div className="mt-3 rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm">{banner}</div>
            ) : null}

            {tab === 'overview' ? (
                <>
                    <div className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            {!createMode ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant={isInlineEditing ? 'companyOutline' : 'company'}
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() => setIsInlineEditing(true)}
                                        disabled={inlineSaving}
                                    >
                                        <LuPencil size={14} />
                                        {isInlineEditing ? 'Editing' : 'Edit'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() => {
                                            const copy = cloneSupplierRecord(s.id);
                                            if (!copy) {
                                                setToast({ msg: 'Could not clone supplier.', err: true });
                                                return;
                                            }
                                            setToast({ msg: `Cloned to ${copy.name}.`, err: false });
                                            router.push(`/company-admin/suppliers/${encodeURIComponent(copy.id)}`);
                                        }}
                                    >
                                        <LuCopy size={14} />
                                        Clone
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={async () => {
                                            const url = `${window.location.origin}/company-admin/suppliers/${encodeURIComponent(s.id)}`;
                                            try {
                                                await window.navigator.clipboard.writeText(url);
                                                setToast({ msg: 'Link copied.', err: false });
                                            } catch {
                                                setToast({ msg: 'Could not copy link.', err: true });
                                            }
                                        }}
                                    >
                                        <LuShare2 size={14} />
                                        Share
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="sm"
                                        className="gap-1.5 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                        disabled={inlineSaving}
                                        onClick={() => {
                                            const ok = window.confirm(`Delete supplier “${s.name}”? This cannot be undone.`);
                                            if (!ok) return;
                                            const done = deleteSupplierRecord(s.id);
                                            if (!done) {
                                                setToast({ msg: 'Could not delete supplier.', err: true });
                                                return;
                                            }
                                            setToast({ msg: 'Supplier deleted.', err: false });
                                            router.push('/company-admin/suppliers/list');
                                        }}
                                    >
                                        <LuTrash2 size={14} />
                                        Archive
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="sm"
                                        className="gap-1.5"
                                        disabled={inlineSaving || isInlineEditing}
                                        onClick={() => router.push('/company-admin/suppliers/new')}
                                    >
                                        <LuPlus size={14} />
                                        New
                                    </Button>
                                </div>
                            ) : (
                                <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--cta-button-bg)] shadow-sm">
                                    Create mode
                                </span>
                            )}
                            <WorkspaceUtilityToolbar
                                help={SUPPLIER_WORKSPACE_HELP}
                                triggerLabel="Supplier workspace help"
                                email={s.email}
                                onExport={() => downloadSupplierJson(s)}
                            />
                        </div>
                    </div>

                    {!createMode ? (
                        <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                                <span className="inline-flex items-center gap-2">
                                    <span className="text-gray-600">Date created</span>
                                    <span className="font-medium text-gray-900">{s.createdAt}</span>
                                </span>
                                <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                <span className="inline-flex items-center gap-2">
                                    <span className="text-gray-600">Last updated</span>
                                    <span className="font-medium text-gray-900">{s.updatedAt ?? s.createdAt}</span>
                                </span>
                            </div>
                        </div>
                    ) : null}
                </>
            ) : null}

            <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                {tab === 'overview' ? (
                    <section className="space-y-4">
                        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-stretch">
                            <div className="min-w-0 space-y-4 xl:col-span-8">
                                <div className="flex min-w-0 flex-col rounded-xl border border-gray-200/80 bg-white shadow-sm">
                                    <div className="bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-3.5">
                                                <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-50 text-lg font-semibold text-gray-700 ring-1 ring-gray-200/80">
                                                    {s.name
                                                        .trim()
                                                        .split(/\s+/)
                                                        .map((w) => w[0])
                                                        .filter(Boolean)
                                                        .slice(0, 2)
                                                        .join('')
                                                        .toUpperCase() || '—'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-900">
                                                            {createMode ? inlineDraft.name.trim() || 'New supplier' : s.name}
                                                        </h1>
                                                        {isInlineEditing ? (
                                                            <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--cta-button-bg)] shadow-sm">
                                                                Editing Mode
                                                            </span>
                                                        ) : null}
                                                        <SupplierStatusBadge status={s.status} />
                                                        <SupplierRatingBadge rating={s.rating} />
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-600">
                                                        {createMode ? inlineDraft.type : s.type} ·{' '}
                                                        {(createMode ? inlineDraft.categories : s.categories).join(', ') || '—'} ·{' '}
                                                        {createMode ? inlineDraft.city || '—' : s.city}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-semibold text-slate-600">Onboarding Progress</span>
                                                        {onboarding.steps.map((st) => (
                                                            <span
                                                                key={st.label}
                                                                className={cn(
                                                                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                                                                    st.done
                                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                                        : 'border-slate-200 bg-slate-50 text-slate-700',
                                                                )}
                                                            >
                                                                {st.done ? <LuCheck size={12} /> : <LuClock size={12} />}
                                                                {st.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div
                                    className={cn(
                                        'space-y-4',
                                        (isInlineEditing || createMode) &&
                                            'rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] p-3',
                                    )}
                                >
                                    <SupplierInlineOverviewEditor
                                        supplier={s}
                                        isEditing={isInlineEditing}
                                        draft={inlineDraft}
                                        errors={inlineErrors}
                                        onDraftChange={onInlineDraftChange}
                                        changedByKey={changedByKey}
                                        typeOptions={SUPPLIER_TYPE_OPTIONS}
                                        statusOptions={SUPPLIER_STATUS_OPTIONS}
                                        suppressEditingChrome
                                    />

                                    <SupplierOverviewProcurementSections
                                        supplierId={createMode ? createSupplierId : s.id}
                                        isEditing={isInlineEditing}
                                        onRequestEdit={() => {
                                            setIsInlineEditing(true);
                                            setShowInlineErrors(true);
                                        }}
                                        materials={relationsDraft.materials}
                                        pricing={relationsDraft.pricing}
                                        capacity={relationsDraft.capacity}
                                        compliance={relationsDraft.compliance}
                                        selections={relationsDraft.selections}
                                        errors={relationsErrors}
                                        onMaterialsChange={(materials) => setRelationsDraft((prev) => ({ ...prev, materials }))}
                                        onPricingChange={(pricing) => setRelationsDraft((prev) => ({ ...prev, pricing }))}
                                        onCapacityChange={(capacity) => setRelationsDraft((prev) => ({ ...prev, capacity }))}
                                        onComplianceChange={(compliance) => setRelationsDraft((prev) => ({ ...prev, compliance }))}
                                        onSelectionsChange={(selections) => setRelationsDraft((prev) => ({ ...prev, selections }))}
                                    />
                                </div>

                                {isInlineEditing && !createMode ? (
                                    <div className="sticky bottom-0 z-30 mt-4 pb-1">
                                        <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                                            <div className="flex items-center gap-3">
                                                <p className="text-sm font-semibold text-gray-900">Unsaved changes</p>
                                                {!hasUnsavedChanges ? (
                                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                                        Up to date
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                                                <Button type="button" variant="companyOutline" size="cta" onClick={onInlineEditCancel} disabled={inlineSaving}>
                                                    Cancel
                                                </Button>
                                                <Button type="button" variant="company" size="cta" onClick={() => void onInlineEditSave()} isLoading={inlineSaving} disabled={!hasUnsavedChanges}>
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {createMode ? (
                                    <div className="sticky bottom-0 z-30 mt-4 pb-1">
                                        <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                                            <div className="flex items-center gap-3">
                                                <p className="text-sm font-semibold text-gray-900">Create supplier</p>
                                                <p className="text-xs font-medium text-slate-500">
                                                    {savedDraft ? (
                                                        <>
                                                            Draft saved (demo) · <span className="tabular-nums text-gray-700">this session</span>
                                                        </>
                                                    ) : (
                                                        'Complete details, materials, pricing, and more — then create supplier.'
                                                    )}
                                                </p>
                                            </div>
                                            <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                                                <Button type="button" variant="companyOutline" size="cta" onClick={onInlineEditCancel} disabled={inlineSaving}>
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="companyOutline"
                                                    size="cta"
                                                    onClick={() => setSavedDraft(true)}
                                                    disabled={inlineSaving}
                                                >
                                                    Save draft
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="company"
                                                    size="cta"
                                                    onClick={() => void onInlineEditSave()}
                                                    isLoading={inlineSaving}
                                                >
                                                    Create supplier
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <aside className="w-full rounded-xl border border-slate-200 bg-linear-to-br from-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] via-white to-[color-mix(in_srgb,var(--cta-button-hover-bg)_10%,white)] p-4 shadow-sm xl:col-span-4 xl:sticky xl:top-44 xl:self-start">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-lg bg-[var(--cta-button-bg)] p-1.5 text-white">
                                        <LuBot size={14} />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-900">Supplier insights</h3>
                                </div>
                                <div className="mt-3 space-y-2 text-xs">
                                    <div className="rounded-lg border border-slate-200 bg-white/80 p-2.5">
                                        <p className="font-semibold text-slate-500">PROCUREMENT READINESS</p>
                                        <div className="mt-1 flex items-center justify-between gap-3">
                                            <p className="text-sm font-semibold text-slate-900 tabular-nums">{onboarding.readinessScore}%</p>
                                            <span
                                                className={cn(
                                                    'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                                                    onboarding.readinessScore >= 80
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                        : onboarding.readinessScore >= 60
                                                          ? 'border-amber-200 bg-amber-50 text-amber-900'
                                                          : 'border-slate-200 bg-slate-50 text-slate-700',
                                                )}
                                            >
                                                {onboarding.readinessScore >= 80 ? 'Procurement-ready' : onboarding.readinessScore >= 60 ? 'Nearly ready' : 'Needs setup'}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-[var(--cta-button-bg)]"
                                                style={{ width: `${Math.min(100, Math.max(0, onboarding.readinessScore))}%` }}
                                            />
                                        </div>
                                        <p className="mt-1 text-[11px] font-medium text-slate-600">Calculated from details, materials, pricing, capacity, and compliance.</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white/80 p-2.5">
                                        <p className="font-semibold text-slate-500">HEALTH</p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">
                                            Rating {s.rating.toFixed(1)} · {s.status === 'Active' ? 'Eligible for new POs' : 'Review before awarding'}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5">
                                        <p className="font-semibold text-amber-700">WATCHLIST</p>
                                        <p className="mt-1 text-sm font-medium text-amber-950">Review expiring compliance docs in the supplier record.</p>
                                    </div>
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5">
                                        <p className="font-semibold text-emerald-700">ON-TIME</p>
                                        <p className="mt-1 text-sm font-medium text-emerald-900">
                                            {onTimePctDisplay != null ? `${onTimePctDisplay}%` : '—'} on-time (from Performance tab)
                                        </p>
                                    </div>
                                </div>
                                <Button variant="company" size="sm" className="mt-3 w-full gap-1.5" onClick={() => setBanner('Sourcing workflow opened (demo).')}>
                                    Run sourcing check
                                    <LuArrowRight size={14} />
                                </Button>
                            </aside>
                        </div>
                    </section>
                ) : null}

                {tab === 'performance' ? <SupplierPerformanceTabPanel supplierId={s.id} supplierName={s.name} onToast={setToast} /> : null}

                {tab === 'notes' ? (
                    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
                            <p className="text-xs text-slate-500">{notes.length} note(s)</p>
                        </div>
                        <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
                            <article className="xl:col-span-4 xl:sticky xl:top-28">
                                <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3">
                                    <textarea
                                        value={notesDraft}
                                        onChange={(e) => setNotesDraft(e.target.value)}
                                        rows={8}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                                        placeholder="Add an internal note..."
                                    />
                                    <div className="mt-3 flex items-center justify-end gap-2">
                                        <Button variant="company" size="sm" className="h-9 px-3 text-sm" onClick={addNote} disabled={!notesDraft.trim()}>
                                            Save note
                                        </Button>
                                    </div>
                                </div>
                            </article>
                            <article className="xl:col-span-8">
                                <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
                                    {notes.length ? (
                                        notes.map((n) => (
                                            <div key={n.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                                <p className="whitespace-pre-wrap text-sm font-medium text-slate-900">{n.text}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {n.by} · {n.at}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">No notes yet.</p>
                                    )}
                                </div>
                            </article>
                        </div>
                    </section>
                ) : null}

                {tab === 'history' ? (
                    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                        <RecordHistoryLogPanel
                            module="suppliers"
                            recordId={s.id}
                            recordTitle={s.name}
                            supplementalEntries={supplementalHistoryEntries}
                            globalHistoryHref="/company-admin/history-logs"
                        />
                    </section>
                ) : null}
            </div>
        </div>
    );
}
