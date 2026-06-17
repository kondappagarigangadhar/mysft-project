import type { ESignRecord } from '@/lib/complianceDocumentsMockStore';

function escapeCell(v: string): string {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

export function downloadComplianceEsignCsv(rows: ESignRecord[], filename = 'esign-export.csv'): void {
    const headers = [
        'Document ID',
        'Document',
        'Signer',
        'Aadhaar',
        'Transaction ID',
        'Status',
        'Created',
        'Signed at',
        'Signed file URL',
    ];
    const lines = [headers.join(',')];
    for (const r of rows) {
        lines.push(
            [
                escapeCell(r.documentId),
                escapeCell(r.documentName),
                escapeCell(r.signerName),
                escapeCell(r.aadhaarMasked),
                escapeCell(r.transactionId),
                escapeCell(r.status),
                escapeCell(r.createdAt.slice(0, 10)),
                escapeCell(r.signedAt ?? ''),
                escapeCell(r.signedStorageUrl ?? ''),
            ].join(','),
        );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
