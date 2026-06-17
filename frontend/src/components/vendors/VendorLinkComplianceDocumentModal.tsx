'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { VerificationBadge } from '@/components/vendors/VendorShared';
import { MOCK_VENDORS } from '@/lib/vendors/mockData';
import { getLinkableDocumentsForVendor, linkDocumentToVendor } from '@/lib/vendors/vendorProfileResources';
import type { VendorDocument } from '@/lib/vendors/types';
import { cn } from '@/lib/utils';
import { LuSearch } from 'react-icons/lu';

export function VendorLinkComplianceDocumentModal({
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
    onLinked: (doc: VendorDocument) => void;
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

    const candidates = useMemo(() => getLinkableDocumentsForVendor(vendorId), [vendorId, listVersion]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return candidates;
        return candidates.filter((d) => {
            const owner = vendorNameById.get(d.vendorId) ?? d.vendorId;
            const hay = `${d.documentName} ${d.type} ${owner} ${d.verificationStatus}`.toLowerCase();
            return hay.includes(q);
        });
    }, [candidates, search, vendorNameById]);

    const selected = filtered.find((d) => d.id === selectedId) ?? candidates.find((d) => d.id === selectedId);

    const onLink = () => {
        const source = candidates.find((d) => d.id === selectedId);
        if (!source) return;
        setLinking(true);
        try {
            const linked = linkDocumentToVendor(source, vendorId);
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
            title="Link compliance document"
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
                Copy a document from the compliance library to <span className="font-semibold text-slate-900">{vendorName}</span>.
            </p>
            <div className="relative mb-3">
                <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search document, type, source vendor…"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--cta-button-bg)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                />
            </div>
            {filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-600">
                    {candidates.length === 0
                        ? 'No other documents available to link.'
                        : 'No documents match your search.'}
                </p>
            ) : (
                <div className="max-h-[min(52vh,420px)] overflow-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[600px] text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="w-10 px-2 py-2" aria-label="Select" />
                                <th className="px-2 py-2">Document</th>
                                <th className="px-2 py-2">Type</th>
                                <th className="px-2 py-2">Source vendor</th>
                                <th className="px-2 py-2">Status</th>
                                <th className="px-2 py-2">Expiry</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((doc) => {
                                const checked = selectedId === doc.id;
                                return (
                                    <tr
                                        key={doc.id}
                                        className={cn(
                                            'cursor-pointer border-t border-slate-100 transition-colors',
                                            checked ? 'bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]' : 'hover:bg-slate-50/80',
                                        )}
                                        onClick={() => setSelectedId(doc.id)}
                                    >
                                        <td className="px-2 py-2 text-center">
                                            <input
                                                type="radio"
                                                name="link-document"
                                                checked={checked}
                                                onChange={() => setSelectedId(doc.id)}
                                                className="h-4 w-4 accent-[var(--cta-button-bg)]"
                                                aria-label={`Select ${doc.documentName}`}
                                            />
                                        </td>
                                        <td className="px-2 py-2 font-semibold text-slate-900">{doc.documentName}</td>
                                        <td className="px-2 py-2 text-slate-700">{doc.type}</td>
                                        <td className="px-2 py-2 text-slate-700">{vendorNameById.get(doc.vendorId) ?? doc.vendorId}</td>
                                        <td className="px-2 py-2">
                                            <VerificationBadge status={doc.verificationStatus} />
                                        </td>
                                        <td className="px-2 py-2 text-slate-700">{doc.expiryDate ?? '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {selected ? (
                <p className="mt-3 text-xs text-slate-500">
                    Selected: <span className="font-semibold text-slate-700">{selected.documentName}</span> ({selected.type})
                </p>
            ) : null}
        </Modal>
    );
}
