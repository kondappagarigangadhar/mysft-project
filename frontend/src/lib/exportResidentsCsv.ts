import type { Resident } from '@/lib/residentStore';

function csvEscape(v: string) {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

export function downloadResidentsCsv(rows: Resident[], filename = 'residents-export.csv') {
    const headers = [
        'residentCode',
        'fullName',
        'residentType',
        'phoneNumber',
        'email',
        'propertyUnit',
        'moveInDate',
        'residentStatus',
        'userRole',
        'portalAccessEnabled',
        'accessExpiryDate',
        'createdAt',
        'updatedAt',
    ];
    const lines = [
        headers.join(','),
        ...rows.map((r) =>
            [
                r.residentCode,
                r.fullName,
                r.residentType,
                r.phoneNumber,
                r.email,
                r.propertyUnit,
                r.moveInDate,
                r.residentStatus,
                r.userRole,
                r.portalAccessEnabled ? 'Yes' : 'No',
                r.accessExpiryDate,
                r.createdAt,
                r.updatedAt,
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

export function openResidentsPrintReport(rows: Resident[], title: string) {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const body = `
    <html><head><title>${csvEscape(title)}</title></head><body style="font-family:system-ui;padding:24px;">
    <h1 style="font-size:18px;margin:0 0 12px;">${csvEscape(title)}</h1>
    <p style="color:#64748b;font-size:13px;margin:0 0 16px;">${rows.length} record(s)</p>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:11px;">
    <thead><tr>
      <th align="left">Resident ID</th><th>Name</th><th>Type</th><th>Phone</th><th>Email</th><th>Unit</th><th>Move-in</th><th>Status</th><th>Role</th><th>Portal</th><th>Access expiry</th>
    </tr></thead><tbody>
    ${rows
        .map(
            (r) =>
                `<tr><td>${csvEscape(r.residentCode)}</td><td>${csvEscape(r.fullName)}</td><td>${csvEscape(r.residentType)}</td><td>${csvEscape(
                    r.phoneNumber,
                )}</td><td>${csvEscape(r.email)}</td><td>${csvEscape(r.propertyUnit)}</td><td>${csvEscape(r.moveInDate)}</td><td>${csvEscape(
                    r.residentStatus,
                )}</td><td>${csvEscape(r.userRole)}</td><td>${r.portalAccessEnabled ? 'Yes' : 'No'}</td><td>${csvEscape(r.accessExpiryDate)}</td></tr>`,
        )
        .join('')}
    </tbody></table>
    </body></html>`;
    w.document.write(body);
    w.document.close();
    w.focus();
    w.print();
}
