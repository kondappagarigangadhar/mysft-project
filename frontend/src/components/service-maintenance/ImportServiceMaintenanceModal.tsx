'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
    addServiceMaintenanceTicket,
    ISSUE_CATEGORY_OPTIONS,
    PRIORITY_LEVEL_OPTIONS,
    SERVICE_LOCATION_UNIT_OPTIONS,
    SOURCE_CHANNEL_OPTIONS,
    TICKET_STATUS_OPTIONS,
    type IssueCategory,
    type PriorityLevel,
    type SourceChannel,
    type TicketStatus,
} from '@/lib/serviceMaintenanceStore';
import { serviceMaintenanceViewHref } from '@/lib/serviceMaintenanceRoutes';
import { LuDownload } from 'react-icons/lu';

const SAMPLE_CSV = `Request Title,Issue Category,Priority,Location Unit,Preferred Visit,Status,Source Channel,Description
Water heater noise,Plumbing,High,Riverfront Tower — Unit 1204,2026-05-22T10:00,Open,Portal,Resident reports rumbling from heater closet`;

type ParsedRow = {
    requestTitle: string;
    issueCategory: string;
    priorityLevel: string;
    locationUnit: string;
    preferredVisitTime: string;
    ticketStatus: string;
    sourceChannel: string;
    description: string;
};

function parseCsv(text: string): ParsedRow[] {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
    const idx = (name: string) => header.findIndex((h) => h.replace(/\s+/g, ' ') === name.toLowerCase());

    const iTitle = idx('request title');
    const iCat = idx('issue category');
    const iPri = idx('priority');
    const iUnit = idx('location unit');
    const iVisit = idx('preferred visit');
    const iStatus = idx('status');
    const iSource = idx('source channel');
    const iDesc = idx('description');

    if (iTitle < 0) return [];

    const rows: ParsedRow[] = [];
    for (let r = 1; r < lines.length; r++) {
        const cells = lines[r]!.split(',').map((c) => c.trim());
        rows.push({
            requestTitle: cells[iTitle] ?? '',
            issueCategory: iCat >= 0 ? cells[iCat] ?? 'General' : 'General',
            priorityLevel: iPri >= 0 ? cells[iPri] ?? 'Medium' : 'Medium',
            locationUnit: iUnit >= 0 ? cells[iUnit] ?? SERVICE_LOCATION_UNIT_OPTIONS[0]! : SERVICE_LOCATION_UNIT_OPTIONS[0]!,
            preferredVisitTime: iVisit >= 0 ? cells[iVisit] ?? new Date().toISOString() : new Date().toISOString(),
            ticketStatus: iStatus >= 0 ? cells[iStatus] ?? 'Open' : 'Open',
            sourceChannel: iSource >= 0 ? cells[iSource] ?? 'Manual' : 'Manual',
            description: iDesc >= 0 ? cells[iDesc] ?? '' : '',
        });
    }
    return rows;
}

function mapCategory(v: string): IssueCategory {
    return ISSUE_CATEGORY_OPTIONS.includes(v as IssueCategory) ? (v as IssueCategory) : 'General';
}

function mapPriority(v: string): PriorityLevel {
    return PRIORITY_LEVEL_OPTIONS.includes(v as PriorityLevel) ? (v as PriorityLevel) : 'Medium';
}

function mapStatus(v: string): TicketStatus {
    return TICKET_STATUS_OPTIONS.includes(v as TicketStatus) ? (v as TicketStatus) : 'Open';
}

function mapSource(v: string): SourceChannel {
    return SOURCE_CHANNEL_OPTIONS.includes(v as SourceChannel) ? (v as SourceChannel) : 'Manual';
}

export function ImportServiceMaintenanceModal({
    isOpen,
    onClose,
    onImported,
}: {
    isOpen: boolean;
    onClose: () => void;
    onImported: () => void;
}) {
    const router = useRouter();
    const [text, setText] = useState('');
    const [step, setStep] = useState<'paste' | 'preview'>('paste');
    const [busy, setBusy] = useState(false);

    const parsed = React.useMemo(() => parseCsv(text), [text]);

    const reset = () => {
        setText('');
        setStep('paste');
        setBusy(false);
    };

    const close = () => {
        reset();
        onClose();
    };

    const runImport = () => {
        if (!parsed.length) return;
        setBusy(true);
        try {
            let lastSlug = '';
            for (const row of parsed) {
                if (!row.requestTitle.trim()) continue;
                const created = addServiceMaintenanceTicket({
                    requestTitle: row.requestTitle.trim(),
                    issueCategory: mapCategory(row.issueCategory),
                    priorityLevel: mapPriority(row.priorityLevel),
                    locationUnit: row.locationUnit,
                    preferredVisitTime: row.preferredVisitTime,
                    ticketStatus: mapStatus(row.ticketStatus),
                    sourceChannel: mapSource(row.sourceChannel),
                    description: row.description,
                });
                lastSlug = created.slug;
            }
            onImported();
            close();
            if (lastSlug) router.push(serviceMaintenanceViewHref(lastSlug));
        } finally {
            setBusy(false);
        }
    };

    const downloadSample = () => {
        const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'service-tickets-import-sample.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={close}
            title="Import service tickets"
            footer={
                step === 'paste' ? (
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={close}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={() => setStep('preview')} disabled={parsed.length === 0}>
                            Preview {parsed.length ? `(${parsed.length})` : ''}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setStep('paste')}>
                            Back
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={runImport} isLoading={busy} disabled={!parsed.length}>
                            Import {parsed.length} ticket{parsed.length === 1 ? '' : 's'}
                        </Button>
                    </>
                )
            }
        >
            {step === 'paste' ? (
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Paste CSV with headers: Request Title, Issue Category, Priority, Location Unit, Preferred Visit, Status, Source Channel, Description.</p>
                    <button type="button" onClick={downloadSample} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--cta-button-bg)] hover:underline">
                        <LuDownload size={16} />
                        Download sample CSV
                    </button>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={10}
                        placeholder={SAMPLE_CSV}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            ) : (
                <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2">Title</th>
                                <th className="px-3 py-2">Category</th>
                                <th className="px-3 py-2">Priority</th>
                                <th className="px-3 py-2">Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parsed.map((row, i) => (
                                <tr key={i} className="border-t border-slate-100">
                                    <td className="px-3 py-2 font-medium text-slate-900">{row.requestTitle || '—'}</td>
                                    <td className="px-3 py-2 text-slate-700">{row.issueCategory}</td>
                                    <td className="px-3 py-2 text-slate-700">{row.priorityLevel}</td>
                                    <td className="px-3 py-2 text-slate-700">{row.locationUnit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
}
