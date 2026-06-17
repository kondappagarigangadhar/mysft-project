import type { Lead } from '@/lib/leadStore';
import { formatLeadCode } from '@/lib/leadStore';

export function downloadLeadsCsv(leads: Lead[], filename = 'leads-export.csv') {
    const headers = [
        'Lead ID',
        'Lead Name',
        'Email',
        'Phone Number',
        'Lead Source',
        'Project Interest',
        'Budget Range',
        'Preferred Unit Type',
        'Lead Status',
        'Assigned To',
        'Present Address',
        'Permanent Address',
        'Lead Score',
        'Created Date',
    ];
    const rows = leads.map((l) => [
        formatLeadCode(l.id),
        escapeCsv(l.name),
        escapeCsv(l.email),
        escapeCsv(l.phone),
        escapeCsv(l.source),
        escapeCsv(l.project),
        escapeCsv(l.budgetRange),
        escapeCsv(l.preferredUnitType),
        escapeCsv(l.status),
        escapeCsv(l.assignedTo),
        escapeCsv(l.presentAddress ?? ''),
        escapeCsv(l.permanentAddress ?? ''),
        String(typeof l.leadScore === 'number' ? l.leadScore : ''),
        escapeCsv(l.createdDate),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function escapeCsv(value: string) {
    const s = value ?? '';
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}
