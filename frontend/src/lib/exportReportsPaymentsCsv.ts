import type { PaymentRecord } from '@/lib/bookingPaymentMockStore';

function escapeCell(v: string): string {
    if (v.includes('"') || v.includes(',') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
    return v;
}

export function downloadReportsPaymentsCsv(
    rows: PaymentRecord[],
    filename = 'reports-payments-export.csv',
): void {
    const header = ['Payment ID', 'Booking ID', 'Date', 'Amount', 'Mode', 'Receipt #', 'Status', 'Source'];
    const lines = [header.join(',')];
    for (const p of rows) {
        lines.push(
            [
                escapeCell(p.slug),
                escapeCell(p.bookingSlug),
                escapeCell(p.date),
                String(p.amount),
                escapeCell(p.mode),
                escapeCell(p.receiptNumber),
                escapeCell(p.status),
                escapeCell(p.source),
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
