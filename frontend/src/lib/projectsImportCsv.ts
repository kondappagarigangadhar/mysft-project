import { parseCsvRows } from '@/lib/inventoryImportCsv';
import type { ProjectStatus, ProjectType } from '@/lib/projectsInventoryStore';

export const PROJECTS_CSV_SAMPLE = `project_name,project_type,location,total_units,project_status,requires_approval
Riverside Heights,Apartment,Mumbai,120,active,no
Greenfield Plots,Plot,Pune,45,upcoming,yes`;

function normalizeHeader(h: string) {
    return h.trim().toLowerCase().replace(/\s+/g, '_');
}

const PROJECT_TYPES: ProjectType[] = ['Plot', 'Apartment', 'Villa'];

function parseProjectType(raw: string): ProjectType | null {
    const t = raw.trim();
    const cap = (t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()) as string;
    if (PROJECT_TYPES.includes(cap as ProjectType)) return cap as ProjectType;
    return null;
}

function parseProjectStatus(raw: string): ProjectStatus | null {
    const t = raw.trim().toLowerCase().replace(/_/g, ' ');
    if (t === 'soldout' || t === 'sold out') return 'sold out';
    if (t === 'upcoming') return 'upcoming';
    if (t === 'active') return 'active';
    return null;
}

function parseBool(raw: string): boolean | null {
    const s = raw.trim().toLowerCase();
    if (['yes', 'true', '1', 'y'].includes(s)) return true;
    if (['no', 'false', '0', 'n', ''].includes(s)) return false;
    return null;
}

export type ParsedProjectRow = {
    project_name: string;
    project_type: ProjectType;
    location: string;
    total_units: number;
    project_status: ProjectStatus;
    requires_approval: boolean;
};

export type ProjectRowParseResult =
    | { ok: true; line: number; data: ParsedProjectRow }
    | { ok: false; line: number; error: string };

export function parseProjectsCsvContent(csvText: string): ProjectRowParseResult[] {
    const rows = parseCsvRows(csvText.trim());
    if (rows.length < 2) {
        return [{ ok: false, line: 1, error: 'File must include a header row and at least one data row.' }];
    }
    const header = rows[0]!.map(normalizeHeader);
    const idx = (name: string) => header.indexOf(name);

    const iName = idx('project_name');
    const iType = idx('project_type');
    const iLoc = idx('location');
    const iUnits = idx('total_units');
    const iStatus = idx('project_status');
    const iApproval = idx('requires_approval');

    if (iName < 0 || iType < 0 || iLoc < 0 || iUnits < 0 || iStatus < 0 || iApproval < 0) {
        return [
            {
                ok: false,
                line: 1,
                error:
                    'Missing required columns: project_name, project_type, location, total_units, project_status, requires_approval',
            },
        ];
    }

    const out: ProjectRowParseResult[] = [];
    for (let r = 1; r < rows.length; r++) {
        const line = r + 1;
        const cells = rows[r]!;
        const project_name = (cells[iName] ?? '').trim();
        const project_type = parseProjectType(cells[iType] ?? '');
        const location = (cells[iLoc] ?? '').trim();
        const total_units = Number(String(cells[iUnits] ?? '').replace(/,/g, ''));
        const project_status = parseProjectStatus(cells[iStatus] ?? '');
        const requiresApprovalRaw = parseBool(cells[iApproval] ?? '');

        if (!project_name) {
            out.push({ ok: false, line, error: 'project_name is required' });
            continue;
        }
        if (!project_type) {
            out.push({ ok: false, line, error: `Invalid project_type: ${cells[iType] ?? ''}` });
            continue;
        }
        if (!location) {
            out.push({ ok: false, line, error: 'location is required' });
            continue;
        }
        if (!Number.isFinite(total_units) || total_units <= 0 || !Number.isInteger(total_units)) {
            out.push({ ok: false, line, error: 'total_units must be a positive whole number' });
            continue;
        }
        if (!project_status) {
            out.push({ ok: false, line, error: `Invalid project_status: ${cells[iStatus] ?? ''} (use upcoming, active, sold out)` });
            continue;
        }
        if (requiresApprovalRaw === null) {
            out.push({ ok: false, line, error: `Invalid requires_approval: ${cells[iApproval] ?? ''} (use yes or no)` });
            continue;
        }

        out.push({
            ok: true,
            line,
            data: {
                project_name,
                project_type,
                location,
                total_units,
                project_status,
                requires_approval: requiresApprovalRaw,
            },
        });
    }
    return out;
}

export function downloadSampleProjectsCsv() {
    const blob = new Blob([`\uFEFF${PROJECTS_CSV_SAMPLE}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
}
