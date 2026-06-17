import type { User } from '@/data/mockData';
import { enrichUserRecord, permissionLabel } from '@/lib/userPermissions';

function csvEscape(v: string) {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

export function downloadUsersCsv(rows: User[], filename = 'users-export.csv') {
    const enriched = rows.map(enrichUserRecord);
    const headers = [
        'firstName',
        'lastName',
        'email',
        'phoneNumber',
        'designation',
        'role',
        'department',
        'status',
        'roleName',
        'roleDescription',
        'permissions',
    ];
    const lines = [
        headers.join(','),
        ...enriched.map((r) =>
            [
                r.firstName,
                r.lastName,
                r.email,
                r.phoneNumber,
                r.designation,
                r.role,
                r.department,
                r.status,
                r.roleName ?? r.role,
                r.roleDescription ?? '',
                (r.permissions ?? []).map(permissionLabel).join('; '),
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

export function openUsersPrintReport(rows: User[], title: string) {
    const enriched = rows.map(enrichUserRecord);
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const body = `
    <html><head><title>${csvEscape(title)}</title></head><body style="font-family:system-ui;padding:24px;">
    <h1 style="font-size:18px;margin:0 0 12px;">${csvEscape(title)}</h1>
    <p style="color:#64748b;font-size:13px;margin:0 0 16px;">${enriched.length} record(s)</p>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:11px;">
    <thead><tr>
      <th>First Name</th><th>Last Name</th><th>Email</th><th>Phone</th><th>Designation</th><th>Role</th><th>Department</th><th>Status</th><th>Role Name</th><th>Permissions</th>
    </tr></thead><tbody>
    ${enriched
        .map(
            (r) =>
                `<tr><td>${csvEscape(r.firstName)}</td><td>${csvEscape(r.lastName)}</td><td>${csvEscape(r.email)}</td><td>${csvEscape(r.phoneNumber)}</td><td>${csvEscape(r.designation)}</td><td>${csvEscape(r.role)}</td><td>${csvEscape(r.department)}</td><td>${r.status}</td><td>${csvEscape(r.roleName ?? r.role)}</td><td>${csvEscape((r.permissions ?? []).map(permissionLabel).join(', '))}</td></tr>`,
        )
        .join('')}
    </tbody></table>
    </body></html>`;
    w.document.write(body);
    w.document.close();
    w.focus();
    w.print();
}
