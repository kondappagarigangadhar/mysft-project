'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CrmFieldProvider, InputField, SelectField } from '@/components/forms/Fields';
import { cn } from '@/lib/utils';
import {
    CTA_CHECKBOX_SM,
    CTA_FLOW_ICON_TILE,
    CTA_INFO_STRIP,
    CTA_LINK_UNDERLINE,
} from '@/lib/theme/ctaThemeClasses';
import { useComplianceStoreBump } from '@/hooks/useComplianceStoreBump';
import { useComplianceRole } from '@/hooks/useComplianceRole';
import { canESign } from '@/lib/complianceRbac';
import {
    createESignRequest,
    DEMO_ESIGN_OTP,
    finalizeESignAfterReview,
    listActiveDocuments,
    requestOtpForESign,
    updateESignSignaturePlacement,
    verifyEsignOtpOnly,
    type ESignRecord,
} from '@/lib/complianceDocumentsMockStore';
import { ESignAuditTimeline, type ESignAuditPhase } from './ESignAuditTimeline';
import { ESignFooterActions } from './ESignFooterActions';
import { ESignPageShell } from './ESignPageShell';
import { ESignStepHeader, type ESignStepDef } from './ESignStepHeader';
import { LuDownload, LuFileText, LuHistory, LuPenLine, LuRotateCcw } from 'react-icons/lu';

const STEPS: ESignStepDef[] = [
    { id: 'doc', label: 'Document', shortLabel: 'Document' },
    { id: 'signer', label: 'Signer details', shortLabel: 'Signer' },
    { id: 'otp', label: 'OTP verification', shortLabel: 'OTP' },
    { id: 'sig', label: 'Signature placement', shortLabel: 'Sign' },
    { id: 'rev', label: 'Review', shortLabel: 'Review' },
];

const ACTOR_NAME = 'Company Admin User';
const PREVIEW_W = 340;
const PREVIEW_H = 400;
const SIG_BOX_W = 144;
const SIG_BOX_H = 56;

function maskInput(d: string): string {
    return d.replace(/\D/g, '').slice(0, 12);
}

