import { getPaymentLinkBookingParty, type PaymentLinkRecord } from '@/lib/bookingPaymentMockStore';

function escapeCell(v: string): string {
    if (v.includes('"') || v.includes(',') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
    return v;
}

export function downloadPaymentLinksCsv(rows: PaymentLinkRecord[], filename = 'payment-links-export.csv'): void {
    const header = ['Link ID', 'Booking ID', 'Customer', 'Lead', 'Amount', 'Purpose', 'Expiry', 'Status', 'Send via', 'URL'];
    const lines = [header.join(',')];
    for (const l of rows) {
        const party = getPaymentLinkBookingParty(l.bookingSlug);
        lines.push(
            [
                escapeCell(l.slug),
                escapeCell(l.bookingSlug),
                escapeCell(party.customerName),
                escapeCell(party.leadSummary),
                String(l.amount),
                escapeCell(l.purpose),
                escapeCell(l.expiryDate),
                escapeCell(l.linkStatus),
                escapeCell(l.sendVia ?? 'Email & SMS'),
                escapeCell(l.url),
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
