export function tenantListHref(): string {
    return '/platform/tenants';
}

export function tenantViewHref(id: number | string): string {
    return `/platform/tenants/view/${encodeURIComponent(String(id))}`;
}

export function tenantCreateHref(): string {
    return '/platform/tenants/view/new';
}