function formatAadhaarField(aadhaar: string): string {
    if (aadhaar.length === 12) {
        return `XXXX XXXX ${aadhaar.slice(8)}`;
    }
    return aadhaar.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function clampPct(n: number, lo = 4, hi = 92) {
    return Math.min(hi, Math.max(lo, n));
}

function percentToDefaultDrag(xPct: number, yPct: number) {
    return {
        x: (xPct / 100) * PREVIEW_W - SIG_BOX_W / 2,
        y: (yPct / 100) * PREVIEW_H - SIG_BOX_H / 2,
    };
}

function initialStepDone(): boolean[] {
    return STEPS.map(() => false);
}

export function ESignWorkflowDrawer({
    open,
    onDismiss,
    onSuccess,
    embeddedInCompanyPage = false,
}: {
    open: boolean;
    onDismiss: () => void;
    onSuccess?: () => void;
    /** Set when rendering under the company-admin page shell (breadcrumb + H1) — hides duplicate page header. */
    embeddedInCompanyPage?: boolean;
}) {
    const router = useRouter();
    const bump = useComplianceStoreBump();
    const { role } = useComplianceRole();

    const [activeIndex, setActiveIndex] = useState(0);
    const [stepDone, setStepDone] = useState(initialStepDone);
    const [flowError, setFlowError] = useState<string | null>(null);

    const [docId, setDocId] = useState('');
    const [signerName, setSignerName] = useState('');
    const [aadhaar, setAadhaar] = useState('');
    const [consent, setConsent] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [timer, setTimer] = useState(0);
    const timerRef = useRef<number | null>(null);
    const [activeEsignId, setActiveEsignId] = useState<string | null>(null);
    const [placementSaved, setPlacementSaved] = useState(false);

    const [pos, setPos] = useState({ x: 58, y: 72 });
    const [sigPage, setSigPage] = useState(1);
    const [sigResetKey, setSigResetKey] = useState(0);
    const previewRef = useRef<HTMLDivElement>(null);
    const dragNodeRef = useRef<HTMLDivElement>(null);

    const [submitting, setSubmitting] = useState(false);
    const [successRecord, setSuccessRecord] = useState<ESignRecord | null>(null);

    const docs = useMemo(() => listActiveDocuments(), [bump]);

    const selectedDoc = useMemo(() => docs.find((d) => d.id === docId), [docs, docId]);

    const startTimer = useCallback(() => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        setTimer(120);
        timerRef.current = window.setInterval(() => {
            setTimer((t) => {
                if (t <= 1) {
                    if (timerRef.current) window.clearInterval(timerRef.current);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, []);

    const resetFlow = useCallback(() => {
        setActiveIndex(0);
        setStepDone(initialStepDone());
        setFlowError(null);
        setDocId('');
        setSignerName('');
        setAadhaar('');
        setConsent(false);
        setOtp('');
        setOtpVerified(false);
        setTimer(0);
        setActiveEsignId(null);
        setPlacementSaved(false);
        setPos({ x: 58, y: 72 });
        setSigPage(1);
        setSigResetKey((k) => k + 1);
        setSuccessRecord(null);
        setSubmitting(false);
    }, []);

    useEffect(() => {
        if (!open) resetFlow();
    }, [open, resetFlow]);

    const markStepDone = (i: number) => {
        setStepDone((prev) => {
            const n = [...prev];
            n[i] = true;
            return n;
        });
    };

    const handleDragStop = useCallback(
        (_: unknown, data: { x: number; y: number; node: HTMLElement }) => {
            const parent = previewRef.current;
            if (!parent) return;
            const pr = parent.getBoundingClientRect();
            const nr = data.node.getBoundingClientRect();
            const cx = ((nr.left + nr.width / 2 - pr.left) / pr.width) * 100;
            const cy = ((nr.top + nr.height / 2 - pr.top) / pr.height) * 100;
            setPos({ x: clampPct(cx), y: clampPct(cy) });
        },
        [],
    );

    const onResendOtp = () => {
        setFlowError(null);
        if (!activeEsignId) return;
        requestOtpForESign(activeEsignId);
        startTimer();
    };

    const sendOtpCreateRequest = () => {
        setFlowError(null);
        if (!canESign(role)) {
            setFlowError('Your role cannot initiate eSign.');
            return;
        }
        if (!docId || !signerName.trim() || aadhaar.length !== 12 || !consent) {
            setFlowError('Complete signer details and consent.');
            return;
        }
        const row = createESignRequest(
            {
                documentId: docId,
                signerName: signerName.trim(),
                aadhaar12: aadhaar,
                signatureXPercent: 50,
                signatureYPercent: 50,
            },
            { name: ACTOR_NAME, role },
        );
        setActiveEsignId(row.id);
        startTimer();
        setOtp('');
        setOtpVerified(false);
        markStepDone(1);
        setActiveIndex(2);
    };

    const verifyOtpAction = () => {
        setFlowError(null);
        if (!activeEsignId) {
            setFlowError('Send OTP first.');
            return;
        }
        const res = verifyEsignOtpOnly(activeEsignId, otp, { name: ACTOR_NAME, role });
        if (!res.ok) {
            setFlowError(res.error ?? 'Invalid OTP.');
            return;
        }
        setOtpVerified(true);
        markStepDone(2);
    };

    const savePlacementAndAdvance = () => {
        setFlowError(null);
        if (!activeEsignId || !otpVerified) {
            setFlowError('Verify OTP before placing signature.');
            return;
        }
        const res = updateESignSignaturePlacement(activeEsignId, pos.x, pos.y, sigPage, { name: ACTOR_NAME, role });
        if (!res.ok) {
            setFlowError(res.error ?? 'Could not save placement.');
            return;
        }
        setPlacementSaved(true);
        markStepDone(3);
        setActiveIndex(4);
    };

    const confirmSign = async () => {
        setFlowError(null);
        if (!activeEsignId) return;
        setSubmitting(true);
        try {
            const res = finalizeESignAfterReview(activeEsignId, { name: ACTOR_NAME, role });
            if (!res.ok || !res.record) {
                setFlowError(res.error ?? 'Could not finalize.');
                return;
            }
            markStepDone(4);
            setSuccessRecord(res.record);
            onSuccess?.();
        } finally {
            setSubmitting(false);
        }
    };

    const auditPhases = useMemo(() => {
        const s = new Set<ESignAuditPhase>();
        if (activeEsignId) s.add('created');
        if (otpVerified) s.add('otp');
        if (placementSaved) s.add('placed');
        if (successRecord) {
            s.add('signed');
            s.add('locked');
        }
        return s;
    }, [activeEsignId, otpVerified, placementSaved, successRecord]);

    const defaultDrag = useMemo(() => percentToDefaultDrag(pos.x, pos.y), [pos, sigResetKey]);

    const footerPrimary = () => {
        if (activeIndex === 0) {
            return {
                label: 'Next',
                variant: 'companyOutline' as const,
                disabled: !docId,
                onClick: () => {
                    setFlowError(null);
                    if (!docId) return;
                    markStepDone(0);
                    setActiveIndex(1);
                },
            };
        }
        if (activeIndex === 1) {
            return {
                label: 'Send OTP',
                variant: 'company' as const,
                disabled: !canESign(role) || !signerName.trim() || aadhaar.length !== 12 || !consent,
                onClick: sendOtpCreateRequest,
            };
        }
        if (activeIndex === 2) {
            return {
                label: 'Next',
                variant: 'companyOutline' as const,
                disabled: !otpVerified,
                onClick: () => {
                    setFlowError(null);
                    if (!otpVerified) return;
                    setActiveIndex(3);
                },
            };
        }
        if (activeIndex === 3) {
            return {
                label: 'Next',
                variant: 'companyOutline' as const,
                disabled: false,
                onClick: savePlacementAndAdvance,
            };
        }
        return {
            label: 'Confirm & sign',
            variant: 'company' as const,
            disabled: false,
            onClick: confirmSign,
        };
    };

    const fp = footerPrimary();

    if (!open) return null;

    const shellProps = embeddedInCompanyPage
        ? { className: 'rounded-xl border-slate-200/80 shadow-sm ring-slate-200/60', minHeightClass: 'min-h-[min(64vh,640px)]' as const }
        : { minHeightClass: 'min-h-[min(70vh,720px)]' as const };

    if (successRecord) {
        return (
            <ESignPageShell {...shellProps}>
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="shrink-0 space-y-2 border-b border-slate-200/80 bg-linear-to-b from-emerald-50/40 to-white px-4 py-5 sm:px-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">eSign</p>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Document signed successfully</h2>
                            <p className="mt-1 text-xs text-slate-600">
                                Transaction <span className="font-mono text-slate-800">{successRecord.transactionId}</span>
                            </p>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
                        <ESignAuditTimeline completedPhases={new Set(['created', 'otp', 'placed', 'signed', 'locked'])} />
                        <div className="flex flex-col gap-2">
                            <Button
                                type="button"
                                variant="company"
                                size="cta"
                                className="w-full gap-2"
                                onClick={() => {
                                    if (successRecord.signedStorageUrl) {
                                        window.open(successRecord.signedStorageUrl, '_blank', 'noopener,noreferrer');
                                    }
                                }}
                                disabled={!successRecord.signedStorageUrl}
                            >
                                <LuDownload className="h-4 w-4" />
                                Download signed PDF
                            </Button>
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="cta"
                                className="w-full gap-2"
                                onClick={() => router.push('/company-admin/documents-compliance/audit')}
                            >
                                <LuHistory className="h-4 w-4" />
                                View audit log
                            </Button>
                        </div>
                    </div>
                    <ESignFooterActions
                        showBack={false}
                        onBack={() => {}}
                        primaryLabel="Back to eSign"
                        primaryVariant="company"
                        onPrimary={onDismiss}
                    />
                </div>
            </ESignPageShell>
        );
    }

    return (
        <ESignPageShell {...shellProps}>
            <div className="flex min-h-0 flex-1 flex-col">
                {embeddedInCompanyPage ? null : (
                    <header className="shrink-0 border-b border-slate-200/80 bg-linear-to-b from-slate-50/90 to-white px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--cta-button-bg)]">
                                    Documents & compliance
                                </p>
                                <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">New eSign request</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                                    Step-by-step Aadhaar eSign (mock). Demo OTP is always{' '}
                                    <span className="rounded bg-white px-1.5 py-0.5 font-mono text-sm font-semibold text-slate-800 ring-1 ring-slate-200/80">
                                        {DEMO_ESIGN_OTP}
                                    </span>
                                    .
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="cta"
                                className="w-full shrink-0 sm:w-auto"
                                onClick={onDismiss}
                            >
                                Back to eSign
                            </Button>
                        </div>
                    </header>
                )}

                {embeddedInCompanyPage ? (
                    <p className="shrink-0 border-b border-slate-200/60 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-600 sm:px-6">
                        Step-by-step eSign. Demo OTP:{' '}
                        <span className="font-mono font-semibold text-slate-800">{DEMO_ESIGN_OTP}</span>
                    </p>
                ) : null}

                <ESignStepHeader steps={STEPS} activeIndex={activeIndex} stepDone={stepDone} />

                <CrmFieldProvider>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                    {!canESign(role) ? (
                        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                            Your current demo role cannot initiate eSign. Switch to Company Admin or Super Admin.
                        </p>
                    ) : null}

                    {flowError ? (
                        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
                            {flowError}
                        </p>
                    ) : null}

                    {activeIndex === 0 ? (
                        <div className="space-y-4">
                            <SelectField
                                id="esign-flow-document"
                                label="Document"
                                required
                                value={docId}
                                onChange={(e) => setDocId(e.target.value)}
                                options={docs.map((d) => ({ value: d.id, label: `${d.name} (${d.id})` }))}
                                placeholder="Select document"
                            />
                            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <span className={cn(CTA_FLOW_ICON_TILE, 'h-10 w-10')}>
                                        <LuFileText className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Preview</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {selectedDoc ? selectedDoc.name : 'No document selected'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {docId ? `Ready to send for eSign · ${docId}` : 'Choose a document to continue.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className={cn(CTA_INFO_STRIP, 'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium shadow-none')}>
                                <LuPenLine className="h-4 w-4 shrink-0" />
                                Send for eSign after signer and OTP steps.
                            </div>
                        </div>
                    ) : null}

                    {activeIndex === 1 ? (
                        <div className="space-y-4">
                            <InputField label="Signer name" required value={signerName} onChange={(e) => setSignerName(e.target.value)} />
                            <div>
                                <InputField
                                    label="Aadhaar number"
                                    required
                                    inputMode="numeric"
                                    autoComplete="off"
                                    value={formatAadhaarField(aadhaar)}
                                    onChange={(e) => setAadhaar(maskInput(e.target.value))}
                                    error={aadhaar.length > 0 && aadhaar.length < 12 ? 'Enter all 12 digits.' : undefined}
                                />
                                <p className="mt-1 text-xs text-slate-500">Stored masked as XXXX XXXX + last 4.</p>
                            </div>
                            <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-700">
                                <input type="checkbox" className={cn('mt-0.5', CTA_CHECKBOX_SM)} checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                                <span>I consent to Aadhaar-based eSign and accept the provider terms.</span>
                            </label>
                        </div>
                    ) : null}

                    {activeIndex === 2 ? (
                        <div className="space-y-4">
                            <p className={cn(CTA_INFO_STRIP, 'rounded-lg px-3 py-2 text-xs font-medium shadow-none')}>
                                Demo: enter <span className="font-mono font-bold">{DEMO_ESIGN_OTP}</span> as the OTP after you send it.
                            </p>
                            <InputField
                                id="esign-flow-otp"
                                label="6-digit OTP"
                                inputMode="numeric"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" variant="company" size="cta" onClick={verifyOtpAction} disabled={otp.length !== 6 || !activeEsignId}>
                                    Verify OTP
                                </Button>
                                <button
                                    type="button"
                                    className={cn(
                                        'text-sm font-semibold',
                                        !activeEsignId || timer > 0 ? 'cursor-not-allowed text-slate-400' : CTA_LINK_UNDERLINE,
                                    )}
                                    onClick={onResendOtp}
                                    disabled={!activeEsignId || timer > 0}
                                >
                                    Resend OTP
                                </button>
                            </div>
                            {timer > 0 ? (
                                <p className="text-xs text-slate-500">
                                    OTP expires in {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                                </p>
                            ) : activeEsignId ? (
                                <p className="text-xs text-slate-500">You can resend the OTP now.</p>
                            ) : null}
                        </div>
                    ) : null}

                    {activeIndex === 3 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-2">
                                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Page
                                    <input
                                        type="number"
                                        min={1}
                                        value={sigPage}
                                        onChange={(e) => setSigPage(Math.max(1, Number(e.target.value) || 1))}
                                        className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-sm font-semibold text-slate-800"
                                    />
                                </label>
                                <Button
                                    type="button"
                                    variant="companyOutline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => {
                                        setPos({ x: 58, y: 72 });
                                        setSigResetKey((k) => k + 1);
                                    }}
                                >
                                    <LuRotateCcw className="h-3.5 w-3.5" />
                                    Reset position
                                </Button>
                            </div>
                            <p className="text-xs text-slate-600">
                                Drag the signature onto the demo PDF. Coordinates are saved as percentages of the preview area.
                            </p>
                            <div
                                ref={previewRef}
                                className="relative mx-auto w-full max-w-[min(100%,380px)] overflow-hidden rounded-lg border border-slate-200 bg-slate-200/80 shadow-inner"
                                style={{ height: PREVIEW_H }}
                            >
                                <iframe
                                    title="Demo document for signature placement"
                                    src="/esign-signature-demo.pdf#toolbar=0&navpanes=0"
                                    className="pointer-events-none absolute inset-0 h-full w-full border-0 bg-white"
                                />
                                <Draggable
                                    key={sigResetKey}
                                    nodeRef={dragNodeRef}
                                    bounds="parent"
                                    defaultPosition={defaultDrag}
                                    onStop={handleDragStop}
                                >
                                    <div
                                        ref={dragNodeRef}
                                        className="flex cursor-grab select-none items-center justify-center rounded-lg border-2 border-[var(--cta-button-bg)] bg-white/95 px-3 py-2 text-xs font-bold text-[var(--cta-button-bg)] shadow-lg active:cursor-grabbing"
                                        style={{ width: SIG_BOX_W, height: SIG_BOX_H }}
                                    >
                                        Signature
                                    </div>
                                </Draggable>
                            </div>
                            <p className="font-mono text-xs text-slate-600">
                                x: {pos.x.toFixed(1)}% · y: {pos.y.toFixed(1)}% · page: {sigPage}
                            </p>
                        </div>
                    ) : null}

                    {activeIndex === 4 ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</span>
                                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">Pending</span>
                                </div>
                                <p className="text-[10px] leading-relaxed text-slate-400">
                                    Reference: <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-800">Signed</span>{' '}
                                    <span className="rounded bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-800">Failed</span> (ledger states).
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Summary</p>
                                <dl className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">Signer</dt>
                                        <dd className="font-semibold text-slate-900">{signerName.trim() || '—'}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">Aadhaar</dt>
                                        <dd className="font-mono text-xs font-semibold text-slate-800">{formatAadhaarField(aadhaar) || '—'}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">Document</dt>
                                        <dd className="text-right font-semibold text-slate-900">{selectedDoc?.name ?? docId}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">Placement</dt>
                                        <dd className="font-mono text-xs text-slate-700">
                                            {pos.x.toFixed(1)}%, {pos.y.toFixed(1)}% · p.{sigPage}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                            <ESignAuditTimeline completedPhases={auditPhases} />
                        </div>
                    ) : null}
                    </div>
                </CrmFieldProvider>

                <ESignFooterActions
                    showBack={activeIndex > 0}
                    onBack={() => {
                        setFlowError(null);
                        setActiveIndex((i) => Math.max(0, i - 1));
                    }}
                    primaryLabel={fp.label}
                    primaryVariant={fp.variant}
                    onPrimary={fp.onClick}
                    primaryDisabled={fp.disabled || submitting}
                    primaryLoading={submitting}
                />
            </div>
        </ESignPageShell>
    );
}
