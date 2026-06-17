'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import StatsCard from '@/components/ui/StatsCard';
import PageHeader from '@/components/ui/PageHeader';
import { LuFileText, LuPlus, LuDownload, LuSearch, LuHardDrive, LuFolderClock, LuSparkles } from 'react-icons/lu';
import type { Document } from '@/data/mockData';
import { getAiErrorMessage, postAi } from '@/lib/aiApi';
import { AIConfidenceBar } from '@/components/ai/AIConfidenceBar';
import { AISkeletonShimmer } from '@/components/ai/AISkeletonShimmer';
import { InlineToast } from '@/components/booking-payment/InlineToast';

type ExtractPayload = { data?: unknown };
type RiskPayload = { risks?: string[] };
type ExplainPayload = { explanation?: string; importantClauses?: string[] };

function HighlightedClause({ text }: { text: string }) {
    return <mark className="rounded-sm bg-yellow-100 px-0.5 text-slate-900">{text}</mark>;
}

function RiskLine({ text }: { text: string }) {
    return <p className="text-red-900 underline decoration-red-400 decoration-2 underline-offset-2">{text}</p>;
}

export function DocumentsIntelligenceWorkspace({ documents }: { documents: Document[] }) {
    const [selectedId, setSelectedId] = useState<number | null>(documents[0]?.id ?? null);
    const selected = useMemo(
        () => documents.find((d) => d.id === selectedId) ?? documents[0],
        [documents, selectedId],
    );
    const fileRef = useRef<HTMLInputElement>(null);

    const [extractJson, setExtractJson] = useState<string>('');
    const [risks, setRisks] = useState<string[]>([]);
    const [explain, setExplain] = useState('');
    const [clauses, setClauses] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [confidence, setConfidence] = useState(84);
    const [actions, setActions] = useState<string[]>(['Review with legal before signing.', 'Verify annexures are attached.']);
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const runAuto = useCallback(async () => {
        const doc = documents.find((d) => d.id === selectedId) ?? documents[0];
        if (!doc) return;
        setLoading(true);
        try {
            const [ex, rk] = await Promise.all([
                postAi<ExtractPayload>('/api/ai/extract', {
                    documentId: String(doc.id),
                    documentName: doc.name,
                }),
                postAi<RiskPayload>('/api/ai/risk', {
                    documentId: String(doc.id),
                    documentName: doc.name,
                }),
            ]);
            const exp = await postAi<ExplainPayload>('/api/ai/explain', {
                documentId: String(doc.id),
                documentName: doc.name,
            });

            try {
                setExtractJson(JSON.stringify(ex.data ?? ex, null, 2));
            } catch {
                setExtractJson(String(ex.data ?? ''));
            }
            setRisks(Array.isArray(rk.risks) ? rk.risks : []);
            setExplain(exp.explanation?.trim() || '');
            setClauses(Array.isArray(exp.importantClauses) ? exp.importantClauses : []);
            setConfidence(86);
            setToast({ msg: 'AI scan complete.' });
        } catch (e) {
            setToast({ msg: getAiErrorMessage(e), err: true });
        } finally {
            setLoading(false);
        }
    }, [documents, selectedId]);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!selected) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            void runAuto();
        }, 450);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [selectedId, runAuto]);

    const onUploadPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setToast({ msg: `Queued “${f.name}” — AI scan runs on selection (demo).` });
        e.target.value = '';
    };

    return (
        <>
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}
            <PageHeader
                title="Document Management"
                subtitle="Securely store and share project blueprints, contracts, and safety protocols — with inline AI review."
                actions={
                    <>
                        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={onUploadPick} />
                        <Button type="button" onClick={() => fileRef.current?.click()}>
                            <LuPlus className="mr-2" /> Upload Document
                        </Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 gap-4 mb-8 mt-6 md:grid-cols-3">
                <StatsCard title="Total Files" value="1,245" icon={LuFileText} trend="45 added this week" trendUp />
                <StatsCard title="Storage Used" value="45.2 GB" icon={LuHardDrive} trend="65% of capacity" />
                <StatsCard title="Pending Review" value="12" icon={LuFolderClock} trend="Action required" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_min(100%,360px)]">
                <Card className="overflow-hidden border-none p-0 shadow-sm ring-1 ring-slate-200">
                    <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-4 md:flex-row">
                        <div className="relative w-full md:max-w-xs">
                            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm transition-all placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:border-primary focus:outline-none">
                                <option>All Types</option>
                                <option>PDFs</option>
                                <option>Blueprints</option>
                                <option>Contracts</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table
                            columns={[
                                {
                                    key: 'name',
                                    header: 'Document Name',
                                    render: (row: Document) => (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(row.id)}
                                            className="flex w-full items-center gap-3 text-left"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 font-bold text-indigo-500">
                                                {row.type}
                                            </div>
                                            <div className="flex min-w-0 flex-col">
                                                <span className="font-bold text-slate-800">{row.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{row.size}</span>
                                            </div>
                                        </button>
                                    ),
                                },
                                { key: 'date', header: 'Uploaded Date' },
                                {
                                    key: 'status',
                                    header: 'Status',
                                    render: (row: Document) => (
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                                row.status === 'Final'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : row.status === 'Draft'
                                                      ? 'bg-amber-100 text-amber-700'
                                                      : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {row.status}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'actions',
                                    header: 'Actions',
                                    render: () => (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="group rounded-lg p-2 text-primary transition-colors hover:bg-orange-50"
                                            >
                                                <LuDownload size={18} className="transition-transform group-hover:-translate-y-0.5" />
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            data={documents}
                        />
                    </div>
                </Card>

                <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-2xl border border-violet-200/50 bg-gradient-to-b from-violet-50/40 to-white p-4 shadow-sm ring-1 ring-violet-100/60">
                        <div className="mb-3 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 text-white">
                                <LuSparkles size={16} aria-hidden />
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">AI side panel</h3>
                                <p className="text-[10px] text-slate-500">{selected?.name ?? 'Select a document'}</p>
                            </div>
                        </div>
                        {loading ? (
                            <div className="space-y-2">
                                <AISkeletonShimmer className="h-3 w-full" />
                                <AISkeletonShimmer className="h-3 w-5/6" />
                            </div>
                        ) : null}
                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-500">AI summary</p>
                                <p className="mt-1 leading-relaxed text-slate-800">
                                    {explain ? (
                                        explain
                                    ) : (
                                        <span className="text-slate-500">Select a row — extract & risk run automatically.</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-red-700">Key risks</p>
                                <ul className="mt-1 space-y-2">
                                    {risks.length ? (
                                        risks.map((r, i) => (
                                            <li key={i}>
                                                <RiskLine text={r} />
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-slate-500">—</li>
                                    )}
                                </ul>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-amber-800">Important clauses</p>
                                <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-800">
                                    {clauses.length ? (
                                        clauses.map((c, i) => (
                                            <li key={i}>
                                                <HighlightedClause text={c} />
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-slate-500">—</li>
                                    )}
                                </ul>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-500">Recommended actions</p>
                                <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-800">
                                    {actions.map((a, i) => (
                                        <li key={i}>{a}</li>
                                    ))}
                                </ul>
                            </div>
                            <AIConfidenceBar value={confidence} />
                            <details className="rounded-lg border border-slate-200 bg-slate-50/80 p-2">
                                <summary className="cursor-pointer text-xs font-semibold text-slate-600">Extracted data (JSON)</summary>
                                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[10px] text-slate-700">
                                    {extractJson || '—'}
                                </pre>
                            </details>
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );
}
