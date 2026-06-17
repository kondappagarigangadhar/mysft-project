'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
    addFollowUp,
    deleteFollowUp,
    FOLLOW_UP_OUTCOME_KEY_LABEL,
    type FollowUpInteraction,
    type FollowUpOutcomeKey,
    type FollowUpPriority,
    type Lead,
    type LeadFollowUp,
    updateFollowUp,
} from '@/lib/leadStore';
import {
    LuActivity,
    LuAlarmClock,
    LuAsterisk,
    LuCalendar,
    LuCalendarClock,
    LuCheck,
    LuPencil,
    LuPhone,
    LuSparkles,
    LuTrash2,
} from 'react-icons/lu';
import { CTA_CARD_EDITING_RING, CTA_INPUT_FOCUS, CTA_LINK_UNDERLINE } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';

type FilterTab = 'today' | 'upcoming' | 'overdue' | 'completed';

const PRIORITIES: FollowUpPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const INTERACTIONS: FollowUpInteraction[] = ['Call', 'WhatsApp', 'Meeting', 'Visit'];
const OUTCOMES: FollowUpOutcomeKey[] = [
    'call_done',
    'no_answer',
    'meeting_done',
    'interested',
    'callback',
    'other',
];

const OUTCOME_CLASS: Record<FollowUpOutcomeKey, string> = {
    call_done: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
    no_answer: 'bg-slate-100 text-slate-800 ring-1 ring-slate-200/80',
    meeting_done: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/80',
    interested: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80',
    callback: 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/80',
    other: 'bg-gray-100 text-gray-800 ring-1 ring-gray-200/80',
};

const PRI_CLASS: Record<FollowUpPriority, string> = {
    Low: 'text-slate-500',
    Medium: 'text-amber-700',
    High: 'text-orange-700',
    Urgent: 'text-rose-700',
};

function ymd(d: Date) {
    return d.toISOString().slice(0, 10);
}

