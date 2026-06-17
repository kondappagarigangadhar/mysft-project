import type {
    ContractExtractionSample,
    ContractRecord,
    ContractRenewalRow,
    ContractRiskLevel,
    ContractStatus,
    ContractType,
} from './contractIntelligenceStore';

export type ContractIntelDatePreset = 'today' | 'week' | 'month' | 'all';

export type ContractIntelFilters = {
    datePreset: ContractIntelDatePreset;
    contractTypeFilter: 'All' | ContractType;
    vendorFilter: string;
    riskLevelFilter: 'All' | ContractRiskLevel;
    statusFilter: 'All' | ContractStatus;
};

export function defaultContractIntelFilters(): ContractIntelFilters {
    return {
        datePreset: 'month',
        contractTypeFilter: 'All',
        vendorFilter: 'All',
        riskLevelFilter: 'All',
        statusFilter: 'All',
    };
}

export function riskLevelClass(risk: ContractRiskLevel): string {
    if (risk === 'High') return 'bg-rose-50 text-rose-800 border-rose-200';
    if (risk === 'Medium') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}

export function statusClass(status: ContractStatus): string {
    if (status === 'Expiring') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (status === 'Under Review') return 'bg-violet-50 text-violet-800 border-violet-200';
    if (status === 'Expired') return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}

export function priorityClass(priority: string): string {
    if (priority === 'Critical') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (priority === 'High') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (priority === 'Medium') return 'bg-violet-100 text-violet-800 border-violet-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
}

export function impactClass(impact: string): string {
    if (impact === 'High') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (impact === 'Medium') return 'border-amber-200 bg-amber-50 text-amber-800';
    return 'border-slate-200 bg-slate-50 text-slate-700';
}

export function riskScoreTone(score: number): string {
    if (score >= 70) return 'text-rose-700 bg-rose-50 border-rose-200';
    if (score >= 45) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
}

export function riskScoreLabel(score: number): string {
    if (score >= 70) return 'High Risk';
    if (score >= 45) return 'Medium Risk';
    return 'Low Risk';
}

export function filterContracts(contracts: ContractRecord[], filters: ContractIntelFilters): ContractRecord[] {
    return contracts.filter((c) => {
        if (filters.contractTypeFilter !== 'All' && c.type !== filters.contractTypeFilter) return false;
        if (filters.vendorFilter !== 'All' && c.vendor !== filters.vendorFilter) return false;
        if (filters.riskLevelFilter !== 'All' && c.riskLevel !== filters.riskLevelFilter) return false;
        if (filters.statusFilter !== 'All' && c.status !== filters.statusFilter) return false;
        return true;
    });
}

export function filterRenewals(renewals: ContractRenewalRow[], contractSlugs: Set<string>): ContractRenewalRow[] {
    return renewals.filter((r) => contractSlugs.has(r.contractSlug));
}

export const STANDARD_CONTRACT_RISK_FINDINGS = [
    'No termination clause',
    'No penalty clause',
    'Insurance requirement missing',
    'Vendor liability capped unusually low',
] as const;

export type UploadedContractReview = {
    id: string;
    fileName: string;
    fileSizeLabel: string;
    uploadedAt: string;
    status: 'analyzing' | 'completed';
    extraction: ContractExtractionSample;
};

function formatContractFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function contractNameFromFile(fileName: string): string {
    return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

function pseudoRiskScore(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 100;
    return 32 + (hash % 58);
}

export function buildUploadedContractReview(file: File, template: ContractExtractionSample): UploadedContractReview {
    const contractName = contractNameFromFile(file.name);
    const riskScore = pseudoRiskScore(file.name.toLowerCase());
    const missingTermination = riskScore >= 52;
    const missingPenalty = riskScore >= 58;
    const lowLiability = riskScore >= 62;

    const findings = [...STANDARD_CONTRACT_RISK_FINDINGS];

    const vendorGuess = contractName.split(' ').slice(0, 2).join(' ') || 'Counterparty';

    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        fileSizeLabel: formatContractFileSize(file.size),
        uploadedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        status: 'analyzing',
        extraction: {
            contractName,
            parties: `ARRIS Realty Pvt Ltd · ${vendorGuess}`,
            effectiveDate: template.effectiveDate,
            expiryDate: template.expiryDate,
            paymentTerms: riskScore >= 50 ? 'Net-45, milestone-based' : 'Net-30, monthly invoicing',
            slaTerms: riskScore >= 55 ? 'Completion within 180 days per phase' : '99.5% uptime, 4-hour response SLA',
            terminationClause: missingTermination ? 'Not found' : '30-day written notice by either party',
            penaltyClause: missingPenalty ? 'Not found' : 'Liquidated damages — 2% of contract value',
            liabilityTerms: lowLiability ? 'Capped at ₹25L — below standard' : 'Mutual indemnification, capped at contract value',
            insuranceRequirements: riskScore >= 55 ? 'Partial — workers comp only' : 'Comprehensive liability cover required',
            renewalTerms: riskScore >= 60 ? 'Auto-renewal unless 60-day notice' : 'Manual renewal with 90-day notice',
            riskScore,
            findings,
        },
    };
}
