'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProjectDetailShell } from '@/components/projects-inventory/ProjectDetailShell';
import { Button } from '@/components/ui/Button';
import { draftService, type DraftRecord } from '@/lib/draftService';
import PageHeader from '@/components/ui/PageHeader';
import { Table } from '@/components/ui/Table';
import { cn } from '@/lib/utils';
import { CTA_FLOW_LINK } from '@/lib/theme/ctaThemeClasses';
import { LuFileText, LuTrash2, LuPencil } from 'react-icons/lu';

type ProjectDraftData = {
    project_name?: string;
    city?: string;
    state?: string;
    project_type?: string;
    project_status?: string;
    total_units?: number;
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

export default function ProjectDraftsPage() {
    const router = useRouter();
    const [refresh, setRefresh] = React.useState(0);
    const drafts = React.useMemo(() => draftService.getDrafts<ProjectDraftData>('project'), [refresh]);

    const onDelete = (draft: DraftRecord) => {
        const label = (draft.data as ProjectDraftData | undefined)?.project_name?.trim() || 'Untitled Project';
        const ok = window.confirm(`Delete draft “${label}”?`);
        if (!ok) return;
        draftService.deleteDraft(draft.draftId);
        setRefresh((x) => x + 1);
    };

    const rows = React.useMemo(() => {
        return drafts.map((d) => {
            const data = d.data as ProjectDraftData | undefined;
            const name = data?.project_name?.trim() || 'Untitled Project';
            const city = data?.city?.trim() || '';
            const state = data?.state?.trim() || '';
            const location = `${city}${city && state ? ', ' : ''}${state}`.trim();
            return { draftId: d.draftId, draft: d, name, location, updatedAt: d.updatedAt };
        });
    }, [drafts]);

    return (
        <ProjectDetailShell breadcrumbItems={[{ label: 'Projects & Inventory', href: '/projects-inventory/projects' }, { label: 'Drafts' }]}>
            <div className="mx-auto w-full px-2 sm:px-4">
                <div className="mt-4">
                    <PageHeader
                        title="Project Drafts"
                        subtitle="Continue where you left off. Drafts are saved locally in this browser."
                        actions={
                            <Link href="/projects/create">
                                <Button variant="company" size="cta" className="h-10">
                                    Create New Project
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
                        <Link href="/projects-inventory/projects" className={cn('text-sm', CTA_FLOW_LINK)}>
                            Back to Projects
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <Table
                            rowKey="draftId"
                            onRowClick={(row: (typeof rows)[number]) => {
                                router.push(`/projects/create?draftId=${encodeURIComponent(row.draftId)}`);
                            }}
                            columns={[
                                {
                                    key: 'name',
                                    header: 'Project name',
                                    render: (row: (typeof rows)[number]) => {
                                        const initial = (row.name.trim().charAt(0) || 'U').toUpperCase();
                                        return (
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-sm font-bold text-[var(--cta-button-bg)]">
                                                    {initial}
                                                </div>
                                                <Link
                                                    href={`/projects/create?draftId=${encodeURIComponent(row.draftId)}`}
                                                    className="flex flex-col min-w-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="text-sm font-semibold text-slate-800 truncate hover:text-[var(--cta-button-bg)] hover:underline">
                                                        {row.name}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-500">Draft</span>
                                                </Link>
                                            </div>
                                        );
                                    },
                                },
                                {
                                    key: 'location',
                                    header: 'Location',
                                    className: 'hidden md:table-cell',
                                    render: (row: (typeof rows)[number]) => (
                                        <span className="text-sm font-medium text-slate-700">{row.location ? row.location : '—'}</span>
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
                                        <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2.5 py-1 text-xs font-semibold text-[var(--cta-button-bg)]">
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
                                                <Link href={`/projects/create?draftId=${encodeURIComponent(row.draftId)}`}>
                                                    <Button
                                                        variant="companyOutline"
                                                        size="sm"
                                                        className="h-8 gap-2 border-slate-200"
                                                        aria-label="Continue editing"
                                                        title="Continue editing"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <LuPencil size={16} className="text-[var(--cta-button-bg)]" />
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
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)]">
                                <LuFileText className="h-6 w-6 text-[var(--cta-button-bg)]" aria-hidden />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-slate-900">No drafts yet</p>
                            <p className="mt-1 text-sm text-slate-600">Start creating a project and drafts will appear here automatically.</p>
                            <div className="mt-4 flex justify-center">
                                <Link href="/projects/create">
                                    <Button variant="company" size="cta" className="h-10">
                                        Create Project
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </ProjectDetailShell>
    );
}

