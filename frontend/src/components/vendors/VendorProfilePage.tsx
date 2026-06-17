'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { VendorDetailMoreMenu } from '@/components/vendors/VendorDetailMoreMenu';
import {
    buildVendorInlineDraft,
    categoriesCsvToList,
    VendorInlineOverviewEditor,
    VENDOR_INLINE_FIELD_IDS,
    type VendorInlineDraft,
    type VendorInlineErrorKey,
} from '@/components/vendors/VendorInlineOverviewEditor';
import { VendorMainTabBar, type VendorMainTabId } from '@/components/vendors/detail/VendorMainTabBar';
import { normalizeVendorDetailTab } from '@/components/vendors/detail/vendorDetailTabIds';
import { AddContractModal } from '@/components/vendors/shared/VendorCrudModals';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import {
    MOCK_VENDOR_CONTRACTS,
    MOCK_VENDOR_DOCUMENTS,
    MOCK_VENDOR_FEEDBACK,
    MOCK_VENDOR_HISTORY,
} from '@/lib/vendors/mockData';
import { VendorLinkedProjectCard } from '@/components/vendors/VendorLinkedProjectCard';
import { getWorkOrderProjectOptions } from '@/lib/work-orders/workOrderCatalog';
import type { VendorContract, VendorDocument, VendorStatus, VendorType } from '@/lib/vendors/types';
import { cn } from '@/lib/utils';
import { WorkspaceUtilityToolbar, VENDOR_WORKSPACE_HELP } from '@/components/workspace-help';
import { CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';
import {
    getAllVendorRecords,
    getVendorRecordById,
    patchVendorRecord,
    saveVendorFromForm,
    type VendorRecord,
    VENDOR_STORE_UPDATED_EVENT,
} from '@/lib/vendors/vendorStore';
import { appendModuleContract, getModuleContracts, getModuleDocuments } from '@/lib/vendors/vendorModuleStore';
import { getWorkOrdersForVendor, getVendorPrimaryProject } from '@/lib/vendors/vendorWorkOrders';
import { VendorAssignWorkOrderModal } from '@/components/vendors/VendorAssignWorkOrderModal';
import { VendorLinkComplianceDocumentModal } from '@/components/vendors/VendorLinkComplianceDocumentModal';
import { VendorLinkContractModal } from '@/components/vendors/VendorLinkContractModal';
import { VendorProfileContractsTable } from '@/components/vendors/VendorProfileContractsTable';
import { VendorProfileDocumentsTable } from '@/components/vendors/VendorProfileDocumentsTable';
import { VendorCoverageAssignmentSection } from '@/components/vendors/VendorCoverageAssignmentSection';
import { VendorProfileWorkOrdersTable } from '@/components/vendors/VendorProfileWorkOrdersTable';
import { VendorProfileInvoicesTable } from '@/components/vendors/VendorProfileInvoicesTable';
import { getVendorInvoicesByVendorId, VENDOR_INVOICE_STORE_UPDATED_EVENT } from '@/lib/vendorInvoiceStore';
import { computeVendorInvoicePerformanceMetrics } from '@/lib/vendors/vendorInvoiceProfileHelpers';
import { hasDocumentsPendingVerification } from '@/lib/vendors/vendorComplianceVerification';
import { useVendorDocumentModals } from '@/hooks/useVendorDocumentModals';
import { RecordWorkflowStepper } from '@/components/workflow/RecordWorkflowStepper';
import { computeVendorWorkflowSteps } from '@/lib/vendors/vendorWorkflow';
import { createWorkflowStepHandler } from '@/lib/workflow/workflowStepNavigation';
import { draftService } from '@/lib/draftService';
import { buildVendorPrefilledWorkOrderDraft } from '@/lib/vendors/vendorWorkOrderDraft';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { vendorHistoryToHistoryLogEntries } from '@/lib/historyLogs/recordHistoryAdapters';
import {
    LuArrowRight,
    LuBot,
    LuBuilding2,
    LuCalendar,
    LuClock3,
    LuDownload,
    LuEllipsis,
    LuFileText,
    LuFileUp,
    LuLink,
    LuMail,
    LuPlus,
    LuPrinter,
    LuWorkflow,
} from 'react-icons/lu';

const NAME_REGEX = /^[A-Za-z][A-Za-z\s.-]*$/;
const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_REGEX = /^\d{6}$/;

const VENDOR_TYPE_OPTIONS: VendorType[] = ['Contractor', 'Supplier'];
const VENDOR_STATUS_OPTIONS: VendorStatus[] = ['Active', 'Inactive', 'Blacklisted', 'Pending'];

function emptyVendorInlineDraft(): VendorInlineDraft {
    return {
        name: '',
        type: 'Contractor',
        categoriesCsv: '',
        primaryProject: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        status: 'Pending',
        onboardedDate: new Date().toISOString().slice(0, 10),
        notes: '',
    };
}

function validateVendorInline(draft: VendorInlineDraft): Partial<Record<VendorInlineErrorKey, string>> {
    const e: Partial<Record<VendorInlineErrorKey, string>> = {};
    if (!draft.name.trim()) e.name = 'Vendor name is required.';
    else if (!NAME_REGEX.test(draft.name.trim())) e.name = 'Use letters, spaces, dots, and hyphens only.';
    if (!draft.contactPerson.trim()) e.contactPerson = 'Contact person is required.';
    else if (!NAME_REGEX.test(draft.contactPerson.trim())) e.contactPerson = 'Invalid contact person.';
    if (!draft.phone.trim()) e.phone = 'Phone is required.';
    else if (!PHONE_REGEX.test(draft.phone.trim())) e.phone = 'Phone must be 10 digits.';
    if (draft.email.trim() && !EMAIL_REGEX.test(draft.email.trim())) e.email = 'Invalid email.';
    if (!draft.city.trim()) e.city = 'City is required.';
    if (draft.pincode.trim() && !PINCODE_REGEX.test(draft.pincode.trim())) e.pincode = 'Pincode must be 6 digits.';
    if (!draft.type) e.type = 'Type is required.';
    const cats = categoriesCsvToList(draft.categoriesCsv);
    if (cats.length === 0) e.categoriesCsv = 'Enter at least one category (comma-separated).';
    if (!draft.status) e.status = 'Status is required.';
    if (!draft.onboardedDate.trim()) e.onboardedDate = 'Date is required.';
    if (!draft.country.trim()) e.country = 'Country is required.';
    if (!draft.primaryProject.trim()) e.primaryProject = 'Primary project is required.';
    return e;
}

function downloadVendorJson(v: VendorRecord) {
    const safe = (v.id || v.name || 'vendor')
        .toString()
        .trim()
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\.+$/, '')
        .slice(0, 80) || 'vendor';
    const blob = new Blob([JSON.stringify(v, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safe}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function makeCreateVendorId(existingIds: Set<string>): string {
    let attempts = 0;
    while (attempts < 20000) {
        const candidate = `VND-${Math.floor(2000 + Math.random() * 7000)}`;
        if (!existingIds.has(candidate)) return candidate;
        attempts += 1;
    }
    return `VND-${Date.now()}`;
}

export function VendorProfilePage({ vendorId }: { vendorId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const createMode = vendorId === 'new';
    const [listVersion, setListVersion] = useState(0);
    const vendor = useMemo(() => getVendorRecordById(vendorId), [vendorId, listVersion]);

    const bump = useCallback(() => setListVersion((x) => x + 1), []);

    const [createVendorId] = useState(() => {
        const existingIds = new Set(getAllVendorRecords().map((r) => r.id));
        return makeCreateVendorId(existingIds);
    });

    const createVendorRecord = useMemo<VendorRecord>(() => {
        const nowIso = new Date().toISOString();
        const ymd = nowIso.slice(0, 10);
        return {
            id: createVendorId,
            name: '',
            type: 'Contractor',
            categories: [],
            contactPerson: '',
            phone: '',
            email: '',
            city: '',
            state: '',
            country: 'India',
            status: 'Pending',
            rating: 0,
            compliancePercent: 0,
            contractStatus: 'Draft',
            docsComplete: 0,
            delays: 0,
            slaBreaches: 0,
            availability: 'Medium',
            primaryProject: '',
            createdAt: ymd,
            address: '',
            pincode: '',
            onboardedDate: ymd,
            notes: '',
        };
    }, [createVendorId]);

    useEffect(() => {
        const sync = () => bump();
        window.addEventListener(VENDOR_STORE_UPDATED_EVENT, sync);
        return () => window.removeEventListener(VENDOR_STORE_UPDATED_EVENT, sync);
    }, [bump]);

    const [tab, setTabState] = useState<VendorMainTabId>(() => {
        const initial = normalizeVendorDetailTab(searchParams.get('tab'));
        return createMode ? 'overview' : initial;
    });

    const setTab = useCallback(
        (next: VendorMainTabId) => {
            if (createMode && next !== 'overview') return;
            setTabState(next);
            const qs = new URLSearchParams(searchParams.toString());
            qs.set('tab', next);
            const q = qs.toString();
            router.replace(q ? `/company-admin/vendors/${encodeURIComponent(vendorId)}?${q}` : `/company-admin/vendors/${encodeURIComponent(vendorId)}`, {
                scroll: false,
            });
        },
        [router, searchParams, vendorId, createMode],
    );

    useEffect(() => {
        const next = normalizeVendorDetailTab(searchParams.get('tab'));
        setTabState(createMode ? 'overview' : next);
    }, [searchParams, createMode]);

    const [isInlineEditing, setIsInlineEditing] = useState<boolean>(() => createMode);
    const [inlineDraft, setInlineDraft] = useState<VendorInlineDraft>(() => {
        if (createMode) return emptyVendorInlineDraft();
        const v = getVendorRecordById(vendorId);
        return v ? buildVendorInlineDraft(v) : emptyVendorInlineDraft();
    });
    const [inlineErrors, setInlineErrors] = useState<Partial<Record<VendorInlineErrorKey, string>>>({});
    const [showInlineErrors, setShowInlineErrors] = useState<boolean>(() => !createMode);
    const [inlineSaving, setInlineSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err: boolean } | null>(null);

    useEffect(() => {
        if (!createMode) return;
        setIsInlineEditing(true);
        setInlineDraft((prev) => (prev ? prev : emptyVendorInlineDraft()));
        setInlineErrors({});
        setShowInlineErrors(false);
    }, [createMode]);

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        if (createMode) return;
        setIsInlineEditing(true);
        setShowInlineErrors(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const next = qs ? `/company-admin/vendors/${encodeURIComponent(vendorId)}?${qs}` : `/company-admin/vendors/${encodeURIComponent(vendorId)}`;
        router.replace(next, { scroll: false });
    }, [searchParams, vendorId, router, createMode]);

    useEffect(() => {
        if (createMode) return;
        if (!isInlineEditing && vendor) {
            setInlineDraft(buildVendorInlineDraft(vendor));
            setInlineErrors({});
        }
    }, [vendor, isInlineEditing, createMode]);

    useEffect(() => {
        if (!isInlineEditing) return;
        if (!showInlineErrors) return;
        setInlineErrors(validateVendorInline(inlineDraft));
    }, [isInlineEditing, inlineDraft, showInlineErrors]);

    const originalDraft = useMemo(() => {
        if (createMode) return emptyVendorInlineDraft();
        return vendor ? buildVendorInlineDraft(vendor) : null;
    }, [vendor, createMode]);
    const changedByKey = useMemo<Partial<Record<VendorInlineErrorKey, boolean>>>(() => {
        if (!originalDraft) return {};
        const keys = Object.keys(inlineDraft) as (keyof VendorInlineDraft)[];
        const next: Partial<Record<VendorInlineErrorKey, boolean>> = {};
        for (const k of keys) {
            next[k] = inlineDraft[k] !== originalDraft[k];
        }
        return next;
    }, [inlineDraft, originalDraft]);

    const isInlineDirty = useMemo(() => {
        if (!originalDraft) return false;
        return (Object.keys(inlineDraft) as (keyof VendorInlineDraft)[]).some((k) => inlineDraft[k] !== originalDraft[k]);
    }, [inlineDraft, originalDraft]);

    const onInlineDraftChange = useCallback(<K extends keyof VendorInlineDraft>(key: K, value: VendorInlineDraft[K]) => {
        setInlineDraft((prev) => ({ ...prev, [key]: value }));
        if (showInlineErrors) {
            setInlineErrors((prev) => {
                if (!prev[key]) return prev;
                const n = { ...prev };
                delete n[key as VendorInlineErrorKey];
                return n;
            });
        }
    }, [showInlineErrors]);

    const scrollToInlineErrorField = useCallback((key: VendorInlineErrorKey) => {
        const el = document.getElementById(VENDOR_INLINE_FIELD_IDS[key]);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
            el.focus();
        }
    }, []);

    const onInlineEditCancel = useCallback(() => {
        if (createMode) {
            router.push('/company-admin/vendors/list');
            return;
        }
        if (vendor) setInlineDraft(buildVendorInlineDraft(vendor));
        setInlineErrors({});
        setIsInlineEditing(false);
    }, [vendor, createMode, router]);

    const onInlineEditSave = useCallback(
        async ({ exitAfter }: { exitAfter: boolean }) => {
            const nextErrors = validateVendorInline(inlineDraft);
            setShowInlineErrors(true);
            setInlineErrors(nextErrors);
            const first = (Object.keys(nextErrors)[0] ?? null) as VendorInlineErrorKey | null;
            if (first) {
                window.requestAnimationFrame(() => scrollToInlineErrorField(first));
                setInlineToast({ msg: 'Please fix the highlighted fields.', err: true });
                return;
            }

            const patch = {
                name: inlineDraft.name.trim(),
                type: inlineDraft.type,
                categories: categoriesCsvToList(inlineDraft.categoriesCsv),
                contactPerson: inlineDraft.contactPerson.trim(),
                phone: inlineDraft.phone.trim(),
                email: inlineDraft.email.trim(),
                address: inlineDraft.address.trim(),
                city: inlineDraft.city.trim(),
                state: inlineDraft.state.trim(),
                pincode: inlineDraft.pincode.trim(),
                country: inlineDraft.country.trim() || 'India',
                status: inlineDraft.status,
                onboardedDate: inlineDraft.onboardedDate.trim(),
                notes: inlineDraft.notes.trim(),
                primaryProject: inlineDraft.primaryProject.trim(),
            };

            if (createMode) {
                setInlineSaving(true);
                try {
                    saveVendorFromForm({
                        vendorId: createVendorId,
                        vendorName: patch.name,
                        vendorType: patch.type,
                        categories: patch.categories,
                        contactPerson: patch.contactPerson,
                        phone: patch.phone,
                        email: patch.email,
                        address: patch.address,
                        city: patch.city,
                        state: patch.state,
                        pincode: patch.pincode,
                        country: patch.country,
                        status: patch.status,
                        onboardedDate: patch.onboardedDate,
                        notes: patch.notes,
                        primaryProject: patch.primaryProject,
                    });
                    setInlineToast({ msg: 'Vendor created successfully.', err: false });
                    router.replace(`/company-admin/vendors/${encodeURIComponent(createVendorId)}?tab=overview`);
                } finally {
                    setInlineSaving(false);
                }
                return;
            }

            if (!vendor) return;

            const corePatch: Parameters<typeof patchVendorRecord>[1] = {};
            (Object.keys(patch) as (keyof typeof patch)[]).forEach((k) => {
                if (k === 'categories') {
                    if (JSON.stringify(patch.categories) !== JSON.stringify(vendor.categories)) {
                        corePatch.categories = patch.categories;
                    }
                    return;
                }
                const pv = patch[k];
                const ov = vendor[k as keyof VendorRecord];
                if (pv !== ov) (corePatch as Record<string, unknown>)[k] = pv;
            });

            if (Object.keys(corePatch).length === 0) {
                if (exitAfter) setIsInlineEditing(false);
                return;
            }

            setInlineSaving(true);
            try {
                const updated = patchVendorRecord(vendor.id, corePatch);
                if (!updated) {
                    setInlineToast({ msg: 'Could not save changes.', err: true });
                    return;
                }
                bump();
                setInlineDraft(buildVendorInlineDraft(updated));
                setInlineToast({ msg: 'Vendor updated successfully.', err: false });
                if (exitAfter) setIsInlineEditing(false);
                setInlineErrors({});
            } finally {
                setInlineSaving(false);
            }
        },
        [inlineDraft, vendor, bump, scrollToInlineErrorField, createMode, createVendorId, router],
    );

    useEffect(() => {
        if (!isInlineEditing || !isInlineDirty) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [isInlineEditing, isInlineDirty]);

    useEffect(() => {
        if (!isInlineEditing) return;
        const onKeyDown = (e: KeyboardEvent) => {
            const k = e.key?.toLowerCase();
            if ((e.ctrlKey || e.metaKey) && k === 's') {
                e.preventDefault();
                if (!inlineSaving) void onInlineEditSave({ exitAfter: false });
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isInlineEditing, inlineSaving, onInlineEditSave]);

    const [documents, setDocuments] = useState<VendorDocument[]>(() => [
        ...getModuleDocuments().filter((item) => item.vendorId === vendorId),
        ...MOCK_VENDOR_DOCUMENTS.filter((item) => item.vendorId === vendorId),
    ]);
    const [contracts, setContracts] = useState<VendorContract[]>(() => [
        ...getModuleContracts().filter((item) => item.vendorId === vendorId),
        ...MOCK_VENDOR_CONTRACTS.filter((item) => item.vendorId === vendorId),
    ]);
    const feedback = useMemo(() => MOCK_VENDOR_FEEDBACK.filter((item) => item.vendorId === vendorId), [vendorId]);
    const [history, setHistory] = useState(() => MOCK_VENDOR_HISTORY.filter((item) => item.vendorId === vendorId));
    const [workOrderRefresh, setWorkOrderRefresh] = useState(0);
    const [invoiceRefresh, setInvoiceRefresh] = useState(0);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'arris-work-orders-v2') setWorkOrderRefresh((n) => n + 1);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => {
        const onInvoiceUpdate = () => setInvoiceRefresh((n) => n + 1);
        window.addEventListener(VENDOR_INVOICE_STORE_UPDATED_EVENT, onInvoiceUpdate);
        return () => window.removeEventListener(VENDOR_INVOICE_STORE_UPDATED_EVENT, onInvoiceUpdate);
    }, []);

    const projectOptions = useMemo(() => getWorkOrderProjectOptions(), []);

    const vendorWorkOrders = useMemo(() => {
        if (createMode) return [];
        const rec = getVendorRecordById(vendorId);
        if (!rec) return [];
        return getWorkOrdersForVendor(rec.id, rec.name);
    }, [createMode, vendorId, listVersion, workOrderRefresh]);

    const primaryProject = useMemo(() => {
        if (createMode) return '';
        const rec = getVendorRecordById(vendorId);
        if (!rec) return '';
        return rec.primaryProject?.trim() || getVendorPrimaryProject(rec.id);
    }, [createMode, vendorId, listVersion]);

    const openCreateWorkOrder = useCallback(() => {
        const rec = getVendorRecordById(vendorId);
        if (!rec) return;
        const draftPayload = buildVendorPrefilledWorkOrderDraft(rec);
        const saved = draftService.saveDraft('work_order', draftPayload);
        router.push(`/work-orders/view/new?tab=overview&draftId=${encodeURIComponent(saved.draftId)}`);
    }, [router, vendorId, listVersion]);

    const vendorInvoices = useMemo(() => {
        if (createMode) return [];
        return getVendorInvoicesByVendorId(vendorId);
    }, [createMode, vendorId, invoiceRefresh]);

    const invoicePerformance = useMemo(() => {
        const rec = getVendorRecordById(vendorId);
        if (!rec) {
            return computeVendorInvoicePerformanceMetrics(vendorId, '');
        }
        return computeVendorInvoicePerformanceMetrics(vendorId, rec.name, rec);
    }, [vendorId, invoiceRefresh, listVersion]);

    const openCreateInvoice = useCallback(() => {
        router.push(
            `/company-admin/vendors/invoices/view/new?tab=overview&vendorId=${encodeURIComponent(vendorId)}`,
        );
    }, [router, vendorId]);

    const [banner, setBanner] = useState<string | null>(null);
    const [contractModalOpen, setContractModalOpen] = useState(false);
    const [assignWorkOrderModalOpen, setAssignWorkOrderModalOpen] = useState(false);
    const [linkDocumentModalOpen, setLinkDocumentModalOpen] = useState(false);
    const [linkContractModalOpen, setLinkContractModalOpen] = useState(false);

    const [notesDraft, setNotesDraft] = useState('');
    const [notes, setNotes] = useState<Array<{ id: string; at: string; by: string; text: string }>>(() => {
        try {
            const raw = localStorage.getItem(`arris-vendor-notes:${vendorId}`);
            if (!raw) return [];
            const parsed = JSON.parse(raw) as Array<{ id: string; at: string; by: string; text: string }>;
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    const appendHistory = useCallback((action: string, module: string, oldValue: string, newValue: string) => {
        setHistory((prev) => [
            {
                id: `HIS-${Date.now()}`,
                vendorId,
                dateTime: new Date().toLocaleString(),
                user: 'Company Admin',
                action,
                module,
                oldValue,
                newValue,
            },
            ...prev,
        ]);
    }, [vendorId]);

    const vendorNameById = useMemo(() => {
        const m = new Map<string, string>();
        getAllVendorRecords().forEach((rec) => m.set(rec.id, rec.name));
        return m;
    }, [listVersion]);

    const {
        openCreate: openCreateDocument,
        openView: openViewDocument,
        openEdit: openEditDocument,
        openDelete: openDeleteDocument,
        modals: documentModals,
    } = useVendorDocumentModals({
        setDocuments,
        vendorNameById,
        lockVendorId: createMode ? undefined : vendorId,
        hideVendorLinkInView: true,
        onAfterAdd: (doc) => {
            appendHistory('Document uploaded', 'Documents', 'Missing', doc.documentName);
            setBanner('Document saved successfully.');
        },
        onAfterUpdate: (doc) => {
            appendHistory('Document updated', 'Documents', '—', doc.documentName);
            setBanner(`Updated ${doc.documentName}.`);
        },
        onAfterDelete: (doc) => {
            appendHistory('Document deleted', 'Documents', doc.documentName, 'Removed');
            setBanner(`Deleted ${doc.documentName}.`);
        },
        onDownload: (doc) => {
            setBanner(`Download triggered for ${doc.fileName ?? doc.documentName} (demo).`);
        },
    });

    const submitContract = (payload: {
        vendorId: string;
        contractName: string;
        startDate: string;
        endDate: string;
        value: string;
        fileName: string;
        notes: string;
    }) => {
        const newContract: VendorContract = {
            id: `CNT-${Date.now()}`,
            vendorId: payload.vendorId,
            contractName: payload.contractName.trim(),
            startDate: payload.startDate,
            endDate: payload.endDate,
            value: Number(payload.value || 0),
            status: 'Active',
            fileName: payload.fileName.trim() || 'contract.pdf',
        };
        setContracts((prev) => [newContract, ...prev]);
        appendModuleContract(newContract);
        setContractModalOpen(false);
        appendHistory('Contract added', 'Contracts', 'None', newContract.contractName);
        setBanner('Contract added successfully.');
    };

    const addNote = () => {
        const text = notesDraft.trim();
        if (!text) return;
        const next = [{ id: `N-${Date.now()}`, at: new Date().toLocaleString(), by: 'Company Admin', text }, ...notes];
        setNotes(next);
        setNotesDraft('');
        try {
            localStorage.setItem(`arris-vendor-notes:${vendorId}`, JSON.stringify(next));
        } catch {
            // ignore
        }
        appendHistory('Note added', 'Notes', '—', text.slice(0, 80));
        setBanner('Note saved.');
    };

    const utilityBtn = CTA_UTILITY_BTN;

    const readOnlyOps = isInlineEditing;
    const v = (createMode ? createVendorRecord : (vendor ?? createVendorRecord)) as VendorRecord;

    const vendorWorkflowSteps = useMemo(
        () =>
            computeVendorWorkflowSteps({
                isCreate: createMode,
                vendor: v,
                documents: createMode ? [] : documents,
                contracts: createMode ? [] : contracts,
                workOrderCount: vendorWorkOrders.length,
                feedbackCount: feedback.length,
            }),
        [createMode, v, documents, contracts, vendorWorkOrders.length, feedback.length],
    );

    const onWorkflowStepNavigate = useCallback(
        createWorkflowStepHandler({
            currentTab: tab,
            setTab: (next) => setTab(next as VendorMainTabId),
            isCreate: createMode,
            onBlocked: (msg) => setInlineToast({ msg, err: true }),
        }),
        [tab, setTab, createMode],
    );

    if (!vendor && !createMode) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                <p>Vendor not found.</p>
                <Link href="/company-admin/vendors" className="mt-3 inline-block font-medium text-[var(--cta-button-bg)] underline-offset-2 hover:underline">
                    Back to vendor list
                </Link>
            </div>
        );
    }

    const breadcrumbLabel = createMode ? 'Create vendor' : v.name || 'Vendor';
    const displayName = (createMode || isInlineEditing) && inlineDraft.name.trim() ? inlineDraft.name.trim() : v.name;
    const displayProject =
        (createMode || isInlineEditing) && inlineDraft.primaryProject.trim()
            ? inlineDraft.primaryProject.trim()
            : v.primaryProject?.trim() || primaryProject;
    const displayCategories =
        createMode || isInlineEditing
            ? categoriesCsvToList(inlineDraft.categoriesCsv).join(', ')
            : v.categories.join(', ');
    const displayCity = (createMode || isInlineEditing) && inlineDraft.city.trim() ? inlineDraft.city.trim() : v.city;

    return (
        <div className="w-full min-w-0 space-y-0">
            {inlineToast ? (
                <InlineToast message={inlineToast.msg} variant={inlineToast.err ? 'error' : 'success'} onDismiss={() => setInlineToast(null)} />
            ) : null}
            <Breadcrumb items={[{ label: 'Vendor List', href: '/company-admin/vendors' }, { label: breadcrumbLabel }]} />
            <VendorMainTabBar
                active={tab}
                disabledTabs={
                    createMode
                        ? { notes: true, performance: true, history: true }
                        : undefined
                }
                onChange={(next) => {
                    if (createMode && next !== 'overview') return;
                    if (isInlineEditing && isInlineDirty) {
                        const ok = window.confirm('You have unsaved changes. Leave this tab and discard them?');
                        if (!ok) return;
                        onInlineEditCancel();
                    }
                    setTab(next);
                }}
            />

            {banner ? (
                <div className="mt-3 rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm">
                    {banner}
                </div>
            ) : null}

            {tab === 'overview' ? (
                <>
                    <div className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-3">
                                {createMode ? (
                                    <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--cta-button-bg)] shadow-sm">
                                        Create mode
                                    </span>
                                ) : (
                                    <VendorDetailMoreMenu
                                        vendor={v}
                                        onEdit={() => setIsInlineEditing(true)}
                                        isEditing={isInlineEditing}
                                        isSaving={inlineSaving}
                                    />
                                )}
                            </div>
                            <WorkspaceUtilityToolbar
                                help={VENDOR_WORKSPACE_HELP}
                                triggerLabel="Vendor workspace help"
                                email={v.email}
                                onExport={() => downloadVendorJson(v)}
                                saving={inlineSaving}
                                isInlineEditing={isInlineEditing}
                            />
                        </div>
                    </div>

                    <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                            <span className="inline-flex items-center gap-2">
                                <LuBuilding2 size={14} className="text-gray-500" aria-hidden />
                                <span className="text-gray-600">Primary project</span>
                                <span className="font-medium text-gray-900">{displayProject || '—'}</span>
                            </span>
                            {!createMode ? (
                                <>
                                    <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                    <span className="inline-flex items-center gap-2">
                                        <LuCalendar size={14} className="text-gray-500" aria-hidden />
                                        <span className="text-gray-600">Date Created</span>
                                        <span className="font-medium text-gray-900">{v.createdAt}</span>
                                    </span>
                                    <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                    <span className="inline-flex items-center gap-2">
                                        <LuClock3 size={14} className="text-gray-500" aria-hidden />
                                        <span className="text-gray-600">Last updated</span>
                                        <span className="font-medium text-gray-900">{history[0]?.dateTime ?? v.createdAt}</span>
                                    </span>
                                </>
                            ) : null}
                        </div>
                    </div>
                </>
            ) : null}

            <div
                className={cn(
                    'min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5',
                    tab !== 'overview' && 'mt-3',
                )}
            >
                {tab === 'overview' ? (
                    <section className="space-y-4">
                        <RecordWorkflowStepper
                            steps={vendorWorkflowSteps}
                            ariaLabel="Vendor onboarding workflow"
                            onStepNavigate={onWorkflowStepNavigate}
                        />
                        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-stretch">
                            <div className="min-w-0 xl:col-span-8">
                                <div
                                    id="wf-vendor-profile"
                                    className={cn(
                                        'flex min-h-0 min-w-0 flex-col rounded-xl border bg-white shadow-sm',
                                        isInlineEditing
                                            ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]'
                                            : 'border-gray-200/80',
                                    )}
                                >
                                    <div className="bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-3.5">
                                                <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-50 text-lg font-semibold text-gray-700 ring-1 ring-gray-200/80">
                                                    {(displayName || '—')
                                                        .trim()
                                                        .split(/\s+/)
                                                        .map((s: string) => s[0])
                                                        .filter(Boolean)
                                                        .slice(0, 2)
                                                        .join('')
                                                        .toUpperCase() || '—'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-900">{displayName || '—'}</h1>
                                                        {isInlineEditing ? (
                                                            <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--cta-button-bg)] shadow-sm">
                                                                Editing mode
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-600">
                                                        {v.type} · {displayCategories || '—'} · {displayCity || '—'}
                                                    </p>
                                                    {displayProject ? (
                                                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--cta-button-bg)]">
                                                            <LuBuilding2 size={14} className="shrink-0 opacity-80" aria-hidden />
                                                            {displayProject}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                           
                                        </div>
                                        <div className="mt-4 min-w-0">
                                            <VendorInlineOverviewEditor
                                                key={createMode ? 'vendor-inline-create' : isInlineEditing ? 'vendor-inline-edit' : 'vendor-inline-view'}
                                                vendor={v}
                                                isEditing={isInlineEditing}
                                                draft={inlineDraft}
                                                errors={inlineErrors}
                                                onDraftChange={onInlineDraftChange}
                                                changedByKey={changedByKey}
                                                typeOptions={VENDOR_TYPE_OPTIONS}
                                                statusOptions={VENDOR_STATUS_OPTIONS}
                                                projectOptions={projectOptions}
                                            />
                                        </div>
                                        {displayProject ? (
                                            <div className="mt-4">
                                                <VendorLinkedProjectCard projectName={displayProject} />
                                            </div>
                                        ) : null}
                                        {isInlineEditing ? (
                                            <div className="sticky bottom-0 z-30 mt-4 pb-1">
                                                <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-sm font-semibold text-gray-900">Unsaved changes</p>
                                                        {!isInlineDirty ? (
                                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                                                Up to date
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                                                        <Button type="button" variant="companyOutline" size="cta" onClick={onInlineEditCancel} disabled={inlineSaving}>
                                                            {createMode ? 'Cancel' : 'Cancel'}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="companyOutline"
                                                            size="cta"
                                                            onClick={() => void onInlineEditSave({ exitAfter: false })}
                                                            disabled={inlineSaving || (!createMode && !isInlineDirty)}
                                                        >
                                                            {createMode ? 'Create vendor' : 'Save'}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="company"
                                                            size="cta"
                                                            onClick={() => void onInlineEditSave({ exitAfter: true })}
                                                            isLoading={inlineSaving}
                                                            disabled={createMode ? false : !isInlineDirty}
                                                        >
                                                            {createMode ? 'Create & open' : 'Save & exit'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <aside className="w-full rounded-xl border border-slate-200 bg-linear-to-br from-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] via-white to-[color-mix(in_srgb,var(--cta-button-hover-bg)_10%,white)] p-4 shadow-sm xl:col-span-4 xl:sticky xl:top-44 xl:self-start">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-lg bg-[var(--cta-button-bg)] p-1.5 text-white">
                                        <LuBot size={14} />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-900">AI Vendor Copilot</h3>
                                </div>
                                <div className="mt-3 space-y-2 text-xs">
                                    <div className="rounded-lg border border-slate-200 bg-white/80 p-2.5">
                                        <p className="font-semibold text-slate-500">NEXT ACTION</p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">Renew expired contract immediately.</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white/80 p-2.5">
                                        <p className="font-semibold text-slate-500">BEST USE CASE</p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">Plumbing maintenance jobs only.</p>
                                    </div>
                                    <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-2.5">
                                        <p className="font-semibold text-rose-600">RISK ALERT</p>
                                        <p className="mt-1 text-sm font-medium text-rose-900">{v.slaBreaches} SLA breaches in last 60 days.</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white/80 p-2.5">
                                        <p className="font-semibold text-slate-500">SUGGESTED DECISION</p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">Restrict new work orders until docs verified.</p>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-2 ring-1 ring-slate-200">
                                        <span className="text-xs font-semibold text-slate-500">CONFIDENCE</span>
                                        <span className="text-sm font-bold text-emerald-700">84%</span>
                                    </div>
                                </div>
                                <Button variant="company" size="sm" className="mt-3 w-full gap-1.5" disabled={readOnlyOps} onClick={() => setBanner('Vendor health workflow opened (demo).')}>
                                    Improve vendor health
                                    <LuArrowRight size={14} />
                                </Button>
                            </aside>
                        </div>

                        {readOnlyOps ? (
                            <p className="text-sm font-medium text-gray-500">Finish editing to add contracts or documents from the tables below.</p>
                        ) : null}

                        <section className="space-y-4">
                            <article id="wf-vendor-compliance" className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Compliance documents</h3>
                                        <p className="mt-0.5 text-xs text-slate-500">Verification status and expiry for this vendor.</p>
                                    </div>
                                    {!createMode ? (
                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                          
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="companyOutline"
                                                className="gap-1.5"
                                                disabled={readOnlyOps}
                                                onClick={() => setLinkDocumentModalOpen(true)}
                                            >
                                                <LuLink size={14} />
                                                Link Document
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="company"
                                                className="gap-1.5"
                                                disabled={readOnlyOps}
                                                onClick={openCreateDocument}
                                            >
                                                <LuPlus size={14} />
                                                Create document
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                                {hasDocumentsPendingVerification(documents) ? (
                                    <p className="mb-3 rounded-lg border border-amber-200/90 bg-amber-50/80 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
                                        Compliance verification in progress. Vendor assignments and work orders will be restricted until approval is completed.
                                    </p>
                                ) : null}
                                <VendorProfileDocumentsTable
                                    documents={documents}
                                    onView={openViewDocument}
                                    onEdit={openEditDocument}
                                    onDelete={openDeleteDocument}
                                />
                            </article>
                            <article id="wf-vendor-contracts" className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Contracts summary</h3>
                                        <p className="mt-0.5 text-xs text-slate-500">Active agreements and renewal dates for this vendor.</p>
                                    </div>
                                    {!createMode ? (
                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                          
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="companyOutline"
                                                className="gap-1.5"
                                                disabled={readOnlyOps}
                                                onClick={() => setLinkContractModalOpen(true)}
                                            >
                                                <LuFileText size={14} />
                                                Link Contract
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="company"
                                                className="gap-1.5"
                                                disabled={readOnlyOps}
                                                onClick={() => setContractModalOpen(true)}
                                            >
                                                <LuPlus size={14} />
                                                Create contract
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                                <VendorProfileContractsTable contracts={contracts} vendorId={v.id} />
                            </article>
                            {!createMode ? (
                                <VendorCoverageAssignmentSection vendorId={v.id} readOnly={readOnlyOps} />
                            ) : null}
                            <article id="wf-vendor-work-orders" className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Work orders</h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {primaryProject
                                                ? `Assignments on ${primaryProject} for this vendor.`
                                                : 'Project-scoped work assignments linked to this vendor.'}
                                        </p>
                                    </div>
                                    {!createMode ? (
                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="companyOutline"
                                                className="gap-1.5"
                                                disabled={readOnlyOps}
                                                onClick={() => setAssignWorkOrderModalOpen(true)}
                                            >
                                                <LuWorkflow size={14} />
                                                Link Assignment
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="company"
                                                className="gap-1.5"
                                                disabled={readOnlyOps}
                                                onClick={openCreateWorkOrder}
                                            >
                                                <LuPlus size={14} />
                                                Create Assignment
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                                <VendorProfileWorkOrdersTable
                                    workOrders={vendorWorkOrders}
                                    projectName={primaryProject}
                                    vendorId={v.id}
                                />
                            </article>
                            {!createMode ? (
                                <article id="wf-vendor-invoices" className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">Vendor invoices</h3>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Invoices submitted by this vendor, linked to work orders and service requests.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="company"
                                            className="gap-1.5"
                                            disabled={readOnlyOps}
                                            onClick={openCreateInvoice}
                                        >
                                            <LuPlus size={14} />
                                            Create Invoice
                                        </Button>
                                    </div>
                                    <VendorProfileInvoicesTable invoices={vendorInvoices} />
                                </article>
                            ) : null}
                        </section>
                    </section>
                ) : null}

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
                                        disabled={readOnlyOps}
                                    />
                                    <div className="mt-3 flex items-center justify-end gap-2">
                                        <Button variant="company" size="sm" className="h-9 px-3 text-sm" onClick={addNote} disabled={!notesDraft.trim() || readOnlyOps}>
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

                {tab === 'performance' ? (
                    <section id="wf-vendor-performance" className="space-y-4">
                        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900">Invoice-driven performance</h3>
                            <p className="mt-0.5 text-xs text-slate-500">Metrics derived from vendor invoice and work order data.</p>
                            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                                    <p className="text-xs text-slate-500">Invoice accuracy</p>
                                    <p className="mt-1 text-xl font-bold text-slate-900">{invoicePerformance.invoiceAccuracy}%</p>
                                </div>
                                <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                                    <p className="text-xs text-slate-500">Payment approval rate</p>
                                    <p className="mt-1 text-xl font-bold text-slate-900">{invoicePerformance.paymentApprovalRate}%</p>
                                </div>
                                <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                                    <p className="text-xs text-slate-500">Avg resolution cost</p>
                                    <p className="mt-1 text-base font-bold text-slate-900">
                                        {invoicePerformance.averageResolutionCost > 0
                                            ? `₹${invoicePerformance.averageResolutionCost.toLocaleString('en-IN')}`
                                            : '—'}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                                    <p className="text-xs text-slate-500">SLA compliance</p>
                                    <p className="mt-1 text-xl font-bold text-emerald-700">{invoicePerformance.slaCompliance}%</p>
                                </div>
                                <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                                    <p className="text-xs text-slate-500">Repeat work orders</p>
                                    <p className="mt-1 text-xl font-bold text-amber-800">{invoicePerformance.repeatWorkOrders}</p>
                                </div>
                            </div>
                        </article>
                        <div className="grid gap-4 md:grid-cols-4">
                            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs text-slate-500">Avg Rating</p>
                                <p className="mt-2 text-xl font-bold text-slate-900">{v.rating}</p>
                            </article>
                            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs text-slate-500">Compliance</p>
                                <p className="mt-2 text-xl font-bold text-slate-900">{v.compliancePercent}%</p>
                            </article>
                            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs text-slate-500">SLA Breaches</p>
                                <p className="mt-2 text-xl font-bold text-rose-700">{v.slaBreaches}</p>
                            </article>
                            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs text-slate-500">On-Time %</p>
                                <p className="mt-2 text-xl font-bold text-slate-900">{Math.max(10, 100 - v.delays * 6)}%</p>
                            </article>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-900">Rating trend</h3>
                                <div className="mt-3 h-2 rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-[var(--cta-button-bg)]" style={{ width: `${Math.min(100, Math.round((v.rating / 5) * 100))}%` }} />
                                </div>
                                <p className="mt-2 text-sm text-slate-600">Jan 4.1 → Feb 4.3 → Mar 4.4 → Apr {v.rating}</p>
                            </article>
                            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-900">Compliance trend</h3>
                                <div className="mt-3 h-2 rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${v.compliancePercent}%` }} />
                                </div>
                                <p className="mt-2 text-sm text-slate-600">
                                    {v.docsComplete} required documents on file · {v.compliancePercent}% verified.
                                </p>
                            </article>
                            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-900">SLA trend</h3>
                                <div className="mt-3 h-2 rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(100, v.slaBreaches * 14)}%` }} />
                                </div>
                                <p className="mt-2 text-sm text-slate-600">{v.slaBreaches} breaches in current cycle.</p>
                            </article>
                        </div>
                        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900">Feedback</h3>
                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full min-w-152 text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-2 py-2">Date</th>
                                            <th className="px-2 py-2">Reviewer</th>
                                            <th className="px-2 py-2">Rating</th>
                                            <th className="px-2 py-2">Comment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feedback.map((item) => (
                                            <tr key={item.id} className="border-t border-slate-100">
                                                <td className="px-2 py-2">{item.date}</td>
                                                <td className="px-2 py-2">{item.reviewer}</td>
                                                <td className="px-2 py-2">{item.rating}</td>
                                                <td className="px-2 py-2">{item.comment}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </article>
                    </section>
                ) : null}

                {tab === 'history' ? (
                    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                        <RecordHistoryLogPanel
                            module="vendors"
                            recordId={v.id}
                            recordTitle={v.name}
                            supplementalEntries={vendorHistoryToHistoryLogEntries(v.id, v.name, history)}
                            globalHistoryHref="/company-admin/history-logs"
                        />
                    </section>
                ) : null}
            </div>

            <AddContractModal isOpen={contractModalOpen} onClose={() => setContractModalOpen(false)} onSubmit={submitContract} initialVendorId={v.id} lockVendor />
            {!createMode ? (
                <>
                    {documentModals}
                    <VendorLinkComplianceDocumentModal
                        isOpen={linkDocumentModalOpen}
                        onClose={() => setLinkDocumentModalOpen(false)}
                        vendorId={v.id}
                        vendorName={v.name}
                        onLinked={(doc) => {
                            setDocuments((prev) => [doc, ...prev]);
                            appendHistory('Document linked', 'Documents', 'None', doc.documentName);
                            setBanner(`Linked ${doc.documentName} to ${v.name}.`);
                        }}
                    />
                    <VendorLinkContractModal
                        isOpen={linkContractModalOpen}
                        onClose={() => setLinkContractModalOpen(false)}
                        vendorId={v.id}
                        vendorName={v.name}
                        onLinked={(c) => {
                            setContracts((prev) => [c, ...prev]);
                            appendHistory('Contract linked', 'Contracts', 'None', c.contractName);
                            setBanner(`Linked ${c.contractName} to ${v.name}.`);
                        }}
                    />
                    <VendorAssignWorkOrderModal
                        isOpen={assignWorkOrderModalOpen}
                        onClose={() => setAssignWorkOrderModalOpen(false)}
                        vendorId={v.id}
                        vendorName={v.name}
                        primaryProject={primaryProject}
                        onAssigned={(wo) => {
                            setWorkOrderRefresh((n) => n + 1);
                            appendHistory('Work order assigned', 'Work Orders', 'None', `${wo.workOrderId} · ${wo.title}`);
                            setBanner(`Assigned ${wo.workOrderId} to ${v.name}.`);
                        }}
                    />
                </>
            ) : null}
        </div>
    );
}
