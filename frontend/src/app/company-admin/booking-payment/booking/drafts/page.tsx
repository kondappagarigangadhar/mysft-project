'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { draftService, type DraftRecord } from '@/lib/draftService';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { LuFileText, LuPencil, LuTrash2 } from 'react-icons/lu';
import { CTA_EDITING_BADGE, CTA_LINK_UNDERLINE } from '@/lib/theme/ctaThemeClasses';

type BookingDraftData = {
    leadId?: string;
    customerName?: string;
    phone?: string;
    projectName?: string;
    unitId?: string;
    unitPrice?: string;
    bookingDate?: string;
    assignedTo?: string;
    dealPaymentMode?: string;
    notes?: string;
    advanceAmount?: string;
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

export default function BookingDraftsPage() {
    const router = useRouter();
    const [refresh, setRefresh] = React.useState(0);
    const drafts = React.useMemo(() => draftService.getDrafts<BookingDraftData>('booking'), [refresh]);

    const onDelete = (draft: DraftRecord) => {
        const data = draft.data as BookingDraftData | undefined;
        const label = data?.customerName?.trim() || data?.leadId?.trim() || 'Untitled Booking';
        const ok = window.confirm(`Delete draft “${label}”?`);
        if (!ok) return;
        draftService.deleteDraft(draft.draftId);
        setRefresh((x) => x + 1);
    };

    const rows = React.useMemo(() => {
        return drafts.map((d) => {
            const data = d.data as BookingDraftData | undefined;
            const name = data?.customerName?.trim() || 'Untitled Booking';
            const phone = data?.phone?.trim() || '';
            const project = data?.projectName?.trim() || '—';
            return { draftId: d.draftId, draft: d, name, phone, project, updatedAt: d.updatedAt };
        });
    }, [drafts]);

    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                    { label: 'Booking Drafts' },
                ]}
            />
            <div className="w-full px-0">
                <div className="mt-4 px-2 sm:px-4">
                    <PageHeader
                        title="Booking Drafts"
                        subtitle="Continue where you left off. Drafts are saved locally in this browser."
                        actions={
                            <Link href="/bookings/create">
                                <Button variant="company" size="cta" className="h-10">
                                    Create New Booking
                                </Button>
                            </Link>
                        }
                    />
                </div>

                <div className="mt-4 space-y-4 px-2 sm:px-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium text-slate-600">
                            {drafts.length} draft{drafts.length === 1 ? '' : 's'}
                        </div>
                        <Link
                            href="/company-admin/booking-payment/booking"
                            className={CTA_LINK_UNDERLINE}
                        >
                            Back to Bookings
                        </Link>
                    </div>
                </div>

                <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <Table
                        rowKey="draftId"
                        onRowClick={(row: (typeof rows)[number]) => {
                            router.push(`/bookings/create?draftId=${encodeURIComponent(row.draftId)}`);
                        }}
                        columns={[
                                {
                                    key: 'name',
                                    header: 'Customer',
                                    render: (row: (typeof rows)[number]) => {
                                        const initial = (row.name.trim().charAt(0) || 'U').toUpperCase();
                                        return (
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-sm font-bold text-[var(--cta-button-bg)]">
                                                    {initial}
                                                </div>
                                                <Link
                                                    href={`/bookings/create?draftId=${encodeURIComponent(row.draftId)}`}
                                                    className="flex flex-col min-w-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="truncate text-sm font-semibold text-slate-800 transition hover:text-[var(--cta-button-bg)] hover:underline">
                                                        {row.name}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-500">Draft</span>
                                                </Link>
                                            </div>
                                        );
                                    },
                                },
                                {
                                    key: 'project',
                                    header: 'Project',
                                    className: 'hidden lg:table-cell',
                                    render: (row: (typeof rows)[number]) => (
                                        <span className="text-sm font-medium text-slate-700">{row.project}</span>
                                    ),
                                },
                                {
                                    key: 'phone',
                                    header: 'Phone',
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
                                        <span className={CTA_EDITING_BADGE}>
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
                                                <Link href={`/bookings/create?draftId=${encodeURIComponent(row.draftId)}`}>
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

                <div className="px-2 sm:px-4 mt-4">
                    {drafts.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)]">
                                <LuFileText className="h-6 w-6 text-[var(--cta-button-bg)]" aria-hidden />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-slate-900">No drafts yet</p>
                            <p className="mt-1 text-sm text-slate-600">
                                Start creating a booking and drafts will appear here automatically.
                            </p>
                            <div className="mt-4 flex justify-center">
                                <Link href="/bookings/create">
                                    <Button variant="company" size="cta" className="h-10">
                                        Create Booking
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}

