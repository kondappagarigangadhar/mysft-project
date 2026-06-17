'use client';

import React, { useState } from 'react';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { Modal } from '@/components/ui/Modal';
import { useVisitorRequests } from '@/hooks/useVisitorRequests';
import { DEMO_RESIDENT_PROFILE, DEMO_RESIDENT_SLUG } from '@/lib/residentDemoProfile';
import { SectionCard } from '@/modules/resident-portal/components/SectionCard';
import { ResidentPageHeader, ResidentPageShell } from '@/modules/resident-portal/components/ResidentPageShell';
import { useResidentSession } from '@/modules/resident-portal/store/residentSessionStore';
import { residentSectionFeedList } from '@/modules/resident-portal/styles/cardStyles';
import {
    VisitorPassConfirmModal,
    VisitorPassFormModal,
    VisitorPassManageActions,
    VisitorPassQr,
    VisitorPassShareActions,
    VisitorRequestCard,
    visitorPassQrValue,
    copyTextToClipboard,
    getVisitorPassPageUrl,
    shareVisitorPassNative,
} from '@/modules/resident-portal/visitors';
import type { VisitorPassFormValues } from '@/modules/resident-portal/visitors';
import type { StoredVisitorRequest } from '@/lib/visitorRequestStore';
import { LuClock, LuQrCode, LuUserPlus, LuUsers } from 'react-icons/lu';

type FormModalState = null | { mode: 'create' } | { mode: 'edit'; pass: StoredVisitorRequest };

