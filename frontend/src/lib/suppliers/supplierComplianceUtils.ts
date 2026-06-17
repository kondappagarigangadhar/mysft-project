/** True when expiry date is before today (document no longer valid by date). */
export function supplierComplianceDateExpired(expiryDate: string): boolean {
    const d = expiryDate.trim();
    if (!d) return false;
    const today = new Date().toISOString().slice(0, 10);
    return d < today;
}

/** Days until expiry; negative if expired; null if no date. */
export function supplierComplianceDaysUntil(expiryDate: string): number | null {
    const d = expiryDate.trim();
    if (!d) return null;
    const t0 = new Date();
    t0.setHours(0, 0, 0, 0);
    const t1 = new Date(d + 'T12:00:00');
    return Math.round((t1.getTime() - t0.getTime()) / 86400000);
}

export function materialKey(name: string): string {
    return name.trim().toLowerCase();
}
