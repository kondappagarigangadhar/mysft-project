'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { CustomerProjectUpdate } from '@/lib/customersStore';
import { LuChevronDown, LuMegaphone, LuPlus } from 'react-icons/lu';
import { cn } from '@/lib/utils';

type Props = {
    updates: CustomerProjectUpdate[];
    editing: boolean;
    onChange: (updates: CustomerProjectUpdate[]) => void;
};

export function CustomerProjectUpdatesTab({ updates, editing, onChange }: Props) {
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set(updates.map((u) => u.id)));

    const toggle = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const addUpdate = () => {
        const id = `pu-${Date.now()}`;
        onChange([
            {
                id,
                title: 'New project update',
                description: '',
                date: new Date().toISOString().slice(0, 10),
            },
            ...updates,
        ]);
        setExpanded((p) => new Set(p).add(id));
    };

    const patch = (id: string, field: keyof CustomerProjectUpdate, value: string) => {
        onChange(updates.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Project Updates</h3>
                {editing ? (
                    <Button variant="companyOutline" size="sm" className="gap-1" type="button" onClick={addUpdate}>
                        <LuPlus size={14} /> Add update
                    </Button>
                ) : null}
            </div>
            {updates.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    No project updates published yet.
                </p>
            ) : (
                updates.map((u) => {
                    const open = expanded.has(u.id);
                    return (
                        <article key={u.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <button
                                type="button"
                                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/80"
                                onClick={() => toggle(u.id)}
                            >
                                <LuMegaphone size={18} className="shrink-0 text-[var(--cta-button-bg)]" />
                                <div className="min-w-0 flex-1">
                                    {editing ? (
                                        <input
                                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm font-semibold"
                                            value={u.title}
                                            onChange={(e) => patch(u.id, 'title', e.target.value)}
                                        />
                                    ) : (
                                        <p className="font-semibold text-slate-900">{u.title}</p>
                                    )}
                                    <p className="text-xs text-slate-500">{u.date}</p>
                                </div>
                                <LuChevronDown size={18} className={cn('shrink-0 transition', open && 'rotate-180')} />
                            </button>
                            {open ? (
                                <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                                    {editing ? (
                                        <textarea
                                            className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                                            rows={3}
                                            value={u.description}
                                            onChange={(e) => patch(u.id, 'description', e.target.value)}
                                        />
                                    ) : (
                                        u.description || '—'
                                    )}
                                </div>
                            ) : null}
                        </article>
                    );
                })
            )}
        </div>
    );
}
