'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { leadProfileHref } from '@/lib/leadRoutes';
import type { Lead } from '@/lib/leadStore';
import { formatLeadCode, getArchivedLeads, normalizeLeadPhoneDigits, restoreLead } from '@/lib/leadStore';
import { LuArrowLeft, LuRotateCcw } from 'react-icons/lu';

function formatArchivedAt(iso: string | null) {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso.slice(0, 10);
    }
}

export function LeadsArchivedPageContent() {
    const router = useRouter();
    const [version, setVersion] = useState(0);
    const archived = useMemo(() => getArchivedLeads(), [version]);

    const bump = () => setVersion((v) => v + 1);

    const onRestore = (lead: Lead) => {
        if (restoreLead(lead.slug)) {
            bump();
            router.push('/leads');
        }
    };

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Leads & Sales', href: '/leads' },
                    { label: 'Archived leads' },
                ]}
            />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Archived leads</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Records removed from the main list are kept here. Restore a lead to bring it back to the active pipeline.
                    </p>
                </div>
                <Link href="/leads">
                    <Button type="button" variant="companyOutline" size="cta" className="gap-2">
                        <LuArrowLeft size={18} />
                        Back to Leads
                    </Button>
                </Link>
            </div>

            {archived.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <p className="text-sm font-medium text-slate-600">No archived leads yet.</p>
                    <p className="mt-1 text-sm text-slate-500">When you delete a lead from the list, it appears here.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <Table
                        rowKey="slug"
                        columns={[
                            {
                                key: 'id',
                                header: 'Lead ID',
                                render: (row: Lead) => (
                                    <span className="text-sm font-semibold tabular-nums text-slate-800">
                                        {formatLeadCode(row.id)}
                                    </span>
                                ),
                            },
                            {
                                key: 'name',
                                header: 'Name',
                                render: (row: Lead) => (
                                    <Link
                                        href={leadProfileHref(row.slug)}
                                        className="text-sm font-semibold text-slate-800 hover:text-blue-600 hover:underline"
                                    >
                                        {row.name}
                                    </Link>
                                ),
                            },
                            {
                                key: 'email',
                                header: 'Email',
                                className: 'hidden md:table-cell max-w-[200px]',
                                render: (row: Lead) => (
                                    <span className="block truncate text-sm text-slate-700">{row.email?.trim() || '—'}</span>
                                ),
                            },
                            {
                                key: 'phone',
                                header: 'Phone',
                                render: (row: Lead) => {
                                    const d = normalizeLeadPhoneDigits(row.phone);
                                    const display =
                                        d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : row.phone.trim() || '—';
                                    return <span className="text-sm font-medium tabular-nums text-slate-700">{display}</span>;
                                },
                            },
                            {
                                key: 'status',
                                header: 'Status',
                                render: (row: Lead) => <LeadStatusBadge status={row.status} />,
                            },
                            {
                                key: 'deletedAt',
                                header: 'Archived',
                                render: (row: Lead) => (
                                    <span className="text-sm text-slate-600">{formatArchivedAt(row.deletedAt)}</span>
                                ),
                            },
                            {
                                key: 'actions',
                                header: '',
                                render: (row: Lead) => (
                                    <div className="flex flex-wrap justify-end gap-2">
                                        <Link href={leadProfileHref(row.slug)}>
                                            <Button type="button" variant="companyOutline" size="sm" className="h-9">
                                                View
                                            </Button>
                                        </Link>
                                        <Button
                                            type="button"
                                            variant="company"
                                            size="sm"
                                            className="h-9 gap-1.5"
                                            onClick={() => onRestore(row)}
                                        >
                                            <LuRotateCcw size={16} />
                                            Restore
                                        </Button>
                                    </div>
                                ),
                            },
                        ]}
                        data={archived}
                        className="border-none"
                    />
                </div>
            )}
        </CompanyAdminDashboardLayout>
    );
}
