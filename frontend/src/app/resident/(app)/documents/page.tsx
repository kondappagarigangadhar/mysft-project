'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RentalLeaseAgreementsPanel } from '@/modules/resident-portal/documents/RentalLeaseAgreementsPanel';
import { useResidentSession } from '@/modules/resident-portal/store/residentSessionStore';
import { ResidentCard } from '@/modules/resident-portal/components/ResidentCard';
import { SectionCard } from '@/modules/resident-portal/components/SectionCard';
import {
    ResidentPageHeader,
    ResidentPageShell,
    residentChipActiveClass,
    residentChipInactiveClass,
    residentInputClass,
} from '@/modules/resident-portal/components/ResidentPageShell';
import { residentSectionFeedList } from '@/modules/resident-portal/styles/cardStyles';
import { cn } from '@/lib/utils';
import {
    LuDownload,
    LuFileText,
    LuIdCard,
    LuReceipt,
    LuScrollText,
    LuSearch,
    LuSignature,
} from 'react-icons/lu';

type DocSection = 'all' | 'leases';

type DocCategory = 'Agreements' | 'Receipts' | 'ID Documents' | 'Community Documents';

type DocItem = {
    id: string;
    title: string;
    category: DocCategory;
    updatedAt: string;
};

const CATS: Array<DocCategory | 'All'> = ['All', 'Agreements', 'Receipts', 'ID Documents', 'Community Documents'];

const SECTION_TABS: { key: DocSection; label: string }[] = [
    { key: 'all', label: 'All documents' },
    { key: 'leases', label: 'Lease agreements' },
];

const categoryStyles: Record<
    DocCategory,
    { icon: React.ComponentType<{ className?: string }>; iconBox: string }
> = {
    Agreements: {
        icon: LuScrollText,
        iconBox: 'border border-[#d4e4f2] bg-[#e8f1fb] text-[#0a66c2]',
    },
    Receipts: {
        icon: LuReceipt,
        iconBox: 'border border-[#c8e6d4] bg-[#e3f2ea] text-[#057642]',
    },
    'ID Documents': {
        icon: LuIdCard,
        iconBox: 'border border-[#ddd0f5] bg-[#ede8fb] text-[#6d28d9]',
    },
    'Community Documents': {
        icon: LuFileText,
        iconBox: 'border border-[#e8e8e6] bg-[#f3f2ef] text-[rgba(0,0,0,0.6)]',
    },
};

export default function ResidentDocumentsPage() {
    const searchParams = useSearchParams();
    const { currentResident } = useResidentSession();
    const initialSection = searchParams.get('section') === 'leases' ? 'leases' : 'all';
    const [section, setSection] = useState<DocSection>(initialSection);

    useEffect(() => {
        if (searchParams.get('section') === 'leases') setSection('leases');
    }, [searchParams]);

    const docs = useMemo<DocItem[]>(
        () => [
            { id: 'D-2', title: 'Maintenance Receipt - Mar 2026', category: 'Receipts', updatedAt: 'Mar 2026' },
            { id: 'D-3', title: 'Aadhaar (Resident)', category: 'ID Documents', updatedAt: 'Feb 2026' },
            { id: 'D-4', title: 'Community By-laws', category: 'Community Documents', updatedAt: 'Jan 2026' },
        ],
        [],
    );
    const [q, setQ] = useState('');
    const [cat, setCat] = useState<(typeof CATS)[number]>('All');

    const filtered = docs
        .filter((d) => (cat === 'All' ? true : d.category === cat))
        .filter((d) => (!q.trim() ? true : d.title.toLowerCase().includes(q.trim().toLowerCase())));

    return (
        <ResidentPageShell>
            <ResidentPageHeader
                icon={<LuFileText className="h-5 w-5" aria-hidden />}
                title="Documents"
                subtitle="Agreements, receipts, IDs, and community files."
            />

            <div className="flex flex-wrap gap-1.5">
                {SECTION_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setSection(tab.key)}
                        className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                            section === tab.key ? residentChipActiveClass : residentChipInactiveClass,
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {section === 'leases' ? (
                currentResident ? (
                    <SectionCard
                        title="Rental lease agreements"
                        subtitle="Review, sign, and download your lease"
                        accent="blue"
                        icon={<LuSignature className="h-4 w-4" />}
                    >
                        <RentalLeaseAgreementsPanel
                            residentEmail={currentResident.email}
                            residentName={currentResident.fullName}
                            adminResidentSlug={currentResident.adminResidentSlug}
                        />
                    </SectionCard>
                ) : (
                    <ResidentCard padding="md">
                        <p className="text-sm text-[rgba(0,0,0,0.55)]">Sign in to view your lease agreements.</p>
                    </ResidentCard>
                )
            ) : (
                <>
                    <ResidentCard padding="md">
                        <div className="relative">
                            <LuSearch
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.45)]"
                                aria-hidden
                            />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search documents…"
                                className={residentInputClass}
                            />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {CATS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCat(c)}
                                    className={cn(
                                        'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                        cat === c ? residentChipActiveClass : residentChipInactiveClass,
                                    )}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </ResidentCard>

                    <SectionCard
                        title="Your files"
                        subtitle={`${filtered.length} ${filtered.length === 1 ? 'document' : 'documents'}`}
                        accent="emerald"
                        icon={<LuFileText className="h-4 w-4" />}
                        bodyClassName="p-0"
                    >
                        {filtered.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-[rgba(0,0,0,0.55)] sm:px-5">
                                No documents found. Try a different search or category.
                            </p>
                        ) : (
                            <ul className={residentSectionFeedList}>
                                {filtered.map((d) => {
                                    const style = categoryStyles[d.category];
                                    const Icon = style.icon;
                                    return (
                                        <li key={d.id}>
                                            <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5 mx-3 lg:mx-0">
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <div
                                                        className={cn(
                                                            'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                                                            style.iconBox,
                                                        )}
                                                    >
                                                        <Icon className="h-4 w-4" aria-hidden />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">{d.title}</p>
                                                        <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.55)]">
                                                            {d.category} · Updated {d.updatedAt}
                                                        </p>
                                                        <p className="mt-1 text-xs text-[rgba(0,0,0,0.45)]">{d.id}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#e0dfdc] bg-white transition-colors hover:border-[#d0cfcc] hover:bg-[#f8f8f6]"
                                                    aria-label={`Download ${d.title}`}
                                                >
                                                    <LuDownload className="h-4 w-4 text-[rgba(0,0,0,0.6)]" aria-hidden />
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </SectionCard>

                    <p className="text-center text-xs text-[rgba(0,0,0,0.45)]">
                        Lease agreements with digital signing are under{' '}
                        <button
                            type="button"
                            onClick={() => setSection('leases')}
                            className="font-semibold text-[#0a66c2] hover:underline"
                        >
                            Lease agreements
                        </button>
                        .
                    </p>
                </>
            )}
        </ResidentPageShell>
    );
}
