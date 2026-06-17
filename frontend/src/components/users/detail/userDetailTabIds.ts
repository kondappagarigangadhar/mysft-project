export type UserDetailMainTabId = 'overview' | 'roles' | 'documents' | 'history';

export const USER_DETAIL_PRIMARY_TAB_ORDER: UserDetailMainTabId[] = ['overview', 'roles', 'documents', 'history'];

export function normalizeUserDetailTab(raw: string | null | undefined): UserDetailMainTabId {
    const t = (raw || '').trim().toLowerCase();
    const allowed = new Set<string>(USER_DETAIL_PRIMARY_TAB_ORDER);
    if (allowed.has(t)) return t as UserDetailMainTabId;
    return 'overview';
}
