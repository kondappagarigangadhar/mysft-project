import type { Lead } from '@/lib/leadStore';

export function daysSinceLastLeadActivity(lead: Lead): number {
    if (!lead.activityLog?.length) return 999;
    const sorted = [...lead.activityLog].sort((a, b) => (a.at < b.at ? 1 : -1));
    const last = sorted[0]?.at;
    if (!last) return 999;
    const t = new Date(last).getTime();
    if (Number.isNaN(t)) return 999;
    return (Date.now() - t) / (24 * 3600 * 1000);
}
