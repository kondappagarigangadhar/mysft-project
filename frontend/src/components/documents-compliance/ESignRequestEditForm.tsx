'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormCollapsibleSection } from '@/components/forms/FormCollapsibleSection';
import { CrmFieldProvider, InputField, SelectField } from '@/components/forms/Fields';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { DocumentFormStickyStatusFooter } from '@/components/documents-compliance/DocumentFormStickyStatusFooter';
import { CTA_LINK_UNDERLINE } from '@/lib/theme/ctaThemeClasses';
import { canESign } from '@/lib/complianceRbac';
import type { ComplianceDemoRole } from '@/lib/complianceRbac';
import {
    getESignById,
    listActiveDocuments,
    type ESignRecord,
    updateESignRequestMeta,
} from '@/lib/complianceDocumentsMockStore';
import { useComplianceStoreBump } from '@/hooks/useComplianceStoreBump';
import { LuFileText, LuShield, LuUser } from 'react-icons/lu';

const FORM_ID = 'esign-request-edit-form';

type ErrKey = 'documentId' | 'signerName';

function statusLabel(complete: boolean) {
    return {
        complete,
        summary: complete ? 'Complete — ready to save' : 'Missing · document and signer name',
    };
}

export function ESignRequestEditForm({
    open,
    esignId,
    onCancel,
    onSuccess,
    actorName,
    actorRole,
}: {
    open: boolean;
    esignId: string;
    onCancel: () => void;
    onSuccess?: () => void;
    actorName: string;
    actorRole: ComplianceDemoRole;
}) {
    const bump = useComplianceStoreBump();
    const [record, setRecord] = useState<ESignRecord | null>(null);
    const [docId, setDocId] = useState('');
    const [signerName, setSignerName] = useState('');
    const [errors, setErrors] = useState<Partial<Record<ErrKey, string>>>({});
    const [showValidationSummary, setShowValidationSummary] = useState(false);
    const [validationToast, setValidationToast] = useState<string | null>(null);
    const [submitShakeKey, setSubmitShakeKey] = useState(0);
    const [sectionOpen, setSectionOpen] = useState({ doc: true, meta: true });

    const dismissToast = useCallback(() => setValidationToast(null), []);

    const docs = useMemo(() => listActiveDocuments(), [bump]);

    useEffect(() => {
        if (!open) return;
        const r = getESignById(esignId);
        setRecord(r ?? null);
        if (r) {
            setDocId(r.documentId);
            setSignerName(r.signerName);
        }
        setErrors({});
        setShowValidationSummary(false);
        setValidationToast(null);
    }, [open, esignId]);

    useEffect(() => {
        if (Object.keys(errors).length === 0) {
            setShowValidationSummary(false);
            setValidationToast(null);
        }
    }, [errors]);

    const formStatus = useMemo(() => {
        const complete = Boolean(docId.trim() && signerName.trim());
        return statusLabel(complete);
    }, [docId, signerName]);

    const runValidate = (): Partial<Record<ErrKey, string>> => {
        const e: Partial<Record<ErrKey, string>> = {};
        if (!docId) e.documentId = 'Select a document.';
        if (!signerName.trim()) e.signerName = 'Signer name is required.';
        return e;
    };

    const onSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!canESign(actorRole)) {
            setValidationToast('Your role cannot edit eSign requests.');
            return;
        }
        const next = runValidate();
        setErrors(next);
        if (Object.keys(next).length) {
            setShowValidationSummary(true);
            setValidationToast(`Please complete ${Object.keys(next).length} required field(s).`);
            setSubmitShakeKey((k) => k + 1);
            setSectionOpen((s) => ({ ...s, doc: true, meta: true }));
            return;
        }
        const res = updateESignRequestMeta(esignId, { documentId: docId, signerName: signerName.trim() }, {
            name: actorName,
            role: actorRole,
        });
        if (!res.ok) {
            setValidationToast(res.error ?? 'Could not save.');
            return;
        }
        onSuccess?.();
    };

    const clearErr = (k: ErrKey) => {
        setErrors((p) => {
            if (!p[k]) return p;
            const n = { ...p };
            delete n[k];
            return n;
        });
    };

    if (!open) return null;

    if (!record) {
        return <p className="text-sm text-slate-500">eSign request not found.</p>;
    }

    if (record.status !== 'Pending') {
        return (
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
                Only <strong>Pending</strong> requests can be edited. This request is {record.status}.
            </div>
        );
    }

    const errDoc = errors.documentId ? 1 : 0;
    const errName = errors.signerName ? 1 : 0;
    const summaryKeys = showValidationSummary ? (['documentId', 'signerName'] as const).filter((k) => errors[k]) : [];

    return (
        <CrmFieldProvider>
            <>
                {validationToast ? (
                    <InlineToast message={validationToast} variant="error" onDismiss={dismissToast} />
                ) : null}
                <div className="w-full space-y-6 pb-8">
                    <form id={FORM_ID} onSubmit={onSubmit} className="space-y-6">
                        <p className="text-xs text-slate-500">
                            <span className="text-rose-500">*</span> Required. Request ID and Aadhaar are fixed after creation in this
                            demo.
                        </p>

                        {showValidationSummary && summaryKeys.length > 0 ? (
                            <div
                                className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950 shadow-sm"
                                role="alert"
                            >
                                <p className="font-semibold">Please complete the following.</p>
                                <p className="mt-2 text-[13px] font-medium text-amber-900/95">
                                    {summaryKeys.map((f, i) => (
                                        <span key={f}>
                                            {i > 0 ? <span className="mx-1 text-amber-800/40">·</span> : null}
                                            <button
                                                type="button"
                                                className={CTA_LINK_UNDERLINE}
                                                onClick={() => {
                                                    if (f === 'documentId') setSectionOpen((s) => ({ ...s, doc: true }));
                                                    if (f === 'signerName') setSectionOpen((s) => ({ ...s, meta: true }));
                                                }}
                                            >
                                                {f === 'documentId' ? 'Document' : 'Signer name'}
                                            </button>
                                        </span>
                                    ))}
                                </p>
                            </div>
                        ) : null}

                        <FormCollapsibleSection
                            layout="card"
                            title="Request reference"
                            icon={LuShield}
                            tone="slate"
                            defaultOpen
                        >
                            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Request ID</p>
                                    <p className="mt-0.5 font-mono text-xs text-slate-900">{record.id}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Transaction</p>
                                    <p className="mt-0.5 font-mono text-xs text-slate-900">{record.transactionId}</p>
                                </div>
                                <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Aadhaar (masked)</p>
                                    <p className="mt-0.5 font-mono text-xs text-slate-800">{record.aadhaarMasked}</p>
                                </div>
                            </div>
                        </FormCollapsibleSection>

                        <FormCollapsibleSection
                            layout="card"
                            title="Document"
                            icon={LuFileText}
                            tone="blue"
                            open={sectionOpen.doc}
                            onOpenChange={(o) => setSectionOpen((s) => ({ ...s, doc: o }))}
                            headerRight={
                                errDoc > 0 ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                                        Required
                                    </span>
                                ) : null
                            }
                        >
                            <SelectField
                                id="esign-edit-document"
                                label="Linked document"
                                required
                                value={docId}
                                onChange={(e) => {
                                    setDocId(e.target.value);
                                    clearErr('documentId');
                                }}
                                options={docs.map((d) => ({ value: d.id, label: `${d.name} (${d.id})` }))}
                                placeholder="—"
                                error={errors.documentId}
                            />
                        </FormCollapsibleSection>

                        <FormCollapsibleSection
                            layout="card"
                            title="Signer"
                            icon={LuUser}
                            tone="amber"
                            open={sectionOpen.meta}
                            onOpenChange={(o) => setSectionOpen((s) => ({ ...s, meta: o }))}
                            headerRight={
                                errName > 0 ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                                        Required
                                    </span>
                                ) : null
                            }
                        >
                            <InputField
                                id="esign-edit-signer"
                                name="signerName"
                                label="Signer name"
                                required
                                value={signerName}
                                onChange={(e) => {
                                    setSignerName(e.target.value);
                                    clearErr('signerName');
                                }}
                                error={errors.signerName}
                            />
                        </FormCollapsibleSection>

                        <DocumentFormStickyStatusFooter
                            formId={FORM_ID}
                            formStatus={formStatus}
                            onCancel={onCancel}
                            submitLabel="Save changes"
                            submitShakeKey={submitShakeKey}
                        />
                    </form>
                </div>
            </>
        </CrmFieldProvider>
    );
}
