'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { BookingRecord, PaymentRecord } from '@/lib/bookingPaymentMockStore';
import type { Lead } from '@/lib/leadStore';
import type { DocumentLookupRow } from '@/services/relationLookupService';
import { cn } from '@/lib/utils';
import { LuBanknote, LuEye, LuFileText, LuLayoutGrid, LuUserRound } from 'react-icons/lu';

function inr(n: number): string {
    return `₹${n.toLocaleString('en-IN')}`;
}

export type LeadJourneyPreviewModalProps = {
    lead: Lead;
    leadCode: string;
    bookingRows: BookingRecord[];
    leadPayments: PaymentRecord[];
    displayDocuments: DocumentLookupRow[];
    money: { total: number; paid: number; pending: number };
};

export function LeadJourneyPreviewModal({
    lead,
    leadCode,
    bookingRows,
    leadPayments,
    displayDocuments,
    money,
}: LeadJourneyPreviewModalProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                title="View Full Details"
                aria-label="View Full Details"
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex shrink-0 items-center justify-center rounded-full  text-white shadow-lg shadow-blue-600/30 transition focus-visible:outline focus-visible:ring-4 focus-visible:ring-blue-500/35"
            >
                <LuEye className="text-blue-600" size={26} aria-hidden />
            </button>

            <Modal
                isOpen={open}
                onClose={() => setOpen(false)}
                title="Lead journey — preview"
                maxWidthClassName="max-w-[min(96vw,1440px)] w-full"
                bodyClassName="!p-4 sm:!p-5 max-h-[88vh] overflow-y-auto"
                footer={
                    <Button type="button" variant="companyOutline" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                }
            >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-5">
                    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-sky-200/90 bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50/90 p-4 shadow-md shadow-sky-900/5 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/90 text-sky-700 shadow-sm ring-1 ring-sky-100">
                                    <LuUserRound size={22} aria-hidden />
                                </span>
                                <div>
                                    <h4 className="text-base font-bold tracking-tight text-slate-900">Lead details</h4>
                                    <p className="text-xs font-medium text-sky-800/80">CRM profile & contact</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-900 shadow-sm ring-1 ring-sky-100">
                                    Score <span className="tabular-nums text-lg font-black">{lead.leadScore}</span>
                                </span>
                            </div>
                        </div>
                        <dl className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto text-sm sm:grid-cols-2">
                            <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lead code</dt>
                                <dd className="mt-0.5 font-bold text-slate-900">{leadCode}</dd>
                            </div>
                            <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Name</dt>
                                <dd className="mt-0.5 font-semibold text-slate-900">{lead.name || '—'}</dd>
                            </div>
                            <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Phone</dt>
                                <dd className="mt-0.5 tabular-nums font-semibold text-slate-900">{lead.phone || '—'}</dd>
                            </div>
                            <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email</dt>
                                <dd className="mt-0.5 break-all font-medium leading-snug text-slate-900">{lead.email || '—'}</dd>
                            </div>
                            <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Project</dt>
                                <dd className="mt-0.5 text-slate-900">{lead.project || '—'}</dd>
                            </div>
                            <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                                <dd className="mt-0.5 font-semibold text-slate-900">{lead.status}</dd>
                            </div>
                            <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Source</dt>
                                <dd className="mt-0.5 text-slate-900">{lead.source}</dd>
                            </div>
                            <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Assigned to</dt>
                                <dd className="mt-0.5 text-slate-900">{lead.assignedTo || '—'}</dd>
                            </div>
                            <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Budget</dt>
                                <dd className="mt-0.5 text-slate-900">{lead.budgetRange || '—'}</dd>
                            </div>
                            <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Preferred unit</dt>
                                <dd className="mt-0.5 text-slate-900">{lead.preferredUnitType}</dd>
                            </div>
                        </dl>
                    </section>

                    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-emerald-200/90 bg-linear-to-br from-emerald-50 via-teal-50/80 to-green-50/90 p-4 shadow-md shadow-emerald-900/5 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                                    <LuLayoutGrid size={20} aria-hidden />
                                </span>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">Bookings</h4>
                                    <p className="text-xs font-medium text-emerald-900/75">Units & inventory</p>
                                </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-emerald-600/95 px-3.5 py-1 text-sm font-black tabular-nums text-white shadow-sm ring-2 ring-white/50">
                                {bookingRows.length}
                            </span>
                        </div>
                        <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-emerald-100/90 bg-white/80 shadow-inner backdrop-blur-sm">
                            {bookingRows.length === 0 ? (
                                <p className="p-4 text-sm text-emerald-900/70">No bookings linked yet.</p>
                            ) : (
                                <div className="max-h-[min(32vh,260px)] overflow-auto lg:max-h-[min(38vh,300px)]">
                                    <table className="w-full min-w-0 border-collapse text-left text-sm">
                                        <thead className="sticky top-0 z-1 bg-emerald-100/95 text-[11px] font-bold uppercase tracking-wide text-emerald-900 backdrop-blur">
                                            <tr className="border-b border-emerald-200/80">
                                                <th className="px-3 py-2 font-semibold">Unit</th>
                                                <th className="px-3 py-2 font-semibold">Project</th>
                                                <th className="px-3 py-2 text-right font-semibold">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-emerald-100/90">
                                            {bookingRows.map((b) => (
                                                <tr key={b.slug} className="bg-white/40 hover:bg-emerald-50/50">
                                                    <td className="px-3 py-2 align-top">
                                                        <span className="font-bold tabular-nums text-slate-900">{b.unitId}</span>
                                                        <p className="font-mono text-[10px] leading-tight text-slate-500">{b.slug}</p>
                                                    </td>
                                                    <td className="px-3 py-2 align-top text-slate-800">{b.projectName}</td>
                                                    <td className="px-3 py-2 text-right align-top font-bold tabular-nums text-emerald-950">
                                                        {inr(b.unitPrice)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-amber-200/90 bg-linear-to-br from-amber-50 via-orange-50/80 to-amber-50/90 p-4 shadow-md shadow-amber-900/5 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 text-amber-700 shadow-sm ring-1 ring-amber-100">
                                    <LuBanknote size={20} aria-hidden />
                                </span>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">Payments</h4>
                                    <p className="text-xs font-medium text-amber-900/80">Ledger & totals</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="rounded-xl border border-amber-100/90 bg-white/90 px-2 py-3 text-center shadow-sm sm:px-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900/70">Count</p>
                                <p className="mt-1 text-2xl font-black tabular-nums text-amber-950 sm:text-3xl">{leadPayments.length}</p>
                            </div>
                            <div className="rounded-xl border-2 border-amber-300/60 bg-linear-to-b from-amber-100/90 to-amber-50 px-2 py-3 text-center shadow-sm sm:px-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-950">Paid</p>
                                <p className="mt-1 text-lg font-black leading-none tabular-nums text-amber-950 sm:text-xl">{inr(money.paid)}</p>
                            </div>
                            <div className="rounded-xl border-2 border-orange-200/80 bg-linear-to-b from-orange-100/90 to-orange-50/90 px-2 py-3 text-center shadow-sm sm:px-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-orange-950">Pending</p>
                                <p className="mt-1 text-lg font-black leading-none tabular-nums text-orange-950 sm:text-xl">{inr(money.pending)}</p>
                            </div>
                        </div>
                        <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-amber-100/90 bg-white/80 shadow-inner backdrop-blur-sm">
                            {leadPayments.length === 0 ? (
                                <p className="p-4 text-sm text-amber-900/75">No payment rows yet.</p>
                            ) : (
                                <div className="max-h-[min(32vh,260px)] overflow-auto lg:max-h-[min(38vh,300px)]">
                                    <table className="w-full min-w-0 border-collapse text-left text-sm">
                                        <thead className="sticky top-0 z-1 bg-amber-100/95 text-[11px] font-bold uppercase tracking-wide text-amber-950 backdrop-blur">
                                            <tr className="border-b border-amber-200/80">
                                                <th className="px-3 py-2 font-semibold">ID</th>
                                                <th className="px-3 py-2 font-semibold">Amount</th>
                                                <th className="px-3 py-2 font-semibold">Date</th>
                                                <th className="px-3 py-2 font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-amber-100/90">
                                            {leadPayments.map((p) => (
                                                <tr key={p.slug} className="bg-white/40 hover:bg-amber-50/50">
                                                    <td className="px-3 py-2 align-top">
                                                        <span className="font-mono text-xs font-semibold text-slate-800">{p.slug}</span>
                                                        <p className="truncate text-[10px] text-slate-500">Bk {p.bookingSlug}</p>
                                                    </td>
                                                    <td className="px-3 py-2 align-top font-bold tabular-nums text-slate-900">{inr(p.amount)}</td>
                                                    <td className="px-3 py-2 align-top tabular-nums text-slate-700">{p.date}</td>
                                                    <td className="px-3 py-2 align-top">
                                                        <span
                                                            className={cn(
                                                                'inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold',
                                                                p.status === 'Completed' && 'bg-emerald-100 text-emerald-900',
                                                                p.status === 'Pending' && 'bg-amber-200/80 text-amber-950',
                                                                p.status === 'Failed' && 'bg-red-100 text-red-900',
                                                            )}
                                                        >
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-violet-200/90 bg-linear-to-br from-violet-50 via-purple-50/80 to-fuchsia-50/70 p-4 shadow-md shadow-violet-900/5 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 text-violet-700 shadow-sm ring-1 ring-violet-100">
                                    <LuFileText size={20} aria-hidden />
                                </span>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">Documents</h4>
                                    <p className="text-xs font-medium text-violet-900/75">Compliance & files</p>
                                </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-violet-600 px-3.5 py-1 text-sm font-black tabular-nums text-white shadow-sm ring-2 ring-white/40">
                                {displayDocuments.length} file{displayDocuments.length === 1 ? '' : 's'}
                            </span>
                        </div>
                        {displayDocuments.length === 0 ? (
                            <p className="mt-4 rounded-xl border border-violet-100 bg-white/70 p-4 text-sm text-violet-900/75 shadow-inner">
                                No documents linked yet.
                            </p>
                        ) : (
                            <div className="mt-4 max-h-[min(32vh,260px)] flex-1 overflow-auto rounded-xl border border-violet-100/90 bg-white/85 shadow-inner backdrop-blur-sm lg:max-h-[min(38vh,300px)]">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead className="sticky top-0 z-1 bg-violet-100/95 text-[11px] font-bold uppercase tracking-wide text-violet-950 backdrop-blur">
                                        <tr className="border-b border-violet-200/80">
                                            <th className="px-3 py-2 font-semibold">Name</th>
                                            <th className="px-3 py-2 font-semibold">Type</th>
                                            <th className="px-3 py-2 font-semibold">Uploaded</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-violet-100/90">
                                        {displayDocuments.map((d) => (
                                            <tr key={d.id} className="hover:bg-violet-50/60">
                                                <td className="px-3 py-2 font-medium text-slate-900">{d.name}</td>
                                                <td className="px-3 py-2 text-slate-700">{d.type}</td>
                                                <td className="px-3 py-2 tabular-nums text-slate-600">{d.uploadDate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </Modal>
        </>
    );
}
