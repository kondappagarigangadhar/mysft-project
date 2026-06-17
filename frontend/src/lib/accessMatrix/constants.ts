import type { PermissionId } from './types';

/** Fixed column widths for the access matrix table. */
export const MATRIX_LAYOUT = {
    /** Sticky left column — module & feature labels. */
    featureColPx: 320,
    /** Minimum role column width before flex distribution. */
    roleColPx: 140,
    addRoleColPx: 120,
    /** Role columns shown per page (right side of the matrix). */
    rolesPerPage: 4,
} as const;

/** Matrix cell dropdown — fixed enterprise set. */
export const PERMISSION_DROPDOWN_OPTIONS: PermissionId[] = ['CRUD', 'Create', 'Edit', 'View', 'No Access'];

export const PERMISSION_TOOLTIPS: Record<PermissionId, string> = {
    CRUD: 'Create, Read, Update, Delete — full record control for this feature.',
    Create: 'Create new records only.',
    Edit: 'Modify existing records.',
    View: 'View records without editing.',
    'No Access': 'No visibility or actions for this feature.',
};

export const PERMISSION_CYCLE: PermissionId[] = ['View', 'Create', 'Edit', 'CRUD', 'No Access'];

const LEGACY_PERMISSION_MAP: Record<string, PermissionId> = {
    'Read Only': 'View',
    Approve: 'Edit',
    Upload: 'Edit',
    'Upload Own': 'Edit',
    Recommend: 'View',
    Limited: 'View',
};

/** Map removed permission labels to the nearest supported value. */
export function normalizePermissionId(value: string): PermissionId {
    if ((PERMISSION_DROPDOWN_OPTIONS as string[]).includes(value)) return value as PermissionId;
    return LEGACY_PERMISSION_MAP[value] ?? 'No Access';
}

export function permissionBadgeClasses(p: PermissionId): string {
    const base =
        'inline-flex max-w-full items-center justify-center truncate rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide shadow-sm';
    switch (p) {
        case 'CRUD':
            return `${base} border-violet-200 bg-violet-50 text-violet-800`;
        case 'Create':
            return `${base} border-blue-200 bg-blue-50 text-blue-800`;
        case 'Edit':
            return `${base} border-orange-200 bg-orange-50 text-orange-900`;
        case 'View':
            return `${base} border-emerald-200 bg-emerald-50 text-emerald-900`;
        case 'No Access':
            return `${base} border-rose-200 bg-rose-50 text-rose-800`;
        default:
            return `${base} border-slate-200 bg-white text-slate-700`;
    }
}

export const MATRIX_LEGEND_PERMISSIONS: PermissionId[] = [...PERMISSION_DROPDOWN_OPTIONS];

export const PERMISSION_LEGEND_ITEMS: { permission: PermissionId; label: string }[] = [
    { permission: 'CRUD', label: 'Full access' },
    { permission: 'Create', label: 'Create only' },
    { permission: 'Edit', label: 'Modify' },
    { permission: 'View', label: 'View only' },
    { permission: 'No Access', label: 'No access' },
];

export function permissionShortLabel(p: PermissionId): string {
    switch (p) {
        case 'CRUD':
            return 'CRUD';
        case 'Create':
            return 'CREATE';
        case 'Edit':
            return 'EDIT';
        case 'View':
            return 'VIEW';
        case 'No Access':
            return '—';
        default:
            return p;
    }
}
