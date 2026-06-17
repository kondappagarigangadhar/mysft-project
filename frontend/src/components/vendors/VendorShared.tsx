'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { ContractStatus, VendorStatus, VerificationStatus } from '@/lib/vendors/types';
import { normalizeVerificationStatus } from '@/lib/vendors/vendorComplianceVerification';
import { LuBrain, LuShieldAlert, LuSparkles } from 'react-icons/lu';

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
    const tone =
        status === 'Active'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : status === 'Inactive'
              ? 'bg-slate-100 text-slate-700 border-slate-200'
              : status === 'Blacklisted'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200';
    return <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', tone)}>{status}</span>;
}

export function ComplianceBadge({ value }: { value: number }) {
    const tone = value >= 85 ? 'text-emerald-700' : value >= 70 ? 'text-amber-700' : 'text-rose-700';
    return <span className={cn('font-semibold', tone)}>{value}%</span>;
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
    const tone =
        status === 'Active'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : status === 'Ending Soon'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : status === 'Expired'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-100 text-slate-700 border-slate-200';
    return <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', tone)}>{status}</span>;
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
    const label = normalizeVerificationStatus(status);
    const tone =
        label === 'Verified'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : label === 'Pending Verification'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : label === 'Rejected'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : label === 'Expired'
                  ? 'bg-orange-50 text-orange-800 border-orange-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';
    return <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', tone)}>{label}</span>;
}

export function RatingPill({ rating }: { rating: number }) {
    const tone = rating >= 4.2 ? 'bg-emerald-50 text-emerald-700' : rating >= 3.4 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700';
    return <span className={cn('rounded-md px-2 py-1 text-xs font-semibold', tone)}>{rating.toFixed(1)}</span>;
}

export function AiVendorWidgets() {
    return (
        <aside className="space-y-4">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <LuBrain className="h-4 w-4 text-[var(--cta-button-bg)]" />
                    <h3 className="text-sm font-semibold text-slate-900">AI Vendor Score</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600">Combines document completeness, rating, delays, SLA breaches, and contract health.</p>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-[84%] rounded-full bg-[var(--cta-button-bg)]" />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">Portfolio Score: 84/100</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <LuSparkles className="h-4 w-4 text-[var(--cta-button-bg)]" />
                    <h3 className="text-sm font-semibold text-slate-900">AI Best Vendor Suggestion</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600">For Electrical · Hyderabad work orders, best match is Prime Electrical Works (4.6 rating, high availability).</p>
                <Button variant="companyOutline" size="sm" className="mt-3">Use Suggestion</Button>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <LuShieldAlert className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-slate-900">AI Risk Detection</h3>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    <li>- 2 vendors with repeated delays</li>
                    <li>- 3 vendors with expiring documents</li>
                    <li>- 1 vendor rated below 3</li>
                    <li>- 1 blacklisted vendor still in assignments</li>
                </ul>
            </article>
        </aside>
    );
}
