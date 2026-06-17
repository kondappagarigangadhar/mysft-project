'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { ESignRequestEditForm } from '@/components/documents-compliance/ESignRequestEditForm';
import { useComplianceRole } from '@/hooks/useComplianceRole';
import { getESignById } from '@/lib/complianceDocumentsMockStore';

const ESIGN_BASE = '/company-admin/documents-compliance/esign';
const DOCS_BASE = '/company-admin/documents-compliance';
const ACTOR_NAME = 'Company Admin User';

export default function EditESignRequestPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { role } = useComplianceRole();
    const record = getESignById(id);
    const [savedToast, setSavedToast] = useState(false);
    const dismissSavedToast = () => setSavedToast(false);

    return (
        <>
            {savedToast ? (
                <InlineToast message="eSign request updated" variant="success" onDismiss={dismissSavedToast} />
            ) : null}
            <div className="min-h-0 w-full max-w-none bg-slate-50/50 pb-2">
                <div className="mb-4 w-full">
                    <Breadcrumb
                        items={[
                            { label: 'Documents & Compliance', href: DOCS_BASE },
                            { label: 'eSign', href: ESIGN_BASE },
                            { label: 'Edit request' },
                        ]}
                    />
                </div>
                <div className="mx-auto w-full max-w-4xl px-0 sm:px-0">
                    <header className="mb-3 rounded-xl border-b border-gray-200/80 bg-white px-4 py-3 lg:px-6">
                        <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Edit eSign request</h1>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Update linked document and signer for pending requests only — same layout as document upload.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push(ESIGN_BASE)}
                                className="inline-flex shrink-0 items-center rounded-md border border-blue-500/10 bg-blue-50/90 px-2 py-1 pt-1 text-sm font-semibold text-blue-600 transition hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35"
                            >
                                <span aria-hidden>←</span>
                                Back to eSign
                            </button>
                        </div>
                    </header>

                    <div className="mt-2">
                        {record ? (
                            <ESignRequestEditForm
                                open
                                esignId={id}
                                onCancel={() => router.push(ESIGN_BASE)}
                                onSuccess={() => {
                                    setSavedToast(true);
                                    window.setTimeout(() => {
                                        router.push(ESIGN_BASE);
                                    }, 900);
                                }}
                                actorName={ACTOR_NAME}
                                actorRole={role}
                            />
                        ) : (
                            <p className="text-sm text-slate-500">eSign request not found.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
