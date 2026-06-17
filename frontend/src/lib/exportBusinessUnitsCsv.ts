import type { BusinessUnit } from '@/data/mockData';

function csvEscape(v: string) {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

export function downloadBusinessUnitsCsv(rows: BusinessUnit[], filename = 'business-units-export.csv') {
    const headers = [
        'id',
        'name',
        'code',
        'parentOrganizationId',
        'parentOrganizationName',
        'defaultProjectScope',
        'createdDate',
        'status',
    ];
    const lines = [
        headers.join(','),
        ...rows.map((r) =>
            [
                r.id,
                r.name,
                r.code,
                r.parentOrganizationId,
                r.parentOrganizationName,
                r.defaultProjectScope.join(';'),
                r.createdDate,
                r.status,
            ]
                .map((c) => csvEscape(String(c)))
                .join(','),
        ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function openBusinessUnitsPrintReport(rows: BusinessUnit[], title: string) {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const body = `
    <html><head><title>${csvEscape(title)}</title></head><body style="font-family:system-ui;padding:24px;">
    <h1 style="font-size:18px;margin:0 0 12px;">${csvEscape(title)}</h1>
    <p style="color:#64748b;font-size:13px;margin:0 0 16px;">${rows.length} record(s)</p>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:12px;">
    <thead><tr>
      <th align="left">Name</th><th>Code</th><th>Parent</th><th>Scope</th><th>Status</th><th>Created</th>
    </tr></thead><tbody>
    ${rows
        .map(
            (r) =>
                `<tr><td>${csvEscape(r.name)}</td><td>${csvEscape(r.code)}</td><td>${csvEscape(r.parentOrganizationName)}</td><td>${csvEscape(r.defaultProjectScope.join(', '))}</td><td>${r.status}</td><td>${csvEscape(r.createdDate)}</td></tr>`,
        )
        .join('')}
    </tbody></table>
    </body></html>`;
    w.document.write(body);
    w.document.close();
    w.focus();
    w.print();
}
