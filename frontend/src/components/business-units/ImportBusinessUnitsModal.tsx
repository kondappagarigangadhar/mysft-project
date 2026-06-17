'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { companies } from '@/data/mockData';
import type { BusinessUnit } from '@/data/mockData';
import { LuDownload } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const SAMPLE_CSV = `Name,Code,ParentOrganization,DefaultScope,Status,CreatedDate
Sample Unit,SMP01,Skyline Builders,Residential;Commercial,Active,Feb 2026`;

export type BusinessUnitImportDraft = Omit<BusinessUnit, 'id'>;

type ParsedRow = {
    name: string;
    code: string;
    parent: string;
    scope: string;
    status: string;
    created: string;
};

function monthYearNow() {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function parseCsv(text: string): ParsedRow[] {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0]!.toLowerCase().split(',').map((h) => h.trim());
    const idx = (name: string) => header.findIndex((h) => h === name.toLowerCase());

    const iName = idx('name');
    const iCode = idx('code');
    const iParent = idx('parentorganization');
    const iScope = idx('defaultscope');
    const iStatus = idx('status');
    const iCreated = idx('createddate');

    if (iName < 0 || iCode < 0 || iParent < 0) return [];

    const rows: ParsedRow[] = [];
    for (let r = 1; r < lines.length; r++) {
        const cells = lines[r]!.split(',').map((c) => c.trim());
        rows.push({
            name: cells[iName] ?? '',
            code: cells[iCode] ?? '',
            parent: cells[iParent] ?? '',
            scope: iScope >= 0 ? cells[iScope] ?? '' : '',
            status: iStatus >= 0 ? cells[iStatus] ?? 'Active' : 'Active',
            created: iCreated >= 0 ? cells[iCreated] ?? '' : '',
        });
    }
    return rows;
}

function resolveParent(parentRaw: string): { id: number; name: string } | null {
    const t = parentRaw.trim();
    if (!t) return null;
    const asNum = Number(t);
    if (!Number.isNaN(asNum) && asNum > 0) {
        const c = companies.find((x) => x.id === asNum);
        if (c) return { id: c.id, name: c.name };
    }
    const c = companies.find((x) => x.name.toLowerCase() === t.toLowerCase());
    if (c) return { id: c.id, name: c.name };
    return null;
}

function mapStatus(s: string): 'Active' | 'Inactive' {
    return s.trim().toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
}

function toDraft(row: ParsedRow): BusinessUnitImportDraft | null {
    if (!row.name.trim() || !row.code.trim()) return null;
    const p = resolveParent(row.parent);
    if (!p) return null;
    const scopes = row.scope
        .split(/[;|]/)
        .map((x) => x.trim())
        .filter(Boolean);
    return {
        name: row.name.trim(),
        code: row.code.trim().toUpperCase().replace(/\s/g, ''),
        parentOrganizationId: p.id,
        parentOrganizationName: p.name,
        defaultProjectScope: scopes.length ? scopes : ['General'],
        createdDate: row.created.trim() || monthYearNow(),
        status: mapStatus(row.status),
    };
}

export function ImportBusinessUnitsModal({
    isOpen,
    onClose,
    onImported,
    existingCodes,
}: {
    isOpen: boolean;
    onClose: () => void;
    onImported: (rows: BusinessUnitImportDraft[]) => void;
    existingCodes: Set<string>;
}) {
    const [text, setText] = useState('');
    const [step, setStep] = useState<'paste' | 'preview'>('paste');
    const [busy, setBusy] = useState(false);

    const parsedRows = parseCsv(text);
    const drafts = parsedRows.map(toDraft).filter((x): x is BusinessUnitImportDraft => !!x);
    const skipped = parsedRows.length - drafts.length;
    const deduped = drafts.filter((d) => !existingCodes.has(d.code.toUpperCase()));
    const canPreview = parsedRows.length > 0;

    const downloadTemplate = () => {
        const blob = new Blob([`\uFEFF${SAMPLE_CSV}`], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'business-units-import-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const runImport = async () => {
        setBusy(true);
        try {
            if (deduped.length) onImported(deduped);
            onClose();
            setText('');
            setStep('paste');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import business units"
            maxWidthClassName="max-w-2xl"
            footer={
                <>
                    <Button type="button" variant="companyOutline" size="cta" onClick={onClose}>
                        Cancel
                    </Button>
                    {step === 'paste' ? (
                        <Button type="button" variant="company" size="cta" disabled={!canPreview} onClick={() => setStep('preview')}>
                            Preview
                        </Button>
                    ) : (
                        <Button type="button" variant="company" size="cta" disabled={busy || !deduped.length} onClick={runImport}>
                            {busy ? 'Importing…' : `Import ${deduped.length} unit(s)`}
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
                    Columns: <strong>Name, Code, ParentOrganization, DefaultScope, Status, CreatedDate</strong>. ParentOrganization can be
                    tenant id or exact tenant name. DefaultScope uses <strong>;</strong> or <strong>|</strong> between values. Rows with unknown
                    parent or duplicate code are skipped.
                </p>
                {skipped > 0 && step === 'preview' ? (
                    <p className="text-xs font-medium text-amber-700">
                        {skipped} row(s) skipped (missing fields, unknown parent, or invalid data).
                    </p>
                ) : null}
                {step === 'paste' ? (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={10}
                        className={cn(
                            'w-full rounded-xl border border-slate-200 bg-slate-50/80 p-3 font-mono text-sm text-slate-900',
                            'focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_25%,transparent)]',
                        )}
                        placeholder={SAMPLE_CSV}
                    />
                ) : (
                    <div className="max-h-64 overflow-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-slate-100 text-xs font-bold uppercase text-slate-500">
                                <tr>
                                    <th className="px-3 py-2">Name</th>
                                    <th className="px-3 py-2">Code</th>
                                    <th className="px-3 py-2">Parent</th>
                                    <th className="px-3 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deduped.map((r, i) => (
                                    <tr key={i} className="border-t border-slate-100">
                                        <td className="px-3 py-2 font-medium">{r.name}</td>
                                        <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
                                        <td className="px-3 py-2">{r.parentOrganizationName}</td>
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
