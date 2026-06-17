'use client';

import React from 'react';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { formatLeadCode, type Lead } from '@/lib/leadStore';
import { LuFingerprint, LuHouse, LuMail, LuMapPin, LuPhone, LuTag, LuUser, LuWallet } from 'react-icons/lu';
import { cn } from '@/lib/utils';

type InfoItemProps = {
    label: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
};

function InfoItem({ label, icon, children, className }: InfoItemProps) {
    return (
        <div className={cn('flex gap-3', className)}>
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
                <div className="mt-0.5 text-sm font-medium text-gray-900">{children}</div>
            </div>
        </div>
    );
}

type InfoGridProps = {
    lead: Lead;
    className?: string;
    embedded?: boolean;
};

const EMPTY_FIELD = '—';

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h4 className="border-b border-gray-100 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">{children}</h4>
    );
}

/** Labels aligned with create / edit forms and leads table. */
export function InfoGrid({ lead, className, embedded }: InfoGridProps) {
    const budgetLine = lead.budgetRange?.trim() ? lead.budgetRange : EMPTY_FIELD;

    const fieldGrid = 'grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2';

    const personalBlock = (
        <div className={fieldGrid}>
            <InfoItem label="Lead ID" icon={<LuFingerprint size={16} aria-hidden />}>
                <span className="font-mono text-sm tracking-tight">{formatLeadCode(lead.id)}</span>
            </InfoItem>
            <InfoItem label="Lead Name" icon={<LuUser size={16} aria-hidden />}>
                {lead.name}
            </InfoItem>
            <InfoItem label="Phone Number" icon={<LuPhone size={16} aria-hidden />}>
                <a href={`tel:${lead.phone.replace(/\s/g, '')}`} className="hover:text-blue-600 hover:underline">
                    {lead.phone}
                </a>
            </InfoItem>
            <InfoItem label="Email" icon={<LuMail size={16} aria-hidden />}>
                <a href={`mailto:${lead.email}`} className="break-all hover:text-blue-600 hover:underline">
                    {lead.email}
                </a>
            </InfoItem>
            <InfoItem label="Present address" icon={<LuMapPin size={16} aria-hidden />} className="sm:col-span-2">
                {lead.presentAddress?.trim() ? (
                    <span className="block whitespace-pre-wrap font-normal leading-relaxed">{lead.presentAddress.trim()}</span>
                ) : (
                    EMPTY_FIELD
                )}
            </InfoItem>
            <InfoItem label="Permanent address" icon={<LuMapPin size={16} aria-hidden />} className="sm:col-span-2">
                {lead.permanentAddress?.trim() ? (
                    <span className="block whitespace-pre-wrap font-normal leading-relaxed">{lead.permanentAddress.trim()}</span>
                ) : (
                    EMPTY_FIELD
                )}
            </InfoItem>
        </div>
    );

    const projectBlock = (
        <div className={fieldGrid}>
            <InfoItem label="Lead Source" icon={<LuHouse size={16} aria-hidden />} >
                {lead.source}
            </InfoItem>
            <InfoItem label="Project Interest" icon={<LuHouse size={16} aria-hidden />} >
                {lead.project?.trim() ? lead.project : EMPTY_FIELD}
            </InfoItem>
            <InfoItem label="Budget Range" icon={<LuWallet size={16} aria-hidden />}>
                {budgetLine}
            </InfoItem>
            <InfoItem label="Preferred Unit Type" icon={<LuHouse size={16} aria-hidden />}>
                {lead.preferredUnitType?.trim() ? lead.preferredUnitType : EMPTY_FIELD}
            </InfoItem>
            <InfoItem label="Lead Status" icon={<LuTag size={16} aria-hidden />}>
                <LeadStatusBadge status={lead.status} />
            </InfoItem>
        </div>
    );

    return (
        <div
            className={cn(
                'flex min-h-0 flex-col',
                !embedded && 'h-full rounded-xl border border-gray-200/80 bg-gray-50/50 p-5 shadow-sm',
                embedded && 'flex-1',
                className
            )}
        >
            

            <div className="min-h-0 flex-1">
                <div>
                    <SectionTitle>Personal details</SectionTitle>
                    <div className="mt-4">{personalBlock}</div>
                </div>
                <div className="mt-8 border-t border-gray-200 pt-2 ">
                    <SectionTitle>Project details</SectionTitle>
                    <div className="mt-4">{projectBlock}</div>
                </div>
            </div>
        </div>
    );
}
