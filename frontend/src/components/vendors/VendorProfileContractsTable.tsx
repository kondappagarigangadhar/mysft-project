'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { ContractStatusBadge } from '@/components/vendors/VendorShared';
import type { VendorContract } from '@/lib/vendors/types';
import { cn } from '@/lib/utils';

export function VendorProfileContractsTable({ contracts, vendorId }: { contracts: VendorContract[]; vendorId: string }) {
    const rows = useMemo(() => contracts.slice(0, 6), [contracts]);
    const router = useRouter();

    const openContracts = () => {
        router.push(`/company-admin/vendors/contracts?vendor=${encodeURIComponent(vendorId)}`);
    };

    if (!rows.length) {
        return (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No contracts on file for this vendor yet.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-2 py-2">Contract Name</th>
                        <th className="px-2 py-2">Start Date</th>
                        <th className="px-2 py-2">End Date</th>
                        <th className="px-2 py-2">Value</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">File</th>
                        <th className="px-2 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((c) => (
                        <tr
                            key={c.id}
                            className={cn('border-t border-slate-100 transition-colors hover:bg-slate-50/70', 'cursor-pointer')}
                            role="link"
                            tabIndex={0}
                            onClick={openContracts}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') openContracts();
                            }}
                        >
                            <td className="px-2 py-2 font-semibold text-slate-900">{c.contractName}</td>
                            <td className="px-2 py-2 text-slate-700">{c.startDate}</td>
                            <td className="px-2 py-2 text-slate-700">{c.endDate}</td>
                            <td className="px-2 py-2 text-slate-700">Rs. {c.value.toLocaleString('en-IN')}</td>
                            <td className="px-2 py-2">
                                <ContractStatusBadge status={c.status} />
                            </td>
                            <td className="max-w-32 truncate px-2 py-2 text-slate-700" title={c.fileName}>
                                {c.fileName}
                            </td>
                            <td className="px-2 py-2">
                                <Link
                                    href={`/company-admin/vendors/contracts?vendor=${encodeURIComponent(vendorId)}`}
                                    className="text-xs font-semibold text-(--cta-button-bg) hover:text-(--cta-button-hover-bg) hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Open
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {contracts.length > 6 ? (
                <p className="mt-2 text-xs text-slate-500">Showing 6 of {contracts.length} contracts.</p>
            ) : null}
        </div>
    );
}
