import type { IssueCategory, PriorityLevel, ServiceMaintenanceTicket } from '@/lib/serviceMaintenanceStore';
import { parseServiceLocationContext } from '@/lib/service-maintenance/serviceLocationContext';
import { getAllVendorCoverageAssignments } from '@/lib/vendors/vendorCoverageStore';
import { getAllVendorRecords, type VendorRecord } from '@/lib/vendors/vendorStore';
import { getWorkOrders } from '@/lib/workOrderStore';

export type AutoAssignmentCandidate = {
    vendorId: string;
    vendorName: string;
    score: number;
    confidence: number;
    reasonParts: string[];
    slaScore: number;
    workload: number;
};

export type AutoAssignmentResult = {
    vendorId: string;
    vendorName: string;
    confidence: number;
    reason: string;
    method: 'Auto';
};

function mapCategoryToVendorCategory(category: IssueCategory): string {
    if (category === 'General') return 'General';
    return category;
}

export function computeVendorSlaScore(vendor: VendorRecord): number {
    const availabilityBonus = vendor.availability === 'High' ? 12 : vendor.availability === 'Medium' ? 6 : 0;
    const raw =
        vendor.compliancePercent * 0.45 + vendor.rating * 18 + availabilityBonus - vendor.slaBreaches * 6 - vendor.delays * 0.5;
    return Math.max(0, Math.min(100, Math.round(raw)));
}

export function computeVendorOpenWorkload(vendor: VendorRecord, openServiceTicketCount = 0): number {
    const openWoStatuses = new Set(['Open', 'Assigned', 'In Progress', 'On Hold']);
    const woCount = getWorkOrders().filter(
        (wo) =>
            !wo.archivedAt &&
            (wo.vendor.vendorId === vendor.id || wo.vendor.vendorName === vendor.name) &&
            openWoStatuses.has(wo.lifecycle.status),
    ).length;
    return openServiceTicketCount + woCount;
}

function isVendorComplianceValid(vendor: VendorRecord): boolean {
    if (vendor.status !== 'Active') return false;
    if (vendor.compliancePercent < 70) return false;
    if (vendor.contractStatus === 'Expired') return false;
    return true;
}

function coverageMatches(
    coverage: ReturnType<typeof getAllVendorCoverageAssignments>[number],
    project: string,
    tower: string,
    category: IssueCategory,
    priority: PriorityLevel,
): { projectMatch: boolean; towerMatch: boolean; categoryMatch: boolean; priorityMatch: boolean } {
    const norm = (s: string) => s.trim().toLowerCase();
    const projectMatch =
        coverage.projectsCovered.length === 0 ||
        coverage.projectsCovered.some((p) => norm(p) === norm(project));
    const towerMatch =
        coverage.towersCovered.length === 0 || coverage.towersCovered.some((t) => norm(t) === norm(tower) || norm(t) === norm(project));
    const cat = mapCategoryToVendorCategory(category);
    const categoryMatch =
        coverage.categoriesCovered.length === 0 ||
        coverage.categoriesCovered.some((c) => norm(c) === norm(cat)) ||
        vendorCategoriesInclude(vendorCategoriesFromCoverage(coverage), cat);
    const priorityMatch =
        coverage.preferredPriorityLevels.length === 0 || coverage.preferredPriorityLevels.includes(priority);
    return { projectMatch, towerMatch, categoryMatch, priorityMatch };
}

function vendorCategoriesFromCoverage(coverage: ReturnType<typeof getAllVendorCoverageAssignments>[number]): string[] {
    return coverage.categoriesCovered;
}

function vendorCategoriesInclude(vendorCategories: string[], category: string): boolean {
    return vendorCategories.some((c) => c.toLowerCase() === category.toLowerCase());
}

export function rankVendorsForServiceTicket(
    ticket: Pick<ServiceMaintenanceTicket, 'locationUnit' | 'issueCategory' | 'priorityLevel'>,
    openTicketsByVendorName?: Record<string, number>,
): AutoAssignmentCandidate[] {
    const { project, tower } = parseServiceLocationContext(ticket.locationUnit);
    const coverageByVendor = new Map(getAllVendorCoverageAssignments().map((c) => [c.vendorId, c]));
    const vendors = getAllVendorRecords();

    const candidates: AutoAssignmentCandidate[] = [];

    for (const vendor of vendors) {
        if (!isVendorComplianceValid(vendor)) continue;
        if (vendor.status === 'Blacklisted') continue;

        const coverage = coverageByVendor.get(vendor.id) ?? {
            vendorId: vendor.id,
            projectsCovered: vendor.primaryProject ? [vendor.primaryProject] : [],
            towersCovered: vendor.primaryProject ? [vendor.primaryProject] : [],
            categoriesCovered: vendor.categories,
            serviceAreas: [vendor.city, vendor.state].filter(Boolean),
            preferredPriorityLevels: ['Low', 'Medium', 'High', 'Critical'] as PriorityLevel[],
        };

        const { projectMatch, towerMatch, categoryMatch, priorityMatch } = coverageMatches(
            coverage,
            project,
            tower,
            ticket.issueCategory,
            ticket.priorityLevel,
        );

        if (!projectMatch || !categoryMatch) continue;
        if (coverage.towersCovered.length > 0 && !towerMatch) continue;
        if (coverage.preferredPriorityLevels.length > 0 && !priorityMatch) continue;

        const vendorCatMatch =
            vendor.categories.some((c) => c.toLowerCase() === ticket.issueCategory.toLowerCase()) ||
            ticket.issueCategory === 'General';
        if (!vendorCatMatch && !categoryMatch) continue;

        const slaScore = computeVendorSlaScore(vendor);
        const workload = computeVendorOpenWorkload(vendor, openTicketsByVendorName?.[vendor.name] ?? 0);
        const reasonParts: string[] = [];
        if (projectMatch) reasonParts.push('Project Match');
        if (towerMatch && coverage.towersCovered.length > 0) reasonParts.push('Tower Match');
        if (categoryMatch) reasonParts.push(`${ticket.issueCategory} Category`);
        if (vendor.primaryProject && vendor.primaryProject.toLowerCase() === project.toLowerCase()) {
            reasonParts.push('Primary Project');
        }
        reasonParts.push(`SLA ${slaScore}%`);

        let score = slaScore;
        if (projectMatch) score += 28;
        if (towerMatch) score += 14;
        if (categoryMatch) score += 22;
        if (vendor.primaryProject?.toLowerCase() === project.toLowerCase()) score += 10;
        score -= workload * 4;

        const confidence = Math.max(62, Math.min(98, Math.round(58 + score * 0.28)));

        candidates.push({
            vendorId: vendor.id,
            vendorName: vendor.name,
            score,
            confidence,
            reasonParts,
            slaScore,
            workload,
        });
    }

    return candidates.sort((a, b) => b.score - a.score || a.workload - b.workload || b.slaScore - a.slaScore);
}

export function runAutoAssignmentForTicket(
    ticket: Pick<ServiceMaintenanceTicket, 'locationUnit' | 'issueCategory' | 'priorityLevel'>,
    openTicketsByVendorName?: Record<string, number>,
): AutoAssignmentResult | null {
    const ranked = rankVendorsForServiceTicket(ticket, openTicketsByVendorName);
    const best = ranked[0];
    if (!best) return null;
    return {
        vendorId: best.vendorId,
        vendorName: best.vendorName,
        confidence: best.confidence,
        reason: best.reasonParts.join(' + '),
        method: 'Auto',
    };
}
