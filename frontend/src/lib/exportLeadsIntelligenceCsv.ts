import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';

function escapeCell(v: string): string {
    if (v.includes('"') || v.includes(',') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
    return v;
}

export function downloadLeadsIntelligenceCsv(rows: IntelligenceLead[], filename = 'leads-intelligence-export.csv'): void {
    const header = [
        'Lead Name',
        'Phone',
        'Email',
        'Source',
        'Project',
        'Lead Score',
        'Status',
        'Assigned To',
        'Present Address',
        'Permanent Address',
        'Temperature',
        'Conversion %',
        'Engagement',
        'Follow-up Risk',
        'Next Action',
        'Best Time',
        'Visit Recommended',
        'Created',
        'Lead Slug',
    ];
    const lines = [header.join(',')];
    for (const l of rows) {
        lines.push(
            [
                escapeCell(l.name),
                escapeCell(l.phone),
                escapeCell(l.email),
                escapeCell(l.source),
                escapeCell(l.projectInterest ?? ''),
                String(l.leadScore),
                escapeCell(l.status),
                escapeCell(l.assignedTo),
                escapeCell(l.presentAddress ?? ''),
                escapeCell(l.permanentAddress ?? ''),
                escapeCell(l.temperature),
                String(l.conversionProbability),
                String(l.engagementScore),
                escapeCell(l.followUpRisk),
                escapeCell(l.nextAction ?? ''),
                escapeCell(l.bestCallTimeLabel ?? ''),
                l.visitRecommendation ? 'Yes' : 'No',
                escapeCell(l.createdAt),
                escapeCell(l.leadSlug),
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
