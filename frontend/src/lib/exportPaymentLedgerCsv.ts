import type { PaymentLedgerRow } from '@/lib/bookingPaymentMockStore';
import { getPaymentTransactionId } from '@/lib/bookingPaymentMockStore';

function escapeCell(v: string): string {
    if (v.includes('"') || v.includes(',') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
    return v;
}

export function downloadPaymentLedgerCsv(rows: PaymentLedgerRow[], filename = 'payment-ledger-export.csv'): void {
    const header = ['Payment ID', 'Transaction ID', 'Booking ID', 'Amount', 'Date', 'Mode', 'Receipt #', 'Status'];
    const lines = [header.join(',')];
    for (const p of rows) {
        lines.push(
            [
                escapeCell(p.slug),
                escapeCell(getPaymentTransactionId(p)),
                escapeCell(p.bookingSlug),
                String(p.amount),
                escapeCell(p.date),
                escapeCell(p.mode),
                escapeCell(p.receiptNumber),
                escapeCell(p.status),
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
