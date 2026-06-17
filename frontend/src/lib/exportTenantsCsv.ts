import type { Company } from '@/data/mockData';

function csvEscape(v: string) {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

export function downloadTenantsCsv(rows: Company[], filename = 'tenants-export.csv') {
    const headers = [
        'id',
        'tenantCode',
        'name',
        'plan',
        'status',
        'businessType',
        'usersCount',
        'city',
        'state',
        'email',
        'phone',
        'createdAt',
        'revenue',
    ];
    const lines = [
        headers.join(','),
        ...rows.map((r) =>
            [
                r.id,
                r.tenantCode,
                r.name,
                r.plan,
                r.status,
                r.businessType,
                r.usersCount,
                r.city,
                r.state,
                r.email,
                r.phone,
                r.createdAt,
                r.revenue,
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

export function openTenantsPrintReport(rows: Company[], title: string) {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const body = `
    <html><head><title>${title}</title></head><body style="font-family:system-ui;padding:24px;">
    <h1 style="font-size:18px;margin:0 0 12px;">${title}</h1>
    <p style="color:#64748b;font-size:13px;margin:0 0 16px;">${rows.length} record(s)</p>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:12px;">
    <thead><tr>
      <th align="left">Company</th><th>Plan</th><th>Status</th><th>Type</th><th>Users</th><th>Location</th><th>Created</th>
    </tr></thead><tbody>
    ${rows
        .map(
            (r) =>
                `<tr><td>${csvEscape(r.name)}</td><td>${r.plan}</td><td>${r.status}</td><td>${r.businessType}</td><td>${r.usersCount}</td><td>${csvEscape(`${r.city}, ${r.state}`)}</td><td>${r.createdAt}</td></tr>`,
        )
        .join('')}
    </tbody></table>
    </body></html>`;
    w.document.write(body);
    w.document.close();
    w.focus();
    w.print();
}
