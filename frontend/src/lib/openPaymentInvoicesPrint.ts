import type { PaymentLedgerRow } from '@/lib/bookingPaymentMockStore';
import { getBookingBySlug, getPaymentTransactionId } from '@/lib/bookingPaymentMockStore';

function esc(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Printable invoice list for the current ledger filter (Print → Save as PDF). */
export function openPaymentInvoicesPrint(rows: PaymentLedgerRow[], title = 'Payment invoices') {
    if (typeof window === 'undefined') return;
    const w = window.open('', '_blank');
    if (!w) return;

    const body = rows
        .map((p) => {
            const b = getBookingBySlug(p.bookingSlug);
            return `<tr>
        <td>${esc(p.receiptNumber)}</td>
        <td>${esc(b?.customerName ?? '')}</td>
        <td>${esc(b?.projectName ?? '')}</td>
        <td>${esc(p.bookingSlug)}</td>
        <td>${esc(p.milestoneName)}</td>
        <td class="num">${p.amount.toLocaleString('en-IN')}</td>
        <td>${esc(p.date)}</td>
        <td>${esc(p.status)}</td>
        <td>${esc(getPaymentTransactionId(p))}</td>
      </tr>`;
        })
        .join('');

    w.document.write(`<!DOCTYPE html><html><head><title>${esc(title)}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a}
      h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{border:1px solid #e2e8f0;padding:7px 8px;text-align:left}
      th{background:#f8fafc;font-weight:600}
      .num{text-align:right;font-variant-numeric:tabular-nums}
    </style></head><body>
    <h1>${esc(title)}</h1>
    <table><thead><tr>
      <th>Receipt #</th><th>Customer</th><th>Project</th><th>Booking</th><th>Milestone</th>
      <th class="num">Amount (INR)</th><th>Date</th><th>Status</th><th>Transaction</th>
    </tr></thead><tbody>${body}</tbody></table>
    <p style="margin-top:16px;font-size:11px;color:#64748b">mySFT · Use Print → Save as PDF</p>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
}
