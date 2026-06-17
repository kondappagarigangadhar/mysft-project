'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Department } from '@/data/mockData';
import { getBusinessUnits } from '@/data/mockData';
import { LuDownload } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';

const SAMPLE_CSV = `Name,Code,Business Unit,Status
Facilities,FAC-01,Residential Sales,Active
Legal,LEG-01,Commercial Leasing,Active`;

type ParsedRow = {
    name: string;
    code: string;
    businessUnit: string;
    status: string;
};

function parseCsv(text: string): ParsedRow[] {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0]!.toLowerCase().split(',').map((h) => h.trim());
    const idx = (name: string) => header.findIndex((h) => h === name.toLowerCase());
    const iName = idx('name');
    const iCode = idx('code');
    const iBu = idx('business unit');
    const iStatus = idx('status');
    if (iName < 0 || iCode < 0) return [];

    const rows: ParsedRow[] = [];
    for (let r = 1; r < lines.length; r++) {
        const cells = lines[r]!.split(',').map((c) => c.trim());
        rows.push({
            name: cells[iName] ?? '',
            code: cells[iCode] ?? '',
            businessUnit: iBu >= 0 ? cells[iBu] ?? '' : '',
            status: iStatus >= 0 ? cells[iStatus] ?? 'Active' : 'Active',
        });
    }
    return rows;
}

function mapStatus(s: string): 'Active' | 'Inactive' {
    return s.trim().toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
}

export function ImportDepartmentsModal({
    isOpen,
    onClose,
    onImported,
}: {
    isOpen: boolean;
    onClose: () => void;
    onImported: (rows: Department[]) => void;
}) {
    const [text, setText] = useState('');
    const [step, setStep] = useState<'paste' | 'preview'>('paste');
    const [busy, setBusy] = useState(false);
    const businessUnits = getBusinessUnits();

    const parsed = parseCsv(text);
    const canPreview = parsed.length > 0;

    const downloadTemplate = () => {
        const blob = new Blob([`\uFEFF${SAMPLE_CSV}`], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'departments-import-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const runImport = () => {
        setBusy(true);
        try {
            const now = new Date().toISOString().slice(0, 10);
            const created: Department[] = parsed
                .filter((row) => row.name.trim() && row.code.trim())
                .map((row, i) => {
                    const bu =
                        businessUnits.find((b) => b.name.toLowerCase() === row.businessUnit.trim().toLowerCase()) ??
                        businessUnits[0];
                    return {
                        id: Date.now() + i,
                        name: row.name.trim(),
                        code: row.code.trim(),
                        businessUnitId: bu?.id ?? 1,
                        businessUnitName: bu?.name ?? (row.businessUnit.trim() || '—'),
                        usersCount: 0,
                        status: mapStatus(row.status),
                        createdDate: now,
                    };
                });
            if (created.length) onImported(created);
            setText('');
            setStep('paste');
            onClose();
        } finally {
            setBusy(false);
        }
    };

    const handleClose = () => {
        setText('');
        setStep('paste');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import departments"
            footer={
                step === 'paste' ? (
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            disabled={!canPreview}
                            onClick={() => setStep('preview')}
                        >
                            Preview
                        </Button>
                    </>
                ) : (
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setStep('paste')}>
                            Back
                        </Button>
                        <Button type="button" variant="company" size="cta" disabled={busy} onClick={runImport}>
                            Import {parsed.length} row(s)
                        </Button>
                    </>
                )
            }
        >
            {step === 'paste' ? (
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Paste CSV with columns: Name, Code, Business Unit (optional), Status (optional).
                    </p>
                    <Button type="button" variant="companyOutline" size="sm" className="gap-2" onClick={downloadTemplate}>
                        <LuDownload size={16} />
                        Download template
                    </Button>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={8}
                        placeholder={SAMPLE_CSV}
                        className={cn(
                            'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono',
                            CTA_INPUT_FOCUS,
                        )}
                    />
                </div>
            ) : (
                <div className="max-h-64 overflow-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                            <tr>
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Code</th>
                                <th className="px-3 py-2">Business unit</th>
                                <th className="px-3 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parsed.map((row, i) => (
                                <tr key={i} className="border-t border-slate-100">
                                    <td className="px-3 py-2">{row.name}</td>
                                    <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                                    <td className="px-3 py-2">{row.businessUnit || '—'}</td>
                                    <td className="px-3 py-2">{row.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
}
