'use client';

import React from 'react';
import { LuCar, LuClock, LuHourglass, LuQrCode } from 'react-icons/lu';
import type { VisitorRequest } from './types';
import { VisitorPassShareActions } from './VisitorPassShareActions';
import { VisitorPassQr, visitorPassQrValue } from './VisitorPassQr';

export function VisitorRequestCard({
    visitor,
    onShowQr,
    onShareCopied,
    manageActions,
}: {
    visitor: VisitorRequest;
    onShowQr?: () => void;
    onShareCopied?: () => void;
    manageActions?: React.ReactNode;
}) {
    const isApproved = visitor.status === 'Approved';
    const qrValue = visitorPassQrValue(visitor.id, visitor.name);

    return (
        <article className="px-4 py-3.5 sm:px-5 mx-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">{visitor.name}</p>
                    {visitor.status === 'Rejected' ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800">
                            Revoked
                        </span>
                    ) : visitor.status === 'Pending' ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                            Pending
                        </span>
                    ) : null}
                </div>
                {visitor.purpose ? (
                    <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.55)]">{visitor.purpose}</p>
                ) : null}
                <p className="mt-1 text-xs text-[rgba(0,0,0,0.55)]">
                    {visitor.mobile} · {visitor.when}
                </p>
                {visitor.vehicle ? (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-[rgba(0,0,0,0.45)]">
                        <LuCar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {visitor.vehicle}
                    </p>
                ) : null}
            </div>
            {manageActions ? <div className="shrink-0">{manageActions}</div> : null}
            </div>

            {isApproved ? (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#c8e6d4] bg-[#f6fbf8] p-3">
                    <div className="shrink-0 rounded-md border border-[#e8e8e6] bg-white p-2">
                        <VisitorPassQr value={qrValue} size={72} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#057642]">Approved · show at gate</p>
                        <p className="mt-0.5 font-mono text-[11px] text-[rgba(0,0,0,0.5)]">{visitor.id}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[rgba(0,0,0,0.45)]">
                            <LuClock className="h-3 w-3 shrink-0" aria-hidden />
                            {visitor.when}
                        </p>
                        {onShowQr ? (
                            <button
                                type="button"
                                onClick={onShowQr}
                                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0a66c2] hover:underline"
                            >
                                <LuQrCode className="h-3.5 w-3.5" aria-hidden />
                                View full QR
                            </button>
                        ) : null}
                        <VisitorPassShareActions
                            visitor={visitor}
                            mobile={visitor.mobile}
                            className="mt-3"
                            onCopied={onShareCopied}
                        />
                    </div>
                </div>
            ) : visitor.status === 'Rejected' ? (
                <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-[#f5d0d0] bg-[#fff5f5] px-3 py-2.5">
                    <p className="text-xs font-medium text-[rgba(0,0,0,0.65)]">
                        Access revoked — QR and gate link are no longer valid. Contact your property office if this was a
                        mistake.
                    </p>
                </div>
            ) : (
                <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-[#f5dcc8] bg-[#fffaf6] px-3 py-2.5">
                    <LuHourglass className="h-4 w-4 shrink-0 text-[#c45d0a]" aria-hidden />
                    <p className="text-xs font-medium text-[rgba(0,0,0,0.65)]">Pass pending</p>
                </div>
            )}
        </article>
    );
}

/** @deprecated Use VisitorRequestCard */
export const VisitorPassCard = VisitorRequestCard;
