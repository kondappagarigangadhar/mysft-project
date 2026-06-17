import type { Company } from '@/data/mockData';
import type { InventoryUnit, Project } from '@/lib/projectsInventoryStore';

function escapeCsv(value: string | number | undefined | null) {
    const s = value === undefined || value === null ? '' : String(value);
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

export function downloadProjectsCsv(projects: Project[], filename = 'projects-export.csv') {
    const headers = ['Project ID', 'Project Name', 'Type', 'Location', 'Total Units', 'Status', 'Approval'];
    const rows = projects.map((p) => [
        escapeCsv(p.project_id),
        escapeCsv(p.project_name),
        escapeCsv(p.project_type),
        escapeCsv(p.location),
        escapeCsv(p.total_units),
        escapeCsv(p.project_status),
        escapeCsv(p.approval_status ?? ''),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    triggerDownload(`\uFEFF${csv}`, filename);
}

/** Excel-compatible HTML table export (opens in Microsoft Excel without extra deps). */
export function downloadProjectsExcel(projects: Project[], filename = 'projects-export.xls') {
    const esc = (v: string | number) =>
        String(v ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    const header = ['Project ID', 'Project Name', 'Type', 'Location', 'Total Units', 'Status', 'Approval'];
    const body = projects
        .map(
            (p) =>
                `<tr>${[
                    esc(p.project_id),
                    esc(p.project_name),
                    esc(p.project_type),
                    esc(p.location),
                    esc(p.total_units),
                    esc(p.project_status),
                    esc(p.approval_status ?? ''),
                ]
                    .map((c) => `<td>${c}</td>`)
                    .join('')}</tr>`,
        )
        .join('');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${header.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function downloadInventoryCsv(
    units: InventoryUnit[],
    projectName: (projectSlug: string) => string,
    filename = 'inventory-export.csv',
) {
    const headers = ['Unit ID', 'Unit Number', 'Project', 'Type', 'Configuration', 'Size', 'Price', 'Status', 'Locked'];
    const rows = units.map((u) => [
        escapeCsv(u.unit_id),
        escapeCsv(u.unit_number),
        escapeCsv(projectName(u.projectSlug)),
        escapeCsv(u.unit_type),
        escapeCsv(u.configuration),
        escapeCsv(u.unit_size),
        escapeCsv(u.price),
        escapeCsv(u.availability_status),
        escapeCsv(u.inventory_lock_status ? 'Yes' : 'No'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    triggerDownload(`\uFEFF${csv}`, filename);
}

export type PricingCsvRow = {
    company: Company;
    project: Project;
    units: number;
    pending: number;
};

export function downloadPricingCsv(rows: PricingCsvRow[], filename = 'pricing-projects-export.csv') {
    const headers = ['Company', 'Tenant Code', 'Project', 'Project ID', 'Location', 'Units', 'Pending pricing'];
    const data = rows.map((r) => [
        escapeCsv(r.company.name),
        escapeCsv(r.company.tenantCode),
        escapeCsv(r.project.project_name),
        escapeCsv(r.project.project_id),
        escapeCsv(r.project.location),
        escapeCsv(r.units),
        escapeCsv(r.pending),
    ]);
    const csv = [headers.join(','), ...data.map((r) => r.join(','))].join('\r\n');
    triggerDownload(`\uFEFF${csv}`, filename);
}

function triggerDownload(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/** Excel-compatible HTML table export (opens in Microsoft Excel without extra deps). */
export function downloadInventoryExcel(
    units: InventoryUnit[],
    projectName: (projectSlug: string) => string,
    filename = 'inventory-export.xls',
) {
    const esc = (v: string | number) =>
        String(v ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    const header = ['Unit ID', 'Unit Number', 'Project', 'Type', 'Configuration', 'Size', 'Price', 'Status', 'Locked'];
    const body = units
        .map(
            (u) =>
                `<tr>${[
                    esc(u.unit_id),
                    esc(u.unit_number),
                    esc(projectName(u.projectSlug)),
                    esc(u.unit_type),
                    esc(u.configuration),
                    esc(u.unit_size),
                    esc(u.price),
                    esc(u.availability_status),
                    esc(u.inventory_lock_status ? 'Yes' : 'No'),
                ]
                    .map((c) => `<td>${c}</td>`)
                    .join('')}</tr>`,
        )
        .join('');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${header.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
