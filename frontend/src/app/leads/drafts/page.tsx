'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LeadDetailShell } from '@/components/leads/LeadDetailShell';
import { Button } from '@/components/ui/Button';
import { draftService, type DraftRecord } from '@/lib/draftService';
import PageHeader from '@/components/ui/PageHeader';
import { Table } from '@/components/ui/Table';
import { cn } from '@/lib/utils';
import { LuFileText, LuTrash2, LuPencil } from 'react-icons/lu';

type LeadDraftData = {
    name?: string;
    phone?: string;
    email?: string;
    source?: string;
    assignedTo?: string;
    project?: string;
    budgetRange?: string;
    preferredUnitType?: string;
    status?: string;
    notes?: string;
    presentAddress?: string;
    permanentAddress?: string;
};

function fmtWhen(iso: string) {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

export default function LeadDraftsPage() {
    const router = useRouter();
    const [refresh, setRefresh] = React.useState(0);
    const drafts = React.useMemo(() => draftService.getDrafts<LeadDraftData>('lead'), [refresh]);

    const onDelete = (draft: DraftRecord) => {
        const label = (draft.data as LeadDraftData | undefined)?.name?.trim() || 'Untitled Lead';
        const ok = window.confirm(`Delete draft “${label}”?`);
        if (!ok) return;
        draftService.deleteDraft(draft.draftId);
        setRefresh((x) => x + 1);
    };

    const rows = React.useMemo(() => {
        return drafts.map((d) => {
            const data = d.data as LeadDraftData | undefined;
            const name = data?.name?.trim() || 'Untitled Lead';
            const phone = data?.phone?.trim() || '';
            return { draftId: d.draftId, draft: d, name, phone, updatedAt: d.updatedAt };
        });
    }, [drafts]);

    return (
        <LeadDetailShell breadcrumbItems={[{ label: 'Leads', href: '/leads' }, { label: 'Drafts' }]}>
            <div className="mx-auto w-full  px-2 sm:px-4">
                <div className="mt-4">
                    <PageHeader
                        title="Lead Drafts"
                        subtitle="Continue where you left off. Drafts are saved locally in this browser."
                        actions={
                            <Link href="/leads/create">
                                <Button variant="company" size="cta" className="h-10">
                                    Create New Lead
                                </Button>
                            </Link>
                        }
                    />
                </div>

                <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium text-slate-600">
                            {drafts.length} draft{drafts.length === 1 ? '' : 's'}
                        </div>
                        <Link
                            href="/leads"
                            className="text-sm font-semibold text-blue-600 underline decoration-blue-500/25 underline-offset-2 hover:text-blue-800"
                        >
                            Back to Leads
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <Table
                            rowKey="draftId"
                            onRowClick={(row: (typeof rows)[number]) => {
                                router.push(`/leads/create?draftId=${encodeURIComponent(row.draftId)}`);
                            }}
                            columns={[
                                {
                                    key: 'name',
                                    header: 'Lead Name',
                                    render: (row: (typeof rows)[number]) => {
                                        const initial = (row.name.trim().charAt(0) || 'U').toUpperCase();
                                        return (
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                                                    {initial}
                                                </div>
                                                <Link
                                                    href={`/leads/create?draftId=${encodeURIComponent(row.draftId)}`}
                                                    className="flex flex-col min-w-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="text-sm font-semibold text-slate-800 truncate hover:text-blue-700 hover:underline">
                                                        {row.name}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-500">Draft</span>
                                                </Link>
                                            </div>
                                        );
                                    },
                                },
                                {
                                    key: 'phone',
                                    header: 'Phone Number',
                                    className: 'hidden md:table-cell',
                                    render: (row: (typeof rows)[number]) => (
                                        <span className="text-sm font-medium tabular-nums text-slate-700">
                                            {row.phone ? row.phone : '—'}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'updatedAt',
                                    header: 'Last Updated',
                                    render: (row: (typeof rows)[number]) => (
                                        <span className="text-sm font-medium text-slate-700">{fmtWhen(row.updatedAt)}</span>
                                    ),
                                },
                                {
                                    key: 'status',
                                    header: 'Status',
                                    className: 'hidden lg:table-cell',
                                    render: () => (
                                        <span className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                                            Draft
                                        </span>
                                    ),
                                },
                                {
                                    key: 'actions',
                                    header: '',
                                    className: 'text-right',
                                    render: (row: (typeof rows)[number]) => (
                                        <div className="flex justify-end">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/leads/create?draftId=${encodeURIComponent(row.draftId)}`}>
                                                    <Button
                                                        variant="companyOutline"
                                                        size="sm"
                                                        className="h-8 gap-2 border-slate-200"
                                                        aria-label="Continue editing"
                                                        title="Continue editing"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <LuPencil size={16} className="text-blue-600" />
                                                        Continue editing
                                                    </Button>
                                                </Link>
                                                <Button
                                                    type="button"
                                                    variant="companyGhost"
                                                    size="icon"
                                                    className={cn('h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600')}
                                                    aria-label="Delete draft"
                                                    title="Delete draft"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(row.draft);
                                                    }}
                                                >
                                                    <LuTrash2 size={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    ),
                                },
                            ]}
                            data={rows}
                            className="border-none"
                        />
                    </div>

                    {drafts.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-200/60">
                                <LuFileText className="h-6 w-6 text-blue-600" aria-hidden />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-slate-900">No drafts yet</p>
                            <p className="mt-1 text-sm text-slate-600">Start creating a lead and drafts will appear here automatically.</p>
                            <div className="mt-4 flex justify-center">
                                <Link href="/leads/create">
                                    <Button variant="company" size="cta" className="h-10">
                                        Create Lead
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </LeadDetailShell>
    );
}

