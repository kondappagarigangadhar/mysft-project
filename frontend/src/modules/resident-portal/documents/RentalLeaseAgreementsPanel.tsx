'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRentalLeaseStoreBump } from '@/hooks/useRentalLeaseStoreBump';
import {
    formatLeasePeriod,
    getDocuSignSigningUrl,
    getLeaseAgreementViewUrl,
    getLeaseAgreementsForPortal,
    isLeaseExpiringSoon,
    leaseStatusBadgeClass,
    triggerLeasePdfDownload,
    type RentalLeaseAgreement,
} from '@/lib/rentalLeaseAgreementStore';
import { residentInputClass } from '@/modules/resident-portal/components/ResidentPageShell';
import { residentSectionFeedList } from '@/modules/resident-portal/styles/cardStyles';
import { cn } from '@/lib/utils';
import { LuArrowRight, LuDownload, LuFileText, LuSearch, LuSignature } from 'react-icons/lu';

type Props = {
    residentEmail: string;
    residentName: string;
    adminResidentSlug?: string;
};

export function RentalLeaseAgreementsPanel({ residentEmail, residentName, adminResidentSlug }: Props) {
    useRentalLeaseStoreBump();
    const [q, setQ] = useState('');

    const agreements = useMemo(
        () => getLeaseAgreementsForPortal({ email: residentEmail, residentSlug: adminResidentSlug }),
        [residentEmail, adminResidentSlug],
    );

    const filtered = agreements.filter((a) => {
        if (!q.trim()) return true;
        const needle = q.trim().toLowerCase();
        return (
            a.agreementName.toLowerCase().includes(needle) ||
            a.propertyUnit.toLowerCase().includes(needle) ||
            a.agreementCode.toLowerCase().includes(needle)
        );
    });

    return (
        <div className="space-y-4">
            <div className="relative">
                <LuSearch
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.45)]"
                    aria-hidden
                />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search lease agreements…"
                    className={residentInputClass}
                />
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#e0dfdc] bg-[#fafafa] px-4 py-10 text-center">
                    <LuSignature className="mx-auto h-8 w-8 text-[rgba(0,0,0,0.35)]" aria-hidden />
                    <p className="mt-3 text-sm font-semibold text-[rgba(0,0,0,0.9)]">No lease agreements yet</p>
                    <p className="mt-1 text-sm text-[rgba(0,0,0,0.55)]">
                        When your manager sends a lease, it will appear here for review and signing.
                    </p>
                </div>
            ) : (
                <ul className={cn(residentSectionFeedList, '-mx-4 sm:-mx-5')}>
                    {filtered.map((a) => (
                        <li key={a.id}>
                            <LeaseAgreementRow agreement={a} residentName={residentName} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function LeaseAgreementRow({ agreement, residentName }: { agreement: RentalLeaseAgreement; residentName: string }) {
    const canSign = ['Sent', 'Pending Signature', 'Viewed'].includes(agreement.status);
    const isSigned = agreement.status === 'Signed';
    const expiring = isLeaseExpiringSoon(agreement);
    const viewHref = getLeaseAgreementViewUrl(agreement.id);
    const signHref = getDocuSignSigningUrl(agreement.id);

    return (
        <article className="px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#d4e4f2] bg-[#e8f1fb] text-[#0a66c2]">
                        <LuFileText className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">{agreement.agreementName}</p>
                        <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.55)]">{agreement.propertyUnit}</p>
                        <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.45)]">
                            {formatLeasePeriod(agreement.leaseStartDate, agreement.leaseEndDate)}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', leaseStatusBadgeClass(agreement.status))}>
                                {agreement.status}
                            </span>
                            {expiring ? (
                                <span className="rounded-md border border-[#f5dcc8] bg-[#fef0e3] px-2 py-0.5 text-xs font-medium text-[#c45d0a]">
                                    Expiring soon
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
                    <Link
                        href={viewHref}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e0dfdc] px-3 text-xs font-semibold text-[rgba(0,0,0,0.75)] transition-colors hover:border-[#d0cfcc] hover:bg-[#f8f8f6]"
                    >
                        Open
                        <LuArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                    {canSign ? (
                        <Link
                            href={signHref}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0a66c2] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#004182]"
                        >
                            <LuSignature className="h-3.5 w-3.5" aria-hidden />
                            Sign
                        </Link>
                    ) : null}
                    {isSigned ? (
                        <Link
                            href={viewHref}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#c8e6d4] bg-[#f6fbf8] px-3 text-xs font-semibold text-[#057642] transition-colors hover:bg-[#e3f2ea]"
                        >
                            Signed copy
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => triggerLeasePdfDownload(agreement, isSigned)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e0dfdc] px-3 text-xs font-semibold text-[rgba(0,0,0,0.75)] transition-colors hover:border-[#d0cfcc] hover:bg-[#f8f8f6]"
                        >
                            <LuDownload className="h-3.5 w-3.5" aria-hidden />
                            PDF
                        </button>
                    )}
                </div>
            </div>
            {agreement.sentDate ? (
                <p className="mt-3 border-t border-[#ebebeb] pt-3 text-[11px] text-[rgba(0,0,0,0.45)]">
                    Sent {new Date(agreement.sentDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                    {residentName}
                </p>
            ) : null}
        </article>
    );
}
