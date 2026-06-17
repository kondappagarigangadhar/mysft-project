import type { BookingRecord, PaymentRecord } from '@/lib/bookingPaymentMockStore';
import { getPaymentTransactionId } from '@/lib/bookingPaymentMockStore';

function esc(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Opens a printable receipt (browser Print → Save as PDF). */
export function openBookingPaymentReceiptPrint(payment: PaymentRecord, booking: BookingRecord | null) {
    if (typeof window === 'undefined') return;
    const w = window.open('', '_blank');
    if (!w) return;

    const customer = booking?.customerName ?? '—';
    const project = booking?.projectName ?? '—';
    const unit = booking?.unitId ?? '—';
    const txn = getPaymentTransactionId(payment);
    const paid =
        payment.status === 'Completed'
            ? `₹${payment.amount.toLocaleString('en-IN')}`
            : payment.receiptGeneratedAt
              ? `₹${payment.amount.toLocaleString('en-IN')} (provisional)`
              : '—';

    w.document.write(`<!DOCTYPE html><html><head><title>${esc(`Receipt ${payment.receiptNumber}`)}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:28px;color:#0f172a;max-width:720px;margin:0 auto}
      h1{font-size:20px;margin:0 0 4px}
      .muted{color:#64748b;font-size:12px;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;font-size:13px;margin-top:12px}
      th,td{border:1px solid #e2e8f0;padding:10px 12px;text-align:left}
      th{background:#f8fafc;width:34%;font-weight:600}
      .brand{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#475569;margin-bottom:16px}
    </style></head><body>
    <p class="brand">mySFT · Payment receipt</p>
    <h1>Receipt ${esc(payment.receiptNumber)}</h1>
    <p class="muted">Generated for print / PDF · ${esc(new Date().toISOString().slice(0, 10))}</p>
    <table>
      <tbody>
        <tr><th>Customer</th><td>${esc(customer)}</td></tr>
        <tr><th>Project</th><td>${esc(project)}</td></tr>
        <tr><th>Unit</th><td>${esc(unit)}</td></tr>
        <tr><th>Booking ID</th><td>${esc(payment.bookingSlug)}</td></tr>
        <tr><th>Payment ID</th><td>${esc(payment.slug)}</td></tr>
        <tr><th>Transaction ID</th><td>${esc(txn)}</td></tr>
        <tr><th>Date</th><td>${esc(payment.date)}</td></tr>
        <tr><th>Mode</th><td>${esc(payment.mode)}</td></tr>
        <tr><th>Status</th><td>${esc(payment.status)}</td></tr>
        <tr><th>Amount</th><td><strong>${esc(paid)}</strong></td></tr>
      </tbody>
    </table>
    <p style="margin-top:24px;font-size:11px;color:#64748b">Use your browser’s Print dialog and choose “Save as PDF” to download.</p>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
}
