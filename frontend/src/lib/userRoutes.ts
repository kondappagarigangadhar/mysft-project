/** Platform Users — list + record (Leads-style). */

export function userListHref() {
    return '/platform/users';
}

export function userViewHref(id: string | number) {
    return `/platform/users/view/${id}`;
}

export function userCreateHref() {
    return '/platform/users/view/new';
}
