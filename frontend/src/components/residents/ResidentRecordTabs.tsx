'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EditableField, EditableSelect } from '@/components/leads/detail/InlineEditableSection';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { ResidentAIPanel } from '@/components/residents/ResidentAIPanel';
import { ResidentDetailMoreMenu } from '@/components/residents/ResidentDetailMoreMenu';
import { ResidentMainTabBar } from '@/components/residents/ResidentMainTabBar';
import { ResidentNoticesTab } from '@/components/residents/ResidentNoticesTab';
import { ResidentAmenitiesTab } from '@/components/residents/ResidentAmenitiesTab';
import { ResidentVisitorsTab } from '@/components/residents/ResidentVisitorsTab';
import {
    buildDefaultLeaseDraft,
    ResidentLeaseAgreementsTab,
    type LeaseWorkspaceDraft,
} from '@/components/residents/ResidentLeaseAgreementsTab';
import { ResidentRecordsTab } from '@/components/residents/ResidentRecordsTab';
import { ResidentHouseholdSection } from '@/components/residents/ResidentHouseholdSection';
import { ResidentVehiclesSection } from '@/components/residents/ResidentVehiclesSection';
import { ResidentServiceRequestsTable } from '@/components/residents/ResidentServiceRequestsTable';
import { ResidentLinkServiceRequestModal } from '@/components/residents/ResidentLinkServiceRequestModal';
import { normalizeResidentWorkspaceTab, type ResidentWorkspaceTabId } from '@/components/residents/residentDetailTabIds';
import { EMPTY_FIELD, ResidentCollapsibleSection, ResidentFieldRow } from '@/components/residents/ResidentOverviewFieldKit';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { StatusModal } from '@/components/ui/StatusModal';
import { cn } from '@/lib/utils';
import {
    CTA_CARD_EDITING_RING,
    CTA_EDITING_BADGE,
    CTA_FOCUS_RING_SOFT,
    CTA_INFO_BANNER,
    CTA_INFO_BANNER_BADGE,
    CTA_UTILITY_BTN,
} from '@/lib/theme/ctaThemeClasses';
import {
    addResident,
    deleteResidentPermanent,
    RESIDENT_PROPERTY_UNIT_OPTIONS,
    RESIDENT_STATUS_OPTIONS,
    RESIDENT_TYPE_OPTIONS,
    RESIDENT_USER_ROLE_OPTIONS,
    updateResident,
    peekNextResidentCode,
    sanitizeResidentHousehold,
    sanitizeResidentVehicles,
    type Resident,
    type ResidentStatusValue,
    type ResidentType,
    type ResidentUserRole,
    type ResidentIdentityDocument,
    type ResidentNotice,
    type ResidentCommunityRecord,
    type ResidentHouseholdMember,
    type ResidentVehicle,
} from '@/lib/residentStore';
import { residentViewHref } from '@/lib/residentRoutes';
import { serviceMaintenanceCreateHref } from '@/lib/serviceMaintenanceRoutes';
import {
    getServiceMaintenanceTicketsForResident,
    SERVICE_MAINTENANCE_TICKET_UPDATED_EVENT,
} from '@/lib/serviceMaintenanceStore';
import {
    attachLeaseGeneratedPdf,
    createLeaseAgreement,
    getLeaseAgreementsForResident,
    sendLeaseAgreement,
} from '@/lib/rentalLeaseAgreementStore';
import type { HistoryLogEntry } from '@/lib/historyLogs/types';
import { LuCalendar, LuCar, LuClock3, LuDownload, LuFileText, LuKeyRound, LuLink, LuMail, LuPhone, LuPlus, LuUser, LuUsers } from 'react-icons/lu';
import { WorkspaceUtilityToolbar, RESIDENT_WORKSPACE_HELP } from '@/components/workspace-help';
import { useResidentHousehold } from '@/hooks/useResidentHousehold';
import { useResidentVehicles } from '@/hooks/useResidentVehicles';

type Draft = {
    residentType: ResidentType | '';
    fullName: string;
    phoneNumber: string;
    email: string;
    propertyUnit: string;
    moveInDate: string;
    residentStatus: ResidentStatusValue | '';
    emergencyContactNumber: string;
    userRole: ResidentUserRole | '';
    portalAccessEnabled: boolean;
    loginUsername: string;
    temporaryPassword: string;
    accessExpiryDate: string;
};

const RESIDENT_INLINE_FIELD_IDS = {
    fullName: 'resident-inline-full-name',
    phoneNumber: 'resident-inline-phone',
    email: 'resident-inline-email',
    propertyUnit: 'resident-inline-property-unit',
    moveInDate: 'resident-inline-move-in',
    emergencyContact: 'resident-inline-emergency',
    userRole: 'resident-inline-user-role',
    loginUsername: 'resident-inline-login',
    temporaryPassword: 'resident-inline-temp-password',
    accessExpiryDate: 'resident-inline-access-expiry',
} as const;

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
    const short = name.trim().slice(0, 2).toUpperCase();
    return short || '?';
}

function buildDraft(r: Resident): Draft {
    return {
        residentType: r.residentType,
        fullName: r.fullName,
        phoneNumber: r.phoneNumber,
        email: r.email,
        propertyUnit: r.propertyUnit,
        moveInDate: r.moveInDate,
        residentStatus: r.residentStatus,
        emergencyContactNumber: r.emergencyContactNumber,
        userRole: r.userRole,
        portalAccessEnabled: r.portalAccessEnabled,
        loginUsername: r.loginUsername,
        temporaryPassword: r.temporaryPassword,
        accessExpiryDate: r.accessExpiryDate,
    };
}

function buildCommunityRecordDraft(r: ResidentCommunityRecord): ResidentCommunityRecord {
    return { ...r, timelineLogs: [...r.timelineLogs], tags: [...r.tags] };
}

