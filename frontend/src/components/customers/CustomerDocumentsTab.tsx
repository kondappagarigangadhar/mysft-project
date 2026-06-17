'use client';

import React, { useMemo, useState } from 'react';
import { CustomerCollapsibleSection } from '@/components/customers/CustomerOverviewFieldKit';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn } from '@/components/data-table/types';
import {
    CUSTOMER_DOCUMENT_TYPE_OPTIONS,
    type Customer,
    type CustomerDocument,
    type CustomerDocumentType,
} from '@/lib/customersStore';
import { LuDownload, LuEye, LuFileText, LuUpload } from 'react-icons/lu';

type Props = {
    customer: Customer;
    editing: boolean;
    documents: CustomerDocument[];
    onDocumentsChange: (docs: CustomerDocument[]) => void;
};

export function CustomerDocumentsTab({ customer, editing, documents, onDocumentsChange }: Props) {
    const [typeFilter, setTypeFilter] = useState<'All' | CustomerDocumentType>('All');
    const filtered = useMemo(() => {
        if (typeFilter === 'All') return documents;
        return documents.filter((d) => d.type === typeFilter);
    }, [documents, typeFilter]);

    const columns: DataTableColumn<CustomerDocument>[] = [
        { id: 'name', header: 'Document Name', render: (r) => r.name },
        { id: 'type', header: 'Type', render: (r) => r.type },
        { id: 'uploaded', header: 'Upload Date', render: (r) => r.uploadedAt },
        {
            id: 'actions',
            header: '',
            render: (r) => (
                <div className="flex justify-end gap-1">
                    <button type="button" className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100" onClick={() => window.open(r.fileUrl, '_blank')} title="Preview">
                        <LuEye size={16} />
                    </button>
                    <a href={r.fileUrl} download className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100" title="Download">
                        <LuDownload size={16} />
                    </a>
                </div>
            ),
        },
    ];

    const addDoc = () => {
        const id = `doc-${Date.now()}`;
        onDocumentsChange([
            ...documents,
            {
                id,
                name: 'New document.pdf',
                type: 'Other',
                fileUrl: `#${id}`,
                uploadedAt: new Date().toISOString().slice(0, 10),
            },
        ]);
    };

    const updateDoc = (id: string, patch: Partial<CustomerDocument>) => {
        onDocumentsChange(documents.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    };

    return (
        <CustomerCollapsibleSection title="Customer Documents" icon={LuFileText} tone="blue" open onOpenChange={() => {}}>
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-3">
                <label className="text-xs font-bold uppercase text-slate-500">Filter</label>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as 'All' | CustomerDocumentType)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                >
                    <option value="All">All types</option>
                    {CUSTOMER_DOCUMENT_TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
                {editing ? (
                    <Button variant="companyOutline" size="sm" className="gap-1" type="button" onClick={addDoc}>
                        <LuUpload size={14} /> Upload
                    </Button>
                ) : null}
            </div>
            {editing ? (
                <div className="space-y-2 px-3 py-3">
                    {filtered.map((d) => (
                        <div key={d.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-3">
                            <input
                                className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                                value={d.name}
                                onChange={(e) => updateDoc(d.id, { name: e.target.value })}
                            />
                            <select
                                className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                                value={d.type}
                                onChange={(e) => updateDoc(d.id, { type: e.target.value as CustomerDocumentType })}
                            >
                                {CUSTOMER_DOCUMENT_TYPE_OPTIONS.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="date"
                                className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                                value={d.uploadedAt}
                                onChange={(e) => updateDoc(d.id, { uploadedAt: e.target.value })}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="px-3 pb-4">
                    <DataTable
                        data={filtered}
                        columns={columns}
                        getRowId={(r) => r.id}
                        sort={{ columnId: null, direction: 'asc' }}
                        onSortChange={() => {}}
                        columnVisibility={{}}
                        columnWidths={{}}
                        onColumnWidthsChange={() => {}}
                        emptyMessage="No documents for this customer."
                        stickyHeader
                        enableClientSort={false}
                    />
                </div>
            )}
            <p className="px-3 pb-3 text-xs text-slate-500">Booking: {customer.bookingId} · {customer.documents.length} file(s) in vault (demo).</p>
        </CustomerCollapsibleSection>
    );
}
