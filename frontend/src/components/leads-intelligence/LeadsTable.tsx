'use client';

import React from 'react';
import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';
import { LeadRow } from './LeadRow';

type SortKey = keyof Pick<
    IntelligenceLead,
    'name' | 'source' | 'leadScore' | 'conversionProbability' | 'temperature' | 'engagementScore' | 'followUpRisk' | 'status' | 'assignedTo'
>;

interface LeadsTableProps {
    leads: IntelligenceLead[];
    sortBy: SortKey;
    sortDir: 'asc' | 'desc';
    onSort: (key: SortKey) => void;
    onView: (lead: IntelligenceLead) => void;
    onEdit: (lead: IntelligenceLead) => void;
    onDelete: (lead: IntelligenceLead) => void;
}

const mainHeaders: { label: string; key?: SortKey }[] = [
    { label: '', key: undefined },
    { label: 'Lead Name', key: 'name' },
    { label: 'Contact Info' },
    { label: 'Source', key: 'source' },
    { label: 'Lead Score', key: 'leadScore' },
    { label: 'Actions' },
];

export function LeadsTable({ leads, sortBy, sortDir, onSort, onView, onEdit, onDelete }: LeadsTableProps) {
    return (
        <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        {mainHeaders.map((header) => (
                            <th key={header.label || 'expand'} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                                {header.key ? (
                                    <button onClick={() => header.key && onSort(header.key)} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
                                        {header.label}
                                        <span className="text-[10px] text-slate-400">{sortBy === header.key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                                    </button>
                                ) : (
                                    header.label
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {leads.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                No leads found for selected filters.
                            </td>
                        </tr>
                    ) : (
                        leads.map((lead) => <LeadRow key={lead.id} lead={lead} onView={onView} onEdit={onEdit} onDelete={onDelete} />)
                    )}
                </tbody>
            </table>
        </div>
    );
}
