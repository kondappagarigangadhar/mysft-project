/**
 * Demo catalog aligned across:
 * - `data/mockData.ts` leads (`projectName` → first 3 unique projects)
 * - `lib/projectsInventoryStore.ts` (seed projects/units + Apartment pricing curve)
 * - `lib/leadStore.ts` lead codes (`AR-{id}`)
 * - `lib/companyStore.ts` / `mockData.companies` (tenant name)
 */

export const DEMO_TENANT_COMPANY_NAME = 'Skyline Builders';

/** Same order as unique project names from `mockData.leads` (first 3). */
export const DEMO_PROJECT_NAMES = ['Skyline Residency', 'Urban Flux Apartments', 'Summit Woods'] as const;

export type DemoProjectName = (typeof DEMO_PROJECT_NAMES)[number];

/**
 * Mirrors `projectsInventoryStore` `buildSeedUnits` for Apartment projects:
 * `price = 6500000 + idx * 150000`, `offer_price` when `idx % 3 === 0`.
 */
export function getDemoUnitOptionsForProject(projectName: string): { id: string; price: number; configuration: string }[] {
    const known = DEMO_PROJECT_NAMES.some((n) => n === projectName);
    const configByIdx = ['2 BHK', '3 BHK', '2 BHK'] as const;
    if (!known) {
        return [{ id: '101', price: 6500000, configuration: '2 BHK' }];
    }
    return [0, 1, 2].map((unitIdx) => {
        const id = String(101 + unitIdx);
        const basePrice = 6500000 + unitIdx * 150000;
        const offerPrice = unitIdx % 3 === 0 ? 6200000 + unitIdx * 120000 : undefined;
        return { id, price: offerPrice ?? basePrice, configuration: configByIdx[unitIdx] ?? '2 BHK' };
    });
}

export function getDemoProjectNamesList(): string[] {
    return [...DEMO_PROJECT_NAMES];
}
