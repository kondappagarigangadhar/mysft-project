'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { addLeadFromCoreFields } from '@/lib/leadStore';
import type { Lead, LeadSource, LeadStatus } from '@/lib/leadStore';
import { LuDownload } from 'react-icons/lu';

const SAMPLE_CSV = `Name,Email,Phone,Source,Status,Assigned
Jane Doe,jane@example.com,9876543210,Website,New,Sales Team`;

type ParsedRow = {
    name: string;
    email: string;
    phone: string;
    source: string;
    status: string;
    assigned: string;
};

function parseCsv(text: string): ParsedRow[] {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0]!.toLowerCase().split(',').map((h) => h.trim());
    const idx = (name: string) => header.findIndex((h) => h === name.toLowerCase());

    const iName = idx('name');
    const iEmail = idx('email');
    const iPhone = idx('phone');
    const iSource = idx('source');
    const iStatus = idx('status');
    const iAssigned = idx('assigned');

    if (iName < 0 || iEmail < 0 || iPhone < 0) return [];

    const rows: ParsedRow[] = [];
    for (let r = 1; r < lines.length; r++) {
        const cells = lines[r]!.split(',').map((c) => c.trim());
        rows.push({
            name: cells[iName] ?? '',
            email: cells[iEmail] ?? '',
            phone: cells[iPhone] ?? '',
            source: iSource >= 0 ? cells[iSource] ?? 'Website' : 'Website',
            status: iStatus >= 0 ? cells[iStatus] ?? 'New' : 'New',
            assigned: iAssigned >= 0 ? cells[iAssigned] ?? 'Sales Team' : 'Sales Team',
        });
    }
    return rows;
}

const SOURCES: LeadSource[] = ['Website', 'Facebook Ads', 'Google Ads', 'Referral', 'Walk-in', 'Broker'];

function mapSource(s: string): LeadSource {
    const t = s.trim();
    return SOURCES.includes(t as LeadSource) ? (t as LeadSource) : 'Website';
}

function mapStatus(s: string): LeadStatus {
    const t = s.trim().toLowerCase();
    if (t === 'lost') return 'Lost';
    if (t === 'qualified') return 'Qualified';
    return 'New';
}

export function ImportLeadsModal({
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

    const parsed = parseCsv(text);
    const canPreview = parsed.length > 0;

    const downloadTemplate = () => {
        const blob = new Blob([`\uFEFF${SAMPLE_CSV}`], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads-import-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const runImport = async () => {
        setBusy(true);
        try {
            const created: Lead[] = [];
            for (const row of parsed) {
                if (!row.name.trim() || !row.email.trim() || !row.phone.trim()) continue;
                created.push(
                    addLeadFromCoreFields({
                        name: row.name.trim(),
                        email: row.email.trim(),
                        phone: row.phone.replace(/\D/g, '').slice(-10),
                        source: mapSource(row.source),
                        status: mapStatus(row.status),
                        assignedTo: row.assigned.trim() || 'Sales Team',
                        notes: 'Imported via CSV',
                        project: 'Unassigned',
                        budgetRange: '0',
                        preferredUnitType: '2 BHK',
                    }),
                );
            }
            onImported();
            onClose();
            setText('');
            setStep('paste');
            if (created.length === 1) {
                router.push(`/leads/view/${created[0]!.slug}`);
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import leads"
            maxWidthClassName="max-w-2xl"
            footer={
                <>
                    <Button type="button" variant="companyOutline" size="cta" onClick={onClose}>
                        Cancel
                    </Button>
                    {step === 'paste' ? (
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            disabled={!canPreview}
                            onClick={() => setStep('preview')}
                        >
                            Preview
                        </Button>
                    ) : (
                        <Button type="button" variant="company" size="cta" disabled={busy} onClick={runImport}>
                            {busy ? 'Importing…' : `Import ${parsed.length} leads`}
                        </Button>
                    )}
                </>
            }
        >
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="companyOutline" size="sm" className="gap-2" onClick={downloadTemplate}>
                        <LuDownload size={16} />
                        Download sample CSV
                    </Button>
                </div>
                <p className="text-sm text-slate-600">
                    Paste CSV content with columns: <strong>Name, Email, Phone, Source, Status, Assigned</strong>. First row must be the
                    header.
                </p>
                {step === 'paste' ? (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={10}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-3 font-mono text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder={SAMPLE_CSV}
                    />
                ) : (
                    <div className="max-h-64 overflow-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-slate-100 text-xs font-bold uppercase text-slate-500">
                                <tr>
                                    <th className="px-3 py-2">Name</th>
                                    <th className="px-3 py-2">Email</th>
                                    <th className="px-3 py-2">Phone</th>
                                    <th className="px-3 py-2">Source</th>
                                    <th className="px-3 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsed.map((r, i) => (
                                    <tr key={i} className="border-t border-slate-100">
                                        <td className="px-3 py-2 font-medium">{r.name}</td>
                                        <td className="px-3 py-2">{r.email}</td>
                                        <td className="px-3 py-2 tabular-nums">{r.phone}</td>
                                        <td className="px-3 py-2">{r.source}</td>
                                        <td className="px-3 py-2">{r.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Modal>
    );
}
