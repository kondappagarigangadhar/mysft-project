'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LuChevronDown, LuChevronRight, LuEye, LuPencil, LuTrash2 } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import { leadProfileHref } from '@/lib/leadRoutes';
import { riskClassMap, statusClassMap, temperatureClassMap } from '@/lib/leadsIntelligenceHelpers';
import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';

interface LeadRowProps {
    lead: IntelligenceLead;
    onView: (lead: IntelligenceLead) => void;
    onEdit: (lead: IntelligenceLead) => void;
    onDelete: (lead: IntelligenceLead) => void;
}

export function LeadRow({ lead, onView, onEdit, onDelete }: LeadRowProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                <td className="w-10 px-2 py-3">
                    <button
                        onClick={() => setExpanded((e) => !e)}
                        className="p-1 rounded-md hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 transition-colors"
                        aria-label={expanded ? 'Collapse' : 'Expand'}
                    >
                        {expanded ? <LuChevronDown size={16} /> : <LuChevronRight size={16} />}
                    </button>
                </td>
                <td className="px-4 py-3">
                    <Link
                        href={leadProfileHref(lead.leadSlug)}
                        className="font-semibold text-slate-800 hover:text-primary hover:underline text-left whitespace-nowrap transition-colors inline-block"
                    >
                        {lead.name}
                    </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 min-w-[180px]">
                    <a href={`tel:${lead.phone}`} className="text-slate-700 hover:text-primary hover:underline block">
                        {lead.phone}
                    </a>
                    <a href={`mailto:${lead.email}`} className="text-slate-500 hover:text-primary hover:underline truncate max-w-[200px] block">
                        {lead.email}
                    </a>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{lead.source}</td>
                <td className="px-4 py-3 min-w-[120px]">
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 flex-1 min-w-[60px] rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-2.5 rounded-full bg-primary transition-all" style={{ width: `${lead.leadScore}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 shrink-0">{lead.leadScore}</span>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                        <Button variant="companyGhost" size="sm" onClick={() => onView(lead)} className="h-8 px-2" title="View">
                            <LuEye size={15} />
                        </Button>
                        <Button variant="companyGhost" size="sm" onClick={() => onEdit(lead)} className="h-8 px-2" title="Edit">
                            <LuPencil size={15} />
                        </Button>
                        <Button variant="companyGhost" size="sm" onClick={() => onDelete(lead)} className="h-8 px-2 text-red-600 hover:text-red-700" title="Delete">
                            <LuTrash2 size={15} />
                        </Button>
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr className="bg-slate-50/80 border-b border-slate-200">
                    <td colSpan={6} className="px-4 py-4 align-top">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                            {/* AI Metrics */}
                            <div className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">AI Metrics</p>
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 text-sm">Conversion:</span>
                                        <span className="font-semibold text-slate-800">{lead.conversionProbability}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 text-sm">Temperature:</span>
                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${temperatureClassMap[lead.temperature]}`}>{lead.temperature}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 text-sm">Engagement:</span>
                                        <span className="font-semibold text-slate-800">{lead.engagementScore}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 text-sm">Risk:</span>
                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${riskClassMap[lead.followUpRisk]}`}>{lead.followUpRisk}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Next Best Action */}
                            <div className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Next Best Action</p>
                                <p className="text-sm text-slate-700 leading-relaxed">{lead.nextBestAction}</p>
                            </div>
                            {/* Status & Assignment */}
                            <div className="sm:w-48 shrink-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Status & Assignment</p>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-slate-500 text-xs block">Status</span>
                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold mt-1 ${statusClassMap[lead.status]}`}>{lead.status}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 text-xs block">Assigned To</span>
                                        <span className="font-semibold text-slate-800 text-sm">{lead.assignedTo}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
