export function serviceMaintenanceListHref() {
    return '/platform/community/service-maintenance';
}

export function serviceMaintenanceViewHref(slug: string) {
    return `/platform/community/service-maintenance/view/${encodeURIComponent(slug)}`;
}

export function serviceMaintenanceCreateHref(opts?: { residentSlug?: string; propertyUnit?: string }) {
    const base = '/platform/community/service-maintenance/view/new';
    if (!opts?.residentSlug?.trim()) return base;
    const sp = new URLSearchParams({ resident: opts.residentSlug.trim() });
    if (opts.propertyUnit?.trim()) sp.set('unit', opts.propertyUnit.trim());
    return `${base}?${sp.toString()}`;
}