function addDays(ymdStr: string, n: number) {
    const d = new Date(ymdStr + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return ymd(d);
}

type PanelProps = { slug: string; lead: Lead; onBump: () => void };

function filterFollowUps(rows: LeadFollowUp[], tab: FilterTab, todayY: string) {
    return rows.filter((fu) => {
        const open = fu.status === 'open';
        const d = fu.followUpDate;
        if (tab === 'completed') return fu.status === 'completed';
        if (tab === 'today') return open && d === todayY;
        if (tab === 'upcoming') return open && d > todayY;
        if (tab === 'overdue') return open && d < todayY;
        return false;
    });
}

function computeStats(rows: LeadFollowUp[], todayY: string) {
    const open = rows.filter((f) => f.status === 'open');
    return {
        dueToday: open.filter((f) => f.followUpDate === todayY).length,
        overdue: open.filter((f) => f.followUpDate < todayY).length,
        completedToday: rows.filter(
            (f) =>
                f.status === 'completed' && (f.completedAt === todayY || f.followUpDate === todayY),
        ).length,
    };
}

const FOLLOW_UP_SCROLL_OFFSET_PX = 96;

type FollowUpFormErrorKey = 'date' | 'notes' | 'nextAction';

const FU_FIELD_IDS: Record<FollowUpFormErrorKey, string> = {
    date: 'fu-input-date',
    notes: 'fu-input-notes',
    nextAction: 'fu-input-next-action',
};

const FU_VALIDATION_ORDER: FollowUpFormErrorKey[] = ['date', 'notes', 'nextAction'];

const FU_HUMAN_FIELD_LABEL: Record<FollowUpFormErrorKey, string> = {
    date: 'Date & time',
    notes: 'Notes',
    nextAction: 'Next action',
};

function RequiredFieldMark() {
    return (
        <LuAsterisk
            className="ml-0.5 inline h-2.5 w-2.5 align-[-0.1em] text-rose-500"
            strokeWidth={3}
            aria-hidden="true"
            title="Required"
        />
    );
}

type FuFormErrors = Partial<Record<FollowUpFormErrorKey, string>>;

function focusFollowUpField(key: FollowUpFormErrorKey) {
    const id = FU_FIELD_IDS[key];
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - FOLLOW_UP_SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.setTimeout(() => {
        const again = document.getElementById(id);
        if (again && 'focus' in again && typeof (again as HTMLElement & { focus: () => void }).focus === 'function') {
            (again as HTMLInputElement | HTMLTextAreaElement).focus({ preventScroll: true });
        }
    }, 400);
}

function buildInsight(lead: Lead, overdue: number, dueToday: number) {
    const h = new Date().getHours();
    const window =
        h < 12 ? '3:00–5:00 PM today' : h < 17 ? '4:30–6:00 PM today' : '10:00 AM–12:00 PM tomorrow';
    const base = lead.project?.trim()
        ? `${lead.preferredUnitType} · ${lead.project} — align on budget, then book site visit.`
        : 'Confirm budget, then lock a site visit while interest is high.';
    let second = '';
    if (lead.status === 'Lost') second = 'Lead is Lost — re-qualify before heavy effort.';
    else if (overdue > 0) second = `${overdue} open task${overdue === 1 ? '' : 's'} overdue — clear the oldest first.`;
    else if (dueToday > 0) second = `${dueToday} touchpoint${dueToday === 1 ? '' : 's'} due today.`;
    const focus = second ? `${base} ${second}` : base;
    return { window, focus };
}

export function LeadFollowUpsPanel({ slug, lead, onBump }: PanelProps) {
    const [localLead, setLocalLead] = useState(lead);
    const [tab, setTab] = useState<FilterTab>('today');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<LeadFollowUp | null>(null);
    const formAnchorRef = useRef<HTMLDivElement>(null);
    const todayY = useMemo(() => ymd(new Date()), []);
    const todayTimeDefault = useMemo(() => {
        const t = new Date();
        t.setHours(t.getHours() + 1, 0, 0, 0);
        return `${String(t.getHours()).padStart(2, '0')}:00`;
    }, []);

    const [fuDate, setFuDate] = useState(todayY);
    const [fuTime, setFuTime] = useState(todayTimeDefault);
    const [interaction, setInteraction] = useState<FollowUpInteraction>('Call');
    const [outcomeKey, setOutcomeKey] = useState<FollowUpOutcomeKey>('call_done');
    const [notes, setNotes] = useState('');
    const [nextAction, setNextAction] = useState('');
    const [priority, setPriority] = useState<FollowUpPriority>('High');
    const [fuFormErrors, setFuFormErrors] = useState<FuFormErrors>({});
    const [showValidationSummary, setShowValidationSummary] = useState(false);
    const [validationFieldToast, setValidationFieldToast] = useState<string | null>(null);
    const [submitShakeKey, setSubmitShakeKey] = useState(0);

    const dismissValidationToast = useCallback(() => {
        setValidationFieldToast(null);
    }, []);

    useEffect(() => {
        setLocalLead(lead);
    }, [lead]);

    useEffect(() => {
        if (Object.keys(fuFormErrors).length === 0) {
            setShowValidationSummary(false);
            setValidationFieldToast(null);
        }
    }, [fuFormErrors]);

    const resetQuickAddForm = useCallback(() => {
        setEditingId(null);
        setFuDate(todayY);
        setFuTime(todayTimeDefault);
        setInteraction('Call');
        setOutcomeKey('call_done');
        setNotes('');
        setNextAction('');
        setPriority('High');
        setFuFormErrors({});
        setShowValidationSummary(false);
        setValidationFieldToast(null);
    }, [todayY, todayTimeDefault]);

    const beginEdit = useCallback(
        (fu: LeadFollowUp) => {
            setEditingId(fu.id);
            setFuDate(fu.followUpDate);
            setFuTime(fu.followUpTime ?? '10:00');
            setInteraction(fu.interactionType);
            setOutcomeKey(fu.outcomeKey);
            setNotes(fu.notes ?? '');
            setNextAction(fu.nextAction ?? '');
            setPriority(fu.priority);
            setFuFormErrors({});
            setShowValidationSummary(false);
            setValidationFieldToast(null);
            window.requestAnimationFrame(() => {
                formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        },
        [],
    );

    const rows = useMemo(
        () => (localLead.followUps ?? []).slice().sort((a, b) => (a.followUpDate < b.followUpDate ? 1 : -1)),
        [localLead],
    );

    const stats = useMemo(() => computeStats(rows, todayY), [rows, todayY]);
    const filtered = useMemo(() => filterFollowUps(rows, tab, todayY), [rows, tab, todayY]);
    const insight = useMemo(
        () => buildInsight(lead, stats.overdue, stats.dueToday),
        [lead, stats.dueToday, stats.overdue],
    );
    const tel = useMemo(() => {
        const p = lead.phone?.replace(/[\s-]/g, '') ?? '';
        return p ? `tel:${p}` : '';
    }, [lead.phone]);

    const runFollowUpValidation = useCallback((): FuFormErrors => {
        const next: FuFormErrors = {};
        if (!fuDate) next.date = 'Required';
        if (!notes.trim()) next.notes = 'Required';
        if (!nextAction.trim()) next.nextAction = 'Required';
        return next;
    }, [fuDate, notes, nextAction]);

    const scrollToFuField = useCallback((k: FollowUpFormErrorKey) => {
        window.requestAnimationFrame(() => focusFollowUpField(k));
    }, []);

    const onSaveTask = async () => {
        const nextErrors = runFollowUpValidation();
        setFuFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setShowValidationSummary(true);
            const n = Object.keys(nextErrors).length;
            setValidationFieldToast(`Please complete ${n} required field${n === 1 ? '' : 's'}`);
            setSubmitShakeKey((k) => k + 1);
            const firstKey = FU_VALIDATION_ORDER.find((k) => Boolean(nextErrors[k]));
            if (firstKey) {
                window.requestAnimationFrame(() => focusFollowUpField(firstKey));
            }
            return;
        }
        setShowValidationSummary(false);
        setSaving(true);
        try {
            if (editingId) {
                const prev = rows.find((r) => r.id === editingId);
                const updated = updateFollowUp(slug, editingId, {
                    followUpDate: fuDate,
                    followUpTime: fuTime,
                    interactionType: interaction,
                    outcome: FOLLOW_UP_OUTCOME_KEY_LABEL[outcomeKey],
                    outcomeKey,
                    notes: notes.trim(),
                    nextAction: nextAction.trim(),
                    priority,
                    status: prev?.status ?? 'open',
                });
                if (updated) {
                    setLocalLead(updated);
                    resetQuickAddForm();
                    onBump();
                }
            } else {
                const updated = addFollowUp(slug, {
                    followUpDate: fuDate,
                    followUpTime: fuTime,
                    interactionType: interaction,
                    outcome: FOLLOW_UP_OUTCOME_KEY_LABEL[outcomeKey],
                    outcomeKey,
                    notes: notes.trim(),
                    nextAction: nextAction.trim(),
                    priority,
                    status: 'open',
                });
                if (updated) {
                    setLocalLead(updated);
                    setNotes('');
                    setNextAction('');
                    setFuFormErrors({});
                    setShowValidationSummary(false);
                    setValidationFieldToast(null);
                    onBump();
                }
            }
        } finally {
            setSaving(false);
        }
    };

    const onDone = useCallback(
        (id: string) => {
            const u = updateFollowUp(slug, id, { status: 'completed', completedAt: todayY });
            if (u) {
                setLocalLead(u);
                setEditingId((eid) => (eid === id ? null : eid));
                setTab('completed');
                onBump();
            }
        },
        [slug, todayY, onBump],
    );

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) return;
        const u = deleteFollowUp(slug, deleteTarget.id);
        if (u) {
            setLocalLead(u);
            setEditingId((eid) => (eid === deleteTarget.id ? null : eid));
            onBump();
        }
        setDeleteTarget(null);
    }, [deleteTarget, slug, onBump]);

    const onRescheduleQuick = useCallback(
        (id: string, currentYmd: string) => {
            const nextD = addDays(currentYmd, 1);
            const u = updateFollowUp(slug, id, { followUpDate: nextD, status: 'open' });
            if (u) {
                setLocalLead(u);
                onBump();
            }
        },
        [slug, onBump],
    );

    const summaryLinkKeys = showValidationSummary
        ? FU_VALIDATION_ORDER.filter((k) => Boolean(fuFormErrors[k]))
        : [];

    const validationSummaryEl =
        showValidationSummary && summaryLinkKeys.length > 0 ? (
            <div
                id="follow-up-validation-summary"
                className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-3.5 py-3 text-sm text-amber-950 shadow-sm"
                role="alert"
            >
                <p className="flex flex-wrap items-center gap-2 font-semibold leading-snug text-amber-950">
                    <span aria-hidden>⚠</span>
                    <span>Please complete required details before saving the follow-up.</span>
                </p>
                <p className="mt-2 text-[13px] font-medium text-amber-900/95">
                    {summaryLinkKeys.map((k, i) => (
                        <React.Fragment key={k}>
                            {i > 0 ? <span className="mx-1 text-amber-800/40">·</span> : null}
                            <button
                                type="button"
                                className={CTA_LINK_UNDERLINE}
                                onClick={() => scrollToFuField(k)}
                            >
                                {FU_HUMAN_FIELD_LABEL[k]}
                            </button>
                        </React.Fragment>
                    ))}
                </p>
            </div>
        ) : null;

    const validationToastEl =
        validationFieldToast ? (
            <InlineToast
                message={validationFieldToast}
                variant="error"
                onDismiss={dismissValidationToast}
            />
        ) : null;

    return (
        <>
            {validationToastEl}
            <div className="w-full min-w-0 space-y-4">
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3.5 py-3 sm:flex-row sm:items-start sm:gap-4 sm:px-4">
                <div className="flex shrink-0 items-center gap-2 text-slate-600">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-[var(--cta-button-bg)]">
                        <LuSparkles size={16} aria-hidden />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Insight</span>
                </div>
                <div className="min-w-0 flex-1 space-y-1.5 text-sm leading-snug text-slate-800">
                    <p>
                        <span className="font-semibold text-slate-900">Best window: </span>
                        {insight.window}
                    </p>
                    <p className="text-slate-700">{insight.focus}</p>
                </div>
            </div>

            {/* Top filter tabs */}
            <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1.5 ring-1 ring-slate-100/80">
                {(
                    [
                        { id: 'today' as const, label: 'Today', icon: LuCalendar },
                        { id: 'upcoming' as const, label: 'Upcoming', icon: LuActivity },
                        { id: 'overdue' as const, label: 'Overdue', icon: LuAlarmClock },
                        { id: 'completed' as const, label: 'Completed', icon: LuCheck },
                    ] as const
                ).map((b) => {
                    const I = b.icon;
                    return (
                        <button
                            key={b.id}
                            type="button"
                            onClick={() => setTab(b.id)}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
                                tab === b.id
                                    ? 'bg-white text-[var(--cta-button-bg)] shadow-sm ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)]'
                                    : 'text-slate-500 hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] hover:text-[var(--cta-button-bg)]',
                            )}
                        >
                            <I size={15} className="opacity-80" />
                            {b.label}
                        </button>
                    );
                })}
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
                {/* Left: sticky quick add */}
                <div ref={formAnchorRef} className="lg:sticky lg:top-28 lg:z-20 lg:h-full lg:min-h-0">
                    <div
                        className={cn(
                            'rounded-2xl border bg-white shadow-sm ring-1 ring-slate-100/80 transition-shadow',
                            editingId ? CTA_CARD_EDITING_RING : 'border-slate-200/80',
                        )}
                    >
                        <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quick add</p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {editingId ? 'Update follow-up' : 'Follow-up task'}
                                    </p>
                                    {editingId ? (
                                        <p className="mt-0.5 text-[11px] font-medium text-[var(--cta-button-bg)]">Editing selected task</p>
                                    ) : null}
                                </div>
                                {editingId ? (
                                    <button
                                        type="button"
                                        onClick={resetQuickAddForm}
                                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Cancel edit
                                    </button>
                                ) : null}
                            </div>
                        </div>
                        <div className="space-y-3.5 p-4">
                            {validationSummaryEl}
                            {/* Row 1: Date | Time */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                    <label
                                        className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                                        htmlFor={FU_FIELD_IDS.date}
                                    >
                                        Date
                                        <RequiredFieldMark />
                                    </label>
                                    <input
                                        id={FU_FIELD_IDS.date}
                                        type="date"
                                        value={fuDate}
                                        onChange={(e) => {
                                            setFuDate(e.target.value);
                                            setFuFormErrors((prev) => {
                                                if (!prev.date) return prev;
                                                const p = { ...prev };
                                                delete p.date;
                                                return p;
                                            });
                                        }}
                                        aria-invalid={Boolean(fuFormErrors.date)}
                                        className={cn(
                                            'h-10 w-full rounded-xl border bg-slate-50/80 px-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2',
                                            fuFormErrors.date
                                                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                                                : cn('border-slate-200', CTA_INPUT_FOCUS),
                                        )}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label
                                        className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                                        htmlFor="fu-input-time"
                                    >
                                        Time
                                    </label>
                                    <input
                                        id="fu-input-time"
                                        type="time"
                                        value={fuTime}
                                        onChange={(e) => setFuTime(e.target.value)}
                                        className={cn(
                                            'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 text-sm font-medium text-slate-900',
                                            CTA_INPUT_FOCUS,
                                        )}
                                    />
                                </div>
                            </div>
                            {fuFormErrors.date ? (
                                <p className="text-xs font-medium text-rose-600">{fuFormErrors.date}</p>
                            ) : null}
                            {/* Row 2: Type | Priority */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</label>
                                    <select
                                        value={interaction}
                                        onChange={(e) => setInteraction(e.target.value as FollowUpInteraction)}
                                        className={cn(
                                            'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 text-sm font-medium text-slate-900',
                                            CTA_INPUT_FOCUS,
                                        )}
                                    >
                                        {INTERACTIONS.map((x) => (
                                            <option key={x} value={x}>
                                                {x}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Priority</label>
                                    <div className="grid grid-cols-2 gap-1">
                                        {PRIORITIES.map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setPriority(p)}
                                                className={cn(
                                                    'rounded-lg border px-1.5 py-2 text-[10px] font-bold uppercase tracking-wide',
                                                    priority === p
                                                        ? 'border-[var(--cta-button-bg)] bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-[var(--cta-button-bg)]'
                                                        : 'border-slate-200 bg-white text-slate-500 hover:border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]',
                                                )}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Row 3: Notes */}
                            <div className="space-y-1.5">
                                <label
                                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                                    htmlFor={FU_FIELD_IDS.notes}
                                >
                                    Notes
                                    <RequiredFieldMark />
                                </label>
                                <textarea
                                    id={FU_FIELD_IDS.notes}
                                    value={notes}
                                    onChange={(e) => {
                                        setNotes(e.target.value);
                                        setFuFormErrors((prev) => {
                                            if (!prev.notes) return prev;
                                            const p = { ...prev };
                                            delete p.notes;
                                            return p;
                                        });
                                    }}
                                    rows={3}
                                    placeholder="Log what happened, objections, and tone."
                                    aria-invalid={Boolean(fuFormErrors.notes)}
                                    className={cn(
                                        'w-full resize-none rounded-xl border bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2',
                                        fuFormErrors.notes
                                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                                            : cn('border-slate-200', CTA_INPUT_FOCUS),
                                    )}
                                />
                                {fuFormErrors.notes ? (
                                    <p className="text-xs font-medium text-rose-600">{fuFormErrors.notes}</p>
                                ) : null}
                            </div>
                            {/* Row 4: Next action */}
                            <div className="space-y-1.5">
                                <label
                                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                                    htmlFor={FU_FIELD_IDS.nextAction}
                                >
                                    Next action
                                    <RequiredFieldMark />
                                </label>
                                <input
                                    id={FU_FIELD_IDS.nextAction}
                                    type="text"
                                    value={nextAction}
                                    onChange={(e) => {
                                        setNextAction(e.target.value);
                                        setFuFormErrors((prev) => {
                                            if (!prev.nextAction) return prev;
                                            const p = { ...prev };
                                            delete p.nextAction;
                                            return p;
                                        });
                                    }}
                                    placeholder="e.g. Send quote, book site visit"
                                    aria-invalid={Boolean(fuFormErrors.nextAction)}
                                    className={cn(
                                        'h-10 w-full rounded-xl border bg-slate-50/80 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2',
                                        fuFormErrors.nextAction
                                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                                            : cn('border-slate-200', CTA_INPUT_FOCUS),
                                    )}
                                />
                                {fuFormErrors.nextAction ? (
                                    <p className="text-xs font-medium text-rose-600">{fuFormErrors.nextAction}</p>
                                ) : null}
                            </div>
                            {/* Row 5: Outcome */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outcome</label>
                                <select
                                    value={outcomeKey}
                                    onChange={(e) => setOutcomeKey(e.target.value as FollowUpOutcomeKey)}
                                    className={cn(
                                        'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 text-sm font-medium text-slate-900',
                                        CTA_INPUT_FOCUS,
                                    )}
                                >
                                    {OUTCOMES.map((k) => (
                                        <option key={k} value={k}>
                                            {FOLLOW_UP_OUTCOME_KEY_LABEL[k]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-1">
                                <Button
                                    key={submitShakeKey}
                                    type="button"
                                    variant="company"
                                    size="cta"
                                    onClick={onSaveTask}
                                    disabled={saving}
                                    className={cn(submitShakeKey > 0 && 'animate-lead-form-shake')}
                                >
                                    {saving ? 'Saving...' : editingId ? 'Update task' : 'Save task'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: follow-up list */}
                <div className="min-w-0">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Workspace</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                            <LuSparkles size={12} className="text-amber-500" />
                            {filtered.length} in view
                        </span>
                    </div>
                    <div className="max-h-[min(52rem,calc(100dvh-12rem))] space-y-4 overflow-y-auto overflow-x-visible pr-1 [scrollbar-gutter:stable]">
                        {filtered.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/60 py-12 text-center">
                                <p className="text-sm font-medium text-slate-500">No follow-ups in this view.</p>
                                <p className="mt-1 text-xs text-slate-400">Use Quick add to schedule a touchpoint or switch tabs.</p>
                            </div>
                        ) : (
                            filtered.map((fu) => {
                                const isOpenTask = fu.status === 'open';
                                return (
                                    <article
                                        key={fu.id}
                                        className={cn(
                                            'group relative rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-slate-100/80 transition-shadow hover:shadow-md',
                                            editingId === fu.id ? CTA_CARD_EDITING_RING : 'border-slate-200/80',
                                        )}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span
                                                    className={cn(
                                                        'inline-flex max-w-full items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold',
                                                        OUTCOME_CLASS[fu.outcomeKey],
                                                    )}
                                                >
                                                    {FOLLOW_UP_OUTCOME_KEY_LABEL[fu.outcomeKey]}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                                    {fu.interactionType}
                                                </span>
                                            </div>
                                            <p className="shrink-0 text-[11px] font-bold tabular-nums text-slate-500">
                                                {fu.followUpDate} · {fu.followUpTime ?? '10:00'}
                                            </p>
                                        </div>
                                        <p className={cn('mt-0.5 text-[10px] font-bold uppercase', PRI_CLASS[fu.priority])}>
                                            {fu.priority} priority
                                        </p>
                                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-800">{fu.notes}</p>
                                        <p className="mt-1.5 text-xs font-semibold text-slate-500">Next</p>
                                        <p className="text-sm font-semibold text-slate-900">{fu.nextAction}</p>
                                        {!isOpenTask ? (
                                            <p className="mt-3 text-[10px] font-bold uppercase text-emerald-600">
                                                Completed{fu.completedAt ? ` · ${fu.completedAt}` : ''}
                                            </p>
                                        ) : null}
                                        {/* Actions: icon + label */}
                                        <div
                                            className={cn(
                                                'mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 transition-opacity duration-150',
                                                'pointer-events-auto opacity-100 sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100',
                                            )}
                                        >
                                            {tel && isOpenTask ? (
                                                <a
                                                    href={tel}
                                                    title="Call lead"
                                                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                                                >
                                                    <LuPhone size={15} className="shrink-0 text-emerald-600" aria-hidden />
                                                    Call
                                                </a>
                                            ) : null}
                                            <button
                                                type="button"
                                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                                                onClick={() => beginEdit(fu)}
                                            >
                                                <LuPencil size={15} className="shrink-0 text-slate-600" aria-hidden />
                                                Edit
                                            </button>
                                            {isOpenTask ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        title="Move due date forward one day"
                                                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                                                        onClick={() => onRescheduleQuick(fu.id, fu.followUpDate)}
                                                    >
                                                        <LuCalendarClock size={15} className="shrink-0 text-sky-600" aria-hidden />
                                                        Reschedule
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-2 text-xs font-semibold text-emerald-900 shadow-sm hover:bg-emerald-100/90"
                                                        onClick={() => onDone(fu.id)}
                                                    >
                                                        <LuCheck size={15} className="shrink-0" aria-hidden />
                                                        Complete
                                                    </button>
                                                </>
                                            ) : null}
                                            <button
                                                type="button"
                                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200/90 bg-rose-50/60 px-2.5 py-2 text-xs font-semibold text-rose-900 shadow-sm hover:bg-rose-100/80"
                                                onClick={() => setDeleteTarget(fu)}
                                            >
                                                <LuTrash2 size={15} className="shrink-0" aria-hidden />
                                                Delete
                                            </button>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* KPI strip — full width below workspace */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 sm:gap-4 sm:p-5">
                <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Due today</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-[var(--cta-button-bg)] sm:text-2xl">{stats.dueToday}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overdue</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-rose-600 sm:text-2xl">{stats.overdue}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Done today</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 sm:text-2xl">{stats.completedToday}</p>
                </div>
            </div>

            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete follow-up"
                maxWidthClassName="max-w-md"
                footer={
                    <>
                        <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="danger" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </>
                }
            >
                <p className="text-sm leading-relaxed text-slate-600">
                    Remove this task from the workspace? This cannot be undone.
                </p>
            </Modal>
        </div>
        </>
    );
}
