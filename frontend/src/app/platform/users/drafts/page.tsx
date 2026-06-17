'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserDetailShell } from '@/components/users/UserDetailShell';
import { Button } from '@/components/ui/Button';
import { draftService, type DraftRecord } from '@/lib/draftService';
import PageHeader from '@/components/ui/PageHeader';
import { Table } from '@/components/ui/Table';
import { cn } from '@/lib/utils';
import { LuFileText, LuTrash2, LuPencil } from 'react-icons/lu';
import type { UserOverviewDraft } from '@/components/users/UserInlineOverviewEditor';
import { userCreateHref, userListHref } from '@/lib/userRoutes';

function fmtWhen(iso: string) {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function displayName(data: UserOverviewDraft | undefined) {
    const fn = data?.firstName?.trim() ?? '';
    const ln = data?.lastName?.trim() ?? '';
    const combined = [fn, ln].filter(Boolean).join(' ').trim();
    if (combined) return combined;
    return data?.email?.trim() || 'Untitled user';
}

function continueHref(draftId: string) {
    return `${userCreateHref()}?draftId=${encodeURIComponent(draftId)}`;
}

export default function UserDraftsPage() {
    const router = useRouter();
    const [refresh, setRefresh] = React.useState(0);
    const drafts = React.useMemo(() => draftService.getDrafts<UserOverviewDraft>('user'), [refresh]);

    const onDelete = (draft: DraftRecord) => {
        const data = draft.data as UserOverviewDraft | undefined;
        const label = displayName(data);
        const ok = window.confirm(`Delete draft “${label}”?`);
        if (!ok) return;
        draftService.deleteDraft(draft.draftId);
        setRefresh((x) => x + 1);
    };

    const rows = React.useMemo(() => {
        return drafts.map((d) => {
            const data = d.data as UserOverviewDraft | undefined;
            const name = displayName(data);
            const email = data?.email?.trim() || '';
            return { draftId: d.draftId, draft: d, name, email, updatedAt: d.updatedAt };
        });
    }, [drafts]);

    return (
        <UserDetailShell breadcrumbItems={[{ label: 'Users', href: userListHref() }, { label: 'Drafts' }]}>
            <div className="mx-auto w-full px-2 sm:px-4">
                <div className="mt-4">
                    <PageHeader
                        title="User drafts"
                        subtitle="Continue where you left off. Drafts are saved locally in this browser."
                        actions={
                            <Link href={userCreateHref()}>
                                <Button variant="company" size="cta" className="h-10">
                                    Create user
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
                            href={userListHref()}
                            className="text-sm font-semibold text-blue-600 underline decoration-blue-500/25 underline-offset-2 hover:text-blue-800"
                        >
                            Back to Users
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <Table
                            rowKey="draftId"
                            onRowClick={(row: (typeof rows)[number]) => {
                                router.push(continueHref(row.draftId));
                            }}
                            columns={[
                                {
                                    key: 'name',
                                    header: 'User',
                                    render: (row: (typeof rows)[number]) => {
                                        const initial = (row.name.trim().charAt(0) || 'U').toUpperCase();
                                        return (
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200/60 bg-blue-50 text-sm font-bold text-blue-700">
                                                    {initial}
                                                </div>
                                                <Link
                                                    href={continueHref(row.draftId)}
                                                    className="flex min-w-0 flex-col"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="truncate text-sm font-semibold text-slate-800 hover:text-blue-700 hover:underline">
                                                        {row.name}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-500">Draft</span>
                                                </Link>
                                            </div>
                                        );
                                    },
                                },
                                {
                                    key: 'email',
                                    header: 'Email',
                                    className: 'hidden md:table-cell',
                                    render: (row: (typeof rows)[number]) => (
                                        <span className="text-sm font-medium text-slate-700">{row.email ? row.email : '—'}</span>
                                    ),
                                },
                                {
                                    key: 'updatedAt',
                                    header: 'Last updated',
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
                                                <Link href={continueHref(row.draftId)}>
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
                            <p className="mt-1 text-sm text-slate-600">Start creating a user and drafts will appear here when you save a draft.</p>
                            <div className="mt-4 flex justify-center">
                                <Link href={userCreateHref()}>
                                    <Button variant="company" size="cta" className="h-10">
                                        Create user
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </UserDetailShell>
    );
}
