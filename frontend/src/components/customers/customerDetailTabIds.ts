export const CUSTOMER_WORKSPACE_TAB_IDS = [
    'overview',
    'payments',
    'documents',
    'project-updates',
    'history',
] as const;

export type CustomerWorkspaceTabId = (typeof CUSTOMER_WORKSPACE_TAB_IDS)[number];

export const CUSTOMER_WORKSPACE_TAB_ORDER: CustomerWorkspaceTabId[] = [
    'overview',
    'payments',
    'documents',
    'project-updates',
    'history',
];

const VALID = new Set<string>(CUSTOMER_WORKSPACE_TAB_IDS);

export function normalizeCustomerWorkspaceTab(tab: string | null): CustomerWorkspaceTabId {
    if (tab === 'payment' || tab === 'payment-tracking') return 'payments';
    if (tab === 'docs' || tab === 'document') return 'documents';
    if (tab === 'updates' || tab === 'project') return 'project-updates';
    if (tab === 'profile') return 'overview';
    if (tab === 'activity') return 'history';
    if (tab && VALID.has(tab)) return tab as CustomerWorkspaceTabId;
    return 'overview';
}
