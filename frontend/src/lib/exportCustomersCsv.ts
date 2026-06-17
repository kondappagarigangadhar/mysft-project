import type { Customer } from '@/lib/customersStore';

function csvEscape(v: string) {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

export function downloadCustomersCsv(rows: Customer[], filename = 'customers-export.csv') {
    const headers = [
        'customerCode',
        'fullName',
        'bookingId',
        'projectName',
        'unitNumber',
        'bookingStatus',
        'totalAmount',
        'paidAmount',
        'pendingAmount',
        'paymentStatus',
        'assignedExecutive',
        'lastPaymentDate',
        'customerStatus',
        'phone',
        'email',
        'leadId',
        'leadSource',
    ];
    const lines = [
        headers.join(','),
        ...rows.map((c) =>
            [
                c.customerCode,
                c.fullName,
                c.bookingId,
                c.projectName,
                c.unitNumber,
                c.bookingStatus,
                c.totalAmount,
                c.paidAmount,
                c.pendingAmount,
                c.paymentStatus,
                c.assignedExecutive,
                c.lastPaymentDate,
                c.customerStatus,
                c.phone,
                c.email,
                c.leadId,
                c.leadSource,
            ]
                .map((v) => csvEscape(String(v)))
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

export function openCustomersPrintReport(rows: Customer[], title: string) {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
    const body = `
    <html><head><title>${csvEscape(title)}</title></head><body style="font-family:system-ui;padding:24px;">
    <h1 style="font-size:18px;margin:0 0 12px;">${csvEscape(title)}</h1>
    <p style="color:#64748b;font-size:13px;margin:0 0 16px;">${rows.length} record(s)</p>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:11px;">
    <thead><tr>
      <th>Customer</th><th>Booking</th><th>Project</th><th>Unit</th><th>Status</th><th>Total</th><th>Paid</th><th>Pending</th><th>Executive</th>
    </tr></thead><tbody>
    ${rows
        .map(
            (c) =>
                `<tr><td>${csvEscape(c.fullName)}</td><td>${csvEscape(c.bookingId)}</td><td>${csvEscape(c.projectName)}</td><td>${csvEscape(
                    c.unitNumber,
                )}</td><td>${csvEscape(c.bookingStatus)}</td><td>${fmt(c.totalAmount)}</td><td>${fmt(c.paidAmount)}</td><td>${fmt(
                    c.pendingAmount,
                )}</td><td>${csvEscape(c.assignedExecutive)}</td></tr>`,
        )
        .join('')}
    </tbody></table>
    </body></html>`;
    w.document.write(body);
    w.document.close();
    w.focus();
    w.print();
}
