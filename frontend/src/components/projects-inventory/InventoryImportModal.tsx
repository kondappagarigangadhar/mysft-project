'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { bulkImportInventoryUnits } from '@/lib/projectsInventoryStore';
import { downloadSampleInventoryCsv, parseInventoryCsvContent, type ParsedInventoryRow, type RowParseResult } from '@/lib/inventoryImportCsv';
import { LuFileUp, LuDownload } from 'react-icons/lu';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onImported: () => void;
};

export function InventoryImportModal({ isOpen, onClose, onImported }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('');
    const [preview, setPreview] = useState<RowParseResult[] | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: number; failed: Array<{ row: number; reason: string }> } | null>(null);

    const reset = () => {
        setFileName('');
        setPreview(null);
        setResult(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const parseFile = (text: string, name: string) => {
        setFileName(name);
        setResult(null);
        setPreview(parseInventoryCsvContent(text));
    };

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => parseFile(String(reader.result ?? ''), f.name);
        reader.readAsText(f);
    };

    const validRows: ParsedInventoryRow[] =
        preview?.filter((r): r is RowParseResult & { ok: true; data: ParsedInventoryRow } => r.ok === true).map((r) => r.data) ?? [];

    const parseErrors = preview?.filter((r) => !r.ok) ?? [];

    const canSubmit = validRows.length > 0 && parseErrors.length === 0 && !result;

    const handleSubmit = () => {
        if (!canSubmit || validRows.length === 0) return;
        setSubmitting(true);
        try {
            const res = bulkImportInventoryUnits(validRows);
            setResult({ success: res.success, failed: res.failed.map((f) => ({ row: f.row, reason: f.reason })) });
            if (res.success > 0) onImported();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Bulk import units"
            footer={
                <>
                    <Button type="button" variant="companyOutline" size="cta" onClick={handleClose}>
                        {result ? 'Close' : 'Cancel'}
                    </Button>
                    {!result ? (
                        <Button type="button" variant="company" size="cta" disabled={!canSubmit || submitting} onClick={handleSubmit}>
                            {submitting ? 'Importing…' : 'Import valid rows'}
                        </Button>
                    ) : null}
                </>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Upload a CSV with columns:{' '}
                    <span className="font-mono text-xs">
                        project_slug, unit_number, unit_type, unit_size, price, availability_status
                    </span>
                    — optional: <span className="font-mono text-xs">configuration</span> (or <span className="font-mono text-xs">bhk</span>) e.g. 2 BHK,{' '}
                    <span className="font-mono text-xs">offer_price, block_phase</span>. Use <span className="font-semibold">available | reserved | sold | pending</span> (or{' '}
                    <span className="font-semibold">blocked</span> for reserved).
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => downloadSampleInventoryCsv()}>
                        <LuDownload size={18} />
                        Download sample file
                    </Button>
                    <Button type="button" variant="company" size="cta" className="gap-2" onClick={() => inputRef.current?.click()}>
                        <LuFileUp size={18} />
                        Choose file
                    </Button>
                    <input ref={inputRef} type="file" accept=".csv,.txt,text/csv" className="hidden" onChange={onPickFile} />
                </div>
                {fileName ? <p className="text-xs text-slate-500">Selected: {fileName}</p> : null}

                {preview && !result ? (
                    <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-sm">
                        {parseErrors.length > 0 ? (
                            <div className="space-y-1">
                                <p className="font-semibold text-rose-700">Fix errors before importing ({parseErrors.length})</p>
                                <ul className="list-inside list-disc text-xs text-rose-800">
                                    {parseErrors.slice(0, 12).map((e, i) => (
                                        <li key={i}>
                                            Line {e.line}: {!e.ok ? e.error : ''}
                                        </li>
                                    ))}
                                    {parseErrors.length > 12 ? <li>…and more</li> : null}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-emerald-800">
                                <span className="font-semibold">{validRows.length}</span> row(s) ready to import — no validation errors.
                            </p>
                        )}
                    </div>
                ) : null}

                {result ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                        <p className="font-semibold text-slate-900">Import finished</p>
                        <p className="mt-1 text-emerald-700">Imported: {result.success}</p>
                        {result.failed.length > 0 ? (
                            <div className="mt-2">
                                <p className="font-medium text-rose-700">Failed: {result.failed.length}</p>
                                <ul className="mt-1 max-h-32 list-inside list-disc overflow-auto text-xs text-rose-900">
                                    {result.failed.map((f, i) => (
                                        <li key={i}>
                                            Row {f.row}: {f.reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </Modal>
    );
}
