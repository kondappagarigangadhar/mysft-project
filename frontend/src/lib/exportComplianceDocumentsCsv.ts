import {
    formatComplianceFileSize,
    getCurrentVersion,
    getPreviousVersion,
    getUploadDateYmd,
    type ComplianceDocumentRecord,
} from '@/lib/complianceDocumentsMockStore';
import { COMPLIANCE_ROLE_LABELS, type ComplianceDemoRole } from '@/lib/complianceRbac';

function escapeCell(v: string): string {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

export function downloadComplianceDocumentsCsv(rows: ComplianceDocumentRecord[], filename = 'documents-export.csv'): void {
    const headers = [
        'Document ID',
        'Document name',
        'Document type',
        'File name',
        'File size',
        'Upload date',
        'Uploaded by',
        'Booking ID',
        'Customer ID',
        'Project ID',
        'Version',
        'Previous version',
        'Access level',
        'Allowed roles',
    ];
    const lines = [headers.join(',')];
    for (const d of rows) {
        const v = getCurrentVersion(d);
        const prev = getPreviousVersion(d);
        const uploadYmd = getUploadDateYmd(d);
        const rolesLabel = d.allowedRoles.map((r) => COMPLIANCE_ROLE_LABELS[r as ComplianceDemoRole]).join('; ');
        const prevLabel = prev ? `v${prev.version} ${prev.fileName}` : '';
        lines.push(
            [
                escapeCell(d.id),
                escapeCell(d.name),
                escapeCell(d.documentType),
                escapeCell(v?.fileName ?? ''),
                escapeCell(v ? formatComplianceFileSize(v.sizeBytes) : ''),
                escapeCell(uploadYmd),
                escapeCell(v?.uploadedBy ?? ''),
                escapeCell(d.bookingId ?? ''),
                escapeCell(d.customerId ?? ''),
                escapeCell(d.projectId ?? ''),
                escapeCell(v?.version != null ? String(v.version) : ''),
                escapeCell(prevLabel),
                escapeCell(d.accessLevel),
                escapeCell(rolesLabel),
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
