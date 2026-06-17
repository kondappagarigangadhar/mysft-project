/** Format YYYY-MM-DD for display (local calendar day, en-IN). */
export function formatShortDate(isoYYYYMMDD: string): string {
    if (!isoYYYYMMDD || isoYYYYMMDD.length < 10) return isoYYYYMMDD;
    const [y, m, d] = isoYYYYMMDD.slice(0, 10).split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return isoYYYYMMDD;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
