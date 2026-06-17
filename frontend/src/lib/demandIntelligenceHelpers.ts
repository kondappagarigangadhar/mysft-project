import type {
    DemandInventoryRiskRow,
    DemandProjectRecord,
    DemandRiskLevel,
    DemandVelocity,
} from './demandIntelligenceStore';

export type DemandIntelDatePreset = 'today' | 'week' | 'month' | 'all';

export type DemandIntelFilters = {
    datePreset: DemandIntelDatePreset;
    projectFilter: string;
    inventoryTypeFilter: string;
    locationFilter: string;
    unitTypeFilter: string;
    demandMin: number;
    demandMax: number;
};

export function defaultDemandIntelFilters(): DemandIntelFilters {
    return {
        datePreset: 'month',
        projectFilter: 'All',
        inventoryTypeFilter: 'All',
        locationFilter: 'All',
        unitTypeFilter: 'All',
        demandMin: 0,
        demandMax: 100,
    };
}

export function formatDemandRevenueLakhs(lakhs: number): string {
    if (lakhs <= 0) return '₹0';
    if (lakhs >= 100) {
        const cr = lakhs / 100;
        const rounded = cr >= 10 ? cr.toFixed(1) : cr.toFixed(2).replace(/\.?0+$/, '');
        return `₹${rounded} Cr`;
    }
    return `₹${lakhs.toLocaleString('en-IN')}L`;
}

export function formatDemandScore(score: number): string {
    return String(Math.round(score));
}

export function demandScoreTone(score: number): string {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
}

export function riskLevelClass(risk: DemandRiskLevel): string {
    if (risk === 'High') return 'bg-rose-50 text-rose-800 border-rose-200';
    if (risk === 'Medium') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}

export function velocityClass(v: DemandVelocity): string {
    if (v === 'High') return 'text-emerald-700 font-semibold';
    if (v === 'Medium') return 'text-amber-700 font-semibold';
    return 'text-rose-700 font-semibold';
}

export function filterDemandProjects(projects: DemandProjectRecord[], filters: DemandIntelFilters): DemandProjectRecord[] {
    return projects.filter((p) => {
        if (filters.projectFilter !== 'All' && p.name !== filters.projectFilter) return false;
        if (filters.locationFilter !== 'All' && p.location !== filters.locationFilter) return false;
        if (p.demandScore < filters.demandMin || p.demandScore > filters.demandMax) return false;
        return true;
    });
}

export function filterInventoryRisks(
    rows: DemandInventoryRiskRow[],
    filters: DemandIntelFilters,
): DemandInventoryRiskRow[] {
    return rows.filter((r) => {
        if (filters.projectFilter !== 'All' && r.project !== filters.projectFilter) return false;
        if (filters.unitTypeFilter !== 'All' && r.inventoryType !== filters.unitTypeFilter) return false;
        if (filters.inventoryTypeFilter !== 'All') {
            const type = filters.inventoryTypeFilter.toLowerCase();
            const rowType = r.inventoryType.toLowerCase();
            if (type === 'apartment' && !rowType.includes('bhk')) return false;
            if (type === 'villa' && !rowType.includes('villa')) return false;
            if (type === 'commercial' && rowType !== 'commercial') return false;
        }
        return true;
    });
}
