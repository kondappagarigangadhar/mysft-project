import { getDemoProjectNamesList, getDemoUnitOptionsForProject } from '@/lib/demoCatalog';
import { getProjects, getUnits, type InventoryUnit } from '@/lib/projectsInventoryStore';
import { getAllVendorRecords } from '@/lib/vendors/vendorStore';
import type { WorkOrderLocationDetails } from '@/lib/workOrderStore';

export type WorkOrderUnitOption = {
    id: string;
    label: string;
    configuration: string;
};

/** Project names from inventory (falls back to demo catalog). */
export function getWorkOrderProjectOptions(): string[] {
    const fromInventory = getProjects()
        .map((p) => p.project_name.trim())
        .filter(Boolean);
    if (fromInventory.length) {
        return [...new Set(fromInventory)].sort((a, b) => a.localeCompare(b));
    }
    return getDemoProjectNamesList();
}

export function getProjectByName(projectName: string) {
    const target = projectName.trim().toLowerCase();
    if (!target) return undefined;
    return getProjects().find((p) => p.project_name.trim().toLowerCase() === target);
}

/** All units for a project — work orders may target any unit, not only available inventory. */
export function getWorkOrderUnitOptions(projectName: string): WorkOrderUnitOption[] {
    if (!projectName.trim()) return [];
    const project = getProjectByName(projectName);
    if (!project) {
        return getDemoUnitOptionsForProject(projectName).map((u) => ({
            id: u.id,
            label: `${u.id} · ${u.configuration}`,
            configuration: u.configuration,
        }));
    }
    return getUnits()
        .filter((u) => u.projectSlug === project.slug)
        .map((u) => formatUnitOption(u))
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

function formatUnitOption(u: InventoryUnit): WorkOrderUnitOption {
    const config = (u.configuration && u.configuration.trim()) || u.unit_type;
    const tower = u.tower_block?.trim();
    const label = tower ? `${u.unit_number} · ${config} · ${tower}` : `${u.unit_number} · ${config}`;
    return { id: u.unit_number, label, configuration: config };
}

export function resolveWorkOrderLocationFromUnit(projectName: string, unitNumber: string): WorkOrderLocationDetails {
    const empty: WorkOrderLocationDetails = { flat: '', block: '', tower: '', plot: '', area: '' };
    if (!projectName.trim() || !unitNumber.trim()) return empty;

    const project = getProjectByName(projectName);
    if (!project) {
        return { ...empty, flat: unitNumber.trim() };
    }

    const unit = getUnits().find((u) => u.projectSlug === project.slug && u.unit_number === unitNumber.trim());
    if (!unit) {
        return { ...empty, flat: unitNumber.trim() };
    }

    const area = unit.unit_size > 0 ? `${unit.unit_size} sq.ft` : '';
    const block = unit.block_phase?.trim() ?? '';
    const tower = unit.tower_block?.trim() ?? '';

    if (unit.unit_type === 'Plot') {
        return { flat: '', block, tower: '', plot: unit.unit_number, area };
    }
    return { flat: unit.unit_number, block, tower, plot: '', area };
}

export function deriveWorkOrderUnitId(projectName: string, location: WorkOrderLocationDetails): string {
    const candidate = location.plot?.trim() || location.flat?.trim() || '';
    if (!candidate || !projectName.trim()) return '';
    const options = getWorkOrderUnitOptions(projectName);
    if (options.some((o) => o.id === candidate)) return candidate;
    return candidate;
}

/** Active/pending vendors; when a project is set, prefer vendors assigned to that project. */
export function getWorkOrderVendorOptions(projectName?: string): string[] {
    const eligible = getAllVendorRecords().filter((v) => v.status === 'Active' || v.status === 'Pending');
    const names = eligible.map((v) => v.name.trim()).filter(Boolean);

    const target = projectName?.trim().toLowerCase();
    if (!target) {
        return [...new Set(names)].sort((a, b) => a.localeCompare(b));
    }

    const scoped = eligible
        .filter((v) => (v.primaryProject || '').trim().toLowerCase() === target)
        .map((v) => v.name.trim())
        .filter(Boolean);

    const list = scoped.length ? scoped : names;
    return [...new Set(list)].sort((a, b) => a.localeCompare(b));
}

export function formatWorkOrderUnitReadLabel(projectName: string, unitId: string): string {
    if (!unitId.trim()) return '';
    const match = getWorkOrderUnitOptions(projectName).find((o) => o.id === unitId);
    return match?.label ?? unitId;
}
