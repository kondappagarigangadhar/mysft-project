'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import {
    LuCalendarCheck,
    LuCreditCard,
    LuDollarSign,
    LuFileText,
    LuFolderKanban,
    LuLink,
    LuPackage,
    LuPenLine,
    LuSparkles,
    LuUserPlus,
} from 'react-icons/lu';
import { cn } from '@/lib/utils';

type QuickAction = {
    label: string;
    href: string;
    icon: ComponentType<{ className?: string; size?: number; 'aria-hidden'?: boolean }>;
};

const PAYMENTS_ADD = `/company-admin/booking-payment/payments/add?returnTo=${encodeURIComponent('/company-admin/dashboard')}`;

/** Primary “create / add” entry points across the company-admin shell (aligned with sidebar). */
const QUICK_ADD_ACTIONS: QuickAction[] = [
    { label: 'Add lead', href: '/leads/view/new', icon: LuUserPlus },
    { label: 'Create project', href: '/projects-inventory/projects/view/new', icon: LuFolderKanban },
    { label: 'Add unit', href: '/projects-inventory/inventory/create', icon: LuPackage },
    { label: 'Pricing', href: '/projects-inventory/pricing', icon: LuDollarSign },
    { label: 'Create booking', href: '/company-admin/booking-payment/booking/create', icon: LuCalendarCheck },
    { label: 'Add payment', href: PAYMENTS_ADD, icon: LuCreditCard },
    { label: 'Payment link', href: '/company-admin/booking-payment/payment-links/form', icon: LuLink },
    { label: 'New document', href: '/company-admin/documents-compliance/view/new', icon: LuFileText },
    { label: 'New eSign', href: '/company-admin/documents-compliance/esign/new', icon: LuPenLine },
    { label: 'Lead intel', href: '/leads/intelligence', icon: LuSparkles },
];

export function CompanyAdminDashboardQuickActions({ className }: { className?: string }) {
    return (
        <section
            className={cn(
                'rounded-2xl border border-slate-200/90 bg-linear-to-b from-white to-slate-50/80 p-4 shadow-sm sm:p-5',
                className,
            )}
            aria-label="Quick add"
        >
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Quick add</h2>
                    <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Jump to common create flows</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {QUICK_ADD_ACTIONS.map(({ label, href, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className="group flex min-h-[44px] items-center gap-2 rounded-xl border border-blue-100/90 bg-white px-3 py-2.5 text-left text-xs font-medium text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#116AEF]/40 sm:text-sm"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#116AEF]/10 text-[#116AEF] transition group-hover:bg-[#116AEF]/15">
                            <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 leading-tight">{label}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
