export function residentsListHref() {
    return '/platform/community/residents';
}

export function residentViewHref(slug: string) {
    return `/platform/community/residents/view/${encodeURIComponent(slug)}`;
}

export function residentCreateHref() {
    return '/platform/community/residents/view/new';
}

export function residentsIntelligenceHref() {
    return '/platform/community/residents/intelligence';
}
