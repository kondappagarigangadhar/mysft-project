'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { useVisitorRequests } from '@/hooks/useVisitorRequests';
import type { StoredVisitorRequest } from '@/lib/visitorRequestStore';
import type { Resident } from '@/lib/residentStore';
import { residentSectionFeedList } from '@/modules/resident-portal/styles/cardStyles';
import {
    VisitorPassConfirmModal,
    VisitorPassFormModal,
    VisitorPassManageActions,
    VisitorPassQr,
    VisitorPassShareActions,
    VisitorRequestCard,
    visitorPassQrValue,
} from '@/modules/resident-portal/visitors';
import type { VisitorPassFormValues } from '@/modules/resident-portal/visitors';
import { LuClock, LuPlus, LuShieldAlert, LuUsers } from 'react-icons/lu';

type Props = {
    resident: Resident;
};

type FormModalState = null | { mode: 'create' } | { mode: 'edit'; pass: StoredVisitorRequest };

export function ResidentVisitorsTab({ resident }: Props) {
    const { requests, addRequest, updateRequest, deleteRequest, revokeRequest } = useVisitorRequests(resident.slug);
    const [formModal, setFormModal] = useState<FormModalState>(null);
    const [qrModalPass, setQrModalPass] = useState<StoredVisitorRequest | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<StoredVisitorRequest | null>(null);
    const [revokeTarget, setRevokeTarget] = useState<StoredVisitorRequest | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const activeCount = requests.filter((r) => r.status === 'Approved').length;
    const formPass = formModal?.mode === 'edit' ? formModal.pass : null;
    const isCreateForm = formModal?.mode === 'create';

    const handleFormSubmit = (values: VisitorPassFormValues) => {
        if (formModal?.mode === 'create') {
            const created = addRequest({
                residentName: resident.fullName,
                propertyUnit: resident.propertyUnit,
                name: values.name,
                mobile: values.mobile,
                vehicle: values.vehicle,
                when: values.when,
                purpose: values.purpose ?? 'Guest visit',
                status: 'Approved',
                requestedAt: 'Added by admin',
            });
            if (created) {
                setNotice(`Added visitor pass for ${created.name}.`);
            }
            return;
        }
        if (formModal?.mode === 'edit') {
            updateRequest(formModal.pass.id, values);
            setNotice(`Updated pass for ${values.name}.`);
        }
    };

    return (
        <div className="w-full min-w-0 space-y-4">
            <Card className="border border-gray-200 p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <LuUsers className="h-5 w-5 text-gray-500" aria-hidden />
                            Visitor passes
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Passes for {resident.propertyUnit || 'this unit'} — from the resident portal or added here.
                            Revoke access if an unwanted guest should not enter.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setFormModal({ mode: 'create' })}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0092ff] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#007ad6]"
                        >
                            <LuPlus className="h-3.5 w-3.5" aria-hidden />
                            Add visitor
                        </button>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
                            {activeCount} active
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">
                            {requests.length} total
                        </span>
                    </div>
                </div>
            </Card>

            {notice ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p>
            ) : null}

            <Card className="overflow-hidden border border-gray-200 shadow-sm" contentClassName="p-0">
                {requests.length === 0 ? (
                    <div className="px-4 py-10 text-center sm:px-5">
                        <p className="text-sm text-gray-500">No visitor passes yet.</p>
                        <button
                            type="button"
                            onClick={() => setFormModal({ mode: 'create' })}
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0092ff] hover:underline"
                        >
                            <LuPlus className="h-4 w-4" aria-hidden />
                            Add visitor pass
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
                                    manageActions={
                                        <VisitorPassManageActions
                                            visitor={visitor}
                                            mode="admin"
                                            onEdit={() => setFormModal({ mode: 'edit', pass: visitor })}
                                            onDelete={() => setDeleteTarget(visitor)}
                                            onRevoke={() => setRevokeTarget(visitor)}
                                        />
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card className="border border-amber-100 bg-amber-50/40 p-4 shadow-sm sm:p-5">
                <p className="flex items-start gap-2 text-sm text-amber-950">
                    <LuShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                        <strong>Add visitor</strong> creates an approved pass for this unit. <strong>Revoke access</strong>{' '}
                        blocks gate entry. Residents can also manage passes from the portal.
                    </span>
                </p>
            </Card>

            <Modal
                isOpen={qrModalPass !== null}
                onClose={() => setQrModalPass(null)}
                title={qrModalPass ? qrModalPass.name : 'Visitor pass'}
                maxWidthClassName="max-w-sm"
                bodyClassName="flex flex-col items-center text-center"
            >
                {qrModalPass ? (
                    <>
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <VisitorPassQr
                                value={visitorPassQrValue(qrModalPass.id, qrModalPass.name)}
                                size={180}
                            />
                        </div>
                        <p className="mt-3 font-mono text-xs text-gray-500">{qrModalPass.id}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
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

            <VisitorPassFormModal
                pass={formPass}
                isOpen={formModal !== null}
                onClose={() => setFormModal(null)}
                onSubmit={handleFormSubmit}
                createTitle="Add visitor"
                submitLabel={isCreateForm ? 'Add visitor pass' : 'Save changes'}
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
                        setNotice(`Deleted pass for ${deleteTarget.name}.`);
                    }
                }}
            />

            <VisitorPassConfirmModal
                pass={revokeTarget}
                variant="revoke"
                isOpen={revokeTarget !== null}
                onClose={() => setRevokeTarget(null)}
                onConfirm={() => {
                    if (!revokeTarget) return;
                    revokeRequest(revokeTarget.id);
                    if (qrModalPass?.id === revokeTarget.id) setQrModalPass(null);
                    setNotice(`Revoked gate access for ${revokeTarget.name}.`);
                }}
            />
        </div>
    );
}
