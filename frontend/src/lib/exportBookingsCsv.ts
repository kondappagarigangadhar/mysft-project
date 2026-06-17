import type { BookingRecord } from '@/lib/bookingPaymentMockStore';

function escapeCell(v: string): string {
    if (v.includes('"') || v.includes(',') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
    return v;
}

export function downloadBookingsCsv(rows: BookingRecord[], filename = 'bookings-export.csv'): void {
    const header = [
        'Booking ID',
        'Lead ID',
        'Assigned To',
        'Customer',
        'Phone',
        'Project',
        'Unit ID',
        'Configuration (BHK)',
        'Unit Price',
        'Booking Date',
        'Status',
        'Deal mode',
    ];
    const lines = [header.join(',')];
    for (const b of rows) {
        lines.push(
            [
                escapeCell(b.slug),
                escapeCell(b.leadId),
                escapeCell(b.assignedTo),
                escapeCell(b.customerName),
                escapeCell(b.phone),
                escapeCell(b.projectName),
                escapeCell(b.unitId),
                escapeCell(b.unitConfiguration ?? ''),
                String(b.unitPrice),
                escapeCell(b.bookingDate.slice(0, 10)),
                escapeCell(b.status),
                escapeCell(b.dealPaymentMode ?? 'milestone'),
            ].join(',')
        );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
