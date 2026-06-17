import type { ServiceMaintenanceTicket } from '@/lib/serviceMaintenanceStore';
import { computeRemainingSlaLabel } from '@/lib/serviceMaintenanceStore';

function csvEscape(v: string) {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

export function downloadServiceMaintenanceCsv(rows: ServiceMaintenanceTicket[], filename = 'service-tickets-export.csv') {
    const headers = [
        'ticketCode',
        'requestTitle',
        'issueCategory',
        'priorityLevel',
        'locationUnit',
        'preferredVisitTime',
        'ticketStatus',
        'slaStatus',
        'assignedVendor',
        'remainingSla',
        'sourceChannel',
        'createdAt',
        'updatedAt',
    ];
    const lines = [
        headers.join(','),
        ...rows.map((r) =>
            [
                r.ticketCode,
                r.requestTitle,
                r.issueCategory,
                r.priorityLevel,
                r.locationUnit,
                r.preferredVisitTime,
                r.ticketStatus,
                r.slaStatus,
                r.assignedVendor,
                computeRemainingSlaLabel(r.slaDueAt, r.ticketStatus),
                r.sourceChannel,
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

export function openServiceMaintenancePrintReport(rows: ServiceMaintenanceTicket[], title: string) {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const body = `
    <html><head><title>${csvEscape(title)}</title></head><body style="font-family:system-ui;padding:24px;">
    <h1 style="font-size:18px;margin:0 0 12px;">${csvEscape(title)}</h1>
    <p style="color:#64748b;font-size:13px;margin:0 0 16px;">${rows.length} record(s)</p>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:11px;">
    <thead><tr>
      <th align="left">Ticket ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Unit</th><th>Status</th><th>SLA</th><th>Vendor</th><th>Remaining SLA</th>
    </tr></thead><tbody>
    ${rows
        .map(
            (r) =>
                `<tr><td>${csvEscape(r.ticketCode)}</td><td>${csvEscape(r.requestTitle)}</td><td>${csvEscape(r.issueCategory)}</td><td>${csvEscape(
                    r.priorityLevel,
                )}</td><td>${csvEscape(r.locationUnit)}</td><td>${csvEscape(r.ticketStatus)}</td><td>${csvEscape(r.slaStatus)}</td><td>${csvEscape(
                    r.assignedVendor,
                )}</td><td>${csvEscape(computeRemainingSlaLabel(r.slaDueAt, r.ticketStatus))}</td></tr>`,
        )
        .join('')}
    </tbody></table>
    </body></html>`;
    w.document.write(body);
    w.document.close();
    w.focus();
    w.print();
}
