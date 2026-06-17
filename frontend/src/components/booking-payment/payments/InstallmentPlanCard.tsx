'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BpStatusBadge, paymentRecordStatusTone } from '@/components/booking-payment/BpStatusBadge';
import {
    formatFrequencyLabel,
    frequencyIntervalDescription,
    updatePaymentInstallmentLines,
    type PaymentInstallmentLine,
    type PaymentRecord,
} from '@/lib/bookingPaymentMockStore';
import { formatShortDate } from '@/lib/formatDate';
import { cn } from '@/lib/utils';
import { LuBell, LuCheck, LuPencil, LuX } from 'react-icons/lu';

function lineStatusClass(status: PaymentInstallmentLine['status']) {
    if (status === 'Paid') return 'text-emerald-800 bg-emerald-50 ring-emerald-100';
    if (status === 'Overdue') return 'text-red-800 bg-red-50 ring-red-100';
    return 'text-amber-800 bg-amber-50 ring-amber-100';
}

function displayLineStatus(status: PaymentInstallmentLine['status']): string {
    if (status === 'Paid') return 'Completed';
    if (status === 'Overdue') return 'Overdue';
    return 'Pending';
}

function countLineStats(lines: PaymentInstallmentLine[]) {
    let completed = 0;
    let pending = 0;
    let overdue = 0;
    for (const l of lines) {
        if (l.status === 'Paid') completed++;
        else if (l.status === 'Overdue') overdue++;
        else pending++;
    }
    return { completed, pending, overdue };
}

function recomputeDraftLine(line: PaymentInstallmentLine): PaymentInstallmentLine {
    const paidAmount = Math.max(0, Math.min(line.expectedAmount, line.paidAmount));
    const pendingAmount = Math.max(0, line.expectedAmount - paidAmount);
    const today = new Date().toISOString().slice(0, 10);
    let status: PaymentInstallmentLine['status'];
    if (pendingAmount <= 0) status = 'Paid';
    else if (line.dueDate.slice(0, 10) < today) status = 'Overdue';
    else status = 'Pending';
    return { ...line, paidAmount, pendingAmount, status };
}

function addCalendarDays(ymd: string, deltaDays: number): string {
    const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + deltaDays);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
}

/** Maps a chosen row status to paid amount + due date; `recomputeDraftLine` keeps amounts consistent. */
function patchForStatusIntent(line: PaymentInstallmentLine, intent: PaymentInstallmentLine['status']): Partial<PaymentInstallmentLine> {
    const today = new Date().toISOString().slice(0, 10);
    const dueYmd = line.dueDate.slice(0, 10);
    if (intent === 'Paid') {
        return { paidAmount: line.expectedAmount };
    }
    if (intent === 'Pending') {
        const due = dueYmd >= today ? line.dueDate : today;
        return { paidAmount: 0, dueDate: due };
    }
    const pastDue = dueYmd < today ? line.dueDate : addCalendarDays(today, -1);
    return { paidAmount: 0, dueDate: pastDue };
}

/** Closed select matches current status so the control is scannable at a glance. */
function statusSelectToneClass(status: PaymentInstallmentLine['status']) {
    if (status === 'Paid') {
        return 'border-emerald-400/80 bg-emerald-50 text-emerald-950 focus:border-emerald-500 focus:ring-emerald-500/25';
    }
    if (status === 'Overdue') {
        return 'border-red-400/80 bg-red-50 text-red-950 focus:border-red-500 focus:ring-red-500/25';
    }
    return 'border-amber-400/80 bg-amber-50 text-amber-950 focus:border-amber-500 focus:ring-amber-500/25';
}

const statusSelectBase =
    'min-w-[9.5rem] max-w-full rounded-lg border py-1.5 pl-2 pr-7 text-[11px] font-semibold shadow-sm focus:outline-none focus:ring-2';

const installmentStatusOptions = (
    <>
        <option value="Pending" className="bg-amber-50 font-medium text-amber-950">
            Pending
        </option>
        <option value="Paid" className="bg-emerald-50 font-medium text-emerald-950">
            Paid
        </option>
        <option value="Overdue" className="bg-red-50 font-medium text-red-950">
            Overdue
        </option>
    </>
);

export type InstallmentReminderPayload = {
    paymentSlug: string;
    receiptNumber: string;
    milestoneName: string;
    /** Omit for whole-plan reminder. */
    installmentNo?: number;
    pendingAmount?: number;
};

