'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { focusPanelFieldById, RequiredAsteriskMark } from '@/components/leads/leadPanelValidationUtils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    getLeads,
    getLeadBySlug,
    setBroker,
    setConversion,
    setLeadAssignment,
    setNotifications,
    setPipeline,
    setSiteVisit,
    type ConversionStatus,
    type Lead,
    type LeadAssignment,
    type LeadBroker,
    type LeadNotifications,
    type LeadPipeline,
    type LeadStage,
    type SiteVisitStatus,
} from '@/lib/leadStore';
import { LuBell, LuBriefcase, LuCalendarDays, LuChartBar, LuDollarSign, LuUserCheck } from 'react-icons/lu';
import { CTA_INPUT_FOCUS, CTA_LINK_UNDERLINE } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';

type SiteVisitErrorKey = 'visitDate' | 'remarks';
const SV_FIELD_IDS: Record<SiteVisitErrorKey, string> = {
    visitDate: 'sv-input-visit-date',
    remarks: 'sv-input-remarks',
};
const SV_ORDER: SiteVisitErrorKey[] = ['visitDate', 'remarks'];
const SV_LABEL: Record<SiteVisitErrorKey, string> = {
    visitDate: 'Visit date',
    remarks: 'Remarks',
};

const CV_FIELD_ID = 'cv-input-converted-date';
type ConvErrorKey = 'convertedDate';
const CV_ORDER: ConvErrorKey[] = ['convertedDate'];
const CV_LABEL: Record<ConvErrorKey, string> = { convertedDate: 'Converted date' };

const stageProgress: Record<LeadStage, number> = {
    New: 0,
    Qualified: 33,
    Proposal: 66,
    Closed: 100,
};

type PanelProps = {
    slug: string;
    lead: Lead;
    onBump: () => void;
};

