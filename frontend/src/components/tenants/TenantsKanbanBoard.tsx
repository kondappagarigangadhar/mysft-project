'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Company } from '@/data/mockData';
import { tenantViewHref } from '@/lib/tenantRoutes';

const STATUSES: Company['status'][] = ['Active', 'Pending', 'Suspended', 'Inactive'];

export function TenantsKanbanBoard({ rows }: { rows: Company[] }) {
    const groups = STATUSES.map((status) => ({
        status,
        items: rows.filter((r) => r.status === status),
    }));

    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {groups.map((g) => (
                <div key={g.status} className="flex min-h-[220px] flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-3 shadow-inner">
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{g.status}</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
                            {g.items.length}
                        </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
                        {g.items.length === 0 ? (
                            <p className="px-1 py-6 text-center text-xs text-slate-400">No tenants</p>
                        ) : (
                            g.items.map((c) => (
                                <Link
                                    key={c.id}
                                    href={tenantViewHref(c.id)}
                                    className={cn(
                                        'rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_40%,transparent)] hover:shadow-md',
                                    )}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-sm font-bold text-slate-700 ring-1 ring-slate-200/80">
                                            {c.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                                            <p className="mt-0.5 text-[11px] text-slate-500">{c.city}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                <span
                                                    className={cn(
                                                        'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                                        c.plan === 'Enterprise' && 'bg-purple-100 text-purple-800',
                                                        c.plan === 'Pro' && 'bg-blue-100 text-blue-800',
                                                        c.plan === 'Basic' && 'bg-slate-100 text-slate-700',
                                                    )}
                                                >
                                                    {c.plan}
                                                </span>
                                                <span className="text-[11px] tabular-nums text-slate-500">{c.usersCount} users</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
