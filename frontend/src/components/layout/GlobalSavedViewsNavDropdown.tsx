'use client';

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { LuBookmark, LuPin, LuPencil, LuSearch, LuTrash2, LuX } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import {
    deleteGlobalSavedViewById,
    EMPTY_GLOBAL_SAVED_VIEWS_SNAPSHOT,
    getGlobalSavedViewsSnapshot,
    queueNavigateWithSavedView,
    renameGlobalSavedView,
    setGlobalSavedViewPinned,
    sortSavedViewsForDisplay,
    subscribeGlobalSavedViews,
    type GlobalSavedView,
} from '@/lib/globalSavedViewsStore';

function moduleBadgeClass(module: string): string {
    const m = module.toLowerCase();
    if (m.includes('lead')) return 'bg-violet-100 text-violet-800 ring-violet-200';
    if (m.includes('customer')) return 'bg-sky-100 text-sky-800 ring-sky-200';
    if (m.includes('invent')) return 'bg-amber-100 text-amber-900 ring-amber-200';
    if (m.includes('payment') || m.includes('book')) return 'bg-emerald-100 text-emerald-900 ring-emerald-200';
    if (m.includes('document') || m.includes('compliance') || m.includes('esign') || m.includes('audit'))
        return 'bg-slate-200 text-slate-800 ring-slate-300';
    if (m.includes('report') || m.includes('demand') || m.includes('intel')) return 'bg-indigo-100 text-indigo-900 ring-indigo-200';
    if (m.includes('project') || m.includes('pric')) return 'bg-orange-100 text-orange-900 ring-orange-200';
    return 'bg-slate-100 text-slate-700 ring-slate-200';
}

export function GlobalSavedViewsNavDropdown({ tone = 'onBlue' as const }: { tone?: 'onBlue' | 'default' }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [renameDraft, setRenameDraft] = useState('');
    const wrapRef = useRef<HTMLDivElement>(null);

    const views = useSyncExternalStore(
        subscribeGlobalSavedViews,
        getGlobalSavedViewsSnapshot,
        () => EMPTY_GLOBAL_SAVED_VIEWS_SNAPSHOT,
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = q
            ? views.filter(
                  (v) =>
                      v.name.toLowerCase().includes(q) ||
                      v.module.toLowerCase().includes(q) ||
                      v.route.toLowerCase().includes(q),
              )
            : views;
        return sortSavedViewsForDisplay(base);
    }, [views, query]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const startRename = (v: GlobalSavedView) => {
        setEditingId(v.id);
        setRenameDraft(v.name);
    };

    const commitRename = (id: string) => {
        renameGlobalSavedView(id, renameDraft);
        setEditingId(null);
        setRenameDraft('');
    };

    const onSelectView = (v: GlobalSavedView) => {
        queueNavigateWithSavedView(v);
        const path = v.route.startsWith('/') ? v.route : `/${v.route}`;
        router.push(path);
        setOpen(false);
        setQuery('');
    };

    const triggerClass =
        tone === 'onBlue'
            ? 'rounded-xl p-2.5 text-sky-200 transition-all duration-200 hover:bg-white/10 hover:text-white'
            : 'rounded-xl p-2.5 text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:text-[#0092ff]';

    return (
        <div className="relative" ref={wrapRef}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    triggerClass,
                    open && tone === 'onBlue' && 'bg-white/15 text-white',
                    open && tone === 'default' && 'bg-blue-50 text-[#0092ff] ring-1 ring-[#0092ff]/20',
                )}
                aria-expanded={open}
                aria-haspopup="menu"
                title="Saved views"
                aria-label="Saved views"
            >
                <LuBookmark size={20} className={cn(tone === 'onBlue' && 'drop-shadow-sm')} />
            </button>

            {open ? (
                <div
                    className="absolute right-0 top-full z-[100] mt-2 min-w-[220px] w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-gray-100 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200 ease-out"
                    role="menu"
                >
                    <div className="rounded-lg border-b border-gray-100 bg-slate-50/90 px-3 py-2.5">
                        <h3 className="text-sm font-semibold text-slate-800">Saved views</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Shortcuts to filtered lists across admin</p>
                    </div>
                    <div className="border-b border-gray-100 px-1 py-2">
                        <div className="relative">
                            <LuSearch
                                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                aria-hidden
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by name or module…"
                                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-8 text-sm text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:border-[#0092ff] focus:outline-none focus:ring-2 focus:ring-[#0092ff]"
                                aria-label="Search saved views"
                            />
                            {query ? (
                                <button
                                    type="button"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Clear search"
                                    onClick={() => setQuery('')}
                                >
                                    <LuX size={16} />
                                </button>
                            ) : null}
                        </div>
                    </div>
                    <div className="max-h-[min(22rem,60vh)] overflow-y-auto py-1.5">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-slate-500">
                                {views.length === 0
                                    ? 'No saved views yet. Save one from any page’s filter drawer.'
                                    : 'No matches. Try another search.'}
                            </p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {filtered.map((v) => (
                                    <li key={v.id} className="px-1 py-0.5">
                                        {editingId === v.id ? (
                                            <div className="flex items-center gap-1 px-1">
                                                <input
                                                    value={renameDraft}
                                                    onChange={(e) => setRenameDraft(e.target.value)}
                                                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') commitRename(v.id);
                                                        if (e.key === 'Escape') {
                                                            setEditingId(null);
                                                            setRenameDraft('');
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                                                    onClick={() => commitRename(v.id)}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-1">
                                                <button
                                                    type="button"
                                                    className="min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-all duration-200 hover:translate-x-1 hover:bg-blue-50 hover:text-[#0092ff]"
                                                    onClick={() => onSelectView(v)}
                                                    role="menuitem"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {v.pinned ? (
                                                            <LuPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                                                        ) : (
                                                            <span className="w-3.5 shrink-0" />
                                                        )}
                                                        <span className="truncate text-sm font-medium text-slate-900">{v.name}</span>
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-[1.375rem]">
                                                        <span
                                                            className={cn(
                                                                'inline-flex max-w-full truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1',
                                                                moduleBadgeClass(v.module),
                                                            )}
                                                        >
                                                            {v.module}
                                                        </span>
                                                        <span className="truncate text-[11px] text-slate-400">{v.route}</span>
                                                    </div>
                                                </button>
                                                <div className="flex shrink-0 flex-col gap-0.5 pt-1">
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            'rounded-lg p-1.5 text-slate-400 hover:bg-slate-100',
                                                            v.pinned && 'text-amber-600',
                                                        )}
                                                        title={v.pinned ? 'Unpin' : 'Pin to top'}
                                                        aria-label={v.pinned ? 'Unpin saved view' : 'Pin saved view'}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setGlobalSavedViewPinned(v.id, !v.pinned);
                                                        }}
                                                    >
                                                        <LuPin size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                        title="Rename"
                                                        aria-label={`Rename ${v.name}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startRename(v);
                                                        }}
                                                    >
                                                        <LuPencil size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                        title="Delete"
                                                        aria-label={`Delete ${v.name}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteGlobalSavedViewById(v.id);
                                                        }}
                                                    >
                                                        <LuTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
