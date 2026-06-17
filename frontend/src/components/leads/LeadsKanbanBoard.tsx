'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { leadProfileHref } from '@/lib/leadRoutes';
import type { KanbanColumnId, Lead } from '@/lib/leadStore';
import { formatLeadCode, normalizeLeadPhoneDigits, resolveKanbanColumnForLead, updateLeadKanbanColumn } from '@/lib/leadStore';
import { LeadScoreBadge, leadDisplayScore } from '@/components/leads/LeadScoreBadge';
import { AIInlineBadge } from '@/components/ai/AIInlineBadge';
import { daysSinceLastLeadActivity } from '@/lib/leadAiUtils';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { formatShortDate } from '@/lib/formatDate';
import { CTA_BULK_BAR, CTA_CHECKBOX_SM } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import { LuBuilding2, LuCalendar, LuChevronDown, LuChevronUp, LuLayers, LuMail, LuPhone, LuTag, LuUser } from 'react-icons/lu';

const COLUMNS: { id: KanbanColumnId; label: string }[] = [
    { id: 'new', label: 'New' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'qualified', label: 'Qualified' },
    { id: 'proposal', label: 'Proposal' },
    { id: 'closed', label: 'Closed' },
];

const DND_PAYLOAD = 'application/x-arris-lead-slugs';

function phoneDisplay(phone: string) {
    const d = normalizeLeadPhoneDigits(phone);
    if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
    return phone.trim() || '—';
}

function ColumnHeaderCheckbox({
    columnLabel,
    items,
    selectedSet,
    onToggle,
}: {
    columnLabel: string;
    items: Lead[];
    selectedSet: Set<string>;
    onToggle: () => void;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const allInCol = items.length > 0 && items.every((l) => selectedSet.has(l.slug));
    const someInCol = items.some((l) => selectedSet.has(l.slug));

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.indeterminate = items.length > 0 && someInCol && !allInCol;
    }, [items.length, someInCol, allInCol]);

    if (items.length === 0) return null;

    return (
        <input
            ref={ref}
            type="checkbox"
            checked={allInCol}
            onChange={onToggle}
            className={CTA_CHECKBOX_SM}
            title={allInCol ? `Deselect all in ${columnLabel}` : `Select all in ${columnLabel}`}
            aria-label={allInCol ? `Deselect all leads in ${columnLabel}` : `Select all leads in ${columnLabel}`}
        />
    );
}

function parseDragSlugs(e: React.DragEvent): string[] {
    const raw = e.dataTransfer.getData(DND_PAYLOAD);
    if (raw) {
        try {
            const slugs = JSON.parse(raw) as unknown;
            if (Array.isArray(slugs) && slugs.every((s) => typeof s === 'string')) return slugs;
        } catch {
            /* fall through */
        }
    }
    const one = e.dataTransfer.getData('text/plain');
    return one ? [one] : [];
}

