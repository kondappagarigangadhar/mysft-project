import type { Invoice } from '@/lib/invoiceStore';

/**
 * Downloads invoice rows as a UTF-8 BOM CSV (Excel-friendly).
 * Columns mirror the enterprise list table 1:1.
 */
export function downloadInvoicesCsv(invoices: Invoice[], filename = 'invoices-export.csv') {
    const headers = [
        'Invoice ID',
        'Invoice Number',
        'Company Name',
        'Counterparty Type',
        'Vendor / Supplier',
        'Project Name',
        'Linked Work Order',
        'Linked Purchase Order',
        'Linked Payment',
        'Invoice Date',
        'Due Date',
        'Currency',
        'Invoice Amount',
        'Tax Amount',
        'Total Amount',
        'Paid Amount',
        'Balance Amount',
        'Validation Status',
        'Payment Status',
        'Export Status',
        'Assigned Finance User',
        'Last Updated',
    ];

    const rows = invoices.map((inv) => [
        escapeCsv(inv.invoiceId),
        escapeCsv(inv.invoiceNumber),
        escapeCsv(inv.companyName),
        escapeCsv(inv.partyType),
        escapeCsv(inv.partyName),
        escapeCsv(inv.linkedProject),
        escapeCsv(inv.linkedWorkOrderId),
        escapeCsv(inv.linkedPurchaseOrder),
        escapeCsv(inv.linkedPaymentId),
        escapeCsv(inv.invoiceDate),
        escapeCsv(inv.dueDate),
        escapeCsv(inv.currency),
        String(inv.invoiceAmount ?? 0),
        String(inv.taxAmount ?? 0),
        String(inv.totalAmount ?? 0),
        String(inv.paidAmount ?? 0),
        String(inv.balanceAmount ?? 0),
        escapeCsv(inv.validation?.status ?? ''),
        escapeCsv(inv.paymentStatus),
        escapeCsv(inv.exportStatus),
        escapeCsv(inv.assignedFinanceUser),
        escapeCsv(inv.updatedAt),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function escapeCsv(value: string) {
    const s = value ?? '';
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}
