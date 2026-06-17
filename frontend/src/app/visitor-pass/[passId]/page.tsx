'use client';

import React, { use } from 'react';
import { useVisitorPass } from '@/hooks/useVisitorPass';
import { VisitorPassQr, visitorPassQrValue } from '@/modules/resident-portal/visitors';
import { VisitorPassShareActions } from '@/modules/resident-portal/visitors/VisitorPassShareActions';
import { LuCar, LuClock, LuMapPin, LuShieldCheck } from 'react-icons/lu';

export default function VisitorPassPublicPage({ params }: { params: Promise<{ passId: string }> }) {
    const { passId } = use(params);
    const pass = useVisitorPass(decodeURIComponent(passId));

    if (!pass) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-lg font-semibold text-gray-900">Pass not found</h1>
                    <p className="mt-2 text-sm text-gray-600">This visitor pass link may have expired or is invalid.</p>
                </div>
            </div>
        );
    }

    const approved = pass.status === 'Approved';
    const qrValue = visitorPassQrValue(pass.id, pass.name);

    return (
        <div className="min-h-screen bg-linear-to-b from-slate-50 to-white px-4 py-8">
            <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-emerald-800">
                    <LuShieldCheck className="h-5 w-5" aria-hidden />
                    <p className="text-sm font-semibold">{approved ? 'Approved gate pass' : 'Visitor pass'}</p>
                </div>
                <h1 className="text-xl font-bold text-gray-900">{pass.name}</h1>
                <p className="mt-1 text-sm text-gray-600">{pass.purpose ?? 'Guest visit'}</p>

                <dl className="mt-4 space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                        <LuClock className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                        <span>{pass.when}</span>
                    </div>
                    {pass.propertyUnit ? (
                        <div className="flex items-center gap-2">
                            <LuMapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                            <span>{pass.propertyUnit}</span>
                        </div>
                    ) : null}
                    {pass.vehicle ? (
                        <div className="flex items-center gap-2">
                            <LuCar className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                            <span className="font-mono text-xs tracking-wide">{pass.vehicle}</span>
                        </div>
                    ) : null}
                </dl>

                {approved ? (
                    <div className="mt-6 flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                        <VisitorPassQr value={qrValue} size={200} />
                        <p className="mt-3 font-mono text-xs text-gray-600">{pass.id}</p>
                        <p className="mt-2 text-center text-xs text-emerald-900">Show this screen at the security gate</p>
                    </div>
                ) : pass.status === 'Rejected' ? (
                    <p className="mt-6 rounded-lg bg-rose-50 px-3 py-2 text-center text-sm text-rose-900">
                        Access was revoked by property management. This QR link is no longer valid.
                    </p>
                ) : (
                    <p className="mt-6 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-900">
                        Pass is not active for entry.
                    </p>
                )}

                <p className="mt-4 text-center text-[11px] text-gray-500">
                    Resident: {pass.residentName}
                </p>

                {approved ? (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="mb-2 text-center text-xs font-semibold text-gray-600">Share this pass</p>
                        <VisitorPassShareActions visitor={pass} mobile={pass.mobile} layout="stack" />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
