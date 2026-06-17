import { MOCK_VENDOR_COVERAGE } from '@/lib/vendors/mockData';
import type { VendorCoverageAssignment, VendorCoveragePriority } from '@/lib/vendors/types';

const STORE_KEY = 'arris-vendor-coverage-v1';
export const VENDOR_COVERAGE_UPDATED_EVENT = 'arris-vendor-coverage-updated';

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emitUpdated() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(VENDOR_COVERAGE_UPDATED_EVENT));
    }
}

function defaultCoverageForVendor(vendorId: string): VendorCoverageAssignment {
    const seed = MOCK_VENDOR_COVERAGE.find((c) => c.vendorId === vendorId);
    if (seed) return { ...seed, projectsCovered: [...seed.projectsCovered], towersCovered: [...seed.towersCovered], categoriesCovered: [...seed.categoriesCovered], serviceAreas: [...seed.serviceAreas], preferredPriorityLevels: [...seed.preferredPriorityLevels] };
    return {
        vendorId,
        projectsCovered: [],
        towersCovered: [],
        categoriesCovered: [],
        serviceAreas: [],
        preferredPriorityLevels: ['Low', 'Medium', 'High', 'Critical'],
    };
}

function normalizeCoverage(raw: unknown, vendorId: string): VendorCoverageAssignment {
    const base = defaultCoverageForVendor(vendorId);
    if (!raw || typeof raw !== 'object') return base;
    const row = raw as Partial<VendorCoverageAssignment>;
    const asList = (v: unknown, fallback: string[]) => (Array.isArray(v) ? v.map(String).filter(Boolean) : fallback);
    return {
        vendorId,
        projectsCovered: row.projectsCovered ? asList(row.projectsCovered, base.projectsCovered) : base.projectsCovered,
        towersCovered: row.towersCovered ? asList(row.towersCovered, base.towersCovered) : base.towersCovered,
        categoriesCovered: row.categoriesCovered ? asList(row.categoriesCovered, base.categoriesCovered) : base.categoriesCovered,
        serviceAreas: row.serviceAreas ? asList(row.serviceAreas, base.serviceAreas) : base.serviceAreas,
        preferredPriorityLevels: row.preferredPriorityLevels
            ? (row.preferredPriorityLevels as VendorCoveragePriority[])
            : base.preferredPriorityLevels,
    };
}

function readAll(): Record<string, VendorCoverageAssignment> {
    if (!canUseStorage()) {
        return Object.fromEntries(MOCK_VENDOR_COVERAGE.map((c) => [c.vendorId, { ...c }]));
    }
    try {
        const raw = window.localStorage.getItem(STORE_KEY);
        if (!raw) {
            return Object.fromEntries(MOCK_VENDOR_COVERAGE.map((c) => [c.vendorId, { ...c }]));
        }
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const out: Record<string, VendorCoverageAssignment> = {};
        for (const seed of MOCK_VENDOR_COVERAGE) {
            out[seed.vendorId] = normalizeCoverage(parsed[seed.vendorId], seed.vendorId);
        }
        for (const [vendorId, value] of Object.entries(parsed)) {
            if (!out[vendorId]) out[vendorId] = normalizeCoverage(value, vendorId);
        }
        return out;
    } catch {
        return Object.fromEntries(MOCK_VENDOR_COVERAGE.map((c) => [c.vendorId, { ...c }]));
    }
}

function persistAll(map: Record<string, VendorCoverageAssignment>) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(STORE_KEY, JSON.stringify(map));
    emitUpdated();
}

export function getVendorCoverageAssignment(vendorId: string): VendorCoverageAssignment {
    const all = readAll();
    return all[vendorId] ?? defaultCoverageForVendor(vendorId);
}

export function getAllVendorCoverageAssignments(): VendorCoverageAssignment[] {
    return Object.values(readAll());
}

export function saveVendorCoverageAssignment(coverage: VendorCoverageAssignment): VendorCoverageAssignment {
    const vendorId = coverage.vendorId.trim();
    const normalized: VendorCoverageAssignment = {
        vendorId,
        projectsCovered: [...coverage.projectsCovered],
        towersCovered: [...coverage.towersCovered],
        categoriesCovered: [...coverage.categoriesCovered],
        serviceAreas: [...coverage.serviceAreas],
        preferredPriorityLevels: [...coverage.preferredPriorityLevels],
    };
    const all = readAll();
    all[vendorId] = normalized;
    persistAll(all);
    return normalized;
}

export const VENDOR_COVERAGE_PROJECT_OPTIONS = [
    'Skyline Residency',
    'Riverfront Tower',
    'Skyline Courts',
    'Garden Plaza',
    'Marina Views',
    'Central Annex',
    'Urban Flux Apartments',
    'Summit Woods',
] as const;

export const VENDOR_COVERAGE_CATEGORY_OPTIONS = [
    'Plumbing',
    'Electrical',
    'HVAC',
    'Cleaning',
    'Security',
    'Civil',
    'General',
] as const;
