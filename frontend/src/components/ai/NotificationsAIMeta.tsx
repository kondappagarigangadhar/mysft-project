'use client';

import React, { useEffect, useState } from 'react';
import { postAiCached } from '@/lib/aiApi';
import { AIConfidenceBar } from '@/components/ai/AIConfidenceBar';
import { AISkeletonShimmer } from '@/components/ai/AISkeletonShimmer';
import { LuZap } from 'react-icons/lu';

type SuggestPayload = {
    bestTimeToSend?: string;
    bestChannel?: string;
    confidence?: number;
};

export function NotificationsAIMeta() {
    const [time, setTime] = useState('');
    const [channel, setChannel] = useState('');
    const [conf, setConf] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await postAiCached<SuggestPayload>(
                    'notification-suggest:v1',
                    '/api/ai/notification-suggest',
                    {},
                    15 * 60_000,
                );
                if (cancelled) return;
                setTime(res.bestTimeToSend?.trim() || '—');
                setChannel(res.bestChannel?.trim() || '—');
                setConf(typeof res.confidence === 'number' ? res.confidence : 82);
            } catch {
                if (!cancelled) {
                    setTime('Tue 10:30 IST');
                    setChannel('Email');
                    setConf(78);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="mb-6 rounded-2xl border border-amber-100/80 bg-gradient-to-r from-amber-50/50 via-white to-sky-50/40 p-4 shadow-sm ring-1 ring-amber-100/60">
            <div className="flex flex-wrap items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <LuZap size={18} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">AI send guidance</p>
                    <p className="mt-1 text-sm text-slate-700">
                        Auto-suggested for payment reminders & inactive leads (demo).
                    </p>
                    {loading ? (
                        <div className="mt-3 space-y-2">
                            <AISkeletonShimmer className="h-3 w-2/3" />
                            <AISkeletonShimmer className="h-3 w-1/2" />
                        </div>
                    ) : (
                        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="text-[10px] font-bold uppercase text-slate-500">Best time to send</dt>
                                <dd className="font-semibold text-slate-900">{time}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-bold uppercase text-slate-500">Best channel</dt>
                                <dd className="font-semibold text-slate-900">{channel}</dd>
                            </div>
                        </dl>
                    )}
                    {!loading ? <AIConfidenceBar value={conf} className="mt-3" /> : null}
                </div>
            </div>
        </div>
    );
}