export function LeadsKanbanBoard({ leads, onMoved }: { leads: Lead[]; onMoved: () => void }) {
    const [dragSlug, setDragSlug] = useState<string | null>(null);
    const [draggingSlugs, setDraggingSlugs] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [detailsOpen, setDetailsOpen] = useState<Set<string>>(() => new Set());

    const selectedSet = useMemo(() => new Set(selected), [selected]);

    const toggleDetails = useCallback((slug: string) => {
        setDetailsOpen((prev) => {
            const next = new Set(prev);
            if (next.has(slug)) next.delete(slug);
            else next.add(slug);
            return next;
        });
    }, []);

    const toggleSelect = useCallback((slug: string) => {
        setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
    }, []);

    const clearSelection = useCallback(() => setSelected([]), []);

    useEffect(() => {
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key === 'Escape') clearSelection();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [clearSelection]);

    const byColumn = useMemo(() => {
        const m = new Map<KanbanColumnId, Lead[]>();
        for (const c of COLUMNS) m.set(c.id, []);
        for (const l of leads) {
            const col = resolveKanbanColumnForLead(l);
            const list = m.get(col) ?? [];
            list.push(l);
            m.set(col, list);
        }
        for (const c of COLUMNS) {
            const list = m.get(c.id) ?? [];
            list.sort((a, b) => a.name.localeCompare(b.name));
            m.set(c.id, list);
        }
        return m;
    }, [leads]);

    const moveSlugsToColumn = useCallback(
        (slugs: string[], col: KanbanColumnId) => {
            const uniq = [...new Set(slugs.filter(Boolean))];
            for (const slug of uniq) {
                updateLeadKanbanColumn(slug, col);
            }
            if (uniq.length) {
                setDragSlug(null);
                setDraggingSlugs([]);
                clearSelection();
                onMoved();
            }
        },
        [clearSelection, onMoved],
    );

    const onDragStart = (slug: string) => (e: React.DragEvent) => {
        const slugsToMove = selectedSet.has(slug) && selected.length > 0 ? [...selected] : [slug];
        setDragSlug(slug);
        setDraggingSlugs(slugsToMove);
        e.dataTransfer.setData(DND_PAYLOAD, JSON.stringify(slugsToMove));
        e.dataTransfer.setData('text/plain', slug);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragEnd = () => {
        setDragSlug(null);
        setDraggingSlugs([]);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (col: KanbanColumnId) => (e: React.DragEvent) => {
        e.preventDefault();
        const slugs = parseDragSlugs(e);
        if (!slugs.length) return;
        moveSlugsToColumn(slugs, col);
    };

    const isDraggingMulti = draggingSlugs.length > 1;

    const toggleSelectAllInColumn = useCallback((colId: KanbanColumnId) => {
        const slugsInCol = (byColumn.get(colId) ?? []).map((l) => l.slug);
        if (slugsInCol.length === 0) return;
        setSelected((prev) => {
            const set = new Set(prev);
            const allInCol = slugsInCol.every((s) => set.has(s));
            if (allInCol) {
                slugsInCol.forEach((s) => set.delete(s));
            } else {
                slugsInCol.forEach((s) => set.add(s));
            }
            return [...set];
        });
    }, [byColumn]);

    return (
        <div className="overflow-x-auto pb-2">
            {selected.length > 0 ? (
                <div className={cn('mb-3 flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm shadow-sm', CTA_BULK_BAR)}>
                    <span className="font-semibold text-slate-800">
                        {selected.length} lead{selected.length === 1 ? '' : 's'} selected
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="hidden text-xs text-slate-500 sm:inline">Drag selected cards to another column</span>
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="flex min-h-[min(70vh,560px)] w-max min-w-full gap-3">
                {COLUMNS.map((col) => {
                    const items = byColumn.get(col.id) ?? [];
                    return (
                        <section
                            key={col.id}
                            className={cn(
                                'flex w-[min(100%,300px)] shrink-0 flex-col rounded-2xl border border-slate-200/90 bg-slate-50/80',
                                dragSlug && 'ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]',
                            )}
                            onDragOver={onDragOver}
                            onDrop={onDrop(col.id)}
                        >
                            <header className="border-b border-slate-200/80 px-3 py-2.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-slate-900">{col.label}</h3>
                                        <p className="text-[11px] font-medium text-slate-500">{items.length} leads</p>
                                    </div>
                                    <ColumnHeaderCheckbox
                                        columnLabel={col.label}
                                        items={items}
                                        selectedSet={selectedSet}
                                        onToggle={() => toggleSelectAllInColumn(col.id)}
                                    />
                                </div>
                            </header>
                            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                                {items.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-slate-200 bg-white/60 px-2 py-6 text-center text-xs text-slate-400">
                                        Drop leads here
                                    </p>
                                ) : (
                                    items.map((lead) => {
                                        const d = normalizeLeadPhoneDigits(lead.phone);
                                        const tel = d.length === 10 ? `tel:${d}` : undefined;
                                        const isSelected = selectedSet.has(lead.slug);
                                        const isInDragBatch = draggingSlugs.includes(lead.slug);
                                        const showDetails = detailsOpen.has(lead.slug);
                                        const highIntent = leadDisplayScore(lead) >= 70;
                                        const stale = daysSinceLastLeadActivity(lead) > 14;
                                        return (
                                            <article
                                                key={lead.slug}
                                                draggable
                                                onDragStart={onDragStart(lead.slug)}
                                                onDragEnd={onDragEnd}
                                                className={cn(
                                                    'cursor-grab rounded-xl border bg-white p-3 shadow-sm ring-1 ring-black/3 transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] hover:shadow-md active:cursor-grabbing',
                                                    isSelected
                                                        ? 'border-[var(--cta-button-bg)] ring-2 ring-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]'
                                                        : 'border-slate-200',
                                                    dragSlug === lead.slug && 'opacity-70 ring-2 ring-[var(--cta-button-bg)]',
                                                    isDraggingMulti && isInDragBatch && 'opacity-80',
                                                )}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(lead.slug)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={cn('mt-1', CTA_CHECKBOX_SM)}
                                                        aria-label={`Select ${lead.name}`}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <Link
                                                                    href={leadProfileHref(lead.slug)}
                                                                    className="font-semibold leading-snug text-slate-900 hover:text-[var(--cta-button-bg)]"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onDragStart={(e) => e.preventDefault()}
                                                                >
                                                                    {lead.name}
                                                                </Link>
                                                                <div className="mt-1 flex flex-wrap gap-1">
                                                                    {highIntent ? (
                                                                        <AIInlineBadge variant="intent" title="High intent">
                                                                            🔥 High Intent
                                                                        </AIInlineBadge>
                                                                    ) : null}
                                                                    {stale ? (
                                                                        <AIInlineBadge variant="risk" title="Low recent response">
                                                                            ⚠️ At risk
                                                                        </AIInlineBadge>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                            <LeadStatusBadge status={lead.status} />
                                                        </div>

                                                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                                                            <LeadScoreBadge score={leadDisplayScore(lead)} />
                                                            <div className="flex min-w-0 max-w-full items-center gap-1 text-[11px] text-slate-600">
                                                                <LuUser size={12} className="shrink-0 text-slate-400" aria-hidden />
                                                                <span className="truncate font-medium" title={lead.assignedTo}>
                                                                    {lead.assignedTo?.trim() || 'Unassigned'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            draggable={false}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleDetails(lead.slug);
                                                            }}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            aria-expanded={showDetails}
                                                            className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50/80 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"
                                                        >
                                                            {showDetails ? (
                                                                <>
                                                                    <LuChevronUp size={14} aria-hidden />
                                                                    Hide details
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <LuChevronDown size={14} aria-hidden />
                                                                    More details
                                                                </>
                                                            )}
                                                        </button>

                                                        {showDetails ? (
                                                            <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2.5 text-[11px]">
                                                                <p className="font-mono text-[10px] font-semibold tabular-nums tracking-wide text-slate-400">
                                                                    {formatLeadCode(lead.id)}
                                                                </p>
                                                                {lead.email?.trim() ? (
                                                                    <div className="flex min-w-0 items-start gap-1.5 text-slate-600">
                                                                        <LuMail size={12} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
                                                                        <a
                                                                            href={`mailto:${lead.email}`}
                                                                            className="min-w-0 truncate hover:text-[var(--cta-button-bg)] hover:underline"
                                                                            title={lead.email}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onDragStart={(e) => e.preventDefault()}
                                                                        >
                                                                            {lead.email}
                                                                        </a>
                                                                    </div>
                                                                ) : null}
                                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                                    <LuPhone size={12} className="shrink-0 text-slate-400" aria-hidden />
                                                                    <a
                                                                        href={tel}
                                                                        className={cn(
                                                                            'tabular-nums',
                                                                            tel ? 'hover:text-[var(--cta-button-bg)]' : 'pointer-events-none text-slate-500',
                                                                        )}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onDragStart={(e) => e.preventDefault()}
                                                                    >
                                                                        {phoneDisplay(lead.phone)}
                                                                    </a>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                                    <LuTag size={12} className="shrink-0 text-slate-400" aria-hidden />
                                                                    <span className="min-w-0 truncate" title={lead.source}>
                                                                        {lead.source}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                                    <LuLayers size={12} className="shrink-0 text-slate-400" aria-hidden />
                                                                    <span className="min-w-0 truncate" title={lead.preferredUnitType}>
                                                                        {lead.preferredUnitType}
                                                                    </span>
                                                                </div>
                                                                {lead.project?.trim() ? (
                                                                    <div className="flex items-start gap-1.5 text-slate-600">
                                                                        <LuBuilding2 size={12} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
                                                                        <span className="min-w-0 line-clamp-2" title={lead.project}>
                                                                            {lead.project}
                                                                        </span>
                                                                    </div>
                                                                ) : null}
                                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                                    <LuCalendar size={12} className="shrink-0 text-slate-400" aria-hidden />
                                                                    <span className="tabular-nums">{formatShortDate(lead.createdDate)}</span>
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
