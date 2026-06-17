import type { BookingRecord } from '@/lib/bookingPaymentMockStore';

function escapeCell(v: string): string {
    if (v.includes('"') || v.includes(',') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
    return v;
}

export function downloadPaymentsBookingListCsv(
    rows: (BookingRecord & { paidCompleted: number })[],
    filename = 'payments-bookings-export.csv',
): void {
    const header = ['Booking ID', 'Customer', 'Project', 'Unit', 'Booked', 'Status', 'Paid (completed)'];
    const lines = [header.join(',')];
    for (const b of rows) {
        lines.push(
            [
                escapeCell(b.slug),
                escapeCell(b.customerName),
                escapeCell(b.projectName),
                escapeCell(b.unitId),
                escapeCell(b.bookingDate.slice(0, 10)),
                escapeCell(b.status),
                String(b.paidCompleted),
            ].join(','),
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
