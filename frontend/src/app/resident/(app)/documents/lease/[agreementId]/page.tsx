'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useRentalLeaseStoreBump } from '@/hooks/useRentalLeaseStoreBump';
import {
    getLeaseAgreementById,
    leaseStatusBadgeClass,
    markLeaseAgreementViewed,
    residentCanAccessLease,
    triggerLeasePdfDownload,
} from '@/lib/rentalLeaseAgreementStore';
import { LeaseDocumentPreview } from '@/modules/resident-portal/documents/LeaseDocumentPreview';
import { LeaseSigningFlow } from '@/modules/resident-portal/documents/LeaseSigningFlow';
import { useResidentSession } from '@/modules/resident-portal/store/residentSessionStore';
import { cn } from '@/lib/utils';
import { LuArrowLeft, LuCheck, LuDownload, LuSignature } from 'react-icons/lu';

export default function ResidentLeaseAgreementPage() {
    useRentalLeaseStoreBump();
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { currentResident } = useResidentSession();
    const agreementId = decodeURIComponent(String(params.agreementId ?? ''));
    const agreement = getLeaseAgreementById(agreementId);
    const signMode = searchParams.get('mode') === 'sign';
    const [flowDone, setFlowDone] = React.useState(false);

    const portalOpts = useMemo(
        () =>
            currentResident
                ? { email: currentResident.email, residentSlug: currentResident.adminResidentSlug }
                : null,
        [currentResident],
    );

    useEffect(() => {
        if (!agreement || !currentResident) return;
        markLeaseAgreementViewed(agreement.id, currentResident.fullName);
    }, [agreement, currentResident]);

    if (!currentResident) {
        return (
            <p className="text-sm text-slate-600">
                Please{' '}
                <Link href="/resident/login" className="font-semibold text-orange-600 hover:underline">
                    sign in
                </Link>{' '}
                to view this agreement.
            </p>
        );
    }

    if (!agreement) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm font-semibold text-slate-900">Agreement not found</p>
                <Link href="/resident/documents?section=leases" className="mt-3 inline-block text-sm font-semibold text-orange-600 hover:underline">
                    Back to lease agreements
                </Link>
            </div>
        );
    }

    if (!portalOpts || !residentCanAccessLease(agreement, portalOpts)) {
        return (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
                <p className="text-sm font-semibold text-rose-900">This agreement is not assigned to your account.</p>
            </div>
        );
    }

    const isSigned = agreement.status === 'Signed' || flowDone;
    const canSign = !isSigned && ['Sent', 'Pending Signature', 'Viewed'].includes(agreement.status);

    if (isSigned && !signMode) {
        return (
            <div className="mx-auto max-w-3xl space-y-4">
                <BackLink />
                <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', leaseStatusBadgeClass('Signed'))}>
                                Signed
                            </span>
                            <h1 className="mt-2 text-lg font-semibold text-slate-900">{agreement.agreementName}</h1>
                            <p className="mt-1 text-sm text-slate-600">{agreement.agreementCode}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => triggerLeasePdfDownload(agreement, true)}>
                            <LuDownload className="mr-1.5 h-4 w-4" aria-hidden />
                            Download signed PDF
                        </Button>
                    </div>
                    <LeaseDocumentPreview agreement={agreement} signed className="mt-6" />
                </div>
            </div>
        );
    }

    if (signMode && canSign) {
        return (
            <div className="mx-auto max-w-3xl space-y-4">
                <BackLink />
                <header>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">DocuSign · Secure signing</p>
                    <h1 className="mt-1 text-lg font-semibold text-slate-900">{agreement.agreementName}</h1>
                </header>
                {flowDone ? (
                    <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                            <LuCheck className="h-7 w-7" aria-hidden />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">Agreement submitted</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Your signed lease has been saved. Community management has been notified.
                        </p>
                        <Button className="mt-6" variant="primary" onClick={() => router.push('/resident/documents?section=leases')}>
                            Back to agreements
                        </Button>
                    </div>
                ) : (
                    <LeaseSigningFlow
                        agreement={agreement}
                        signerName={currentResident.fullName}
                        onComplete={() => setFlowDone(true)}
                        onDecline={() => router.push('/resident/documents?section=leases')}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <BackLink />
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', leaseStatusBadgeClass(agreement.status))}>
                        {agreement.status}
                    </span>
                    <h1 className="mt-2 text-lg font-semibold text-slate-900">{agreement.agreementName}</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        {agreement.propertyUnit} · {agreement.agreementCode}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => triggerLeasePdfDownload(agreement, false)}>
                        <LuDownload className="mr-1.5 h-4 w-4" aria-hidden />
                        Download
                    </Button>
                    {canSign ? (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => router.push(`/resident/documents/lease/${encodeURIComponent(agreement.id)}?mode=sign`)}
                        >
                            <LuSignature className="mr-1.5 h-4 w-4" aria-hidden />
                            Review & Sign
                        </Button>
                    ) : null}
                </div>
            </header>

            <LeaseDocumentPreview agreement={agreement} />

            {canSign ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
                    <p className="font-semibold">Action required</p>
                    <p className="mt-1 text-amber-900/90">Please review the document above, then continue to e-sign and submit your lease.</p>
                    <Button
                        className="mt-3"
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/resident/documents/lease/${encodeURIComponent(agreement.id)}?mode=sign`)}
                    >
                        Start signing
                    </Button>
                </div>
            ) : null}
        </div>
    );
}

function BackLink() {
    return (
        <Link
            href="/resident/documents?section=leases"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
            <LuArrowLeft className="h-4 w-4" aria-hidden />
            Rental lease agreements
        </Link>
    );
}
