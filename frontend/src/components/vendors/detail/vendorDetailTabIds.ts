export type VendorMainTabId = 'overview' | 'notes' | 'performance' | 'history';

const ORDER: VendorMainTabId[] = ['overview', 'notes', 'performance', 'history'];

export function normalizeVendorDetailTab(raw: string | null | undefined): VendorMainTabId {
    if (!raw) return 'overview';
    const t = raw.toLowerCase();
    if (ORDER.includes(t as VendorMainTabId)) return t as VendorMainTabId;
    return 'overview';
}
