import type { HistoryLogEntry } from '@/lib/historyLogs/types';
import { formatHistoryExactLong } from '@/lib/historyLogs/historyTime';
import { MODULE_LABEL } from '@/lib/historyLogs/mockHistoryLogs';
import { getBeforeAfterForEntry } from '@/lib/historyLogs/beforeAfter';

function escapeCsvField(s: string): string {
    if (/[",\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function rowToCsv(e: HistoryLogEntry): string {
    const { before, after } = getBeforeAfterForEntry(e);
    const fields = [
        e.id,
        formatHistoryExactLong(e.at),
        e.user.name,
        e.user.role ?? '',
        MODULE_LABEL[e.module],
        e.recordId,
        e.recordLabel,
        e.action,
        e.actionType,
        e.severity,
        before,
        after,
        (e.changes ?? '').replace(/\n/g, ' '),
    ];
    return fields.map((x) => escapeCsvField(String(x))).join(',');
}

const CSV_HEADER = [
    'id',
    'timestamp',
    'user',
    'role',
    'module',
    'recordId',
    'record',
    'action',
    'actionType',
    'severity',
    'before',
    'after',
    'changes',
].join(',');

export function downloadHistoryLogsCsv(logs: HistoryLogEntry[], filename: string) {
    const body = [CSV_HEADER, ...logs.map(rowToCsv)].join('\r\n');
    const blob = new Blob(['\uFEFF' + body], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/** Opens in Excel; HTML table, no extra deps. */
export function downloadHistoryLogsExcelHtml(logs: HistoryLogEntry[], baseName: string) {
    const rows = logs
        .map((e) => {
            const { before, after } = getBeforeAfterForEntry(e);
            return `<tr>
<td>${esc(e.id)}</td>
<td>${esc(formatHistoryExactLong(e.at))}</td>
<td>${esc(e.user.name)}</td>
<td>${esc(e.user.role ?? '')}</td>
<td>${esc(MODULE_LABEL[e.module])}</td>
<td>${esc(e.recordId)}</td>
<td>${esc(e.recordLabel)}</td>
<td>${esc(e.action)}</td>
<td>${esc(e.actionType)}</td>
<td>${esc(before)}</td>
<td>${esc(after)}</td>
<td>${esc(e.changes ?? '')}</td>
</tr>`;
        })
        .join('\n');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body><table border="1">
<thead><tr>
<th>id</th><th>Timestamp</th><th>User</th><th>Role</th><th>Module</th><th>Record ID</th><th>Record</th>
<th>Action</th><th>Action type</th><th>Before</th><th>After</th><th>Changes</th>
</tr></thead>
<tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const name = baseName.replace(/\.(xls|html)?$/i, '') + '.xls';
    triggerDownload(blob, name);
}

function esc(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4_000);
}

/** Simple print / PDF (browser print dialog) — same idea as Leads “PDF / Print”. */
export function openHistoryLogsPrintReport(logs: HistoryLogEntry[], reportTitle: string) {
    if (typeof window === 'undefined' || logs.length === 0) return;
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const rows = logs
        .map((e) => {
            const { before, after } = getBeforeAfterForEntry(e);
            return `<tr>
<td>${esc(e.id)}</td>
<td>${esc(formatHistoryExactLong(e.at))}</td>
<td>${esc(e.user.name)}</td>
<td>${esc(MODULE_LABEL[e.module])}</td>
<td>${esc(e.recordLabel)}</td>
<td>${esc(e.action)}</td>
<td>${esc(before)}</td>
<td>${esc(after)}</td>
</tr>`;
        })
        .join('');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(reportTitle)}</title>
<style>body{font-family:system-ui,sans-serif;padding:16px;color:#0f172a}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}th{background:#f8fafc}</style></head>
<body><h1 style="font-size:18px;margin:0 0 12px">${esc(reportTitle)}</h1>
<p style="color:#64748b;font-size:12px;margin:0 0 16px">${logs.length} row(s)</p>
<table><thead><tr>
<th>ID</th><th>Time</th><th>User</th><th>Module</th><th>Record</th><th>Action</th><th>Before</th><th>After</th>
</tr></thead><tbody>${rows}</tbody></table>
<script>window.onload=function(){window.print()}</script>
</body></html>`);
    w.document.close();
}