function emptyDraft(ymd: string): Draft {
    return {
        residentType: 'Tenant',
        fullName: '',
        phoneNumber: '',
        email: '',
        propertyUnit: RESIDENT_PROPERTY_UNIT_OPTIONS[0] ?? '',
        moveInDate: ymd,
        residentStatus: 'Active',
        emergencyContactNumber: '',
        userRole: 'Household Member',
        portalAccessEnabled: false,
        loginUsername: '',
        temporaryPassword: '',
        accessExpiryDate: ymd,
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

function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadTextFile({ filename, content, mime }: { filename: string; content: string; mime: string }) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

type Props = {
    resident: Resident;
    createMode: boolean;
    onBump: () => void;
};

export function ResidentRecordTabs({ resident, createMode, onBump }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [tab, setTab] = useState<ResidentWorkspaceTabId>(() => normalizeResidentWorkspaceTab(searchParams.get('tab')));
    const [isInlineEditing, setIsInlineEditing] = useState(false);
    const [inlineSaving, setInlineSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const [statusModal, setStatusModal] = useState<{ open: boolean; type: 'success' | 'error'; title: string }>({
        open: false,
        type: 'success',
        title: '',
    });
    const [optimistic, setOptimistic] = useState<Resident | null>(null);
    const [permDelOpen, setPermDelOpen] = useState(false);
    const [sectionsOpen, setSectionsOpen] = useState({ info: true, household: true, vehicles: true, access: true, documents: true });

    const [draft, setDraft] = useState<Draft>(() => (createMode ? emptyDraft(new Date().toISOString().slice(0, 10)) : buildDraft(resident)));
    const [identityDoc, setIdentityDoc] = useState<ResidentIdentityDocument | null>(() => resident.identityDocument);
    const [noticesDraft, setNoticesDraft] = useState<ResidentNotice[]>(() => [...resident.notices]);
    const [vehiclesDraft, setVehiclesDraft] = useState<ResidentVehicle[]>(() => [...(resident.vehicles ?? [])]);
    const [householdDraft, setHouseholdDraft] = useState<ResidentHouseholdMember[]>(() => [...(resident.householdMembers ?? [])]);
    const [communityRecordDraft, setCommunityRecordDraft] = useState<ResidentCommunityRecord>(() =>
        buildCommunityRecordDraft(resident.communityRecord),
    );
    const [leaseDraft, setLeaseDraft] = useState<LeaseWorkspaceDraft>(() =>
        buildDefaultLeaseDraft(resident, getLeaseAgreementsForResident(resident.slug)),
    );
    const [linkServiceRequestOpen, setLinkServiceRequestOpen] = useState(false);
    const [serviceRequestsVersion, setServiceRequestsVersion] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const displayed = optimistic ?? resident;
    const workspaceEditing = createMode || isInlineEditing;
    const canMutateFields = workspaceEditing && !resident.deletedAt;
    const { vehicles: syncedVehicles } = useResidentVehicles(resident.slug);
    const { householdMembers: syncedHousehold } = useResidentHousehold(resident.slug);
    const vehiclesForSection = workspaceEditing ? vehiclesDraft : syncedVehicles;
    const householdForSection = workspaceEditing ? householdDraft : syncedHousehold;

    const serviceRequests = useMemo(() => {
        if (createMode) return [];
        void serviceRequestsVersion;
        return getServiceMaintenanceTicketsForResident(resident.slug);
    }, [createMode, resident.slug, serviceRequestsVersion]);

    useEffect(() => {
        const bump = () => setServiceRequestsVersion((n) => n + 1);
        window.addEventListener(SERVICE_MAINTENANCE_TICKET_UPDATED_EVENT, bump);
        return () => window.removeEventListener(SERVICE_MAINTENANCE_TICKET_UPDATED_EVENT, bump);
    }, []);

    const openCreateServiceRequest = useCallback(() => {
        router.push(
            serviceMaintenanceCreateHref({
                residentSlug: resident.slug,
                propertyUnit: displayed.propertyUnit,
            }),
        );
    }, [router, resident.slug, displayed.propertyUnit]);

    const workspaceResident = useMemo(
        (): Resident => ({
            ...displayed,
            ...draft,
            residentType: (draft.residentType || displayed.residentType) as ResidentType,
            residentStatus: (draft.residentStatus || displayed.residentStatus) as ResidentStatusValue,
            userRole: (draft.userRole || displayed.userRole) as ResidentUserRole,
            identityDocument: identityDoc,
            notices: noticesDraft,
            communityRecord: communityRecordDraft,
        }),
        [displayed, draft, identityDoc, noticesDraft, communityRecordDraft],
    );

    const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';

    const residentHistorySupplemental = useMemo((): HistoryLogEntry[] => {
        if (createMode) return [];
        const base: HistoryLogEntry[] = [
            {
                id: `res-${displayed.slug}-created`,
                at: displayed.createdAt,
                user: { id: 'u-sys', name: 'System', role: 'Platform' },
                module: 'residents',
                recordId: displayed.slug,
                recordLabel: displayed.fullName,
                action: 'Resident record created',
                changes: '—',
                severity: 'success',
                actionType: 'created',
            },
            {
                id: `res-${displayed.slug}-updated`,
                at: displayed.updatedAt,
                user: { id: 'u-admin', name: 'Company Admin', role: 'Company Admin' },
                module: 'residents',
                recordId: displayed.slug,
                recordLabel: displayed.fullName,
                action: 'Record updated',
                changes: '—',
                severity: 'info',
                actionType: 'edited',
            },
        ];
        const noticeEntries: HistoryLogEntry[] = displayed.notices.map((n) => ({
            id: `res-${displayed.slug}-notice-${n.id}`,
            at: n.updatedAt,
            user: { id: 'u-admin', name: 'Company Admin', role: 'Company Admin' },
            module: 'residents',
            recordId: displayed.slug,
            recordLabel: displayed.fullName,
            action: `Notice updated: ${n.title}`,
            changes: `${n.category} · ${n.audienceTypes.join(', ')}`,
            severity: n.category === 'Emergency' ? 'warning' : 'info',
            actionType: 'edited',
        }));
        const timelineEntries: HistoryLogEntry[] = displayed.communityRecord.timelineLogs.map((log) => ({
            id: `res-${displayed.slug}-tl-${log.id}`,
            at: log.at.length <= 10 ? `${log.at}T12:00:00.000Z` : new Date(log.at).toISOString(),
            user: { id: 'u-admin', name: 'Company Admin', role: 'Company Admin' },
            module: 'residents',
            recordId: displayed.slug,
            recordLabel: displayed.fullName,
            action: `Timeline: ${log.kind.replace('-', ' ')}`,
            changes: log.note,
            severity: 'info',
            actionType: 'edited',
        }));
        const occupancyEntry: HistoryLogEntry = {
            id: `res-${displayed.slug}-occupancy`,
            at: displayed.updatedAt,
            user: { id: 'u-admin', name: 'Company Admin', role: 'Company Admin' },
            module: 'residents',
            recordId: displayed.slug,
            recordLabel: displayed.fullName,
            action: 'Occupancy status',
            changes: displayed.communityRecord.occupancyStatus,
            severity: displayed.communityRecord.occupancyStatus === 'Vacant' ? 'warning' : 'success',
            actionType: 'edited',
        };
        const accessEntry: HistoryLogEntry = {
            id: `res-${displayed.slug}-access`,
            at: displayed.updatedAt,
            user: { id: 'u-admin', name: 'Company Admin', role: 'Company Admin' },
            module: 'residents',
            recordId: displayed.slug,
            recordLabel: displayed.fullName,
            action: 'Access management',
            changes: displayed.portalAccessEnabled ? 'Portal enabled' : 'Portal disabled',
            severity: 'info',
            actionType: 'edited',
        };
        const docEntry: HistoryLogEntry | null = displayed.identityDocument
            ? {
                  id: `res-${displayed.slug}-doc`,
                  at: displayed.identityDocument.uploadedAt,
                  user: { id: 'u-admin', name: 'Company Admin', role: 'Company Admin' },
                  module: 'residents',
                  recordId: displayed.slug,
                  recordLabel: displayed.fullName,
                  action: 'Identity document',
                  changes: displayed.identityDocument.fileName,
                  severity: 'info',
                  actionType: 'edited',
              }
            : null;
        return [...base, ...noticeEntries, occupancyEntry, accessEntry, ...timelineEntries, ...(docEntry ? [docEntry] : [])];
    }, [createMode, displayed]);

    useEffect(() => {
        const fromUrl = normalizeResidentWorkspaceTab(searchParams.get('tab'));
        setTab(fromUrl);
    }, [searchParams]);

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        if (createMode) return;
        setDraft(buildDraft(resident));
        setIdentityDoc(resident.identityDocument);
        setNoticesDraft([...resident.notices]);
        setVehiclesDraft([...(resident.vehicles ?? [])]);
        setHouseholdDraft([...(resident.householdMembers ?? [])]);
        setCommunityRecordDraft(buildCommunityRecordDraft(resident.communityRecord));
        setLeaseDraft(buildDefaultLeaseDraft(resident, getLeaseAgreementsForResident(resident.slug)));
        setIsInlineEditing(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const base = `/platform/community/residents/view/${encodeURIComponent(resident.slug)}`;
        router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    }, [searchParams, router, createMode, resident.slug]);

    useEffect(() => {
        setOptimistic(null);
        setIdentityDoc(resident.identityDocument);
        if (!workspaceEditing) {
            setDraft(buildDraft(resident));
            setNoticesDraft([...resident.notices]);
            setVehiclesDraft([...(resident.vehicles ?? [])]);
            setHouseholdDraft([...(resident.householdMembers ?? [])]);
            setCommunityRecordDraft(buildCommunityRecordDraft(resident.communityRecord));
            setLeaseDraft(buildDefaultLeaseDraft(resident, getLeaseAgreementsForResident(resident.slug)));
        }
    }, [resident, workspaceEditing]);

    useEffect(() => {
        if (createMode) {
            const ymd = new Date().toISOString().slice(0, 10);
            setDraft(emptyDraft(ymd));
            setIdentityDoc(null);
            setNoticesDraft([]);
            setVehiclesDraft([]);
            setHouseholdDraft([]);
            setCommunityRecordDraft(buildCommunityRecordDraft(resident.communityRecord));
            setLeaseDraft(buildDefaultLeaseDraft(resident, []));
        }
    }, [createMode, resident.communityRecord]);

    const setTabNavigate = useCallback(
        (next: ResidentWorkspaceTabId) => {
            setTab(next);
            const sp = new URLSearchParams(searchParams.toString());
            sp.set('tab', next);
            router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
        },
        [router, searchParams, pathname],
    );

    const isDirty = useMemo(() => {
        if (createMode) return true;
        const base = buildDraft(resident);
        return (
            (Object.keys(base) as (keyof Draft)[]).some((k) => draft[k] !== base[k]) ||
            JSON.stringify(identityDoc) !== JSON.stringify(resident.identityDocument) ||
            JSON.stringify(noticesDraft) !== JSON.stringify(resident.notices) ||
            JSON.stringify(vehiclesDraft) !== JSON.stringify(resident.vehicles ?? []) ||
            JSON.stringify(householdDraft) !== JSON.stringify(resident.householdMembers ?? []) ||
            JSON.stringify(communityRecordDraft) !== JSON.stringify(resident.communityRecord)
        );
    }, [createMode, draft, resident, identityDoc, noticesDraft, vehiclesDraft, householdDraft, communityRecordDraft]);

    const validateNotices = (): string | null => {
        for (const n of noticesDraft) {
            const partial = n.title.trim() || n.description.trim();
            if (!partial) continue;
            if (!n.title.trim()) return 'Each notice must have a title.';
            if (!n.description.trim()) return 'Each notice must have a description.';
            if (!n.category) return 'Each notice must have a category.';
            if (n.audienceTypes.length === 0) return 'Each notice must have an audience.';
        }
        return null;
    };

    const validateCommunityRecord = (): string | null => {
        if (!communityRecordDraft.directoryResidentName.trim()) return 'Community directory resident name is required.';
        if (!communityRecordDraft.unitNumber.trim()) return 'Unit number is required.';
        return null;
    };

    const sanitizeNotices = (): ResidentNotice[] => {
        const now = new Date().toISOString();
        return noticesDraft
            .filter((n) => n.title.trim() || n.description.trim())
            .map((n) => ({ ...n, title: n.title.trim(), description: n.description.trim(), updatedAt: now }));
    };

    const validate = (): string | null => {
        if (!draft.fullName.trim()) return 'Full name is required.';
        if (!draft.email.trim()) return 'Email is required.';
        if (!draft.phoneNumber.trim()) return 'Phone number is required.';
        if (!draft.residentType) return 'Resident type is required.';
        if (!draft.propertyUnit.trim()) return 'Property / unit is required.';
        if (!draft.moveInDate) return 'Move-in date is required.';
        if (!draft.residentStatus) return 'Resident status is required.';
        if (!draft.emergencyContactNumber.trim()) return 'Emergency contact number is required.';
        if (!draft.userRole) return 'User role is required.';
        if (!draft.accessExpiryDate) return 'Access expiry date is required.';
        return validateNotices() ?? validateCommunityRecord();
    };

    const onWorkspaceEdit = () => {
        setDraft(buildDraft(optimistic ?? resident));
        setIdentityDoc(resident.identityDocument);
        setNoticesDraft([...(optimistic ?? resident).notices]);
        setVehiclesDraft([...((optimistic ?? resident).vehicles ?? [])]);
        setHouseholdDraft([...((optimistic ?? resident).householdMembers ?? [])]);
        setCommunityRecordDraft(buildCommunityRecordDraft((optimistic ?? resident).communityRecord));
        setLeaseDraft(buildDefaultLeaseDraft(optimistic ?? resident, getLeaseAgreementsForResident(resident.slug)));
        setIsInlineEditing(true);
    };

    const persistLeaseDraftForResident = (slug: string, saved: Resident) => {
        if (getLeaseAgreementsForResident(slug).length > 0) return;
        if (!leaseDraft.agreementName.trim()) return;
        const row = createLeaseAgreement({
            residentSlug: slug,
            residentName: saved.fullName,
            residentEmail: saved.email,
            propertyUnit: saved.propertyUnit,
            agreementName: leaseDraft.agreementName.trim(),
            leaseStartDate: leaseDraft.leaseStartDate,
            leaseEndDate: leaseDraft.leaseEndDate || leaseDraft.leaseStartDate,
            monthlyRent: Number(leaseDraft.monthlyRent) || 0,
            securityDeposit: Number(leaseDraft.securityDeposit) || 0,
        });
        attachLeaseGeneratedPdf(row.id);
        if (leaseDraft.sendOnSave) sendLeaseAgreement(row.id);
    };

    const onWorkspaceCancel = () => {
        if (createMode) {
            router.push('/platform/community/residents');
            return;
        }
        setDraft(buildDraft(resident));
        setIdentityDoc(resident.identityDocument);
        setNoticesDraft([...resident.notices]);
        setVehiclesDraft([...(resident.vehicles ?? [])]);
        setHouseholdDraft([...(resident.householdMembers ?? [])]);
        setCommunityRecordDraft(buildCommunityRecordDraft(resident.communityRecord));
        setLeaseDraft(buildDefaultLeaseDraft(resident, getLeaseAgreementsForResident(resident.slug)));
        setIsInlineEditing(false);
        setOptimistic(null);
    };

    const onWorkspaceSave = async ({ exitAfter }: { exitAfter: boolean }) => {
        const err = validate();
        if (err) {
            setInlineToast({ msg: err, err: true });
            return;
        }
        setInlineSaving(true);
        try {
            const notices = sanitizeNotices();
            const vehicles = sanitizeResidentVehicles(vehiclesDraft);
            const householdMembers = sanitizeResidentHousehold(householdDraft);
            if (createMode) {
                const created = addResident({
                    fullName: draft.fullName.trim(),
                    email: draft.email.trim(),
                    phoneNumber: draft.phoneNumber.trim(),
                    residentType: draft.residentType as ResidentType,
                    propertyUnit: draft.propertyUnit.trim(),
                    moveInDate: draft.moveInDate,
                    residentStatus: draft.residentStatus as ResidentStatusValue,
                    emergencyContactNumber: draft.emergencyContactNumber.trim(),
                    userRole: draft.userRole as ResidentUserRole,
                    portalAccessEnabled: draft.portalAccessEnabled,
                    loginUsername: draft.loginUsername.trim(),
                    temporaryPassword: draft.temporaryPassword,
                    accessExpiryDate: draft.accessExpiryDate,
                    identityDocument: identityDoc,
                    vehicles,
                    householdMembers,
                    notices,
                    communityRecord: {
                        ...communityRecordDraft,
                        directoryResidentName: communityRecordDraft.directoryResidentName.trim() || draft.fullName.trim(),
                    },
                });
                persistLeaseDraftForResident(created.slug, created);
                onBump();
                setStatusModal({ open: true, type: 'success', title: 'Resident created successfully' });
                window.setTimeout(() => {
                    router.replace(`${residentViewHref(created.slug)}?tab=overview`, { scroll: true });
                }, 400);
                return;
            }
            const updated = updateResident(resident.slug, {
                ...draft,
                residentType: draft.residentType as ResidentType,
                residentStatus: draft.residentStatus as ResidentStatusValue,
                userRole: draft.userRole as ResidentUserRole,
                identityDocument: identityDoc,
                vehicles,
                householdMembers,
                notices,
                communityRecord: communityRecordDraft,
            });
            if (!updated) {
                setInlineToast({ msg: 'Could not save changes.', err: true });
                return;
            }
            persistLeaseDraftForResident(updated.slug, updated);
            setOptimistic(updated);
            onBump();
            setStatusModal({ open: true, type: 'success', title: 'Workspace saved successfully' });
            if (exitAfter) setIsInlineEditing(false);
        } catch {
            setInlineToast({ msg: 'Could not save workspace.', err: true });
        } finally {
            setInlineSaving(false);
        }
    };

    const exportJson = () => {
        const payload = { ...displayed, identityDocument: identityDoc };
        const safe = (displayed.fullName || 'resident')
            .replace(/[/\\?%*:|"<>]/g, '-')
            .replace(/\.+$/, '')
            .slice(0, 80);
        downloadTextFile({ filename: `${safe}.json`, content: JSON.stringify(payload, null, 2), mime: 'application/json;charset=utf-8' });
    };

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const blobUrl = URL.createObjectURL(file);
        setIdentityDoc({
            id: `doc-${Date.now()}`,
            fileName: file.name,
            sizeLabel: formatFileSize(file.size),
            uploadedAt: new Date().toISOString(),
            mimeType: file.type || 'application/octet-stream',
            blobUrl,
        });
        e.target.value = '';
    };

    const openPreview = () => {
        if (!identityDoc?.blobUrl) return;
        window.open(identityDoc.blobUrl, '_blank', 'noopener,noreferrer');
    };

    const downloadDoc = () => {
        if (!identityDoc?.blobUrl) return;
        const a = document.createElement('a');
        a.href = identityDoc.blobUrl;
        a.download = identityDoc.fileName;
        a.click();
    };

    const nextCode = peekNextResidentCode();

    const typeBadge = (t: ResidentType | '') => {
        if (!t) return 'bg-slate-100 text-slate-700';
        if (t === 'Owner') return 'bg-orange-100 text-orange-900';
        if (t === 'Tenant') return 'bg-[color-mix(in_srgb,var(--cta-button-bg)_18%,white)] text-slate-900';
        return 'bg-violet-100 text-violet-900';
    };

    const statusBadge = (s: ResidentStatusValue | '') => {
        if (!s) return 'bg-slate-100 text-slate-700';
        if (s === 'Active') return 'bg-emerald-100 text-emerald-900';
        if (s === 'Inactive') return 'bg-slate-200 text-slate-900';
        return 'bg-amber-100 text-amber-950';
    };

    return (
        <div className="w-full min-w-0 space-y-0">
            <StatusModal open={statusModal.open} type={statusModal.type} title={statusModal.title} onClose={() => setStatusModal((s) => ({ ...s, open: false }))} />
            {inlineToast ? <InlineToast message={inlineToast.msg} variant={inlineToast.err ? 'error' : 'success'} onDismiss={() => setInlineToast(null)} /> : null}

            <ResidentMainTabBar active={tab} onChange={setTabNavigate} />

            {!createMode && resident.deletedAt ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 shadow-sm">
                    This resident is archived and is hidden from the main Resident Management list.
                </div>
            ) : null}

            {createMode ? (
                <div className={CTA_INFO_BANNER}>
                    You are creating a new resident <span className={CTA_INFO_BANNER_BADGE}>Draft</span>
                </div>
            ) : null}
            {!resident.deletedAt && !createMode ? (
                <div className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <ResidentDetailMoreMenu
                                resident={displayed}
                                onEdit={onWorkspaceEdit}
                                isEditing={workspaceEditing}
                                isSaving={inlineSaving}
                                onRequestPermanentDelete={() => setPermDelOpen(true)}
                            />
                        </div>
                        <WorkspaceUtilityToolbar
                            help={RESIDENT_WORKSPACE_HELP}
                            triggerLabel="Resident workspace help"
                            email={displayed.email}
                            onExport={exportJson}
                            saving={inlineSaving}
                            isInlineEditing={workspaceEditing}
                        />
                    </div>
                </div>
            ) : resident.deletedAt && !createMode ? (
                <div className="mt-3 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Read-only archived record</div>
            ) : null}

            {!createMode ? (
                <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                        <span className="inline-flex items-center gap-2">
                            <LuCalendar size={14} className="text-gray-500" aria-hidden />
                            <span className="text-gray-600">Created</span>
                            <span className="font-medium text-gray-900">{formatIso(displayed.createdAt)}</span>
                        </span>
                        <span className="hidden h-4 w-px bg-gray-300 sm:inline" aria-hidden />
                        <span className="inline-flex items-center gap-2">
                            <LuClock3 size={14} className="text-gray-500" aria-hidden />
                            <span className="text-gray-600">Updated</span>
                            <span className="font-medium text-gray-900">{formatIso(displayed.updatedAt)}</span>
                        </span>
                       
                    </div>
                </div>
            ) : null}

            <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                {tab === 'overview' ? (
                    <>
                    <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
                        <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-span-2">
                            <div
                                className={cn(
                                    'flex min-h-0 min-w-0 flex-col rounded-xl border bg-white shadow-sm',
                                    workspaceEditing && !resident.deletedAt ? CTA_CARD_EDITING_RING : 'border-gray-200/80',
                                )}
                            >
                                <div className="bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                                    <div className="flex min-w-0 gap-4 border-b border-gray-200/60 pb-4">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-50 text-lg font-semibold text-gray-700 ring-1 ring-gray-200/80">
                                            {initials(createMode ? draft.fullName || 'New resident' : displayed.fullName)}
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="truncate text-2xl font-semibold tracking-tight text-gray-900">
                                                    {createMode ? draft.fullName.trim() || 'New resident' : displayed.fullName}
                                                </h2>
                                                {workspaceEditing ? <span className={CTA_EDITING_BADGE}>Editing Mode</span> : null}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                                                    {createMode ? nextCode : displayed.residentCode}
                                                </span>
                                                {(workspaceEditing ? draft.residentType : displayed.residentType) ? (
                                                    <span
                                                        className={cn(
                                                            'rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                                                            typeBadge((workspaceEditing ? draft.residentType : displayed.residentType) as ResidentType | ''),
                                                        )}
                                                    >
                                                        {workspaceEditing ? draft.residentType : displayed.residentType}
                                                    </span>
                                                ) : null}
                                                {(workspaceEditing ? draft.residentStatus : displayed.residentStatus) ? (
                                                    <span
                                                        className={cn(
                                                            'rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                                                            statusBadge(
                                                                (workspaceEditing ? draft.residentStatus : displayed.residentStatus) as ResidentStatusValue | '',
                                                            ),
                                                        )}
                                                    >
                                                        {workspaceEditing ? draft.residentStatus : displayed.residentStatus}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <LuMail size={14} className="text-gray-400" />
                                                    {(workspaceEditing ? draft.email : displayed.email)?.trim() || '—'}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <LuPhone size={14} className="text-gray-400" />
                                                    {(workspaceEditing ? draft.phoneNumber : displayed.phoneNumber)?.trim() || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-4">
                                        <ResidentCollapsibleSection
                                            title="RESIDENT INFORMATION"
                                            icon={LuUser}
                                            tone="blue"
                                            open={sectionsOpen.info}
                                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, info: o }))}
                                        >
                                            <div className={fieldGrid}>
                                                <ResidentFieldRow label="Resident ID">
                                                    <span className="font-mono text-sm tracking-tight text-gray-900">
                                                        {createMode ? `${nextCode} (auto)` : displayed.residentCode}
                                                    </span>
                                                </ResidentFieldRow>
                                                <ResidentFieldRow label="Resident Type" required>
                                                    <EditableSelect
                                                        isEditing={canMutateFields}
                                                        value={draft.residentType}
                                                        onChange={(value) => setDraft((d) => ({ ...d, residentType: value as ResidentType }))}
                                                        placeholder="Select type"
                                                        options={[...RESIDENT_TYPE_OPTIONS]}
                                                        readValue={
                                                            displayed.residentType ? (
                                                                <span
                                                                    className={cn(
                                                                        'rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
                                                                        typeBadge(displayed.residentType),
                                                                    )}
                                                                >
                                                                    {displayed.residentType}
                                                                </span>
                                                            ) : (
                                                                EMPTY_FIELD
                                                            )
                                                        }
                                                    />
                                                </ResidentFieldRow>
                                                <ResidentFieldRow label="Full Name" required>
                                                    <EditableField
                                                        id={RESIDENT_INLINE_FIELD_IDS.fullName}
                                                        isEditing={canMutateFields}
                                                        value={draft.fullName}
                                                        onChange={(value) => setDraft((d) => ({ ...d, fullName: value }))}
                                                        readValue={
                                                            displayed.fullName?.trim() ? (
                                                                <span className="text-base font-semibold text-gray-900">{displayed.fullName}</span>
                                                            ) : (
                                                                EMPTY_FIELD
                                                            )
                                                        }
                                                    />
                                                </ResidentFieldRow>
                                                <ResidentFieldRow label="Phone" required>
                                                    <EditableField
                                                        id={RESIDENT_INLINE_FIELD_IDS.phoneNumber}
                                                        isEditing={canMutateFields}
                                                        type="tel"
                                                        value={draft.phoneNumber}
                                                        onChange={(value) => setDraft((d) => ({ ...d, phoneNumber: value }))}
                                                        readValue={
                                                            displayed.phoneNumber?.trim() ? (
                                                                <a
                                                                    href={`tel:${displayed.phoneNumber.replace(/\s/g, '')}`}
                                                                    className="hover:text-[var(--cta-button-bg)] hover:underline"
                                                                >
                                                                    {displayed.phoneNumber}
                                                                </a>
                                                            ) : (
                                                                EMPTY_FIELD
                                                            )
                                                        }
                                                    />
                                                </ResidentFieldRow>
                                                <ResidentFieldRow label="Email" required>
                                                    <EditableField
                                                        id={RESIDENT_INLINE_FIELD_IDS.email}
                                                        isEditing={canMutateFields}
                                                        type="email"
                                                        value={draft.email}
                                                        onChange={(value) => setDraft((d) => ({ ...d, email: value }))}
                                                        readValue={
                                                            displayed.email?.trim() ? (
                                                                <a
                                                                    href={`mailto:${displayed.email}`}
                                                                    className="break-all hover:text-[var(--cta-button-bg)] hover:underline"
                                                                >
                                                                    {displayed.email}
                                                                </a>
                                                            ) : (
                                                                EMPTY_FIELD
                                                            )
                                                        }
                                                    />
                                                </ResidentFieldRow>
                                                <ResidentFieldRow label="Property / Unit" required>
                                                    <EditableSelect
                                                        id={RESIDENT_INLINE_FIELD_IDS.propertyUnit}
                                                        isEditing={canMutateFields}
                                                        value={draft.propertyUnit}
                                                        onChange={(value) => setDraft((d) => ({ ...d, propertyUnit: value }))}
                                                        placeholder="Select unit"
                                                        options={[...RESIDENT_PROPERTY_UNIT_OPTIONS]}
                                                        readValue={displayed.propertyUnit?.trim() || EMPTY_FIELD}
                                                    />
                                                </ResidentFieldRow>
                                                <ResidentFieldRow label="Move-in Date" required>
                                                    <EditableField
                                                        id={RESIDENT_INLINE_FIELD_IDS.moveInDate}
                                                        isEditing={canMutateFields}
                                                        type="date"
                                                        value={draft.moveInDate}
                                                        onChange={(value) => setDraft((d) => ({ ...d, moveInDate: value }))}
                                                        readValue={displayed.moveInDate || EMPTY_FIELD}
                                                    />
                                                </ResidentFieldRow>
                                                <ResidentFieldRow label="Resident Status" required>
                                                    <EditableSelect
                                                        isEditing={canMutateFields}
                                                        value={draft.residentStatus}
                                                        onChange={(value) => setDraft((d) => ({ ...d, residentStatus: value as ResidentStatusValue }))}
                                                        placeholder="Select status"
                                                        options={[...RESIDENT_STATUS_OPTIONS]}
                                                        readValue={
                                                            displayed.residentStatus ? (
                                                                <span
                                                                    className={cn(
                                                                        'rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
                                                                        statusBadge(displayed.residentStatus),
                                                                    )}
                                                                >
                                                                    {displayed.residentStatus}
                                                                </span>
                                                            ) : (
                                                                EMPTY_FIELD
                                                            )
                                                        }
                                                    />
                                                </ResidentFieldRow>
                                                <ResidentFieldRow label="Emergency Contact" required className="xl:col-span-2">
                                                    <EditableField
                                                        id={RESIDENT_INLINE_FIELD_IDS.emergencyContact}
                                                        isEditing={canMutateFields}
                                                        type="tel"
                                                        value={draft.emergencyContactNumber}
                                                        onChange={(value) => setDraft((d) => ({ ...d, emergencyContactNumber: value }))}
                                                        readValue={
                                                            displayed.emergencyContactNumber?.trim() ? (
                                                                <a
                                                                    href={`tel:${displayed.emergencyContactNumber.replace(/\s/g, '')}`}
                                                                    className="hover:text-[var(--cta-button-bg)] hover:underline"
                                                                >
                                                                    {displayed.emergencyContactNumber}
                                                                </a>
                                                            ) : (
                                                                EMPTY_FIELD
                                                            )
                                                        }
                                                    />
                                                </ResidentFieldRow>
                                            </div>
                                        </ResidentCollapsibleSection>

                                        <ResidentCollapsibleSection
                                            title="HOUSEHOLD MEMBERS"
                                            icon={LuUsers}
                                            tone="blue"
                                            open={sectionsOpen.household}
                                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, household: o }))}
                                        >
                                            <div className="p-3 sm:p-4">
                                                <ResidentHouseholdSection
                                                    householdMembers={householdForSection}
                                                    onHouseholdChange={setHouseholdDraft}
                                                    canMutate={canMutateFields}
                                                    onRequestEdit={() => setIsInlineEditing(true)}
                                                />
                                                {!workspaceEditing ? (
                                                    <p className="mt-3 text-center text-[11px] text-gray-500">
                                                        Synced with the resident portal My Unit page.
                                                    </p>
                                                ) : null}
                                            </div>
                                        </ResidentCollapsibleSection>

                                        <ResidentCollapsibleSection
                                            title="VEHICLES"
                                            icon={LuCar}
                                            tone="slate"
                                            open={sectionsOpen.vehicles}
                                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, vehicles: o }))}
                                        >
                                            <div className="p-3 sm:p-4">
                                                <ResidentVehiclesSection
                                                    vehicles={vehiclesForSection}
                                                    onVehiclesChange={setVehiclesDraft}
                                                    canMutate={canMutateFields}
                                                    onRequestEdit={() => setIsInlineEditing(true)}
                                                />
                                                {!workspaceEditing ? (
                                                    <p className="mt-3 text-center text-[11px] text-gray-500">
                                                        Synced with the resident portal My Unit page.
                                                    </p>
                                                ) : null}
                                            </div>
                                        </ResidentCollapsibleSection>

                                        <ResidentCollapsibleSection
                                            title="ACCESS MANAGEMENT"
                                            icon={LuKeyRound}
                                            tone="amber"
                                            open={sectionsOpen.access}
                                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, access: o }))}
                                        >
                                            <div className={fieldGrid}>
                                                <ResidentFieldRow label="User Role" required>
                                                    <EditableSelect
                                                        id={RESIDENT_INLINE_FIELD_IDS.userRole}
                                                        isEditing={canMutateFields}
                                                        value={draft.userRole}
                                                        onChange={(value) => setDraft((d) => ({ ...d, userRole: value as ResidentUserRole }))}
                                                        placeholder="Select role"
                                                        options={[...RESIDENT_USER_ROLE_OPTIONS]}
                                                        readValue={displayed.userRole?.trim() || EMPTY_FIELD}
                                                    />
                                                </ResidentFieldRow>
                                                <ResidentFieldRow label="Portal Access">
                                                    <EditableSelect
                                                        isEditing={canMutateFields}
                                                        value={draft.portalAccessEnabled ? 'Enabled' : 'Disabled'}
                                                        onChange={(value) => setDraft((d) => ({ ...d, portalAccessEnabled: value === 'Enabled' }))}
                                                        options={['Enabled', 'Disabled']}
                                                        readValue={
                                                            <span
                                                                className={cn(
                                                                    'rounded-full px-2 py-0.5 text-xs font-bold',
                                                                    displayed.portalAccessEnabled ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-800',
                                                                )}
                                                            >
                                                                {displayed.portalAccessEnabled ? 'Enabled' : 'Disabled'}
                                                            </span>
                                                        }
                                                    />
                                                </ResidentFieldRow>
                                                <ResidentFieldRow label="Login Username">
                                                    <EditableField
                                                        id={RESIDENT_INLINE_FIELD_IDS.loginUsername}
                                                        isEditing={canMutateFields}
                                                        value={draft.loginUsername}
                                                        onChange={(value) => setDraft((d) => ({ ...d, loginUsername: value }))}
                                                        readValue={displayed.loginUsername?.trim() || EMPTY_FIELD}
                                                    />
                                                </ResidentFieldRow>
                                                <ResidentFieldRow label="Temporary Password">
                                                    <EditableField
                                                        id={RESIDENT_INLINE_FIELD_IDS.temporaryPassword}
                                                        isEditing={canMutateFields}
                                                        type="password"
                                                        value={draft.temporaryPassword}
                                                        onChange={(value) => setDraft((d) => ({ ...d, temporaryPassword: value }))}
                                                        readValue={
                                                            displayed.temporaryPassword?.trim() ? (
                                                                <span className="font-mono text-sm tracking-wide text-gray-700">••••••••</span>
                                                            ) : (
                                                                EMPTY_FIELD
                                                            )
                                                        }
                                                    />
                                                </ResidentFieldRow>
                                                <ResidentFieldRow label="Access Expiry" required className="xl:col-span-2">
                                                    <EditableField
                                                        id={RESIDENT_INLINE_FIELD_IDS.accessExpiryDate}
                                                        isEditing={canMutateFields}
                                                        type="date"
                                                        value={draft.accessExpiryDate}
                                                        onChange={(value) => setDraft((d) => ({ ...d, accessExpiryDate: value }))}
                                                        readValue={displayed.accessExpiryDate || EMPTY_FIELD}
                                                    />
                                                </ResidentFieldRow>
                                            </div>
                                            {!workspaceEditing ? (
                                                <p className="border-t border-gray-100 px-3 py-2 text-sm text-gray-500">Use Edit on the workspace toolbar to change credentials.</p>
                                            ) : null}
                                        </ResidentCollapsibleSection>

                                        <ResidentCollapsibleSection
                                            title="IDENTITY DOCUMENT"
                                            icon={LuFileText}
                                            tone="slate"
                                            open={sectionsOpen.documents}
                                            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, documents: o }))}
                                        >
                                            <div className="space-y-4 p-3">
                                                <p className="text-sm text-gray-600">Upload, preview (when supported), download, or replace identity proof.</p>
                                                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={onPickFile} />
                                                {identityDoc ? (
                                                    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{identityDoc.fileName}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {identityDoc.sizeLabel} · {formatIso(identityDoc.uploadedAt)}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <Button type="button" variant="companyOutline" size="sm" onClick={openPreview} disabled={!identityDoc.blobUrl}>
                                                                    Preview
                                                                </Button>
                                                                <Button type="button" variant="companyOutline" size="sm" onClick={downloadDoc} disabled={!identityDoc.blobUrl}>
                                                                    Download
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="company"
                                                                    size="sm"
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    disabled={!canMutateFields}
                                                                >
                                                                    Replace
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        {identityDoc.mimeType.startsWith('image') && identityDoc.blobUrl ? (
                                                            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white p-2">
                                                                <img src={identityDoc.blobUrl} alt="" className="max-h-64 w-full object-contain" />
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={!canMutateFields}
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className={cn(
                                                            'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white px-4 py-10 text-sm font-semibold text-gray-600 hover:border-[var(--cta-button-bg)] hover:text-[var(--cta-button-bg)] disabled:opacity-40',
                                                            CTA_FOCUS_RING_SOFT,
                                                        )}
                                                    >
                                                        <LuFileText className="mb-2 h-8 w-8 opacity-70" aria-hidden />
                                                        Upload identity document
                                                    </button>
                                                )}
                                            </div>
                                        </ResidentCollapsibleSection>
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div className="min-w-0 space-y-4 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
                            <ResidentAIPanel resident={workspaceResident} disabled={workspaceEditing} />
                            <Card className="border border-gray-200 p-4 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-900">Quick info</h3>
                                <dl className="mt-3 space-y-2 text-sm text-gray-700">
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-gray-500">Unit</dt>
                                        <dd className="max-w-[60%] truncate text-right font-medium text-gray-900">
                                            {(workspaceEditing ? draft.propertyUnit : displayed.propertyUnit) || '—'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-gray-500">Role</dt>
                                        <dd className="font-medium text-gray-900">{(workspaceEditing ? draft.userRole : displayed.userRole) || '—'}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-gray-500">Portal</dt>
                                        <dd className="font-medium text-gray-900">
                                            {workspaceEditing ? (draft.portalAccessEnabled ? 'On' : 'Off') : displayed.portalAccessEnabled ? 'On' : 'Off'}
                                        </dd>
                                    </div>
                                </dl>
                            </Card>
                            <Card className="border border-gray-200 p-4 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-900">Activity summary</h3>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                                        Docs: {identityDoc ? 'Attached' : 'Missing'}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                                        Access: {(workspaceEditing ? draft.accessExpiryDate : displayed.accessExpiryDate) || '—'}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                                        Status: {(workspaceEditing ? draft.residentStatus : displayed.residentStatus) || '—'}
                                    </span>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {!createMode ? (
                        <section className="mt-4 space-y-4">
                            <article className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Service requests</h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Maintenance and service tickets linked to {displayed.fullName}.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="companyOutline"
                                            className="gap-1.5"
                                            disabled={workspaceEditing}
                                            onClick={() => setLinkServiceRequestOpen(true)}
                                        >
                                            <LuLink size={14} aria-hidden />
                                            Link service request
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="company"
                                            className="gap-1.5"
                                            disabled={workspaceEditing}
                                            onClick={openCreateServiceRequest}
                                        >
                                            <LuPlus size={14} aria-hidden />
                                            Create service request
                                        </Button>
                                    </div>
                                </div>
                                <ResidentServiceRequestsTable
                                    tickets={serviceRequests}
                                    residentName={displayed.fullName}
                                    readOnly={workspaceEditing}
                                    onCreate={workspaceEditing ? undefined : openCreateServiceRequest}
                                />
                            </article>
                        </section>
                    ) : null}
                    </>
                ) : null}

                {tab === 'notices' ? (
                    <ResidentNoticesTab
                        resident={workspaceResident}
                        notices={canMutateFields ? noticesDraft : displayed.notices}
                        onNoticesChange={setNoticesDraft}
                        canMutate={canMutateFields}
                        onRequestEdit={
                            !canMutateFields && !createMode && !resident.deletedAt ? onWorkspaceEdit : undefined
                        }
                    />
                ) : null}

                {tab === 'visitors' && !createMode ? <ResidentVisitorsTab resident={displayed} /> : null}

                {tab === 'amenities' && !createMode ? <ResidentAmenitiesTab resident={displayed} /> : null}

                {tab === 'records' ? (
                    <ResidentRecordsTab
                        resident={workspaceResident}
                        communityRecord={communityRecordDraft}
                        onCommunityRecordChange={setCommunityRecordDraft}
                        canMutate={canMutateFields}
                    />
                ) : null}

                {tab === 'lease' ? (
                    <ResidentLeaseAgreementsTab
                        resident={workspaceResident}
                        canMutate={canMutateFields}
                        leaseDraft={leaseDraft}
                        onLeaseDraftChange={setLeaseDraft}
                        onRequestEdit={
                            !canMutateFields && !createMode && !resident.deletedAt
                                ? () => {
                                      onWorkspaceEdit();
                                      setTabNavigate('lease');
                                  }
                                : undefined
                        }
                    />
                ) : null}

                {tab === 'activity' ? (
                    <div className="w-full min-w-0">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                            <RecordHistoryLogPanel
                                module="residents"
                                recordId={displayed.slug}
                                recordTitle={displayed.fullName}
                                supplementalEntries={residentHistorySupplemental}
                            />
                        </div>
                    </div>
                ) : null}

                {workspaceEditing && !resident.deletedAt ? (
                    <div className="sticky bottom-0 z-30 mt-4 pb-1">
                        <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                            <div className="flex items-center gap-3">
                                <p className="text-sm font-semibold text-gray-900">
                                    {createMode ? 'Create resident workspace' : 'You have unsaved changes'}
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
                                        onClick={() => void onWorkspaceSave({ exitAfter: true })}
                                        isLoading={inlineSaving}
                                    >
                                        {inlineSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            variant="companyOutline"
                                            size="cta"
                                            onClick={() => void onWorkspaceSave({ exitAfter: false })}
                                            disabled={inlineSaving || !isDirty}
                                            isLoading={inlineSaving}
                                        >
                                            {inlineSaving ? 'Saving...' : 'Save'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="company"
                                            size="cta"
                                            onClick={() => void onWorkspaceSave({ exitAfter: true })}
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

            <Modal
                isOpen={permDelOpen}
                onClose={() => setPermDelOpen(false)}
                title="Delete resident permanently"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setPermDelOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={() => {
                                deleteResidentPermanent(resident.slug);
                                setPermDelOpen(false);
                                router.push('/platform/community/residents');
                            }}
                        >
                            Delete permanently
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Permanently remove <span className="font-semibold text-slate-900">{resident.fullName}</span>? This cannot be undone in the demo store.
                </p>
            </Modal>

            {!createMode ? (
                <ResidentLinkServiceRequestModal
                    isOpen={linkServiceRequestOpen}
                    onClose={() => setLinkServiceRequestOpen(false)}
                    residentSlug={resident.slug}
                    residentName={displayed.fullName}
                    propertyUnit={displayed.propertyUnit}
                    onLinked={() => {
                        setServiceRequestsVersion((n) => n + 1);
                        setInlineToast({ msg: 'Service request linked.', err: false });
                    }}
                />
            ) : null}
        </div>
    );
}
