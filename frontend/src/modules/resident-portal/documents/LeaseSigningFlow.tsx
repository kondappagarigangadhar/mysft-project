'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
    completeLeaseSigning,
    formatLeaseCurrency,
    formatLeasePeriod,
    rejectLeaseAgreement,
    type RentalLeaseAgreement,
} from '@/lib/rentalLeaseAgreementStore';
import { LeaseDocumentPreview } from './LeaseDocumentPreview';
import { cn } from '@/lib/utils';
import { LuCheck, LuChevronRight, LuSignature, LuX } from 'react-icons/lu';

const STEPS = ['Review document', 'Accept terms', 'Sign & submit'] as const;

type Props = {
    agreement: RentalLeaseAgreement;
    signerName: string;
    onComplete: () => void;
    onDecline: () => void;
};

export function LeaseSigningFlow({ agreement, signerName, onComplete, onDecline }: Props) {
    const [step, setStep] = useState(0);
    const [accepted, setAccepted] = useState(false);
    const [signature, setSignature] = useState(signerName);
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = () => {
        if (!signature.trim()) return;
        setSubmitting(true);
        window.setTimeout(() => {
            completeLeaseSigning(agreement.id, signature.trim());
            setSubmitting(false);
            onComplete();
        }, 1200);
    };

    return (
        <div className="space-y-6">
            <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                {STEPS.map((label, i) => (
                    <li key={label} className="flex items-center gap-2">
                        <span
                            className={cn(
                                'grid h-7 w-7 place-items-center rounded-full ring-1',
                                i <= step ? 'bg-orange-600 text-white ring-orange-600' : 'bg-white text-slate-500 ring-slate-200',
                            )}
                        >
                            {i < step ? <LuCheck className="h-3.5 w-3.5" /> : i + 1}
                        </span>
                        <span className={cn(i === step && 'text-slate-900')}>{label}</span>
                        {i < STEPS.length - 1 ? <LuChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden /> : null}
                    </li>
                ))}
            </ol>

            {step === 0 ? (
                <>
                    <LeaseDocumentPreview agreement={agreement} />
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                        <Button variant="outline" onClick={() => rejectLeaseAgreement(agreement.id, 'Declined by tenant') && onDecline()}>
                            <LuX className="mr-1.5 h-4 w-4" aria-hidden />
                            Decline
                        </Button>
                        <Button variant="primary" onClick={() => setStep(1)}>
                            I have read the document
                            <LuChevronRight className="ml-1.5 h-4 w-4" aria-hidden />
                        </Button>
                    </div>
                </>
            ) : null}

            {step === 1 ? (
                <>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">Lease summary</p>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <span className="text-slate-500">Property:</span> {agreement.propertyUnit}
                            </li>
                            <li>
                                <span className="text-slate-500">Period:</span> {formatLeasePeriod(agreement.leaseStartDate, agreement.leaseEndDate)}
                            </li>
                            <li>
                                <span className="text-slate-500">Rent:</span> {formatLeaseCurrency(agreement.monthlyRent)} / month
                            </li>
                            <li>
                                <span className="text-slate-500">Deposit:</span> {formatLeaseCurrency(agreement.securityDeposit)}
                            </li>
                        </ul>
                    </div>
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                        <input
                            type="checkbox"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-slate-700">
                            I agree to the lease terms, community rules, and authorize my electronic signature on this agreement via
                            DocuSign.
                        </span>
                    </label>
                    <div className="flex justify-between gap-2">
                        <Button variant="outline" onClick={() => setStep(0)}>
                            Back
                        </Button>
                        <Button variant="primary" disabled={!accepted} onClick={() => setStep(2)}>
                            Continue to sign
                        </Button>
                    </div>
                </>
            ) : null}

            {step === 2 ? (
                <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-sm font-semibold text-slate-900">Electronic signature</p>
                        <p className="mt-1 text-xs text-slate-500">Type your full legal name as it appears on your ID.</p>
                        <input
                            value={signature}
                            onChange={(e) => setSignature(e.target.value)}
                            className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold text-slate-900 focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                            placeholder="Full name"
                        />
                        <div
                            className="mt-4 flex min-h-[72px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4"
                            style={{ fontFamily: 'cursive', fontSize: '1.75rem', color: '#0f172a' }}
                        >
                            {signature.trim() || 'Your signature'}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                        <Button variant="outline" onClick={() => setStep(1)} disabled={submitting}>
                            Back
                        </Button>
                        <Button variant="primary" disabled={!signature.trim() || submitting} onClick={onSubmit}>
                            <LuSignature className="mr-1.5 h-4 w-4" aria-hidden />
                            {submitting ? 'Submitting…' : 'Submit signed agreement'}
                        </Button>
                    </div>
                </>
            ) : null}
        </div>
    );
}
