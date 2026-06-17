export type WorkOrderDetailMainTabId = 'overview' | 'notifications' | 'activity';

export const WORK_ORDER_DETAIL_PRIMARY_TAB_ORDER: WorkOrderDetailMainTabId[] = ['overview', 'notifications', 'activity'];

export const WORK_ORDER_DETAIL_MORE_TAB_ORDER: WorkOrderDetailMainTabId[] = [];

export function normalizeWorkOrderDetailTab(input: string | null): WorkOrderDetailMainTabId {
    const v = (input ?? '').trim();
    // Legacy tabs merged into overview
    if (v === 'progress' || v === 'completion') return 'overview';
    const all = [...WORK_ORDER_DETAIL_PRIMARY_TAB_ORDER, ...WORK_ORDER_DETAIL_MORE_TAB_ORDER];
    return (all as string[]).includes(v) ? (v as WorkOrderDetailMainTabId) : 'overview';
}
