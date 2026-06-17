import type { PaymentLedgerRow } from '@/lib/bookingPaymentMockStore';
import { getBookingBySlug, getPaymentTransactionId } from '@/lib/bookingPaymentMockStore';

function escapeCell(v: string): string {
    if (v.includes('"') || v.includes(',') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
    return v;
}

/**
 * Invoice-oriented export: enriches each row with booking customer / project / unit when available.
 */
export function downloadPaymentInvoicesCsv(rows: PaymentLedgerRow[], filename = 'payment-invoices-export.csv'): void {
    const header = [
        'Invoice / Receipt #',
        'Payment ID',
        'Transaction ID',
        'Customer',
        'Project',
        'Unit',
        'Booking ID',
        'Milestone',
        'Amount (INR)',
        'Date',
        'Mode',
        'Status',
    ];
    const lines = [header.join(',')];
    for (const p of rows) {
        const b = getBookingBySlug(p.bookingSlug);
        lines.push(
            [
                escapeCell(p.receiptNumber),
                escapeCell(p.slug),
                escapeCell(getPaymentTransactionId(p)),
                escapeCell(b?.customerName ?? ''),
                escapeCell(b?.projectName ?? ''),
                escapeCell(b?.unitId ?? ''),
                escapeCell(p.bookingSlug),
                escapeCell(p.milestoneName),
                String(p.amount),
                escapeCell(p.date),
                escapeCell(p.mode),
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
