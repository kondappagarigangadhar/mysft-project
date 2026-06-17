export const DEPARTMENT_PROFILE_VIEW_BASE = '/departments/view' as const;

export function departmentProfileHref(id: number | string): string {
    return `${DEPARTMENT_PROFILE_VIEW_BASE}/${encodeURIComponent(String(id))}`;
}

export function departmentProfileEditHref(id: number | string): string {
    return `${DEPARTMENT_PROFILE_VIEW_BASE}/${encodeURIComponent(String(id))}?edit=1`;
}
