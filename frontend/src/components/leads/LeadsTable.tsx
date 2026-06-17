'use client';

import React from 'react';
import Link from 'next/link';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { cn } from '@/lib/utils';
import type { Lead } from '@/lib/leadStore';
import { formatLeadCode, normalizeLeadPhoneDigits } from '@/lib/leadStore';
import { leadProfileEditHref, leadProfileHref } from '@/lib/leadRoutes';
import { LuPencil, LuEye, LuTrash2 } from 'react-icons/lu';

const LeadLink = ({ lead, children, className }: { lead: Lead; children: React.ReactNode; className?: string }) => (
    <Link
        href={leadProfileHref(lead.slug)}
        onClick={(e) => e.stopPropagation()}
        className={cn('transition-colors hover:text-[var(--cta-button-bg)] hover:underline', className)}
    >
        {children}
    </Link>
);

export function LeadsTable({ leads, onDelete }: { leads: Lead[]; onDelete: (lead: Lead) => void }) {
    return (
        <div className={cn('bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden')}>
            <Table
                rowKey="id"
                columns={[
                    {
                        key: 'id',
                        header: 'Lead ID',
                        render: (row: Lead) => (
                            <LeadLink lead={row}>
                                <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                                    {formatLeadCode(row.id)}
                                </span>
                            </LeadLink>
                        ),
                    },
                    {
                        key: 'name',
                        header: 'Lead Name',
                        render: (row: Lead) => (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 shrink-0">
                                    {row.name.charAt(0).toUpperCase()}
                                </div>
                                <LeadLink lead={row} className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-slate-800 truncate">{row.name}</span>
                                </LeadLink>
                            </div>
                        ),
                    },
                    {
                        key: 'email',
                        header: 'Email',
                        className: 'hidden xl:table-cell',
                        render: (row: Lead) => (
                            <a
                                href={`mailto:${row.email}`}
                                className="text-sm font-medium text-slate-700 hover:text-[var(--cta-button-bg)] hover:underline truncate block max-w-[200px]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {row.email?.trim() || '—'}
                            </a>
                        ),
                    },
                    {
                        key: 'phone',
                        header: 'Phone Number',
                        render: (row: Lead) => {
                            const d = normalizeLeadPhoneDigits(row.phone);
                            const display =
                                d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : row.phone.trim() || '—';
                            return (
                                <a
                                    href={d.length === 10 ? `tel:${d}` : undefined}
                                    className={cn(
                                        'text-sm font-medium tabular-nums',
                                        d.length === 10
                                            ? 'text-slate-700 hover:text-[var(--cta-button-bg)] hover:underline'
                                            : 'text-slate-500',
                                    )}
                                    onClick={(e) => d.length !== 10 && e.preventDefault()}
                                >
                                    {display}
                                </a>
                            );
                        },
                        className: 'hidden md:table-cell',
                    },
                    {
                        key: 'source',
                        header: 'Lead Source',
                        className: 'hidden lg:table-cell',
                        render: (row: Lead) => <span className="text-sm font-medium text-slate-700">{row.source}</span>,
                    },
                    {
                        key: 'project',
                        header: 'Project Interest',
                        render: (row: Lead) => (
                            <LeadLink lead={row}>
                                <span className="text-sm font-semibold text-slate-800 truncate block max-w-[160px] hover:text-[var(--cta-button-bg)]">
                                    {row.project}
                                </span>
                            </LeadLink>
                        ),
                    },
                    {
                        key: 'budgetRange',
                        header: 'Budget Range',
                        render: (row: Lead) => <span className="text-sm font-medium text-slate-700">{row.budgetRange}</span>,
                    },
                    {
                        key: 'preferredUnitType',
                        header: 'Preferred Unit Type',
                        className: 'hidden lg:table-cell',
                        render: (row: Lead) => <span className="text-sm font-medium text-slate-700">{row.preferredUnitType}</span>,
                    },
                    {
                        key: 'status',
                        header: 'Lead Status',
                        render: (row: Lead) => <LeadStatusBadge status={row.status} />,
                    },
                    {
                        key: 'actions',
                        header: '',
                        render: (row: Lead) => (
                            <div className="flex justify-end gap-1">
                                <Link href={leadProfileHref(row.slug)}>
                                    <Button
                                        variant="companyGhost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                    >
                                        <LuEye size={18} />
                                    </Button>
                                </Link>
                                <Link href={leadProfileEditHref(row.slug)}>
                                    <Button
                                        variant="companyGhost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                    >
                                        <LuPencil size={18} />
                                    </Button>
                                </Link>
                                <Button
                                    type="button"
                                    variant="companyGhost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    title="Delete lead"
                                    aria-label={`Delete lead ${row.name}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(row);
                                    }}
                                >
                                    <LuTrash2 size={18} />
                                </Button>
                            </div>
                        ),
                    },
                ]}
                data={leads}
                className="border-none"
            />
        </div>
    );
}

