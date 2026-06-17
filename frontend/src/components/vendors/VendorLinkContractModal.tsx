'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ContractStatusBadge } from '@/components/vendors/VendorShared';
import { MOCK_VENDORS } from '@/lib/vendors/mockData';
import { getLinkableContractsForVendor, linkContractToVendor } from '@/lib/vendors/vendorProfileResources';
import type { VendorContract } from '@/lib/vendors/types';
import { cn } from '@/lib/utils';
import { LuSearch } from 'react-icons/lu';

export function VendorLinkContractModal({
    isOpen,
    onClose,
    vendorId,
    vendorName,
    onLinked,
}: {
    isOpen: boolean;
    onClose: () => void;
    vendorId: string;
    vendorName: string;
    onLinked: (contract: VendorContract) => void;
}) {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const [linking, setLinking] = useState(false);
    const [listVersion, setListVersion] = useState(0);

    const vendorNameById = useMemo(() => new Map(MOCK_VENDORS.map((v) => [v.id, v.name])), []);

    useEffect(() => {
        if (!isOpen) return;
        setSearch('');
        setSelectedId('');
        setLinking(false);
        setListVersion((n) => n + 1);
    }, [isOpen, vendorId]);

    const candidates = useMemo(() => getLinkableContractsForVendor(vendorId), [vendorId, listVersion]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return candidates;
        return candidates.filter((c) => {
            const owner = vendorNameById.get(c.vendorId) ?? c.vendorId;
            const hay = `${c.contractName} ${owner} ${c.status} ${c.fileName}`.toLowerCase();
            return hay.includes(q);
        });
    }, [candidates, search, vendorNameById]);

    const selected = filtered.find((c) => c.id === selectedId) ?? candidates.find((c) => c.id === selectedId);

    const onLink = () => {
        const source = candidates.find((c) => c.id === selectedId);
        if (!source) return;
        setLinking(true);
        try {
            const linked = linkContractToVendor(source, vendorId);
            onLinked(linked);
            onClose();
        } finally {
            setLinking(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Link contract"
            maxWidthClassName="max-w-3xl"
            placement="top"
            footer={
                <>
                    <Button variant="companyOutline" size="cta" onClick={onClose} disabled={linking}>
                        Cancel
                    </Button>
                    <Button variant="company" size="cta" onClick={onLink} disabled={!selectedId || linking}>
                        {linking ? 'Linking…' : 'Link to vendor'}
                    </Button>
                </>
            }
        >
            <p className="mb-3 text-sm text-slate-600">
                Copy a contract from the contracts library to <span className="font-semibold text-slate-900">{vendorName}</span>.
            </p>
            <div className="relative mb-3">
                <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search contract, vendor, status…"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--cta-button-bg)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                />
            </div>
            {filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-600">
                    {candidates.length === 0
                        ? 'No other contracts available to link.'
                        : 'No contracts match your search.'}
                </p>
            ) : (
                <div className="max-h-[min(52vh,420px)] overflow-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="w-10 px-2 py-2" aria-label="Select" />
                                <th className="px-2 py-2">Contract</th>
                                <th className="px-2 py-2">Source vendor</th>
                                <th className="px-2 py-2">Period</th>
                                <th className="px-2 py-2">Value</th>
                                <th className="px-2 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => {
                                const checked = selectedId === c.id;
                                return (
                                    <tr
                                        key={c.id}
                                        className={cn(
                                            'cursor-pointer border-t border-slate-100 transition-colors',
                                            checked ? 'bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]' : 'hover:bg-slate-50/80',
                                        )}
                                        onClick={() => setSelectedId(c.id)}
                                    >
                                        <td className="px-2 py-2 text-center">
                                            <input
                                                type="radio"
                                                name="link-contract"
                                                checked={checked}
                                                onChange={() => setSelectedId(c.id)}
                                                className="h-4 w-4 accent-[var(--cta-button-bg)]"
                                                aria-label={`Select ${c.contractName}`}
                                            />
                                        </td>
                                        <td className="px-2 py-2 font-semibold text-slate-900">{c.contractName}</td>
                                        <td className="px-2 py-2 text-slate-700">{vendorNameById.get(c.vendorId) ?? c.vendorId}</td>
                                        <td className="px-2 py-2 text-slate-700">
                                            {c.startDate} → {c.endDate}
                                        </td>
                                        <td className="px-2 py-2 text-slate-700">Rs. {c.value.toLocaleString('en-IN')}</td>
                                        <td className="px-2 py-2">
                                            <ContractStatusBadge status={c.status} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {selected ? (
                <p className="mt-3 text-xs text-slate-500">
                    Selected: <span className="font-semibold text-slate-700">{selected.contractName}</span>
                </p>
            ) : null}
        </Modal>
    );
}
