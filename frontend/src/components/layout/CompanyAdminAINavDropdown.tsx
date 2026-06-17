'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LuLoader, LuSparkles, LuX } from 'react-icons/lu';
import { getAiErrorMessage, postAi, postAiCached } from '@/lib/aiApi';
import { cn } from '@/lib/utils';

type ExecPayload = {
    headline?: string;
    riskPayments?: number;
    hotLeads?: number;
    urgentActions?: number;
    bullets?: string[];
};

type AnalyticsPayload = { summary?: string; insights?: string[]; bullets?: string[] };

export function CompanyAdminAINavDropdown({ triggerTone = 'default' }: { triggerTone?: 'default' | 'onBlue' } = {}) {
    const [open, setOpen] = useState(false);
    const [headline, setHeadline] = useState('');
    const [bullets, setBullets] = useState<string[]>([]);
    const [loadingPulse, setLoadingPulse] = useState(false);
    const [q, setQ] = useState('');
    const [answer, setAnswer] = useState('');
    const [asking, setAsking] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    const loadPulse = useCallback(async () => {
        setLoadingPulse(true);
        setErr(null);
        try {
            const res = await postAiCached<ExecPayload>(
                'executive-summary:navbar',
                '/api/ai/executive-summary',
                {},
                8 * 60_000,
            );
            setHeadline(res.headline?.trim() || 'Workspace pulse');
            setBullets(Array.isArray(res.bullets) ? res.bullets.slice(0, 3) : []);
        } catch (e) {
            setErr(getAiErrorMessage(e));
        } finally {
            setLoadingPulse(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        void loadPulse();
    }, [open, loadPulse]);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', onDoc);
        }
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const ask = async () => {
        const query = q.trim();
        if (!query) return;
        setAsking(true);
        setErr(null);
        try {
            const res = await postAi<AnalyticsPayload>('/api/ai/analytics', { query });
            const parts = [res.summary?.trim(), ...(res.insights ?? res.bullets ?? [])].filter(Boolean);
            setAnswer(parts.join('\n\n'));
        } catch (e) {
            setErr(getAiErrorMessage(e));
            setAnswer('');
        } finally {
            setAsking(false);
        }
    };

    return (
        <div className="relative" ref={wrapRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    'relative flex rounded-xl p-2.5 transition-all duration-200',
                    triggerTone === 'onBlue'
                        ? 'text-amber-300 hover:bg-white/10 hover:text-amber-200'
                        : 'text-[#0092ff] hover:bg-blue-50 hover:text-blue-700',
                    triggerTone === 'onBlue' && open && 'bg-white/15 ring-1 ring-amber-400/50',
                    triggerTone === 'default' && open && 'bg-blue-50 ring-1 ring-[#0092ff]/25',
                )}
                title="AI hub — insights & ask"
                aria-expanded={open}
                aria-label="Open AI hub"
            >
                <LuSparkles size={20} aria-hidden />
                <span
                    className={cn(
                        'absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ring-2',
                        triggerTone === 'onBlue'
                            ? 'bg-amber-400 text-[#0a1628] ring-[#0092ff]'
                            : 'bg-[#0092ff] text-white ring-white',
                    )}
                >
                    2
                </span>
            </button>

            {open ? (
                <div
                    className="absolute right-0 top-[calc(100%+8px)] z-[200] w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200 ease-out"
                    role="dialog"
                    aria-label="AI hub"
                >
                    <div className="flex items-start justify-between gap-2 rounded-lg border-b border-gray-100 bg-gradient-to-br from-blue-50 to-white px-3 py-3">
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#0092ff]">AI hub</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">{headline || 'This week'}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-lg p-1.5 text-slate-400 transition-all duration-200 hover:bg-blue-50 hover:text-[#0092ff]"
                            aria-label="Close"
                        >
                            <LuX size={18} />
                        </button>
                    </div>

                    <div className="max-h-[min(55vh,420px)] overflow-y-auto px-4 py-3">
                        {loadingPulse ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <LuLoader className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                                Loading insights…
                            </div>
                        ) : err && !bullets.length ? (
                            <p className="text-sm text-red-700">{err}</p>
                        ) : (
                            <ul className="space-y-2 text-sm text-slate-700">
                                {bullets.map((b, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0092ff]" aria-hidden />
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="mt-2 border-t border-gray-100 pt-3">
                            <label htmlFor="ai-nav-ask" className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                Ask AI
                            </label>
                            <textarea
                                id="ai-nav-ask"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                rows={2}
                                placeholder="e.g. Summarize payment risk this week"
                                className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-[#0092ff] focus:outline-none focus:ring-2 focus:ring-[#0092ff]/25"
                            />
                            <button
                                type="button"
                                onClick={() => void ask()}
                                disabled={asking || !q.trim()}
                                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0092ff] to-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {asking ? <LuLoader className="h-4 w-4 animate-spin" aria-hidden /> : null}
                                {asking ? 'Thinking…' : 'Get answer'}
                            </button>
                            {answer ? (
                                <p className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/90 p-3 text-sm leading-relaxed text-slate-800">
                                    {answer}
                                </p>
                            ) : null}
                            {err && bullets.length ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
