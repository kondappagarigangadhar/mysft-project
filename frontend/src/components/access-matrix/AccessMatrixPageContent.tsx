'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useAdaptiveRoleColumnPagination } from '@/hooks/useAdaptiveRoleColumnPagination';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { CustomRolesEmptyState } from '@/components/access-matrix/CustomRolesEmptyState';
import { MatrixPermissionCell } from '@/components/access-matrix/MatrixPermissionCell';
import { PermissionLegend } from '@/components/access-matrix/PermissionLegend';
import { RoleSetPagination } from '@/components/access-matrix/RoleSetPagination';
import { RoleOriginBadge } from '@/components/access-matrix/RoleOriginBadge';
import { AssignRoleUsersModal, platformUserToAssigned } from '@/components/access-matrix/AssignRoleUsersModal';
import { MATRIX_LAYOUT, PERMISSION_DROPDOWN_OPTIONS } from '@/lib/accessMatrix/constants';
import {
    MATRIX_MODULES,
    SEED_AUDIT,
    buildDefaultRoles,
    buildInitialMatrix,
    isDefaultMatrixRole,
    seedUsersByRole,
} from '@/lib/accessMatrix/seed';
import type { User } from '@/data/mockData';
import type { AssignedMatrixUser, AuditMatrixEntry, MatrixRole, PermissionId } from '@/lib/accessMatrix/types';
import { CTA_CHECKBOX_SM, CTA_INPUT_FOCUS, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';
import { WorkspaceHelp, ACCESS_MATRIX_WORKSPACE_HELP } from '@/components/workspace-help';
import {
    LuBookmark,
    LuChevronDown,
    LuChevronLeft,
    LuChevronRight,
    LuClipboardList,
    LuChartColumn,
    LuDownload,
    LuFactory,
    LuGauge,
    LuEllipsisVertical,
    LuFileText,
    LuFilter,
    LuHistory,
    LuMessagesSquare,
    LuPackage,
    LuPlug,
    LuReceipt,
    LuPin,
    LuPlus,
    LuMonitor,
    LuSearch,
    LuShieldCheck,
    LuShoppingCart,
    LuTruck,
    LuUpload,
    LuUserPlus,
    LuUsers,
    LuX,
} from 'react-icons/lu';

const PATHNAME = '/platform/access-matrix';
const LEGACY_SAVED_VIEWS_KEY = 'arris-access-matrix-saved-views';

const MODULE_ACTIONS_MENU_W_PX = 240; /* Tailwind w-60 */
const ROLE_ACTIONS_MENU_W_PX = 240;
/** Menus above sticky matrix header (z-45); below modals (z-50). */
const MATRIX_FLOATING_MENU_Z = 350;
const MATRIX_TOAST_DURATION_MS = 2800;
/** Sticky role header offset — matches fixed `CompanyAdminNavbar` (h-14). */
const MATRIX_STICKY_TOP = 'top-14';

type MatrixToast = { msg: string; variant: 'success' | 'error' };

const ALL_FEATURE_IDS = MATRIX_MODULES.flatMap((m) => m.features.map((f) => f.id));

function cloneMatrix(m: Record<string, Record<string, PermissionId>>): Record<string, Record<string, PermissionId>> {
    return JSON.parse(JSON.stringify(m)) as Record<string, Record<string, PermissionId>>;
}

function countMatrixDiff(
    current: Record<string, Record<string, PermissionId>>,
    baseline: Record<string, Record<string, PermissionId>>,
    roleIds: string[],
): number {
    let n = 0;
    for (const f of ALL_FEATURE_IDS) {
        for (const r of roleIds) {
            const c = current[f]?.[r] ?? 'No Access';
            const b = baseline[f]?.[r] ?? 'No Access';
            if (c !== b) n++;
        }
    }
    return n;
}

function moduleIconFor(id: string): React.ComponentType<{ className?: string; size?: number }> {
    switch (id) {
        case 'vendor-mgmt':
            return LuTruck;
        case 'supplier-mgmt':
            return LuFactory;
        case 'work-order-mgmt':
            return LuClipboardList;
        case 'procurement':
            return LuShoppingCart;
        case 'invoice-payment':
            return LuReceipt;
        case 'sla-performance':
            return LuGauge;
        case 'inventory-consumption':
            return LuPackage;
        case 'service-integration':
            return LuPlug;
        case 'compliance-documentation':
            return LuShieldCheck;
        case 'vendor-communication':
            return LuMessagesSquare;
        case 'vendor-analytics':
            return LuChartColumn;
        case 'leads':
            return LuUserPlus;
        case 'customers':
            return LuUsers;
        case 'residents':
            return LuUsers;
        case 'lead-intelligence':
            return LuGauge;
        case 'ai-demand-intelligence':
            return LuMonitor;
        case 'projects-setup':
            return LuClipboardList;
        case 'inventory-pricing':
            return LuPackage;
        case 'visual-mapping':
            return LuMonitor;
        case 'bookings':
            return LuBookmark;
        case 'payments':
            return LuReceipt;
        case 'booking-payment-ai':
            return LuMessagesSquare;
        case 'payment-links':
            return LuPlug;
        case 'document-management':
            return LuFileText;
        case 'e-sign':
            return LuFileText;
        case 'audit-activity':
            return LuHistory;
        case 'records-management':
            return LuShieldCheck;
        case 'finance':
            return LuReceipt;
        case 'inventory':
            return LuPackage;
        case 'work-orders':
            return LuClipboardList;
        case 'documents':
            return LuFileText;
        case 'users':
            return LuUsers;
        default:
            return LuClipboardList;
    }
}

type MatrixRoleStatus = NonNullable<MatrixRole['status']>;
type RoleMatrixTab = 'default' | 'custom';

type FilterPayload = {
    search: string;
    moduleIds: string[];
    /** Which role governance statuses appear as matrix columns. Default: Active only. */
    roleStatuses: MatrixRoleStatus[];
};

type SavedMatrixView = { id: string; name: string; payload: FilterPayload };

const MATRIX_ROLE_STATUS_OPTIONS: MatrixRoleStatus[] = ['Active', 'Draft', 'Disabled'];

function normalizeFilterPayload(raw: Partial<FilterPayload> | undefined): FilterPayload {
    const search = typeof raw?.search === 'string' ? raw.search : '';
    const moduleIds =
        Array.isArray(raw?.moduleIds) && raw.moduleIds.length > 0
            ? [...raw.moduleIds]
            : MATRIX_MODULES.map((m) => m.id);
    const allowed = new Set<MatrixRoleStatus>(MATRIX_ROLE_STATUS_OPTIONS);
    let roleStatuses: MatrixRoleStatus[] = [];
    if (Array.isArray(raw?.roleStatuses) && raw.roleStatuses.length > 0) {
        roleStatuses = [...new Set(raw.roleStatuses.filter((x): x is MatrixRoleStatus => allowed.has(x)))];
    }
    if (roleStatuses.length === 0) roleStatuses = ['Active'];
    return { search, moduleIds, roleStatuses };
}

function formatTs(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function initials(name: string): string {
    const p = name.trim().split(/\s+/).filter(Boolean);
    if (p.length === 0) return '?';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function statusBadge(status: AssignedMatrixUser['status']) {
    const base = 'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide';
    if (status === 'Active') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (status === 'Invited') return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
    return cn(base, 'border-slate-200 bg-slate-100 text-slate-600');
}

export function AccessMatrixPageContent() {
    const globalViewsTick = useGlobalSavedViewsSync();
    const [roles, setRoles] = useState<MatrixRole[]>(() => buildDefaultRoles());
    const [matrix, setMatrix] = useState<Record<string, Record<string, PermissionId>>>(() =>
        cloneMatrix(buildInitialMatrix(buildDefaultRoles().map((r) => r.id))),
    );
    const [baselineMatrix, setBaselineMatrix] = useState<Record<string, Record<string, PermissionId>>>(() =>
        cloneMatrix(buildInitialMatrix(buildDefaultRoles().map((r) => r.id))),
    );
    const [lastUpdated, setLastUpdated] = useState<{ at: Date; by: string }>(() => ({
        at: new Date(),
        by: 'Super Admin',
    }));
    const [pinnedRoleIds, setPinnedRoleIds] = useState<Set<string>>(() => new Set());
    const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(() => new Set());
    const [roleMenuFor, setRoleMenuFor] = useState<string | null>(null);
    const [moduleMenuFor, setModuleMenuFor] = useState<string | null>(null);
    const [moduleMenuPos, setModuleMenuPos] = useState<{ top: number; left: number } | null>(null);
    const [roleMenuPos, setRoleMenuPos] = useState<{ top: number; left: number } | null>(null);
    const moduleMenuAnchorRef = useRef<HTMLButtonElement>(null);
    const matrixScrollRef = useRef<HTMLDivElement>(null);
    const matrixHeaderHScrollRef = useRef<HTMLDivElement>(null);
    const matrixBodyHScrollRef = useRef<HTMLDivElement>(null);
    const matrixHScrollSyncLock = useRef(false);
    const [rolePageIndex, setRolePageIndex] = useState(0);
    const [bulkApplyOpen, setBulkApplyOpen] = useState(false);
    const bulkApplyRef = useRef<HTMLDivElement>(null);
    const [editRoleOpen, setEditRoleOpen] = useState(false);
    const [editRoleId, setEditRoleId] = useState<string | null>(null);
    const [editRoleName, setEditRoleName] = useState('');
    const [editRoleDesc, setEditRoleDesc] = useState('');

    const [usersByRole, setUsersByRole] = useState<Record<string, AssignedMatrixUser[]>>(() =>
        seedUsersByRole(buildDefaultRoles().map((r) => r.id)),
    );
    const [auditLog, setAuditLog] = useState<AuditMatrixEntry[]>(() => [...SEED_AUDIT]);

    const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
    const [searchDraft, setSearchDraft] = useState('');
    const [filters, setFilters] = useState<FilterPayload>(() => normalizeFilterPayload(undefined));
    const [hoverRoleId, setHoverRoleId] = useState<string | null>(null);
    const [hoverFeatureId, setHoverFeatureId] = useState<string | null>(null);

    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
    const [assignUsersModalRoleId, setAssignUsersModalRoleId] = useState<string | null>(null);

    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [importOpen, setImportOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const [addRoleOpen, setAddRoleOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDescription, setNewRoleDescription] = useState('');
    const [newRoleScope, setNewRoleScope] = useState('Tenant');
    const [newRoleStatus, setNewRoleStatus] = useState<'Active' | 'Draft'>('Active');
    const [cloneRoleId, setCloneRoleId] = useState<string>('');


    const [toast, setToast] = useState<MatrixToast | null>(null);
    const [roleMatrixTab, setRoleMatrixTab] = useState<RoleMatrixTab>('default');
    const [modulePermClipboard, setModulePermClipboard] = useState<Record<string, Record<string, PermissionId>> | null>(
        null,
    );
    const [auditRoleFilter, setAuditRoleFilter] = useState<string | null>(null);
    const [isMobileViewport, setIsMobileViewport] = useState(false);

    const dismissToast = useCallback(() => setToast(null), []);
    const showToast = useCallback((msg: string, variant: MatrixToast['variant'] = 'success') => {
        setToast({ msg, variant });
    }, []);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(PATHNAME, 'Access matrix', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, []);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const apply = () => setIsMobileViewport(mq.matches);
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);

    useConsumePendingSavedView(normalizeSavedViewRoute(PATHNAME), (f) => {
        const payload = normalizeFilterPayload(f as Partial<FilterPayload>);
        setFilters(payload);
        setSearchDraft(payload.search);
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((prev) => (prev.search === searchDraft ? prev : { ...prev, search: searchDraft }));
        }, 280);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    useEffect(() => {
        if (!bulkApplyOpen) return;
        const onDown = (e: MouseEvent) => {
            if (bulkApplyRef.current && !bulkApplyRef.current.contains(e.target as Node)) setBulkApplyOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [bulkApplyOpen]);

    useEffect(() => {
        if (!exportMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setExportMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [exportMenuOpen]);

    useLayoutEffect(() => {
        if (!moduleMenuFor) {
            setModuleMenuPos(null);
            return undefined;
        }
        const pad = 8;
        const gap = 4;
        const update = () => {
            const anchor = moduleMenuAnchorRef.current;
            if (!anchor) return;
            const r = anchor.getBoundingClientRect();
            let left = Math.round(r.right - MODULE_ACTIONS_MENU_W_PX);
            left = Math.max(pad, Math.min(left, window.innerWidth - MODULE_ACTIONS_MENU_W_PX - pad));
            setModuleMenuPos({ top: Math.round(r.bottom + gap), left });
        };
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [moduleMenuFor]);

    useLayoutEffect(() => {
        if (!roleMenuFor) {
            setRoleMenuPos(null);
            return undefined;
        }
        const pad = 8;
        const gap = 6;
        const update = () => {
            const anchor = document.querySelector<HTMLElement>(`[data-role-menu-opener="${roleMenuFor}"]`);
            if (!anchor) return;
            const r = anchor.getBoundingClientRect();
            let left = Math.round(r.right - ROLE_ACTIONS_MENU_W_PX);
            left = Math.max(pad, Math.min(left, window.innerWidth - ROLE_ACTIONS_MENU_W_PX - pad));
            setRoleMenuPos({ top: Math.round(r.bottom + gap), left });
        };
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [roleMenuFor]);

    useEffect(() => {
        if (!roleMenuFor && !moduleMenuFor) return;
        const onDocClick = (e: MouseEvent) => {
            const el = e.target as HTMLElement | null;
            if (!el) return;
            if (el.closest?.('[data-matrix-menu]')) return;
            if (el.closest?.('[data-matrix-menu-opener]')) return;
            setRoleMenuFor(null);
            setModuleMenuFor(null);
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, [roleMenuFor, moduleMenuFor]);

    const savedViews = useMemo(
        (): SavedMatrixView[] =>
            loadGlobalSavedViews()
                .filter((view) => normalizeSavedViewRoute(view.route) === normalizeSavedViewRoute(PATHNAME))
                .map((view) => ({ id: view.id, name: view.name, payload: view.filters as FilterPayload })),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute when saved-view store bumps (tick is intentional)
        [globalViewsTick],
    );

    const persistSavedViews = (views: SavedMatrixView[]) => {
        replaceViewsForRoute(
            PATHNAME,
            'Access matrix',
            views.map((v) => ({
                id: v.id,
                name: v.name,
                payload: v.payload as unknown as Record<string, unknown>,
            })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const pushAudit = useCallback((entry: Omit<AuditMatrixEntry, 'id' | 'at'> & { at?: string }) => {
        const row: AuditMatrixEntry = {
            id: `audit-${Date.now()}`,
            at: entry.at ?? new Date().toISOString(),
            actor: entry.actor,
            action: entry.action,
            previousValue: entry.previousValue,
            updatedValue: entry.updatedValue,
        };
        setAuditLog((prev) => [row, ...prev]);
    }, []);

    /** Left column: always show modules/features selected in Filters (search does not narrow rows). */
    const visibleModules = useMemo(
        () => MATRIX_MODULES.filter((m) => filters.moduleIds.includes(m.id)),
        [filters.moduleIds],
    );

    const moduleMenuModule = useMemo(
        () => (moduleMenuFor ? (MATRIX_MODULES.find((m) => m.id === moduleMenuFor) ?? null) : null),
        [moduleMenuFor],
    );

    const isDefaultModuleFilter =
        filters.moduleIds.length === MATRIX_MODULES.length && MATRIX_MODULES.every((m) => filters.moduleIds.includes(m.id));
    const isDefaultRoleStatusFilter =
        filters.roleStatuses.length === 1 && filters.roleStatuses[0] === 'Active';
    const hasActiveFilters =
        filters.search.trim() !== '' || !isDefaultModuleFilter || !isDefaultRoleStatusFilter;

    const toggleModuleFilter = (id: string) => {
        setFilters((f) => {
            const on = f.moduleIds.includes(id);
            const next = on ? f.moduleIds.filter((x) => x !== id) : [...f.moduleIds, id];
            return { ...f, moduleIds: next.length === 0 ? [id] : next };
        });
    };

    const toggleRoleStatusFilter = (status: MatrixRoleStatus) => {
        setFilters((f) => {
            const cur = f.roleStatuses;
            const on = cur.includes(status);
            const next = on ? cur.filter((x) => x !== status) : [...cur, status];
            return { ...f, roleStatuses: next.length === 0 ? [status] : next };
        });
    };

    const resetFilters = () => {
        setFilters(normalizeFilterPayload({}));
        setSearchDraft('');
    };

    const applySavedView = (v: SavedMatrixView) => {
        const payload = normalizeFilterPayload(v.payload);
        setFilters(payload);
        setSearchDraft(payload.search);
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        const id = `v-${Date.now()}`;
        persistSavedViews([...savedViews, { id, name, payload: { ...filters } }]);
        setSaveModalOpen(false);
        setSaveViewName('');
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((v) => v.id !== id));
    };

    const pendingChangeCount = useMemo(
        () => countMatrixDiff(matrix, baselineMatrix, roles.map((r) => r.id)),
        [matrix, baselineMatrix, roles],
    );

    const setCellPermission = useCallback((featureId: string, roleId: string, next: PermissionId) => {
        setMatrix((prev) => ({
            ...prev,
            [featureId]: { ...prev[featureId], [roleId]: next },
        }));
    }, []);

    const saveMatrixChanges = useCallback(() => {
        setBaselineMatrix(cloneMatrix(matrix));
        setLastUpdated({ at: new Date(), by: 'Super Admin' });
        pushAudit({
            actor: 'You (preview)',
            action: 'Access updated',
            previousValue: `${pendingChangeCount} permission cell(s) differed from saved baseline`,
            updatedValue: 'Saved matrix snapshot',
        });
        showToast('Changes saved successfully.');
    }, [matrix, pendingChangeCount, pushAudit]);

    const discardMatrixChanges = useCallback(() => {
        setMatrix(cloneMatrix(baselineMatrix));
        showToast('Changes discarded.');
    }, [baselineMatrix]);

    const applyPermissionToModules = useCallback(
        (perm: PermissionId) => {
            const targets = [...selectedModuleIds];
            if (targets.length === 0) return;
            setMatrix((prev) => {
                const next = cloneMatrix(prev);
                for (const modId of targets) {
                    const mod = MATRIX_MODULES.find((m) => m.id === modId);
                    if (!mod) continue;
                    for (const f of mod.features) {
                        for (const r of roles) {
                            if (r.status === 'Disabled') continue;
                            next[f.id] = { ...next[f.id], [r.id]: perm };
                        }
                    }
                }
                return next;
            });
            setBulkApplyOpen(false);
        },
        [roles, selectedModuleIds],
    );

    const exportJson = () => {
        const blob = new Blob([JSON.stringify({ roles, matrix, exportedAt: new Date().toISOString() }, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'access-matrix-export.json';
        a.click();
        URL.revokeObjectURL(url);
        setExportMenuOpen(false);
    };

    const exportCsv = () => {
        const header = ['Module', 'Feature', ...orderedVisibleRoles.map((r) => r.name), 'Notes'];
        const lines = [header.join(',')];
        for (const m of MATRIX_MODULES) {
            for (const f of m.features) {
                const row = [
                    `"${m.title.replace(/"/g, '""')}"`,
                    `"${f.label.replace(/"/g, '""')}"`,
                    ...orderedVisibleRoles.map((r) => {
                        const p = matrix[f.id]?.[r.id] ?? 'No Access';
                        return `"${p.replace(/"/g, '""')}"`;
                    }),
                    '""',
                ];
                lines.push(row.join(','));
            }
        }
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'access-matrix.csv';
        a.click();
        URL.revokeObjectURL(url);
        setExportMenuOpen(false);
    };

    const openAddRole = () => {
        setNewRoleName('');
        setNewRoleDescription('');
        setNewRoleScope('Tenant');
        setNewRoleStatus('Active');
        setCloneRoleId(roles[0]?.id ?? '');
        setAddRoleOpen(true);
    };

    const submitAddRole = () => {
        const name = newRoleName.trim();
        if (!name) return;
        const id = `role-${Date.now()}`;
        const cloneFrom = cloneRoleId ? roles.find((r) => r.id === cloneRoleId) : undefined;
        const newRole: MatrixRole = {
            id,
            name,
            description: newRoleDescription.trim() || undefined,
            category: 'Operations',
            accessScope: newRoleScope,
            status: newRoleStatus,
            isSystem: false,
        };
        const extendForNewRole = (
            prev: Record<string, Record<string, PermissionId>>,
            newRoleId: string,
            cloneFromId: string | undefined,
        ) => {
            const next = cloneMatrix(prev);
            for (const key of Object.keys(next)) {
                const sourcePerm = cloneFromId ? prev[key]?.[cloneFromId] : undefined;
                next[key] = { ...next[key], [newRoleId]: sourcePerm ?? 'No Access' };
            }
            return next;
        };
        setRoles((prev) => [...prev, newRole]);
        setMatrix((prev) => extendForNewRole(prev, id, cloneFrom?.id));
        setBaselineMatrix((prev) => extendForNewRole(prev, id, cloneFrom?.id));
        setUsersByRole((prev) => ({ ...prev, [id]: [] }));
        pushAudit({
            actor: 'You (preview)',
            action: 'Role created',
            previousValue: '—',
            updatedValue: cloneFrom ? `${name} (cloned from ${cloneFrom.name})` : name,
        });
        setAddRoleOpen(false);
        setRoleMatrixTab('custom');
        showToast(`Role “${name}” added to the matrix.`);
    };

    const removeUser = (roleId: string, userId: string) => {
        const u = usersByRole[roleId]?.find((x) => x.id === userId);
        setUsersByRole((prev) => ({
            ...prev,
            [roleId]: (prev[roleId] ?? []).filter((x) => x.id !== userId),
        }));
        pushAudit({
            actor: 'You (preview)',
            action: 'User removed',
            previousValue: `${roles.find((r) => r.id === roleId)?.name ?? roleId} — ${u?.name ?? userId}`,
            updatedValue: '—',
        });
    };

    const assignPlatformUsersToRole = useCallback(
        (platformUsers: User[]) => {
            if (!assignUsersModalRoleId || platformUsers.length === 0) return;
            const roleName = roles.find((r) => r.id === assignUsersModalRoleId)?.name ?? assignUsersModalRoleId;
            const newRows = platformUsers.map(platformUserToAssigned);
            const existing = usersByRole[assignUsersModalRoleId] ?? [];
            const existingEmails = new Set(existing.map((u) => u.email.toLowerCase()));
            const toAdd = newRows.filter((r) => !existingEmails.has(r.email.toLowerCase()));
            if (toAdd.length === 0) {
                showToast('Selected users are already assigned to this role.', 'error');
                return;
            }
            const addedNames = toAdd.map((r) => r.name).join(', ');
            setUsersByRole((prev) => ({
                ...prev,
                [assignUsersModalRoleId]: [...(prev[assignUsersModalRoleId] ?? []), ...toAdd],
            }));
            pushAudit({
                actor: 'You (preview)',
                action: 'User assigned',
                previousValue: `${roleName} — (updated)`,
                updatedValue: `${roleName} — ${addedNames}`,
            });
            showToast(
                toAdd.length === 1
                    ? `Assigned ${toAdd[0].name} to “${roleName}”.`
                    : `Assigned ${toAdd.length} users to “${roleName}”.`,
            );
        },
        [assignUsersModalRoleId, roles, usersByRole, pushAudit, showToast],
    );

    const openAssignUsersModal = useCallback((roleId: string) => {
        setRoleMenuFor(null);
        setRoleMenuPos(null);
        setAssignUsersModalRoleId(roleId);
    }, []);

    const toggleRoleMenu = useCallback((roleId: string) => {
        setRoleMenuFor((cur) => (cur === roleId ? null : roleId));
    }, []);

    const toggleCollapse = (moduleId: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    };

    const allModulesCollapsed = useMemo(
        () => visibleModules.length > 0 && visibleModules.every((m) => collapsed.has(m.id)),
        [visibleModules, collapsed],
    );

    const toggleAllModulesCollapse = useCallback(() => {
        setCollapsed((prev) => {
            const allCollapsed =
                visibleModules.length > 0 && visibleModules.every((m) => prev.has(m.id));
            if (allCollapsed) return new Set();
            return new Set(visibleModules.map((m) => m.id));
        });
    }, [visibleModules]);

    const setModuleAllPermissions = useCallback(
        (modId: string, perm: PermissionId, roleIds: string[]) => {
            const mod = MATRIX_MODULES.find((m) => m.id === modId);
            if (!mod || roleIds.length === 0) return;
            setMatrix((prev) => {
                const next = cloneMatrix(prev);
                for (const f of mod.features) {
                    for (const rid of roleIds) {
                        next[f.id] = { ...next[f.id], [rid]: perm };
                    }
                }
                return next;
            });
            setModuleMenuFor(null);
        },
        [],
    );

    const copyModulePermissionsForPaste = useCallback(
        (modId: string, roleIds: string[]) => {
            const mod = MATRIX_MODULES.find((m) => m.id === modId);
            if (!mod) return;
            const snap: Record<string, Record<string, PermissionId>> = {};
            for (const f of mod.features) {
                snap[f.id] = {};
                for (const rid of roleIds) {
                    snap[f.id][rid] = matrix[f.id]?.[rid] ?? 'No Access';
                }
            }
            setModulePermClipboard(snap);
            showToast('Module permissions copied.');
            setModuleMenuFor(null);
        },
        [matrix, showToast],
    );

    const pasteModulePermissions = useCallback(
        (modId: string, roleIds: string[]) => {
            if (!modulePermClipboard) {
                showToast('Copy a module first, then paste.', 'error');
                setModuleMenuFor(null);
                return;
            }
            const mod = MATRIX_MODULES.find((m) => m.id === modId);
            if (!mod) return;
            setMatrix((prev) => {
                const next = cloneMatrix(prev);
                for (const f of mod.features) {
                    const src = modulePermClipboard[f.id];
                    if (!src) continue;
                    for (const rid of roleIds) {
                        next[f.id] = { ...next[f.id], [rid]: src[rid] ?? 'No Access' };
                    }
                }
                return next;
            });
            showToast(`Permissions pasted to “${mod.title}”.`);
            setModuleMenuFor(null);
        },
        [modulePermClipboard, showToast],
    );

    const openRoleAuditLogs = useCallback((roleId: string) => {
        setAuditRoleFilter(roleId);
        setRoleMenuFor(null);
        setAuditDrawerOpen(true);
    }, []);

    const resetModuleFromBaseline = useCallback(
        (modId: string) => {
            const mod = MATRIX_MODULES.find((m) => m.id === modId);
            if (!mod) return;
            setMatrix((prev) => {
                const next = cloneMatrix(prev);
                for (const f of mod.features) {
                    const row: Record<string, PermissionId> = {};
                    for (const rid of roles.map((x) => x.id)) {
                        row[rid] = baselineMatrix[f.id]?.[rid] ?? 'No Access';
                    }
                    next[f.id] = row;
                }
                return next;
            });
            setModuleMenuFor(null);
        },
        [baselineMatrix, roles],
    );

    const cloneModulePermissionsJson = useCallback(async (modId: string) => {
        const mod = MATRIX_MODULES.find((m) => m.id === modId);
        if (!mod) return;
        const payload: Record<string, Record<string, PermissionId>> = {};
        for (const f of mod.features) {
            payload[f.label] = { ...matrix[f.id] };
        }
        try {
            await navigator.clipboard.writeText(JSON.stringify({ module: mod.title, permissions: payload }, null, 2));
        } catch {
            showToast('Clipboard unavailable in this browser context.', 'error');
        }
        setModuleMenuFor(null);
    }, [matrix]);

    const exportModuleCsv = useCallback(
        (modId: string) => {
            const mod = MATRIX_MODULES.find((m) => m.id === modId);
            if (!mod) return;
            const header = ['Feature', ...roles.map((r) => r.name)];
            const lines = [header.join(',')];
            for (const f of mod.features) {
                lines.push(
                    [
                        `"${f.label.replace(/"/g, '""')}"`,
                        ...roles.map((r) => `"${(matrix[f.id]?.[r.id] ?? 'No Access').replace(/"/g, '""')}"`),
                    ].join(','),
                );
            }
            const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `access-matrix-${modId}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            setModuleMenuFor(null);
        },
        [matrix, roles],
    );

    const resetSelectedModulesFromBaseline = useCallback(() => {
        const targets = [...selectedModuleIds];
        if (!targets.length) return;
        setMatrix((prev) => {
            const next = cloneMatrix(prev);
            for (const modId of targets) {
                const mod = MATRIX_MODULES.find((m) => m.id === modId);
                if (!mod) continue;
                for (const f of mod.features) {
                    const row: Record<string, PermissionId> = {};
                    for (const rid of roles.map((x) => x.id)) {
                        row[rid] = baselineMatrix[f.id]?.[rid] ?? 'No Access';
                    }
                    next[f.id] = row;
                }
            }
            return next;
        });
    }, [baselineMatrix, roles, selectedModuleIds]);

    const exportSelectedModulesCsv = useCallback(() => {
        const targets = [...selectedModuleIds];
        if (!targets.length) return;
        const mods = MATRIX_MODULES.filter((m) => targets.includes(m.id));
        const lines: string[] = [];
        for (const mod of mods) {
            lines.push(`# ${mod.title}`);
            lines.push(['Feature', ...roles.map((r) => r.name)].join(','));
            for (const f of mod.features) {
                lines.push(
                    [
                        `"${f.label.replace(/"/g, '""')}"`,
                        ...roles.map((r) => `"${(matrix[f.id]?.[r.id] ?? 'No Access').replace(/"/g, '""')}"`),
                    ].join(','),
                );
            }
            lines.push('');
        }
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'access-matrix-selected-modules.csv';
        a.click();
        URL.revokeObjectURL(url);
    }, [matrix, roles, selectedModuleIds]);

    const toggleModuleSelected = useCallback((modId: string) => {
        setSelectedModuleIds((prev) => {
            const next = new Set(prev);
            if (next.has(modId)) next.delete(modId);
            else next.add(modId);
            return next;
        });
    }, []);

    const togglePinRole = useCallback((roleId: string) => {
        setPinnedRoleIds((prev) => {
            const next = new Set(prev);
            if (next.has(roleId)) next.delete(roleId);
            else next.add(roleId);
            return next;
        });
        setRoleMenuFor(null);
    }, []);

    const cloneRoleColumn = useCallback(
        (sourceRoleId: string) => {
            const src = roles.find((r) => r.id === sourceRoleId);
            if (!src) return;
            const id = `role-${Date.now()}`;
            const name = `${src.name} (copy)`;
            const newRole: MatrixRole = {
                id,
                name,
                description: src.description,
                category: src.category,
                accessScope: src.accessScope,
                status: 'Draft',
                isSystem: false,
            };
            const extend = (prev: Record<string, Record<string, PermissionId>>) => {
                const next = cloneMatrix(prev);
                for (const key of Object.keys(next)) {
                    next[key] = { ...next[key], [id]: prev[key]?.[sourceRoleId] ?? 'No Access' };
                }
                return next;
            };
            setRoles((p) => [...p, newRole]);
            setMatrix((m) => extend(m));
            setBaselineMatrix((m) => extend(m));
            setUsersByRole((p) => ({ ...p, [id]: [] }));
            setRoleMenuFor(null);
            setRoleMatrixTab('custom');
            showToast(`Cloned role column from “${src.name}”.`);
        },
        [roles],
    );

    const deleteRoleById = useCallback(
        (roleId: string) => {
            const r = roles.find((x) => x.id === roleId);
            if (!r || r.isSystem) {
                showToast('System roles cannot be deleted.', 'error');
                setRoleMenuFor(null);
                return;
            }
            setRoles((prev) => prev.filter((x) => x.id !== roleId));
            setMatrix((prev) => {
                const next = cloneMatrix(prev);
                for (const k of Object.keys(next)) {
                    const row = { ...next[k] };
                    delete row[roleId];
                    next[k] = row;
                }
                return next;
            });
            setBaselineMatrix((prev) => {
                const next = cloneMatrix(prev);
                for (const k of Object.keys(next)) {
                    const row = { ...next[k] };
                    delete row[roleId];
                    next[k] = row;
                }
                return next;
            });
            setPinnedRoleIds((prev) => {
                const next = new Set(prev);
                next.delete(roleId);
                return next;
            });
            setRoleMenuFor(null);
            showToast(`Deleted role “${r.name}”.`);
        },
        [roles],
    );

    const disableRoleById = useCallback((roleId: string) => {
        const r = roles.find((x) => x.id === roleId);
        if (!r || r.isSystem) {
            showToast('System roles cannot be disabled.', 'error');
            setRoleMenuFor(null);
            return;
        }
        setRoles((prev) => prev.map((x) => (x.id === roleId ? { ...x, status: 'Disabled' } : x)));
        setRoleMenuFor(null);
        showToast(`Disabled role “${r.name}”.`);
    }, [roles]);

    const openEditRole = useCallback((roleId: string) => {
        const r = roles.find((x) => x.id === roleId);
        if (!r) return;
        setEditRoleId(roleId);
        setEditRoleName(r.name);
        setEditRoleDesc(r.description ?? '');
        setEditRoleOpen(true);
        setRoleMenuFor(null);
    }, [roles]);

    const submitEditRole = useCallback(() => {
        if (!editRoleId) return;
        const name = editRoleName.trim();
        if (!name) return;
        setRoles((prev) =>
            prev.map((x) => (x.id === editRoleId ? { ...x, name, description: editRoleDesc.trim() || undefined } : x)),
        );
        setEditRoleOpen(false);
        setEditRoleId(null);
        showToast('Role updated.');
    }, [editRoleDesc, editRoleId, editRoleName]);

    /** Top columns only: search narrows role columns; left rows stay full module/feature list. */
    const visibleRoles = useMemo(() => {
        const q = filters.search.trim().toLowerCase();
        const statusSet = new Set(filters.roleStatuses);
        const byStatus = roles.filter((r) => {
            const s: MatrixRoleStatus = r.status ?? 'Active';
            return statusSet.has(s);
        });
        if (!q) return byStatus;
        return byStatus.filter((r) => r.name.toLowerCase().includes(q));
    }, [roles, filters.search, filters.roleStatuses]);

    const tabFilteredRoles = useMemo(() => {
        if (roleMatrixTab === 'default') {
            return visibleRoles.filter((r) => isDefaultMatrixRole(r));
        }
        return visibleRoles.filter((r) => !isDefaultMatrixRole(r));
    }, [visibleRoles, roleMatrixTab]);

    const orderedVisibleRoles = useMemo(() => {
        const pin = pinnedRoleIds;
        const pinned = tabFilteredRoles.filter((r) => pin.has(r.id));
        const unpinned = tabFilteredRoles.filter((r) => !pin.has(r.id));
        const ord = (a: MatrixRole, b: MatrixRole) =>
            roles.findIndex((x) => x.id === a.id) - roles.findIndex((x) => x.id === b.id);
        return [...[...pinned].sort(ord), ...[...unpinned].sort(ord)];
    }, [tabFilteredRoles, pinnedRoleIds, roles]);

    const showAddRoleColumn = roleMatrixTab === 'custom';
    const { featureColPx, addRoleColPx } = MATRIX_LAYOUT;

    const {
        rolePageCount,
        safeRolePageIndex,
        paginatedVisibleRoles,
        showAddRoleOnPage,
        dynamicRoleColPx,
        matrixTableWidthPx,
    } = useAdaptiveRoleColumnPagination(matrixScrollRef, orderedVisibleRoles, {
        showAddRoleColumn,
        rolePageIndex,
    });

    const colCount = paginatedVisibleRoles.length + (showAddRoleOnPage ? 1 : 0);

    const tabRoleCounts = useMemo(() => {
        const statusSet = new Set(filters.roleStatuses);
        const byStatus = roles.filter((r) => statusSet.has((r.status ?? 'Active') as MatrixRoleStatus));
        return {
            default: byStatus.filter((r) => isDefaultMatrixRole(r)).length,
            custom: byStatus.filter((r) => !isDefaultMatrixRole(r)).length,
        };
    }, [roles, filters.roleStatuses]);

    const hasAnyCustomRoles = useMemo(() => roles.some((r) => !isDefaultMatrixRole(r)), [roles]);

    const activeMatrixRoleIds = useMemo(() => orderedVisibleRoles.map((r) => r.id), [orderedVisibleRoles]);

    useEffect(() => {
        setRolePageIndex(0);
    }, [roleMatrixTab, orderedVisibleRoles.length, filters.roleStatuses.join(',')]);

    useEffect(() => {
        if (rolePageIndex >= rolePageCount) {
            setRolePageIndex(Math.max(0, rolePageCount - 1));
        }
    }, [rolePageIndex, rolePageCount]);

    useEffect(() => {
        matrixHScrollSyncLock.current = true;
        if (matrixHeaderHScrollRef.current) matrixHeaderHScrollRef.current.scrollLeft = 0;
        if (matrixBodyHScrollRef.current) matrixBodyHScrollRef.current.scrollLeft = 0;
        matrixHScrollSyncLock.current = false;
    }, [safeRolePageIndex]);

    const filteredAuditLog = useMemo(() => {
        if (!auditRoleFilter) return auditLog;
        const role = roles.find((r) => r.id === auditRoleFilter);
        if (!role) return auditLog;
        const needle = role.name.toLowerCase();
        return auditLog.filter(
            (e) =>
                e.previousValue.toLowerCase().includes(needle) ||
                e.updatedValue.toLowerCase().includes(needle) ||
                e.action.toLowerCase().includes('role'),
        );
    }, [auditLog, auditRoleFilter, roles]);

    const matrixTableStyle = matrixTableWidthPx != null ? { width: matrixTableWidthPx } : undefined;

    const syncMatrixHorizontalScroll = useCallback((source: 'header' | 'body', scrollLeft: number) => {
        if (matrixHScrollSyncLock.current) return;
        matrixHScrollSyncLock.current = true;
        const header = matrixHeaderHScrollRef.current;
        const body = matrixBodyHScrollRef.current;
        if (source === 'header' && body && body.scrollLeft !== scrollLeft) {
            body.scrollLeft = scrollLeft;
        } else if (source === 'body' && header && header.scrollLeft !== scrollLeft) {
            header.scrollLeft = scrollLeft;
        }
        matrixHScrollSyncLock.current = false;
    }, []);

    const onMatrixHeaderHScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            syncMatrixHorizontalScroll('header', e.currentTarget.scrollLeft);
        },
        [syncMatrixHorizontalScroll],
    );

    const onMatrixBodyHScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            syncMatrixHorizontalScroll('body', e.currentTarget.scrollLeft);
        },
        [syncMatrixHorizontalScroll],
    );

    return (
        <CompanyAdminDashboardLayout mainClassName="max-w-none">
            <div className={cn('mx-auto w-full px-2 pb-10 sm:px-4', pendingChangeCount > 0 && 'pb-28')}>
                <Breadcrumb items={[{ label: 'Platform Foundation' }, { label: 'Access matrix' }]} />

                {isMobileViewport ? (
                    <div className="mb-4 mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        <LuMonitor className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
                        <p>
                            <span className="font-semibold">Best on larger screens.</span> The permission matrix works best on
                            tablet or desktop; role headers stay pinned while you scroll the page.
                        </p>
                    </div>
                ) : null}

                <div className="mb-6 mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Access control matrix</h1>
                        <p className="mt-1 text-xs text-slate-500">
                            {roleMatrixTab === 'default'
                                ? 'Platform seed roles only — fixed columns, no add.'
                                : 'Roles you created — add, edit, disable, or delete from here.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
                        <div
                            role="tablist"
                            aria-label="Role column groups"
                            className="inline-flex shrink-0 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={roleMatrixTab === 'default'}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition',
                                    roleMatrixTab === 'default'
                                        ? 'bg-slate-800 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                                )}
                                onClick={() => setRoleMatrixTab('default')}
                            >
                                Default roles
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-0.5 text-[10px] font-bold',
                                        roleMatrixTab === 'default' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600',
                                    )}
                                >
                                    {tabRoleCounts.default}
                                </span>
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={roleMatrixTab === 'custom'}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition',
                                    roleMatrixTab === 'custom'
                                        ? 'bg-[var(--cta-button-bg)] text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                                )}
                                onClick={() => setRoleMatrixTab('custom')}
                            >
                                Custom roles
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-0.5 text-[10px] font-bold',
                                        roleMatrixTab === 'custom'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-[var(--cta-button-bg)]',
                                    )}
                                >
                                    {tabRoleCounts.custom}
                                </span>
                            </button>
                        </div>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="cta"
                            className="gap-2"
                            onClick={() => {
                                setAuditRoleFilter(null);
                                setAuditDrawerOpen(true);
                            }}
                        >
                            <LuHistory size={18} />
                            View logs
                        </Button>
                        
                            <Button type="button" variant="company" size="cta" className={cn('gap-2', CTA_SHADOW_SOFT)} onClick={openAddRole}>
                                <LuPlus size={18} />
                                Add role
                            </Button>
                       
                    </div>
                </div>

                <div className="mb-3 flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 shadow-sm sm:flex-row sm:items-center sm:gap-3">
                    <div className="min-w-0 flex-1 sm:max-w-md">
                        <div className="relative min-w-[200px] flex-1 max-w-xl">
                            <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Search roles…"
                                value={searchDraft}
                                onChange={(e) => setSearchDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') setFilters((f) => ({ ...f, search: searchDraft }));
                                }}
                                className={cn(
                                    'h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                                    CTA_INPUT_FOCUS,
                                )}
                                aria-label="Search roles in access matrix"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:ml-auto">
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="cta"
                            onClick={toggleAllModulesCollapse}
                            aria-label={allModulesCollapsed ? 'Expand all modules' : 'Collapse all modules'}
                        >
                            {allModulesCollapsed ? 'Expand all' : 'Collapse all'}
                        </Button>
                        <Button
                            type="button"
                            variant={filterDrawerOpen ? 'company' : 'companyOutline'}
                            size="cta"
                            className="gap-2"
                            onClick={() => setFilterDrawerOpen(true)}
                        >
                            <LuFilter size={18} />
                            Filters
                            {hasActiveFilters ? (
                                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">On</span>
                            ) : null}
                        </Button>
                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setSaveModalOpen(true)}>
                            <LuBookmark size={18} />
                            Save view
                        </Button>
                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setImportOpen(true)}>
                            <LuUpload size={18} />
                            Import
                        </Button>
                        <div className="relative" ref={exportMenuRef}>
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="cta"
                                className="gap-2"
                                onClick={() => setExportMenuOpen((o) => !o)}
                                aria-expanded={exportMenuOpen}
                            >
                                <LuDownload size={18} />
                                Export
                                <LuChevronDown size={16} className="opacity-70" />
                            </Button>
                            {exportMenuOpen ? (
                                <div className="absolute right-0 top-[calc(100%+6px)] z-[300] w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                        onClick={exportCsv}
                                    >
                                        <LuDownload size={16} className="text-slate-400" />
                                        CSV
                                    </button>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                        onClick={exportJson}
                                    >
                                        <LuClipboardList size={16} className="text-slate-400" />
                                        JSON
                                    </button>
                                </div>
                            ) : null}
                        </div>
                        <WorkspaceHelp
                            {...ACCESS_MATRIX_WORKSPACE_HELP}
                            triggerLabel="Access matrix workspace help"
                        />
                    </div>
                </div>

                {selectedModuleIds.size > 0 ? (
                    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold text-slate-900">{selectedModuleIds.size} module(s) selected</div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative" ref={bulkApplyRef}>
                                <Button
                                    type="button"
                                    variant="companyOutline"
                                    size="cta"
                                    className="gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setBulkApplyOpen((o) => !o);
                                    }}
                                >
                                    Apply permission
                                    <LuChevronDown size={16} className="opacity-70" />
                                </Button>
                                {bulkApplyOpen ? (
                                    <div className="absolute left-0 top-[calc(100%+6px)] z-[300] max-h-64 min-w-[200px] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                        {PERMISSION_DROPDOWN_OPTIONS.map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                                onClick={() => applyPermissionToModules(p)}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={exportSelectedModulesCsv}>
                                <LuDownload size={16} />
                                Export selected
                            </Button>
                            <Button type="button" variant="companyOutline" size="cta" onClick={resetSelectedModulesFromBaseline}>
                                Reset selected
                            </Button>
                            <Button type="button" variant="companyGhost" size="cta" onClick={() => setSelectedModuleIds(new Set())}>
                                Clear selection
                            </Button>
                        </div>
                    </div>
                ) : null}

                <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    {roleMatrixTab === 'custom' && !hasAnyCustomRoles ? (
                        <CustomRolesEmptyState onCreateRole={openAddRole} />
                    ) : (
                        <>
                            <div className="flex shrink-0 flex-col gap-1.5 border-b border-slate-200 bg-slate-50/40 px-2 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:px-3">
                                <PermissionLegend className="min-w-0" />
                                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto">
                                    <span className="hidden text-sm font-medium text-slate-500 sm:inline">
                                        {MATRIX_LAYOUT.rolesPerPage} roles per page
                                    </span>
                                    <RoleSetPagination
                                        pageIndex={safeRolePageIndex}
                                        pageCount={rolePageCount}
                                        onPageChange={setRolePageIndex}
                                    />
                                </div>
                            </div>
                            <div
                                ref={matrixScrollRef}
                                key={`role-page-${safeRolePageIndex}`}
                                className="w-full bg-white transition-opacity duration-200 ease-out"
                            >
                                <div
                                    className={cn(
                                        'sticky z-[45] overflow-visible border-b-2 border-slate-200 bg-white shadow-[0_4px_14px_-4px_rgba(15,23,42,0.12)]',
                                        MATRIX_STICKY_TOP,
                                    )}
                                >
                                    <div
                                        ref={matrixHeaderHScrollRef}
                                        className="overflow-x-auto overflow-y-visible"
                                        onScroll={onMatrixHeaderHScroll}
                                    >
                                        <table
                                            className="w-full min-w-full table-fixed border-separate border-spacing-0 text-base"
                                            style={matrixTableStyle}
                                        >
                            <thead>
                                <tr className="bg-white">
                                    <th
                                        className="sticky left-0 z-50 border-b-2 border-r border-slate-200 bg-white px-4 py-3.5 text-left text-sm font-bold uppercase tracking-wide text-slate-900 shadow-[4px_0_16px_-6px_rgba(15,23,42,0.14)]"
                                        style={{ minWidth: featureColPx, width: featureColPx, maxWidth: featureColPx }}
                                        scope="col"
                                    >
                                        <span className="block leading-snug">Module / Feature</span>
                                    </th>
                                    {paginatedVisibleRoles.map((r, cidx) => {
                                        const isPinned = pinnedRoleIds.has(r.id);
                                        const isDefaultRole = isDefaultMatrixRole(r);
                                        const pinOrder = paginatedVisibleRoles.filter((x, i) => i < cidx && pinnedRoleIds.has(x.id)).length;
                                        const stickyLeftPx = isPinned ? featureColPx + pinOrder * dynamicRoleColPx : undefined;
                                        return (
                                            <th
                                                key={r.id}
                                                scope="col"
                                                style={{
                                                    ...(isPinned ? { left: stickyLeftPx } : {}),
                                                    width: dynamicRoleColPx,
                                                    minWidth: dynamicRoleColPx,
                                                    maxWidth: dynamicRoleColPx,
                                                    transition: 'width 200ms ease-out, min-width 200ms ease-out, max-width 200ms ease-out',
                                                }}
                                                className={cn(
                                                    'relative overflow-visible border-b-2 border-slate-200 px-2 py-3 text-center align-bottom transition-colors',
                                                    isPinned && 'sticky z-[48] shadow-[4px_0_16px_-6px_rgba(15,23,42,0.14)]',
                                                    isDefaultRole ? 'bg-white' : 'bg-slate-50/90',
                                                    !isPinned && 'shadow-[0_2px_10px_-4px_rgba(15,23,42,0.1)]',
                                                    hoverRoleId === r.id &&
                                                        (isDefaultRole
                                                            ? 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]'
                                                            : 'bg-[color-mix(in_srgb,var(--cta-button-bg)_14%,white)]'),
                                                    r.status === 'Disabled' && 'opacity-60',
                                                )}
                                                onMouseEnter={() => setHoverRoleId(r.id)}
                                                onMouseLeave={() => setHoverRoleId(null)}
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <p className="w-full px-1 text-center text-sm font-bold leading-snug text-slate-900">
                                                        <span className="line-clamp-2">{r.name}</span>
                                                    </p>
                                                    <div className="flex w-full items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-[var(--cta-button-bg)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] hover:text-[var(--cta-button-bg)]"
                                                            title={`Assign users to ${r.name}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openAssignUsersModal(r.id);
                                                            }}
                                                        >
                                                            <LuUsers className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                                            <span className="tabular-nums">
                                                                {usersByRole[r.id]?.length ?? 0}{' '}
                                                                {(usersByRole[r.id]?.length ?? 0) === 1 ? 'user' : 'users'}
                                                            </span>
                                                        </button>
                                                        {isPinned ? (
                                                            <span
                                                                className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-500"
                                                                title="Pinned column"
                                                            >
                                                                <LuPin className="h-3.5 w-3.5" aria-hidden />
                                                            </span>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            data-matrix-menu-opener
                                                            data-role-menu-opener={r.id}
                                                            aria-label={`Actions for ${r.name}`}
                                                            aria-expanded={roleMenuFor === r.id}
                                                            className={cn(
                                                                'inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800',
                                                                roleMenuFor === r.id &&
                                                                    'border-[var(--cta-button-bg)] text-[var(--cta-button-bg)] ring-2 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]',
                                                            )}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleRoleMenu(r.id);
                                                            }}
                                                        >
                                                            <LuEllipsisVertical className="h-4 w-4" aria-hidden />
                                                        </button>
                                                    </div>
                                                </div>
                                            </th>
                                        );
                                    })}
                                    {showAddRoleOnPage ? (
                                        <th
                                            className="border-b border-slate-200 bg-slate-50/90 px-2 py-2 text-center align-middle"
                                            style={{ width: addRoleColPx, minWidth: addRoleColPx, maxWidth: addRoleColPx }}
                                            scope="col"
                                        >
                                            <button
                                                type="button"
                                                onClick={openAddRole}
                                                className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-2 py-3.5 text-sm font-bold text-slate-600 transition hover:border-[var(--cta-button-bg)] hover:text-[var(--cta-button-bg)]"
                                            >
                                                <LuPlus className="h-5 w-5" />
                                                Add role
                                            </button>
                                        </th>
                                    ) : null}
                                </tr>
                            </thead>
                                        </table>
                                    </div>
                                </div>
                                <div
                                    ref={matrixBodyHScrollRef}
                                    className="overflow-x-auto overflow-y-visible"
                                    onScroll={onMatrixBodyHScroll}
                                >
                                    <table
                                        className="w-full min-w-full table-fixed border-separate border-spacing-0 text-base"
                                        style={matrixTableStyle}
                                    >
                            <tbody>
                                {visibleModules.length === 0 ? (
                                    <tr>
                                        <td colSpan={colCount + 1} className="px-6 py-16 text-center text-sm font-medium text-slate-500">
                                            No modules match the current filters. Open Filters and enable at least one module.
                                        </td>
                                    </tr>
                                ) : orderedVisibleRoles.length === 0 ? (
                                    <tr>
                                        <td colSpan={colCount + 1} className="px-6 py-16 text-center text-sm font-medium text-slate-500">
                                            No roles match your search or filter settings. Try another role name or adjust Filters.
                                        </td>
                                    </tr>
                                ) : null}
                                {visibleModules.map((mod) => {
                                    const isCollapsed = collapsed.has(mod.id);
                                    const feats = mod.features;
                                    if (feats.length === 0) return null;
                                    return (
                                        <React.Fragment key={mod.id}>
                                            <tr className="bg-slate-50/95">
                                                <td
                                                    className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-100 px-3 py-3 shadow-[2px_0_12px_-4px_rgba(15,23,42,0.1)] align-middle"
                                                    style={{ minWidth: featureColPx, width: featureColPx, maxWidth: featureColPx }}
                                                    colSpan={1}
                                                >
                                                    <div className="flex items-start gap-1">
                                                        <input
                                                            type="checkbox"
                                                            className={cn(CTA_CHECKBOX_SM, 'shrink-0')}
                                                            checked={selectedModuleIds.has(mod.id)}
                                                            onChange={() => toggleModuleSelected(mod.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            aria-label={`Select ${mod.title}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="flex shrink-0 items-center rounded-md p-0.5 text-slate-700 transition hover:bg-white hover:text-slate-900"
                                                            onClick={() => toggleCollapse(mod.id)}
                                                            aria-expanded={!isCollapsed}
                                                        >
                                                            {isCollapsed ? (
                                                                <LuChevronRight className="h-5 w-5" />
                                                            ) : (
                                                                <LuChevronDown className="h-5 w-5" />
                                                            )}
                                                        </button>
                                                        <span
                                                            className="min-w-0 flex-1 text-sm font-bold leading-snug text-slate-900 [overflow-wrap:anywhere]"
                                                            title={mod.title}
                                                        >
                                                            {mod.title}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            ref={moduleMenuFor === mod.id ? moduleMenuAnchorRef : undefined}
                                                            data-matrix-menu-opener
                                                            className="shrink-0 rounded-md p-1 text-slate-700 hover:bg-white hover:text-slate-900"
                                                            aria-label={`${mod.title} module actions`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setModuleMenuFor((cur) => (cur === mod.id ? null : mod.id));
                                                            }}
                                                        >
                                                            <LuEllipsisVertical className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td
                                                    className="border-b border-slate-200 bg-slate-50/95 px-2 py-2"
                                                    colSpan={colCount}
                                                />
                                            </tr>
                                            {!isCollapsed
                                                ? feats.map((f) => (
                                                      <tr key={f.id} className="bg-white">
                                                          <td
                                                              className={cn(
                                                                  'sticky left-0 z-[28] border-b border-r border-slate-100 bg-white px-4 py-3 text-left align-top text-sm font-medium text-slate-800 shadow-[2px_0_12px_-4px_rgba(15,23,42,0.08)] transition-colors',
                                                                  hoverFeatureId === f.id ? 'bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]' : '',
                                                              )}
                                                              style={{ minWidth: featureColPx, width: featureColPx, maxWidth: featureColPx }}
                                                              onMouseEnter={() => setHoverFeatureId(f.id)}
                                                              onMouseLeave={() => setHoverFeatureId(null)}
                                                          >
                                                              <span className="block break-words pl-6 text-sm leading-snug text-slate-700 [overflow-wrap:anywhere]">
                                                                  {f.label}
                                                              </span>
                                                          </td>
                                                          {paginatedVisibleRoles.map((r, cidx) => {
                                                              const isPinned = pinnedRoleIds.has(r.id);
                                                              const isDefaultRole = isDefaultMatrixRole(r);
                                                              const pinOrder = paginatedVisibleRoles.filter(
                                                                  (x, i) => i < cidx && pinnedRoleIds.has(x.id),
                                                              ).length;
                                                              const stickyLeftPx = isPinned
                                                                  ? featureColPx + pinOrder * dynamicRoleColPx
                                                                  : undefined;
                                                              const perm = matrix[f.id]?.[r.id] ?? 'No Access';
                                                              return (
                                                                  <td
                                                                      key={r.id}
                                                                      style={{
                                                                          ...(isPinned ? { left: stickyLeftPx } : {}),
                                                                          width: dynamicRoleColPx,
                                                                          minWidth: dynamicRoleColPx,
                                                                          maxWidth: dynamicRoleColPx,
                                                                          transition:
                                                                              'width 200ms ease-out, min-width 200ms ease-out, max-width 200ms ease-out',
                                                                      }}
                                                                      className={cn(
                                                                          'relative overflow-visible border-b border-slate-100 px-2 py-3 text-center align-middle transition-colors',
                                                                          isPinned &&
                                                                              (isDefaultRole
                                                                                  ? 'sticky z-[23] bg-white shadow-[4px_0_14px_-4px_rgba(15,23,42,0.12)]'
                                                                                  : 'sticky z-[23] bg-[color-mix(in_srgb,var(--cta-button-bg)_4%,white)] shadow-[4px_0_14px_-4px_rgba(15,23,42,0.12)]'),
                                                                          !isPinned && !isDefaultRole && 'bg-[color-mix(in_srgb,var(--cta-button-bg)_3%,white)]',
                                                                          !isPinned &&
                                                                              (hoverRoleId === r.id || hoverFeatureId === f.id)
                                                                              ? 'bg-[color-mix(in_srgb,var(--cta-button-bg)_6%,white)]'
                                                                              : '',
                                                                      )}
                                                                      onMouseEnter={() => setHoverRoleId(r.id)}
                                                                      onMouseLeave={() => setHoverRoleId(null)}
                                                                  >
                                                                      <MatrixPermissionCell
                                                                          featureId={f.id}
                                                                          roleId={r.id}
                                                                          value={perm}
                                                                          disabled={r.status === 'Disabled'}
                                                                          onPick={(next) => setCellPermission(f.id, r.id, next)}
                                                                      />
                                                                  </td>
                                                              );
                                                          })}
                                                          {showAddRoleOnPage ? (
                                                              <td className="border-b border-slate-100 bg-slate-50/40" />
                                                          ) : null}
                                                      </tr>
                                                  ))
                                                : null}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                                    </table>
                                </div>
                            </div>
                            {rolePageCount > 1 ? (
                                <div className="flex shrink-0 items-center justify-end border-t border-slate-200 bg-slate-50/40 px-2 py-1.5 sm:px-3">
                                    <RoleSetPagination
                                        pageIndex={safeRolePageIndex}
                                        pageCount={rolePageCount}
                                        onPageChange={setRolePageIndex}
                                    />
                                </div>
                            ) : null}
                        </>
                    )}
                </section>

                {pendingChangeCount > 0 ? (
                    <div className="fixed inset-x-0 bottom-0 z-[120] border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-8px_rgba(15,23,42,0.15)] backdrop-blur-sm">
                        <div className="mx-auto flex w-full max-w-none flex-col gap-3 sm:max-w-6xl sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-slate-900">
                                {pendingChangeCount} permission change{pendingChangeCount === 1 ? '' : 's'} pending
                            </p>
                            <div className="flex flex-wrap gap-2 sm:justify-end">
                                <Button type="button" variant="companyOutline" size="cta" onClick={discardMatrixChanges}>
                                    Discard
                                </Button>
                                <Button type="button" variant="company" size="cta" className={CTA_SHADOW_SOFT} onClick={saveMatrixChanges}>
                                    Save changes
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Filters drawer */}
                {filterDrawerOpen ? (
                    <>
                        <button
                            type="button"
                            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
                            aria-label="Close filters"
                            onClick={() => setFilterDrawerOpen(false)}
                        />
                        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <h2 className="text-lg font-bold text-slate-900">Filters</h2>
                                <button
                                    type="button"
                                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                    onClick={() => setFilterDrawerOpen(false)}
                                >
                                    <LuX size={20} />
                                </button>
                            </div>
                            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                                <p className="text-sm text-slate-600">Choose which modules appear in the matrix.</p>
                                {MATRIX_MODULES.map((m) => (
                                    <label
                                        key={m.id}
                                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                                    >
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-slate-300 text-[var(--cta-button-bg)]"
                                            checked={filters.moduleIds.includes(m.id)}
                                            onChange={() => toggleModuleFilter(m.id)}
                                        />
                                        {m.title}
                                    </label>
                                ))}
                                <div className="border-t border-slate-100 pt-4">
                                    <p className="text-sm font-semibold text-slate-800">Role columns</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        By default only <span className="font-medium text-slate-700">Active</span> roles are shown.
                                        Enable Draft or Disabled to include those roles in the matrix.
                                    </p>
                                    <div className="mt-3 space-y-2">
                                        {MATRIX_ROLE_STATUS_OPTIONS.map((st) => (
                                            <label
                                                key={st}
                                                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-[var(--cta-button-bg)]"
                                                    checked={filters.roleStatuses.includes(st)}
                                                    onChange={() => toggleRoleStatusFilter(st)}
                                                />
                                                {st}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {savedViews.length > 0 ? (
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved views</p>
                                        <ul className="mt-2 space-y-1">
                                            {savedViews.map((view) => (
                                                <li key={view.id} className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-slate-800 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                                        onClick={() => applySavedView(view)}
                                                    >
                                                        {view.name}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600"
                                                        onClick={() => deleteSavedView(view.id)}
                                                    >
                                                        ✕
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </div>
                            <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
                                <Button type="button" variant="companyOutline" size="cta" className="flex-1" onClick={resetFilters}>
                                    Reset
                                </Button>
                                <Button type="button" variant="company" size="cta" className="flex-1" onClick={() => setFilterDrawerOpen(false)}>
                                    Apply
                                </Button>
                            </div>
                        </aside>
                    </>
                ) : null}

                <AssignRoleUsersModal
                    open={!!assignUsersModalRoleId}
                    role={assignUsersModalRoleId ? roles.find((r) => r.id === assignUsersModalRoleId) ?? null : null}
                    assignedUsers={assignUsersModalRoleId ? usersByRole[assignUsersModalRoleId] ?? [] : []}
                    onClose={() => setAssignUsersModalRoleId(null)}
                    onAssignUsers={assignPlatformUsersToRole}
                    onRemoveUser={(userId) =>
                        assignUsersModalRoleId && removeUser(assignUsersModalRoleId, userId)
                    }
                />

                {/* Audit drawer */}
                {auditDrawerOpen ? (
                    <>
                        <button
                            type="button"
                            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
                            aria-label="Close audit logs"
                            onClick={() => {
                                setAuditDrawerOpen(false);
                                setAuditRoleFilter(null);
                            }}
                        />
                        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Audit timeline</h2>
                                    {auditRoleFilter ? (
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Filtered: {roles.find((r) => r.id === auditRoleFilter)?.name ?? 'Role'}
                                        </p>
                                    ) : null}
                                </div>
                                <button
                                    type="button"
                                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                    onClick={() => {
                                        setAuditDrawerOpen(false);
                                        setAuditRoleFilter(null);
                                    }}
                                >
                                    <LuX size={20} />
                                </button>
                            </div>
                            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                                {filteredAuditLog.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                        No audit entries for this filter.
                                    </p>
                                ) : null}
                                {filteredAuditLog.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="relative rounded-xl border border-slate-100 bg-slate-50/60 p-3 pl-4 shadow-sm before:absolute before:left-0 before:top-3 before:h-[calc(100%-12px)] before:w-1 before:rounded-full before:bg-[var(--cta-button-bg)]"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wide text-[var(--cta-button-bg)]">
                                                {entry.action}
                                            </span>
                                            <span className="text-[10px] font-semibold text-slate-500">{formatTs(entry.at)}</span>
                                        </div>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">{entry.actor}</p>
                                        <p className="mt-1 text-xs text-slate-600">
                                            <span className="font-medium text-slate-500">Before:</span> {entry.previousValue}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600">
                                            <span className="font-medium text-slate-500">After:</span> {entry.updatedValue}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    </>
                ) : null}

                <Modal
                    isOpen={saveModalOpen}
                    onClose={() => setSaveModalOpen(false)}
                    title="Save filter view"
                    footer={
                        <>
                            <Button type="button" variant="companyOutline" size="cta" onClick={() => setSaveModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" variant="company" size="cta" onClick={saveCurrentView} disabled={!saveViewName.trim()}>
                                Save
                            </Button>
                        </>
                    }
                >
                    <p className="mb-3 text-sm text-slate-600">
                        Save the current role search, module visibility, and role status filters for quick reuse.
                    </p>
                    <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                    <input
                        value={saveViewName}
                        onChange={(e) => setSaveViewName(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                        placeholder="e.g. Finance modules · narrowed search"
                    />
                </Modal>

                <Modal
                    isOpen={importOpen}
                    onClose={() => setImportOpen(false)}
                    title="Import matrix"
                    footer={
                        <>
                            <Button type="button" variant="companyOutline" size="cta" onClick={() => setImportOpen(false)}>
                                Close
                            </Button>
                            <Button
                                type="button"
                                variant="company"
                                size="cta"
                                onClick={() => {
                                    setImportOpen(false);
                                }}
                            >
                                Done
                            </Button>
                        </>
                    }
                >
                    <p className="text-sm text-slate-600">
                        Drop a future export here or choose a file. This prototype records the intent only; no parsing runs yet.
                    </p>
                    <div className="mt-4 flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-500">
                        Drag & drop (disabled)
                    </div>
                </Modal>

                <Modal
                    isOpen={addRoleOpen}
                    onClose={() => setAddRoleOpen(false)}
                    title="Add role"
                    maxWidthClassName="max-w-lg"
                    footer={
                        <>
                            <Button type="button" variant="companyOutline" size="cta" onClick={() => setAddRoleOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" variant="company" size="cta" onClick={submitAddRole} disabled={!newRoleName.trim()}>
                                Create role
                            </Button>
                        </>
                    }
                >
                    <p className="mb-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] px-3 py-2 text-xs leading-relaxed text-slate-600">
                        <span>New roles appear as</span>
                        <RoleOriginBadge role={{ name: '', isSystem: false }} />
                        <span>and can be disabled or deleted. Default seed roles stay fixed.</span>
                    </p>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400">Role name</label>
                            <input
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                                placeholder="e.g. Regional Readiness Lead"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400">Description</label>
                            <textarea
                                value={newRoleDescription}
                                onChange={(e) => setNewRoleDescription(e.target.value)}
                                rows={3}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                                placeholder="Short purpose statement"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400">Clone existing role</label>
                            <select
                                value={cloneRoleId}
                                onChange={(e) => setCloneRoleId(e.target.value)}
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            >
                                <option value="">No clone (start from No Access)</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                        {isDefaultMatrixRole(r) ? ' (Default)' : ' (Custom)'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400">Access scope</label>
                            <select
                                value={newRoleScope}
                                onChange={(e) => setNewRoleScope(e.target.value)}
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            >
                                {['Global', 'Tenant', 'Business unit', 'Project'].map((c) => (
                                    <option key={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400">Status</label>
                            <select
                                value={newRoleStatus}
                                onChange={(e) => setNewRoleStatus(e.target.value as 'Active' | 'Draft')}
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            >
                                <option value="Active">Active</option>
                                <option value="Draft">Draft</option>
                            </select>
                        </div>
                    </div>
                </Modal>

                <Modal
                    isOpen={editRoleOpen}
                    onClose={() => setEditRoleOpen(false)}
                    title="Edit role"
                    maxWidthClassName="max-w-lg"
                    footer={
                        <>
                            <Button type="button" variant="companyOutline" size="cta" onClick={() => setEditRoleOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" variant="company" size="cta" onClick={submitEditRole} disabled={!editRoleName.trim()}>
                                Save role
                            </Button>
                        </>
                    }
                >
                    {editRoleId && roles.find((r) => r.id === editRoleId) ? (
                        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <span className="text-xs font-semibold text-slate-600">Role type</span>
                            <RoleOriginBadge role={roles.find((r) => r.id === editRoleId)!} size="sm" />
                            {isDefaultMatrixRole(roles.find((r) => r.id === editRoleId)!) ? (
                                <span className="text-xs text-slate-500">Name and description can be edited; column cannot be removed.</span>
                            ) : (
                                <span className="text-xs text-slate-500">Custom role — you can disable or delete it from the column menu.</span>
                            )}
                        </div>
                    ) : null}
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400">Role name</label>
                            <input
                                value={editRoleName}
                                onChange={(e) => setEditRoleName(e.target.value)}
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400">Description</label>
                            <textarea
                                value={editRoleDesc}
                                onChange={(e) => setEditRoleDesc(e.target.value)}
                                rows={3}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                            />
                        </div>
                    </div>
                </Modal>

            </div>
            {roleMenuFor && roleMenuPos && typeof document !== 'undefined'
                ? (() => {
                      const menuRole = roles.find((x) => x.id === roleMenuFor);
                      if (!menuRole) return null;
                      const menuRoleIsDefault = isDefaultMatrixRole(menuRole);
                      return createPortal(
                          <ul
                              data-matrix-menu
                              className="fixed max-h-[min(70vh,420px)] w-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5"
                              style={{
                                  top: roleMenuPos.top,
                                  left: roleMenuPos.left,
                                  zIndex: MATRIX_FLOATING_MENU_Z,
                              }}
                              onClick={(e) => e.stopPropagation()}
                          >
                              <li>
                                  <button
                                      type="button"
                                      className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                      onClick={() => openEditRole(menuRole.id)}
                                  >
                                      Edit role
                                  </button>
                              </li>
                              <li>
                                  <button
                                      type="button"
                                      className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                      onClick={() => cloneRoleColumn(menuRole.id)}
                                  >
                                      Clone role
                                  </button>
                              </li>
                              <li>
                                  <button
                                      type="button"
                                      className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                      onClick={() => openAssignUsersModal(menuRole.id)}
                                  >
                                      Assign users
                                  </button>
                              </li>
                              <li>
                                  <button
                                      type="button"
                                      className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                      onClick={() => openRoleAuditLogs(menuRole.id)}
                                  >
                                      View audit logs
                                  </button>
                              </li>
                              <li className="border-t border-slate-100">
                                  <button
                                      type="button"
                                      className="flex w-full px-4 py-2.5 text-left text-sm text-slate-500 transition hover:bg-slate-50"
                                      onClick={() => togglePinRole(menuRole.id)}
                                  >
                                      {pinnedRoleIds.has(menuRole.id) ? 'Unpin column' : 'Pin column'}
                                  </button>
                              </li>
                              {!menuRoleIsDefault ? (
                                  <>
                                      <li>
                                          <button
                                              type="button"
                                              className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-amber-800 transition hover:bg-amber-50"
                                              onClick={() => disableRoleById(menuRole.id)}
                                          >
                                              Disable role
                                          </button>
                                      </li>
                                      <li>
                                          <button
                                              type="button"
                                              className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                                              onClick={() => deleteRoleById(menuRole.id)}
                                          >
                                              Delete role
                                          </button>
                                      </li>
                                  </>
                              ) : (
                                  <li className="border-t border-slate-100 px-4 py-2.5 text-sm leading-snug text-slate-500">
                                      Default roles are fixed platform seed columns.
                                  </li>
                              )}
                          </ul>,
                          document.body,
                      );
                  })()
                : null}

            {moduleMenuFor && moduleMenuModule && moduleMenuPos && typeof document !== 'undefined'
                ? createPortal(
                      <ul
                          data-matrix-menu
                          className="fixed w-64 max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5"
                          style={{ top: moduleMenuPos.top, left: moduleMenuPos.left, zIndex: MATRIX_FLOATING_MENU_Z }}
                          onClick={(e) => e.stopPropagation()}
                      >
                          <li>
                              <button
                                  type="button"
                                  className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                  onClick={() => setModuleAllPermissions(moduleMenuModule.id, 'CRUD', activeMatrixRoleIds)}
                              >
                                  Apply CRUD to all
                              </button>
                          </li>
                          <li>
                              <button
                                  type="button"
                                  className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                  onClick={() => setModuleAllPermissions(moduleMenuModule.id, 'View', activeMatrixRoleIds)}
                              >
                                  Apply View to all
                              </button>
                          </li>
                          <li>
                              <button
                                  type="button"
                                  className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                  onClick={() => setModuleAllPermissions(moduleMenuModule.id, 'No Access', activeMatrixRoleIds)}
                              >
                                  Remove access
                              </button>
                          </li>
                          <li className="border-t border-slate-100">
                              <button
                                  type="button"
                                  className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                  onClick={() => copyModulePermissionsForPaste(moduleMenuModule.id, activeMatrixRoleIds)}
                              >
                                  Copy permissions
                              </button>
                          </li>
                          <li>
                              <button
                                  type="button"
                                  className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                  onClick={() => pasteModulePermissions(moduleMenuModule.id, activeMatrixRoleIds)}
                              >
                                  Paste permissions
                              </button>
                          </li>
                          <li className="border-t border-slate-100">
                              <button
                                  type="button"
                                  className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                  onClick={() => cloneModulePermissionsJson(moduleMenuModule.id)}
                              >
                                  Copy as JSON
                              </button>
                          </li>
                          <li>
                              <button
                                  type="button"
                                  className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                  onClick={() => exportModuleCsv(moduleMenuModule.id)}
                              >
                                  Export module permissions
                              </button>
                          </li>
                          <li>
                              <button
                                  type="button"
                                  className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                  onClick={() => resetModuleFromBaseline(moduleMenuModule.id)}
                              >
                                  Reset module permissions
                              </button>
                          </li>
                      </ul>,
                      document.body,
                  )
                : null}

            {toast ? (
                <InlineToast
                    message={toast.msg}
                    variant={toast.variant}
                    onDismiss={dismissToast}
                    durationMs={MATRIX_TOAST_DURATION_MS}
                    className={cn(pendingChangeCount > 0 ? 'bottom-24' : 'bottom-6')}
                />
            ) : null}
        </CompanyAdminDashboardLayout>
    );
}
