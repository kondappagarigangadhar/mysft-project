'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { importPaymentRecordsBatch } from '@/lib/bookingPaymentMockStore';
import { parsePaymentImportCsv } from '@/lib/paymentImportCsv';
import { cn } from '@/lib/utils';
import { CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';

export function ImportPaymentRecordsModal({
    open,
    onClose,
    defaultBookingSlug,
    onImported,
}: {
    open: boolean;
    onClose: () => void;
    /** When set, rows may omit booking_slug and use this booking. */
    defaultBookingSlug: string;
    onImported: (count: number) => void;
}) {
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [errorList, setErrorList] = useState<string[]>([]);

    const reset = () => {
        setText('');
        setMessage(null);
        setErrorList([]);
        setBusy(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const runImport = () => {
        setBusy(true);
        setMessage(null);
        setErrorList([]);
        const { rows, errors } = parsePaymentImportCsv(text, defaultBookingSlug);
        const parseMsgs = errors.map((e) => `Line ${e.line}: ${e.message}`);
        if (!rows.length && parseMsgs.length) {
            setErrorList(parseMsgs);
            setBusy(false);
            return;
        }
        const batch = importPaymentRecordsBatch(
            rows.map((r) => ({
                lineNumber: r.lineNumber,
                bookingSlug: r.bookingSlug,
                milestoneId: r.milestoneId,
                amount: r.amount,
                date: r.date,
                mode: r.mode,
                receiptNumber: r.receiptNumber,
                status: r.status,
            }))
        );
        const failMsgs = batch.failures.map((f) =>
            f.line != null ? `Line ${f.line} (${f.receiptNumber}): ${f.error}` : `${f.receiptNumber}: ${f.error}`
        );
        const allErr = [...parseMsgs, ...failMsgs];
        if (allErr.length) setErrorList(allErr);
        if (batch.imported > 0) {
            setMessage(`Imported ${batch.imported} payment record(s).`);
            onImported(batch.imported);
        } else if (!allErr.length) {
            setMessage('No rows to import.');
        }
        setBusy(false);
    };

    return (
        <Modal
            isOpen={open}
            onClose={handleClose}
            title="Import payment records"
            footer={
                <>
                    <Button type="button" variant="companyOutline" size="cta" onClick={handleClose}>
                        Close
                    </Button>
                    <Button type="button" variant="company" size="cta" onClick={runImport} disabled={busy || !text.trim()}>
                        {busy ? 'Importing…' : 'Import'}
                    </Button>
                </>
            }
        >
            <p className="text-sm text-slate-600 mb-3">
                Upload a CSV (or paste from Excel). Header row required. Columns:{' '}
                <span className="font-mono text-xs text-slate-800">amount, date, mode, receipt_number, milestone_id</span> or{' '}
                <span className="font-mono text-xs text-slate-800">milestone_name</span>
                {defaultBookingSlug ? (
                    <>
                        . <span className="font-medium text-slate-800">booking_slug</span> optional (defaults to current booking).
                    </>
                ) : (
                    <> plus <span className="font-medium text-slate-800">booking_slug</span>.</>
                )}
                Optional: <span className="font-mono text-xs">status</span> (Pending, Completed, Failed).
            </p>
            <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">CSV file</span>
                <input
                    type="file"
                    accept=".csv,text/csv"
                    className="mt-1 block w-full text-sm text-slate-600"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.onload = () => setText(String(reader.result ?? ''));
                        reader.readAsText(f);
                    }}
                />
            </label>
            <label className="mt-4 block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Or paste CSV</span>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className={cn(
                        'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900',
                        CTA_INPUT_FOCUS,
                    )}
                    placeholder="booking_slug,amount,date,mode,receipt_number,milestone_name,status"
                />
            </label>
            {message ? <p className="mt-3 text-sm font-medium text-emerald-800">{message}</p> : null}
            {errorList.length > 0 ? (
                <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
                    <p className="font-semibold mb-1">Issues</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                        {errorList.slice(0, 40).map((e, i) => (
                            <li key={i}>{e}</li>
                        ))}
                    </ul>
                    {errorList.length > 40 ? <p className="mt-1 text-amber-800">…and {errorList.length - 40} more</p> : null}
                </div>
            ) : null}
        </Modal>
    );
}
