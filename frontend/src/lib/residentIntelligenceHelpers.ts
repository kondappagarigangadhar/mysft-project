import type { ResidentIntelRecord, ResidentRiskRow } from './residentIntelligenceStore';

export type ResidentIntelDatePreset = 'today' | 'week' | 'month' | 'all';

export type ResidentHealthStatusFilter = 'All' | 'At risk' | 'On track' | 'Attention';

export type ResidentIntelFilters = {
    datePreset: ResidentIntelDatePreset;
    propertyFilter: string;
    residentStatusFilter: string;
    portalFilter: string;
    tagFilter: string;
    healthFilter: ResidentHealthStatusFilter;
};

export function defaultResidentIntelFilters(): ResidentIntelFilters {
    return {
        datePreset: 'all',
        propertyFilter: 'All',
        residentStatusFilter: 'All',
        portalFilter: 'All',
        tagFilter: 'All',
        healthFilter: 'All',
    };
}

export function propertyBuildingFromUnit(propertyUnit: string): string {
    const idx = propertyUnit.indexOf(' — ');
    return idx >= 0 ? propertyUnit.slice(0, idx).trim() : propertyUnit.trim();
}

export function communityScoreTone(score: number): string {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
}

export function residentRiskClass(risk: 'High' | 'Medium' | 'Low'): string {
    if (risk === 'High') return 'bg-rose-50 text-rose-800 border-rose-200';
    if (risk === 'Medium') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}

function dateInPreset(isoDate: string, preset: ResidentIntelDatePreset): boolean {
    if (preset === 'all') return true;
    const d = new Date(isoDate.slice(0, 10));
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (preset === 'today') return d >= start;
    if (preset === 'week') {
        const weekStart = new Date(start);
        weekStart.setDate(weekStart.getDate() - 7);
        return d >= weekStart;
    }
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return d >= monthStart;
}

function portalExpiringSoon(accessExpiryDate: string): boolean {
    const expiry = new Date(accessExpiryDate.slice(0, 10));
    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);
    return expiry <= in30 && expiry >= now;
}

export function filterResidentIntelRecords(
    records: ResidentIntelRecord[],
    filters: ResidentIntelFilters,
): ResidentIntelRecord[] {
    return records.filter((r) => {
        if (filters.propertyFilter !== 'All' && r.propertyName !== filters.propertyFilter) return false;
        if (filters.residentStatusFilter !== 'All' && r.residentStatus !== filters.residentStatusFilter) return false;
        if (!dateInPreset(r.moveInDate, filters.datePreset)) return false;
        if (filters.portalFilter === 'Enabled' && !r.portalAccessEnabled) return false;
        if (filters.portalFilter === 'Disabled' && r.portalAccessEnabled) return false;
        if (filters.portalFilter === 'Expiring' && (!r.portalAccessEnabled || !portalExpiringSoon(r.accessExpiryDate))) return false;
        if (filters.tagFilter !== 'All' && !r.tags.includes(filters.tagFilter)) return false;
        if (filters.healthFilter === 'At risk' && r.riskLevel !== 'High') return false;
        if (filters.healthFilter === 'On track' && (r.riskLevel === 'High' || r.openTickets > 0)) return false;
        if (filters.healthFilter === 'Attention' && r.riskLevel === 'Low' && r.openTickets === 0) return false;
        return true;
    });
}

export function filterResidentRisks(rows: ResidentRiskRow[], filters: ResidentIntelFilters): ResidentRiskRow[] {
    return rows.filter((r) => {
        if (filters.propertyFilter !== 'All' && r.propertyName !== filters.propertyFilter) return false;
        if (filters.residentStatusFilter !== 'All' && r.residentStatus !== filters.residentStatusFilter) return false;
        return true;
    });
}