export function LeadAssignmentPanel({ slug, lead, onBump }: PanelProps) {
    const { assignedTos } = useMemo(() => {
        const leads = getLeads();
        const set = new Set(leads.map((l) => l.assignedTo).filter(Boolean));
        return { assignedTos: Array.from(set) };
    }, []);

    const [assignedTo, setAssignedTo] = useState<string>(lead.assignedTo || '');
    const [assignmentDate, setAssignmentDate] = useState<string>(lead.assignment?.assignmentDate || lead.createdDate);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setAssignedTo(lead.assignedTo || '');
        setAssignmentDate(lead.assignment?.assignmentDate || lead.createdDate);
    }, [lead]);

    const onSave = async () => {
        if (!assignedTo.trim()) return;
        setIsSubmitting(true);
        try {
            const assignment: LeadAssignment = { assignedTo, assignmentDate };
            setLeadAssignment(slug, assignment);
            onBump();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card className="border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/80 p-5">
                        <div className="rounded-lg bg-white p-2 text-gray-600 ring-1 ring-gray-200">
                            <LuUserCheck size={18} />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">Assignment</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Assigned To</label>
                            <select
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className={cn(
                                    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-all',
                                    CTA_INPUT_FOCUS,
                                )}
                            >
                                {assignedTos.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Assignment Date</label>
                            <input
                                type="date"
                                value={assignmentDate}
                                onChange={(e) => setAssignmentDate(e.target.value)}
                                className={cn(
                                    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-all',
                                    CTA_INPUT_FOCUS,
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 p-5">
                        <Button type="button" variant="company" size="cta" onClick={onSave} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </Card>
            </div>

            <Card className="border border-gray-200 shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50/80 p-5">
                    <h2 className="text-base font-semibold text-gray-900">Current status</h2>
                </div>
                <div className="space-y-3 p-5 text-sm text-gray-700">
                    <div>
                        <span className="font-medium text-gray-500">Lead Status:</span> {lead.status}
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Assigned To:</span> {lead.assignedTo || '—'}
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Assigned Date:</span>{' '}
                        {lead.assignment?.assignmentDate || lead.createdDate}
                    </div>
                </div>
            </Card>
        </div>
    );
}

export { LeadFollowUpsPanel } from '@/components/leads/LeadFollowUpSalesCenter';

export function LeadSiteVisitPanel({ slug, lead, onBump }: PanelProps) {
    const [localLead, setLocalLead] = useState(lead);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [svFormErrors, setSvFormErrors] = useState<Partial<Record<SiteVisitErrorKey, string>>>({});
    const [showSvValidationSummary, setShowSvValidationSummary] = useState(false);
    const [svValidationFieldToast, setSvValidationFieldToast] = useState<string | null>(null);
    const [svSubmitShakeKey, setSvSubmitShakeKey] = useState(0);

    const dismissSvValidationToast = useCallback(() => {
        setSvValidationFieldToast(null);
    }, []);

    const latestVisit = useMemo(() => {
        const visits = localLead.siteVisits || [];
        if (visits.length === 0) return null;
        return visits.slice().sort((a, b) => (a.visitDate < b.visitDate ? 1 : -1))[0];
    }, [localLead]);

    const [visitDate, setVisitDate] = useState<string>(latestVisit?.visitDate || lead.createdDate || '');
    const [visitStatus, setVisitStatus] = useState<SiteVisitStatus>(latestVisit?.visitStatus || 'Scheduled');
    const [remarks, setRemarks] = useState<string>(latestVisit?.remarks || '');

    useEffect(() => {
        setLocalLead(lead);
    }, [lead]);

    useEffect(() => {
        const v = latestVisit;
        setVisitDate(v?.visitDate || localLead.createdDate);
        setVisitStatus((v?.visitStatus as SiteVisitStatus) || 'Scheduled');
        setRemarks(v?.remarks || '');
    }, [localLead, latestVisit]);

    useEffect(() => {
        if (Object.keys(svFormErrors).length === 0) {
            setShowSvValidationSummary(false);
            setSvValidationFieldToast(null);
        }
    }, [svFormErrors]);

    const runSiteVisitValidation = useCallback((): Partial<Record<SiteVisitErrorKey, string>> => {
        const next: Partial<Record<SiteVisitErrorKey, string>> = {};
        if (!visitDate) next.visitDate = 'Required';
        if (!remarks.trim()) next.remarks = 'Required';
        return next;
    }, [visitDate, remarks]);

    const scrollToSvField = useCallback((k: SiteVisitErrorKey) => {
        window.requestAnimationFrame(() => focusPanelFieldById(SV_FIELD_IDS[k]));
    }, []);

    const onSave = async () => {
        const nextErrors = runSiteVisitValidation();
        setSvFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setShowSvValidationSummary(true);
            const n = Object.keys(nextErrors).length;
            setSvValidationFieldToast(`Please complete ${n} required field${n === 1 ? '' : 's'}`);
            setSvSubmitShakeKey((k) => k + 1);
            const firstKey = SV_ORDER.find((k) => Boolean(nextErrors[k]));
            if (firstKey) {
                window.requestAnimationFrame(() => focusPanelFieldById(SV_FIELD_IDS[firstKey]));
            }
            return;
        }
        setIsSubmitting(true);
        try {
            const updated = setSiteVisit(slug, {
                visitDate,
                visitStatus,
                remarks: remarks.trim(),
            });
            if (updated) {
                setLocalLead(updated);
                setSvFormErrors({});
                setShowSvValidationSummary(false);
                setSvValidationFieldToast(null);
                onBump();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const svSummaryLinkKeys = showSvValidationSummary
        ? SV_ORDER.filter((k) => Boolean(svFormErrors[k]))
        : [];
    const svValidationSummaryEl =
        showSvValidationSummary && svSummaryLinkKeys.length > 0 ? (
            <div
                className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-3.5 py-3 text-sm text-amber-950 shadow-sm"
                role="alert"
            >
                <p className="flex flex-wrap items-center gap-2 font-semibold leading-snug text-amber-950">
                    <span aria-hidden>⚠</span>
                    <span>Please complete required details before saving the site visit.</span>
                </p>
                <p className="mt-2 text-[13px] font-medium text-amber-900/95">
                    {svSummaryLinkKeys.map((k, i) => (
                        <React.Fragment key={k}>
                            {i > 0 ? <span className="mx-1 text-amber-800/40">·</span> : null}
                            <button
                                type="button"
                                className={CTA_LINK_UNDERLINE}
                                onClick={() => scrollToSvField(k)}
                            >
                                {SV_LABEL[k]}
                            </button>
                        </React.Fragment>
                    ))}
                </p>
            </div>
        ) : null;

    const svToastEl =
        svValidationFieldToast ? (
            <InlineToast
                message={svValidationFieldToast}
                variant="error"
                onDismiss={dismissSvValidationToast}
            />
        ) : null;

    return (
        <>
            {svToastEl}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card className="border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/80 p-5">
                        <div className="rounded-lg bg-white p-2 text-gray-600 ring-1 ring-gray-200">
                            <LuCalendarDays size={18} />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">Site visit</h2>
                    </div>

                    <div className="space-y-6 p-5">
                        {svValidationSummaryEl}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label
                                className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                htmlFor={SV_FIELD_IDS.visitDate}
                            >
                                Visit Date
                                <RequiredAsteriskMark />
                            </label>
                            <input
                                id={SV_FIELD_IDS.visitDate}
                                type="date"
                                value={visitDate}
                                onChange={(e) => {
                                    setVisitDate(e.target.value);
                                    setSvFormErrors((prev) => {
                                        if (!prev.visitDate) return prev;
                                        const p = { ...prev };
                                        delete p.visitDate;
                                        return p;
                                    });
                                }}
                                aria-invalid={Boolean(svFormErrors.visitDate)}
                                className={cn(
                                    'w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2',
                                    svFormErrors.visitDate
                                        ? 'border-rose-300 focus:ring-rose-500/20'
                                        : cn('border-gray-200', CTA_INPUT_FOCUS),
                                )}
                            />
                            {svFormErrors.visitDate ? (
                                <p className="text-xs font-medium text-rose-600">{svFormErrors.visitDate}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Visit Status</label>
                            <select
                                value={visitStatus}
                                onChange={(e) => setVisitStatus(e.target.value as SiteVisitStatus)}
                                className={cn(
                                    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm',
                                    CTA_INPUT_FOCUS,
                                )}
                            >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label
                                className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                htmlFor={SV_FIELD_IDS.remarks}
                            >
                                Remarks
                                <RequiredAsteriskMark />
                            </label>
                            <textarea
                                id={SV_FIELD_IDS.remarks}
                                value={remarks}
                                onChange={(e) => {
                                    setRemarks(e.target.value);
                                    setSvFormErrors((prev) => {
                                        if (!prev.remarks) return prev;
                                        const p = { ...prev };
                                        delete p.remarks;
                                        return p;
                                    });
                                }}
                                rows={5}
                                aria-invalid={Boolean(svFormErrors.remarks)}
                                className={cn(
                                    'w-full resize-none rounded-xl border bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2',
                                    svFormErrors.remarks
                                        ? 'border-rose-300 focus:ring-rose-500/20'
                                        : cn('border-gray-200', CTA_INPUT_FOCUS),
                                )}
                                placeholder="Write visit remarks, outcomes, and follow-ups..."
                            />
                            {svFormErrors.remarks ? (
                                <p className="text-xs font-medium text-rose-600">{svFormErrors.remarks}</p>
                            ) : null}
                        </div>
                    </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 p-5">
                        <Button
                            key={svSubmitShakeKey}
                            type="button"
                            variant="company"
                            size="cta"
                            onClick={onSave}
                            disabled={isSubmitting}
                            className={cn(svSubmitShakeKey > 0 && 'animate-lead-form-shake')}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </Card>
            </div>

            <Card className="border border-gray-200 shadow-sm">
                <div className="border-b border-gray-100 p-5">
                    <h2 className="text-lg font-semibold text-gray-900">Visit history</h2>
                    <p className="mt-1 text-sm text-gray-500">Latest visits for this lead.</p>
                </div>

                <div className="space-y-4 p-5">
                    {localLead.siteVisits.length === 0 ? (
                        <div className="text-sm font-medium text-gray-500">No site visits recorded yet.</div>
                    ) : (
                        localLead.siteVisits
                            .slice()
                            .sort((a, b) => (a.visitDate < b.visitDate ? 1 : -1))
                            .map((v) => (
                                <div key={v.id} className="rounded-xl border border-gray-200 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-gray-800">{v.visitStatus}</p>
                                        <p className="text-xs font-medium text-gray-500">{v.visitDate}</p>
                                    </div>
                                    {v.remarks ? (
                                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{v.remarks}</p>
                                    ) : (
                                        <p className="mt-2 text-sm text-gray-500">No remarks</p>
                                    )}
                                </div>
                            ))
                    )}
                </div>
            </Card>
        </div>
        </>
    );
}

export function LeadPipelinePanel({ slug, lead, onBump }: PanelProps) {
    const [localLead, setLocalLead] = useState(lead);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [leadStage, setLeadStageState] = useState<LeadStage>(lead.pipeline?.leadStage || 'Qualified');
    const [conversionProbability, setConversionProbability] = useState<number>(
        lead.pipeline?.conversionProbability ?? stageProgress[lead.pipeline?.leadStage || 'Qualified']
    );

    useEffect(() => {
        setLocalLead(lead);
        setLeadStageState(lead.pipeline?.leadStage || 'Qualified');
        setConversionProbability(lead.pipeline?.conversionProbability ?? stageProgress[lead.pipeline?.leadStage || 'Qualified']);
    }, [lead]);

    const progressPercent = Math.max(0, Math.min(100, Number(conversionProbability) || 0));

    const onSave = async () => {
        setIsSubmitting(true);
        try {
            const updated = setPipeline(slug, {
                leadStage,
                conversionProbability: Math.max(0, Math.min(100, Number(conversionProbability) || 0)),
            } as LeadPipeline);
            if (updated) {
                setLocalLead(updated);
                onBump();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card className="border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/80 p-5">
                        <div className="rounded-lg bg-white p-2 text-gray-600 ring-1 ring-gray-200">
                            <LuBriefcase size={18} />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">Pipeline</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Lead Stage</label>
                            <select
                                value={leadStage}
                                onChange={(e) => setLeadStageState(e.target.value as LeadStage)}
                                className={cn(
                                    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm',
                                    CTA_INPUT_FOCUS,
                                )}
                            >
                                <option value="New">New</option>
                                <option value="Qualified">Qualified</option>
                                <option value="Proposal">Proposal</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Conversion Probability (%)</label>
                            <input
                                type="number"
                                value={conversionProbability}
                                onChange={(e) => setConversionProbability(Number(e.target.value))}
                                className={cn(
                                    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm',
                                    CTA_INPUT_FOCUS,
                                )}
                                min={0}
                                max={100}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Progress</label>
                                <div className="h-3 w-full overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                                    <div className="h-full bg-gray-700 transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
                                </div>
                                <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                                    <span>0%</span>
                                    <span>{progressPercent}%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 p-5">
                        <Button type="button" variant="company" size="cta" onClick={onSave} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </Card>
            </div>

            <Card className="border border-gray-200 shadow-sm">
                <div className="border-b border-gray-100 p-5">
                    <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
                </div>
                <div className="space-y-3 p-5 text-sm text-gray-700">
                    <div>
                        <span className="font-medium text-gray-500">Stage:</span> {leadStage}
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Probability:</span> {conversionProbability}%
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Assigned:</span> {localLead.assignedTo || '—'}
                    </div>
                </div>
            </Card>
        </div>
    );
}

export function LeadConversionPanel({ slug, lead, onBump }: PanelProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [conversionStatus, setConversionStatus] = useState<ConversionStatus>(lead.conversion?.conversionStatus || 'Won');
    const [convertedDate, setConvertedDate] = useState<string>(lead.conversion?.convertedDate || lead.createdDate || '');
    const [cvFormErrors, setCvFormErrors] = useState<Partial<Record<ConvErrorKey, string>>>({});
    const [showCvValidationSummary, setShowCvValidationSummary] = useState(false);
    const [cvValidationFieldToast, setCvValidationFieldToast] = useState<string | null>(null);
    const [cvSubmitShakeKey, setCvSubmitShakeKey] = useState(0);

    const dismissCvValidationToast = useCallback(() => {
        setCvValidationFieldToast(null);
    }, []);

    useEffect(() => {
        setConversionStatus(lead.conversion.conversionStatus);
        setConvertedDate(lead.conversion.convertedDate || lead.createdDate);
    }, [lead]);

    useEffect(() => {
        if (Object.keys(cvFormErrors).length === 0) {
            setShowCvValidationSummary(false);
            setCvValidationFieldToast(null);
        }
    }, [cvFormErrors]);

    const runConversionValidation = useCallback((): Partial<Record<ConvErrorKey, string>> => {
        const next: Partial<Record<ConvErrorKey, string>> = {};
        if (!convertedDate) next.convertedDate = 'Required';
        return next;
    }, [convertedDate]);

    const scrollToCvField = useCallback(() => {
        window.requestAnimationFrame(() => focusPanelFieldById(CV_FIELD_ID));
    }, []);

    const onSave = async () => {
        const nextErrors = runConversionValidation();
        setCvFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setShowCvValidationSummary(true);
            const n = Object.keys(nextErrors).length;
            setCvValidationFieldToast(`Please complete ${n} required field${n === 1 ? '' : 's'}`);
            setCvSubmitShakeKey((k) => k + 1);
            if (nextErrors.convertedDate) {
                window.requestAnimationFrame(() => focusPanelFieldById(CV_FIELD_ID));
            }
            return;
        }
        setIsSubmitting(true);
        try {
            const updated = setConversion(slug, {
                conversionStatus,
                convertedDate,
            });
            if (updated) {
                setCvFormErrors({});
                setShowCvValidationSummary(false);
                setCvValidationFieldToast(null);
                onBump();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const cvSummaryLinkKeys = showCvValidationSummary ? CV_ORDER.filter((k) => Boolean(cvFormErrors[k])) : [];
    const cvValidationSummaryEl =
        showCvValidationSummary && cvSummaryLinkKeys.length > 0 ? (
            <div
                className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-3.5 py-3 text-sm text-amber-950 shadow-sm"
                role="alert"
            >
                <p className="flex flex-wrap items-center gap-2 font-semibold leading-snug text-amber-950">
                    <span aria-hidden>⚠</span>
                    <span>Please complete required details before saving conversion.</span>
                </p>
                <p className="mt-2 text-[13px] font-medium text-amber-900/95">
                    {cvSummaryLinkKeys.map((k, i) => (
                        <React.Fragment key={k}>
                            {i > 0 ? <span className="mx-1 text-amber-800/40">·</span> : null}
                            <button
                                type="button"
                                className={CTA_LINK_UNDERLINE}
                                onClick={scrollToCvField}
                            >
                                {CV_LABEL[k]}
                            </button>
                        </React.Fragment>
                    ))}
                </p>
            </div>
        ) : null;

    const cvToastEl =
        cvValidationFieldToast ? (
            <InlineToast
                message={cvValidationFieldToast}
                variant="error"
                onDismiss={dismissCvValidationToast}
            />
        ) : null;

    return (
        <>
            {cvToastEl}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card className="border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/80 p-5">
                        <div className="rounded-lg bg-white p-2 text-gray-600 ring-1 ring-gray-200">
                            <LuDollarSign size={18} />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">Conversion</h2>
                    </div>

                    <div className="space-y-6 p-5">
                        {cvValidationSummaryEl}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Conversion Status</label>
                            <select
                                value={conversionStatus}
                                onChange={(e) => setConversionStatus(e.target.value as ConversionStatus)}
                                className={cn(
                                    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm',
                                    CTA_INPUT_FOCUS,
                                )}
                            >
                                <option value="Won">Won</option>
                                <option value="Lost">Lost</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label
                                className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                htmlFor={CV_FIELD_ID}
                            >
                                Converted Date
                                <RequiredAsteriskMark />
                            </label>
                            <input
                                id={CV_FIELD_ID}
                                type="date"
                                value={convertedDate}
                                onChange={(e) => {
                                    setConvertedDate(e.target.value);
                                    setCvFormErrors((prev) => {
                                        if (!prev.convertedDate) return prev;
                                        const p = { ...prev };
                                        delete p.convertedDate;
                                        return p;
                                    });
                                }}
                                aria-invalid={Boolean(cvFormErrors.convertedDate)}
                                className={cn(
                                    'w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2',
                                    cvFormErrors.convertedDate
                                        ? 'border-rose-300 focus:ring-rose-500/20'
                                        : cn('border-gray-200', CTA_INPUT_FOCUS),
                                )}
                            />
                            {cvFormErrors.convertedDate ? (
                                <p className="text-xs font-medium text-rose-600">{cvFormErrors.convertedDate}</p>
                            ) : null}
                        </div>
                    </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 p-5">
                        <Button
                            key={cvSubmitShakeKey}
                            type="button"
                            variant="company"
                            size="cta"
                            onClick={onSave}
                            disabled={isSubmitting}
                            className={cn(cvSubmitShakeKey > 0 && 'animate-lead-form-shake')}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </Card>
            </div>

            <Card className="border border-gray-200 shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50/80 p-5">
                    <h2 className="text-base font-semibold text-gray-900">Current summary</h2>
                </div>
                <div className="space-y-3 p-5 text-sm text-gray-700">
                    <div>
                        <span className="font-medium text-gray-500">Status:</span> {conversionStatus}
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Date:</span> {convertedDate}
                    </div>
                </div>
            </Card>
        </div>
        </>
    );
}

export function LeadBrokerPanel({ slug, lead, onBump }: PanelProps) {
    const [localLead, setLocalLead] = useState(lead);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [brokerName, setBrokerName] = useState<string>(lead.broker?.brokerName || lead.brokerAgent || '');
    const [commissionPercentage, setCommissionPercentage] = useState<number>(lead.broker?.commissionPercentage ?? 0);

    useEffect(() => {
        setLocalLead(lead);
        setBrokerName(lead.broker.brokerName || lead.brokerAgent || '');
        setCommissionPercentage(lead.broker.commissionPercentage ?? 0);
    }, [lead]);

    const onSave = async () => {
        setIsSubmitting(true);
        try {
            const updated = setBroker(slug, {
                brokerName: brokerName.trim(),
                commissionPercentage: Math.max(0, Math.min(100, Number(commissionPercentage) || 0)),
            } as LeadBroker);

            if (updated) {
                setLocalLead(updated);
                onBump();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card className="border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/80 p-5">
                        <div className="rounded-lg bg-white p-2 text-gray-600 ring-1 ring-gray-200">
                            <LuBriefcase size={18} />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">Broker</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Broker Name</label>
                            <input
                                type="text"
                                value={brokerName}
                                onChange={(e) => setBrokerName(e.target.value)}
                                className={cn(
                                    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm',
                                    CTA_INPUT_FOCUS,
                                )}
                                placeholder="e.g. City Homes Realty"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Commission Percentage</label>
                            <input
                                type="number"
                                value={commissionPercentage}
                                onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                                min={0}
                                max={100}
                                className={cn(
                                    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm',
                                    CTA_INPUT_FOCUS,
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Commission Preview</label>
                            <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
                                {Math.max(0, Math.min(100, Number(commissionPercentage) || 0))}% of deal value
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 p-5">
                        <Button type="button" variant="company" size="cta" onClick={onSave} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </Card>
            </div>

            <Card className="border border-gray-200 shadow-sm">
                <div className="border-b border-gray-100 p-5">
                    <h2 className="text-lg font-semibold text-gray-900">Current broker</h2>
                </div>
                <div className="space-y-3 p-5 text-sm text-gray-700">
                    <div>
                        <span className="font-medium text-gray-500">Name:</span> {localLead.broker.brokerName || '—'}
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Commission:</span> {localLead.broker.commissionPercentage}%
                    </div>
                </div>
            </Card>
        </div>
    );
}

export function LeadNotificationsPanel({ slug, lead, onBump }: PanelProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reminderEnabled, setReminderEnabled] = useState<boolean>(lead.notifications.reminderEnabled || false);

    useEffect(() => {
        setReminderEnabled(lead.notifications.reminderEnabled);
    }, [lead]);

    const onSave = async () => {
        setIsSubmitting(true);
        try {
            const updated = setNotifications(slug, {
                reminderEnabled,
            } as LeadNotifications);
            if (updated) {
                onBump();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card className="border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/80 p-5">
                        <div className="rounded-lg bg-white p-2 text-gray-600 ring-1 ring-gray-200">
                            <LuBell size={18} />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
                    </div>

                    <div className="p-5">
                        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-5">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-800">Reminder</span>
                                <span className="mt-1 text-sm text-gray-500">Turn on reminders for follow-ups.</span>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={reminderEnabled}
                                    onChange={(e) => setReminderEnabled(e.target.checked)}
                                />
                                <div
                                    className={cn(
                                        'relative h-6 w-11 rounded-full transition-colors',
                                        reminderEnabled ? 'bg-gray-700' : 'bg-gray-200'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform',
                                            reminderEnabled && 'translate-x-5'
                                        )}
                                    />
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 p-5">
                        <Button type="button" variant="company" size="cta" onClick={onSave} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </Card>
            </div>

            <Card className="border border-gray-200 shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50/80 p-5">
                    <h2 className="text-base font-semibold text-gray-900">Current setting</h2>
                </div>
                <div className="space-y-3 p-5 text-sm text-gray-700">
                    <div>
                        <span className="font-medium text-gray-500">Reminder:</span> {reminderEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                </div>
            </Card>
        </div>
    );
}

/** CRM-wide lead metrics (all leads). Used on `/leads/analytics`. */
export function LeadAnalyticsPanel() {
    const { totalLeads, conversionRate } = useMemo(() => {
        const leads = getLeads();
        const total = leads.length;
        const won = leads.filter((l) => l.conversion.conversionStatus === 'Won').length;
        const rate = total === 0 ? 0 : Math.round((won / total) * 100);
        return { totalLeads: total, conversionRate: rate };
    }, []);

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 p-5">
                    <h2 className="text-base font-semibold text-gray-900">Total leads</h2>
                    <LuChartBar className="text-gray-400" />
                </div>
                <div className="p-5">
                    <div className="text-4xl font-bold text-gray-900">{totalLeads}</div>
                    <p className="mt-2 text-sm text-gray-500">Leads tracked in this CRM module.</p>
                </div>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 p-5">
                    <h2 className="text-base font-semibold text-gray-900">Conversion rate</h2>
                    <LuChartBar className="text-gray-400" />
                </div>
                <div className="p-5">
                    <div className="text-4xl font-bold text-gray-900">{conversionRate}%</div>
                    <p className="mt-2 text-sm text-gray-500">Won conversions divided by total leads.</p>
                </div>
            </Card>
        </div>
    );
}