export default function ResidentVisitorsPage() {
    const { currentResident } = useResidentSession();
    const adminSlug = currentResident?.adminResidentSlug ?? DEMO_RESIDENT_SLUG;
    const { requests, addRequest, updateRequest, deleteRequest, isLinked } = useVisitorRequests(adminSlug);

    const [formModal, setFormModal] = useState<FormModalState>(null);
    const [qrModalPass, setQrModalPass] = useState<StoredVisitorRequest | null>(null);
    const [shareModalPass, setShareModalPass] = useState<StoredVisitorRequest | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<StoredVisitorRequest | null>(null);
    const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

    const residentName = currentResident?.fullName ?? DEMO_RESIDENT_PROFILE.fullName;
    const propertyUnit = DEMO_RESIDENT_PROFILE.propertyUnit;

    const notifyShare = async (pass: StoredVisitorRequest) => {
        const passUrl = getVisitorPassPageUrl(pass.id);
        const copied = await copyTextToClipboard(passUrl);
        const native = await shareVisitorPassNative(pass, passUrl);
        if (native === 'shared') {
            setToast({ message: 'Pass shared successfully.', variant: 'success' });
        } else if (copied) {
            setToast({ message: 'Pass link copied — send it to your visitor (WhatsApp or SMS below).', variant: 'success' });
        } else {
            setToast({ message: 'Pass created. Use the share buttons below.', variant: 'success' });
        }
        setShareModalPass(pass);
    };

    const handleFormSubmit = (values: VisitorPassFormValues) => {
        if (formModal?.mode === 'create') {
            if (!isLinked) return;
            const created = addRequest({
                residentName,
                propertyUnit,
                name: values.name,
                mobile: values.mobile,
                vehicle: values.vehicle,
                when: values.when,
                status: 'Approved',
                purpose: values.purpose ?? 'Guest visit',
                requestedAt: 'Just now',
            });
            if (!created) return;
            void notifyShare(created);
            return;
        }
        if (formModal?.mode === 'edit') {
            updateRequest(formModal.pass.id, values);
            setToast({ message: 'Visitor pass updated.', variant: 'success' });
        }
    };

    const formPass = formModal?.mode === 'edit' ? formModal.pass : null;
    const formOpen = formModal !== null;

    return (
        <ResidentPageShell>
            <ResidentPageHeader
                icon={<LuUsers className="h-5 w-5" aria-hidden />}
                title="Visitors"
                subtitle="Invite guests — share a QR link they can open on their phone."
            />

            <SectionCard
                title="Visitor passes"
                subtitle="Share link with guest — they can show QR at the gate"
                accent="emerald"
                icon={<LuQrCode className="h-4 w-4" />}
                bodyClassName="p-0"
                action={
                    <button
                        type="button"
                        onClick={() => setFormModal({ mode: 'create' })}
                        disabled={!isLinked}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0a66c2] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <LuUserPlus className="h-3.5 w-3.5" aria-hidden />
                        Invite visitor
                    </button>
                }
            >
                {requests.length === 0 ? (
                    <div className="px-4 py-10 text-center sm:px-5">
                        <p className="text-sm text-[rgba(0,0,0,0.55)]">No passes yet.</p>
                        <button
                            type="button"
                            onClick={() => setFormModal({ mode: 'create' })}
                            disabled={!isLinked}
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a66c2] hover:underline disabled:opacity-50"
                        >
                            <LuUserPlus className="h-4 w-4" aria-hidden />
                            Invite your first visitor
                        </button>
                    </div>
                ) : (
                    <ul className={residentSectionFeedList}>
                        {requests.map((visitor) => (
                            <li key={visitor.id}>
                                <VisitorRequestCard
                                    visitor={visitor}
                                    onShowQr={
                                        visitor.status === 'Approved' ? () => setQrModalPass(visitor) : undefined
                                    }
                                    onShareCopied={() =>
                                        setToast({ message: 'Pass link copied.', variant: 'success' })
                                    }
                                    manageActions={
                                        <VisitorPassManageActions
                                            visitor={visitor}
                                            mode="resident"
                                            onEdit={() => setFormModal({ mode: 'edit', pass: visitor })}
                                            onDelete={() => setDeleteTarget(visitor)}
                                        />
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            <Modal
                isOpen={qrModalPass !== null}
                onClose={() => setQrModalPass(null)}
                title={qrModalPass ? qrModalPass.name : 'Visitor pass'}
                maxWidthClassName="max-w-sm"
                bodyClassName="flex flex-col items-center text-center"
            >
                {qrModalPass ? (
                    <>
                        <div className="rounded-xl border border-[#e0dfdc] bg-white p-4">
                            <VisitorPassQr
                                value={visitorPassQrValue(qrModalPass.id, qrModalPass.name)}
                                size={180}
                            />
                        </div>
                        <p className="mt-3 font-mono text-xs text-[rgba(0,0,0,0.55)]">{qrModalPass.id}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-[rgba(0,0,0,0.55)]">
                            <LuClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {qrModalPass.when}
                        </p>
                        <VisitorPassShareActions
                            visitor={qrModalPass}
                            mobile={qrModalPass.mobile}
                            layout="stack"
                            className="mt-4 w-full"
                        />
                    </>
                ) : null}
            </Modal>

            <Modal
                isOpen={shareModalPass !== null}
                onClose={() => setShareModalPass(null)}
                title="Share with visitor"
                maxWidthClassName="max-w-sm"
                bodyClassName="flex flex-col items-center text-center"
            >
                {shareModalPass ? (
                    <>
                        <p className="text-sm text-gray-600">
                            Send this link to <strong>{shareModalPass.name}</strong> so they can open the QR on their phone at
                            the gate.
                        </p>
                        <VisitorPassShareActions
                            visitor={shareModalPass}
                            mobile={shareModalPass.mobile}
                            layout="stack"
                            className="mt-4 w-full"
                        />
                    </>
                ) : null}
            </Modal>

            <VisitorPassFormModal
                pass={formPass}
                isOpen={formOpen}
                onClose={() => setFormModal(null)}
                onSubmit={handleFormSubmit}
                disabled={!isLinked}
            />

            <VisitorPassConfirmModal
                pass={deleteTarget}
                variant="delete"
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (!deleteTarget) return;
                    if (deleteRequest(deleteTarget.id)) {
                        if (qrModalPass?.id === deleteTarget.id) setQrModalPass(null);
                        if (shareModalPass?.id === deleteTarget.id) setShareModalPass(null);
                        setToast({ message: 'Visitor pass deleted.', variant: 'success' });
                    }
                }}
            />

            {toast ? (
                <InlineToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
            ) : null}
        </ResidentPageShell>
    );
}
