import type { User } from '@/data/mockData';

/** RBAC permission options for user records (view / edit / create). */
export const USER_PERMISSION_OPTIONS = [
    { id: 'users.view', label: 'Users — View' },
    { id: 'users.create', label: 'Users — Create' },
    { id: 'users.edit', label: 'Users — Edit' },
    { id: 'users.delete', label: 'Users — Delete' },
    { id: 'departments.view', label: 'Departments — View' },
    { id: 'departments.edit', label: 'Departments — Edit' },
    { id: 'projects.view', label: 'Projects — View' },
    { id: 'projects.edit', label: 'Projects — Edit' },
    { id: 'leads.view', label: 'Leads — View' },
    { id: 'leads.edit', label: 'Leads — Edit' },
    { id: 'finance.view', label: 'Finance — View' },
    { id: 'finance.edit', label: 'Finance — Edit' },
    { id: 'reports.view', label: 'Reports — View' },
    { id: 'settings.manage', label: 'Settings — Manage' },
] as const;

export type UserPermissionId = (typeof USER_PERMISSION_OPTIONS)[number]['id'];

export function permissionLabel(id: string): string {
    return USER_PERMISSION_OPTIONS.find((p) => p.id === id)?.label ?? id;
}

export function defaultPermissionsForRole(role: string): string[] {
    const all = USER_PERMISSION_OPTIONS.map((p) => p.id);
    const r = role.trim().toLowerCase();
    if (r === 'administrator') return [...all];
    if (r === 'engineer') return ['projects.view', 'projects.edit', 'departments.view', 'leads.view', 'users.view'];
    if (r === 'supervisor') return ['projects.view', 'projects.edit', 'departments.view', 'users.view', 'reports.view'];
    if (r === 'auditor') return ['projects.view', 'finance.view', 'reports.view', 'users.view'];
    if (r === 'viewer') return ['projects.view', 'departments.view', 'leads.view', 'users.view'];
    return ['users.view'];
}

export function defaultRoleDescription(role: string): string {
    const r = role.trim();
    if (!r) return '';
    return `${r} role with workspace access aligned to assigned permissions.`;
}

export function enrichUserRecord(u: User): User {
    const role = u.role?.trim() ?? '';
    const roleName = u.roleName?.trim() || role;
    return {
        ...u,
        roleName,
        roleDescription: u.roleDescription?.trim() || defaultRoleDescription(roleName || role),
        permissions: u.permissions?.length ? [...u.permissions] : defaultPermissionsForRole(role),
    };
}