export function InstallmentPlanCard({
    payment,
    lines,
    milestoneName,
    onSaved,
    onSendReminder,
}: {
    payment: PaymentRecord;
    lines: PaymentInstallmentLine[];
    milestoneName: string;
    onSaved: () => void;
    /** Optional — parent can show a toast; if omitted, a short inline confirmation is shown in the card. */
    onSendReminder?: (payload: InstallmentReminderPayload) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<PaymentInstallmentLine[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [quickSaving, setQuickSaving] = useState(false);
    const [localReminderMsg, setLocalReminderMsg] = useState<string | null>(null);

    const canEdit = payment.status !== 'Completed';
    const canRemind = payment.status !== 'Completed';
    const n = lines.length;
    const stats = useMemo(() => countLineStats(lines), [lines]);

    const freq = payment.frequency ?? undefined;

    const startEdit = () => {
        setError(null);
        setDraft(lines.map((l) => ({ ...l })));
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setDraft([]);
        setError(null);
    };

    const patchDraft = (index: number, patch: Partial<PaymentInstallmentLine>) => {
        setDraft((prev) => {
            const next = [...prev];
            const merged = { ...next[index], ...patch };
            if (patch.paidAmount !== undefined) {
                const raw = Number(patch.paidAmount);
                merged.paidAmount = Number.isFinite(raw) ? Math.round(raw) : 0;
            }
            next[index] = recomputeDraftLine(merged);
            return next;
        });
    };

    const save = () => {
        setSaving(true);
        setError(null);
        const res = updatePaymentInstallmentLines(
            payment.slug,
            draft.map((l) => recomputeDraftLine(l))
        );
        setSaving(false);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        setEditing(false);
        setDraft([]);
        onSaved();
    };

    const applyQuickStatusChange = (idx: number, intent: PaymentInstallmentLine['status']) => {
        setQuickSaving(true);
        setError(null);
        const next = lines.map((l) => ({ ...l }));
        const patch = patchForStatusIntent(next[idx]!, intent);
        const merged = { ...next[idx]!, ...patch };
        if (patch.paidAmount !== undefined) {
            const raw = Number(patch.paidAmount);
            merged.paidAmount = Number.isFinite(raw) ? Math.round(raw) : 0;
        }
        next[idx] = recomputeDraftLine(merged);
        const res = updatePaymentInstallmentLines(
            payment.slug,
            next.map((l) => recomputeDraftLine(l))
        );
        setQuickSaving(false);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        onSaved();
    };

    const tableLines = editing ? draft : lines;

    const fireReminder = (installmentNo?: number, pendingAmount?: number) => {
        const payload: InstallmentReminderPayload = {
            paymentSlug: payment.slug,
            receiptNumber: payment.receiptNumber,
            milestoneName,
            installmentNo,
            pendingAmount,
        };
        if (onSendReminder) {
            onSendReminder(payload);
        } else {
            const part =
                installmentNo != null
                    ? `Installment #${installmentNo} (${payment.receiptNumber})`
                    : `Schedule ${payment.receiptNumber}`;
            setLocalReminderMsg(
                `Reminder queued for ${part}${pendingAmount != null ? ` — ₹${pendingAmount.toLocaleString('en-IN')} outstanding` : ''} (demo).`,
            );
            window.setTimeout(() => setLocalReminderMsg(null), 4500);
        }
    };

    return (
        <Card className="overflow-hidden shadow-sm ring-1 ring-slate-900/5" contentClassName="p-0">
            <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Payment</p>
                    <p className="font-mono text-sm font-semibold text-slate-900">{payment.receiptNumber}</p>
                    <p className="text-xs text-slate-600">
                        {milestoneName} · schedule from {formatShortDate(payment.scheduleStartDate ?? payment.date)}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 ring-1 ring-slate-200">
                            Cadence: {formatFrequencyLabel(freq)}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                            {frequencyIntervalDescription(freq)}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-900 ring-1 ring-violet-100">
                            {n} installment{n === 1 ? '' : 's'}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                        <span className="text-emerald-800">{stats.completed} completed</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-amber-800">{stats.pending} pending</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-red-800">{stats.overdue} overdue</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <BpStatusBadge tone={paymentRecordStatusTone(payment.status)}>{payment.status}</BpStatusBadge>
                    <span className="tabular-nums text-sm font-semibold text-slate-800">
                        ₹{payment.amount.toLocaleString('en-IN')}
                    </span>
                    {canRemind ? (
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="gap-1.5 border-violet-200 text-violet-900 hover:bg-violet-50"
                            onClick={() => fireReminder()}
                            disabled={quickSaving || saving}
                            title="Queue SMS / email for this installment plan (demo)"
                        >
                            <LuBell size={14} aria-hidden />
                            Send reminder
                        </Button>
                    ) : null}
                    {canEdit ? (
                        !editing ? (
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="sm"
                                className="gap-1.5"
                                onClick={startEdit}
                                disabled={quickSaving}
                            >
                                <LuPencil size={14} aria-hidden />
                                Edit schedule
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button type="button" variant="companyOutline" size="sm" className="gap-1.5" onClick={cancelEdit} disabled={saving}>
                                    <LuX size={14} aria-hidden />
                                    Cancel
                                </Button>
                                <Button type="button" variant="company" size="sm" className="gap-1.5" onClick={save} disabled={saving}>
                                    <LuCheck size={14} aria-hidden />
                                    {saving ? 'Saving…' : 'Save'}
                                </Button>
                            </div>
                        )
                    ) : (
                        <span className="text-[11px] font-medium text-slate-500">Schedule locked (payment completed)</span>
                    )}
                </div>
            </div>

            {error ? (
                <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">{error}</div>
            ) : null}
            {localReminderMsg ? (
                <div className="mx-4 mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900">
                    {localReminderMsg}
                </div>
            ) : null}

            <div className={cn('overflow-x-auto p-4', quickSaving && 'pointer-events-none opacity-70')}>
                <div className="mb-3 space-y-2">
                    <p className="text-[11px] text-slate-600">
                        {canEdit
                            ? editing
                                ? 'Edit due dates and paid amounts, or set status per row. Save when done.'
                                : 'Use Edit schedule for bulk changes, or change status on any row from the dropdown.'
                            : null}
                    </p>
                    {canEdit ? (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-medium text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400 ring-1 ring-amber-600/30" aria-hidden />
                                Pending — not fully paid, on or before due date
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-1 ring-emerald-700/30" aria-hidden />
                                Paid — full amount received
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 ring-1 ring-red-700/30" aria-hidden />
                                Overdue — past due with balance
                            </span>
                        </div>
                    ) : null}
                </div>
                <table className="w-full text-sm min-w-[980px]">
                    <thead>
                        <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-100">
                            <th className="py-2.5 px-3">No.</th>
                            <th className="py-2.5 px-3">Due date</th>
                            <th className="py-2.5 px-3 text-right">Expected</th>
                            <th className="py-2.5 px-3 text-right">Paid</th>
                            <th className="py-2.5 px-3 text-right">Pending</th>
                            <th className="py-2.5 px-3 min-w-[10rem]">
                                Status
                                {canEdit ? <span className="ml-1 font-normal normal-case text-slate-400">(change)</span> : null}
                            </th>
                            <th className="py-2.5 px-2 text-right whitespace-nowrap">Reminder</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tableLines.map((line, idx) => (
                            <tr key={line.installmentNo} className="hover:bg-slate-50/80">
                                <td className="py-2.5 px-3 tabular-nums text-slate-600">{line.installmentNo}</td>
                                <td className="py-2.5 px-3 whitespace-nowrap text-slate-800">
                                    {editing ? (
                                        <input
                                            type="date"
                                            value={line.dueDate.slice(0, 10)}
                                            onChange={(e) => patchDraft(idx, { dueDate: e.target.value })}
                                            className="w-full min-w-[9rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900"
                                        />
                                    ) : (
                                        formatShortDate(line.dueDate)
                                    )}
                                </td>
                                <td className="py-2.5 px-3 text-right tabular-nums">₹{line.expectedAmount.toLocaleString('en-IN')}</td>
                                <td className="py-2.5 px-3 text-right tabular-nums text-emerald-900">
                                    {editing ? (
                                        <input
                                            type="number"
                                            min={0}
                                            max={line.expectedAmount}
                                            step={1}
                                            value={line.paidAmount}
                                            onChange={(e) => patchDraft(idx, { paidAmount: Number(e.target.value) })}
                                            className="w-full max-w-[7rem] ml-auto rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-xs font-medium tabular-nums"
                                        />
                                    ) : (
                                        <span className="text-emerald-800">₹{line.paidAmount.toLocaleString('en-IN')}</span>
                                    )}
                                </td>
                                <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                                    ₹{line.pendingAmount.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-3">
                                    {canEdit && !editing ? (
                                        <select
                                            aria-label={`Status for installment ${line.installmentNo}`}
                                            title="Pending: not yet due or unpaid · Paid: full amount received · Overdue: past due with balance"
                                            className={cn(statusSelectBase, statusSelectToneClass(line.status))}
                                            value={line.status}
                                            disabled={quickSaving}
                                            onChange={(e) =>
                                                applyQuickStatusChange(idx, e.target.value as PaymentInstallmentLine['status'])
                                            }
                                        >
                                            {installmentStatusOptions}
                                        </select>
                                    ) : editing ? (
                                        <select
                                            aria-label={`Status for installment ${line.installmentNo}`}
                                            title="Pending: not yet due or unpaid · Paid: full amount received · Overdue: past due with balance"
                                            className={cn(statusSelectBase, statusSelectToneClass(line.status))}
                                            value={line.status}
                                            disabled={saving}
                                            onChange={(e) =>
                                                patchDraft(idx, patchForStatusIntent(line, e.target.value as PaymentInstallmentLine['status']))
                                            }
                                        >
                                            {installmentStatusOptions}
                                        </select>
                                    ) : (
                                        <span
                                            className={cn(
                                                'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
                                                lineStatusClass(line.status)
                                            )}
                                        >
                                            {displayLineStatus(line.status)}
                                        </span>
                                    )}
                                </td>
                                <td className="py-2 px-2 text-right">
                                    {canRemind && line.status !== 'Paid' && line.pendingAmount > 0 ? (
                                        <Button
                                            type="button"
                                            variant="companyGhost"
                                            size="sm"
                                            className="h-8 gap-1 whitespace-nowrap px-2 text-[11px] font-semibold text-violet-800 hover:bg-violet-50"
                                            disabled={quickSaving || saving}
                                            title="Send reminder for this installment (demo)"
                                            onClick={() => fireReminder(line.installmentNo, line.pendingAmount)}
                                        >
                                            <LuBell size={13} aria-hidden />
                                            Remind
                                        </Button>
                                    ) : (
                                        <span className="text-[10px] text-slate-400">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
