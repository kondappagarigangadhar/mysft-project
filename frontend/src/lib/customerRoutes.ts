export function customersListHref() {
    return '/platform/customers';
}

export function customerViewHref(slug: string) {
    return `/platform/customers/view/${encodeURIComponent(slug)}`;
}

export function customerCreateHref() {
    return '/platform/customers/view/new';
}

export function customerProfileEditHref(slug: string) {
    return `${customerViewHref(slug)}?edit=1`;
}
