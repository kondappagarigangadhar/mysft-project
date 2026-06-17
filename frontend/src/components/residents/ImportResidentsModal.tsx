'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
    addResident,
    RESIDENT_PROPERTY_UNIT_OPTIONS,
    RESIDENT_STATUS_OPTIONS,
    RESIDENT_TYPE_OPTIONS,
    RESIDENT_USER_ROLE_OPTIONS,
    type ResidentStatusValue,
    type ResidentType,
    type ResidentUserRole,
} from '@/lib/residentStore';
import { residentViewHref } from '@/lib/residentRoutes';
import { LuDownload } from 'react-icons/lu';

const SAMPLE_CSV = `Full Name,Email,Phone,Resident Type,Property Unit,Move-in Date,Status,User Role,Portal Access
Ada Lovelace,ada@example.com,9800012345,Owner,Riverfront Tower — Unit 1204,2026-03-01,Active,Resident Admin,Yes`;

type ParsedRow = {
    fullName: string;
    email: string;
    phone: string;
    residentType: string;
    propertyUnit: string;
    moveInDate: string;
    status: string;
    userRole: string;
    portal: string;
};

function parseCsv(text: string): ParsedRow[] {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
    const idx = (name: string) =>
        header.findIndex((h) => h.replace(/\s+/g, ' ') === name.toLowerCase());

    const iName = idx('full name');
    const iEmail = idx('email');
    const iPhone = idx('phone');
    const iType = idx('resident type');
    const iUnit = idx('property unit');
    const iMove = idx('move-in date');
    const iStatus = idx('status');
    const iRole = idx('user role');
    const iPortal = idx('portal access');

    if (iName < 0 || iEmail < 0 || iPhone < 0) return [];

    const rows: ParsedRow[] = [];
    for (let r = 1; r < lines.length; r++) {
        const cells = lines[r]!.split(',').map((c) => c.trim());
        rows.push({
            fullName: cells[iName] ?? '',
            email: cells[iEmail] ?? '',
            phone: cells[iPhone] ?? '',
            residentType: iType >= 0 ? cells[iType] ?? 'Tenant' : 'Tenant',
            propertyUnit:
                iUnit >= 0
                    ? cells[iUnit] ?? RESIDENT_PROPERTY_UNIT_OPTIONS[0]!
                    : RESIDENT_PROPERTY_UNIT_OPTIONS[0]!,
            moveInDate: iMove >= 0 ? cells[iMove] ?? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            status: iStatus >= 0 ? cells[iStatus] ?? 'Active' : 'Active',
            userRole: iRole >= 0 ? cells[iRole] ?? 'Household Member' : 'Household Member',
            portal: iPortal >= 0 ? cells[iPortal] ?? 'No' : 'No',
        });
    }
    return rows;
}

function mapType(t: string): ResidentType {
    const x = t.trim();
    return RESIDENT_TYPE_OPTIONS.includes(x as ResidentType) ? (x as ResidentType) : 'Tenant';
}

function mapStatus(t: string): ResidentStatusValue {
    const x = t.trim();
    return RESIDENT_STATUS_OPTIONS.includes(x as ResidentStatusValue) ? (x as ResidentStatusValue) : 'Active';
}

function mapRole(t: string): ResidentUserRole {
    const x = t.trim();
    return (RESIDENT_USER_ROLE_OPTIONS as readonly string[]).includes(x) ? (x as ResidentUserRole) : 'Household Member';
}

export function ImportResidentsModal({
    isOpen,
    onClose,
    onImported,
}: {
    isOpen: boolean;
    onClose: () => void;
    onImported: () => void;
}) {
    const router = useRouter();
    const [text, setText] = useState('');
    const [step, setStep] = useState<'paste' | 'preview'>('paste');
    const [busy, setBusy] = useState(false);

    const parsed = React.useMemo(() => parseCsv(text), [text]);

    const reset = () => {
        setText('');
        setStep('paste');
        setBusy(false);
    };

    const close = () => {
        reset();
        onClose();
    };

    const runImport = () => {
        setBusy(true);
        try {
            let lastHref = '';
            for (const row of parsed) {
                if (!row.fullName.trim()) continue;
                let unit = row.propertyUnit.trim();
                if (!RESIDENT_PROPERTY_UNIT_OPTIONS.includes(unit)) {
                    unit = RESIDENT_PROPERTY_UNIT_OPTIONS[0]!;
                }
                const portal = /^y(es)?$/i.test(row.portal.trim());
                const created = addResident({
                    fullName: row.fullName.trim(),
                    email: row.email.trim(),
                    phoneNumber: row.phone.trim(),
                    residentType: mapType(row.residentType),
                    propertyUnit: unit,
                    moveInDate: row.moveInDate.trim().slice(0, 10),
                    residentStatus: mapStatus(row.status),
                    userRole: mapRole(row.userRole),
                    portalAccessEnabled: portal,
                    loginUsername: row.email.split('@')[0]?.replace(/[^a-z0-9._-]/gi, '') || 'resident',
                    temporaryPassword: `Temp${Math.floor(Math.random() * 9000 + 1000)}`,
                    accessExpiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
                    emergencyContactNumber: row.phone.trim(),
                    identityDocument: null,
                });
                lastHref = residentViewHref(created.slug);
            }
            onImported();
            close();
            if (lastHref) router.push(lastHref);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={close}
            title="Import residents"
            footer={
                step === 'paste' ? (
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={close}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            disabled={parsed.length === 0}
                            onClick={() => setStep('preview')}
                        >
                            Next
                        </Button>
                    </>
                ) : (
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setStep('paste')}>
                            Back
                        </Button>
                        <Button type="button" variant="company" size="cta" isLoading={busy} onClick={runImport}>
                            Import {parsed.length || ''} resident{parsed.length === 1 ? '' : 's'}
                        </Button>
                    </>
                )
            }
        >
            {step === 'paste' ? (
                <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                        Paste UTF-8 CSV with columns: Full Name, Email, Phone, Resident Type, Property Unit, Move-in Date, Status, User
                        Role, Portal Access.
                    </p>
                    <a
                        href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`}
                        download="residents-sample.csv"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--cta-button-bg)] hover:underline"
                    >
                        <LuDownload size={16} />
                        Download sample CSV
                    </a>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={12}
                        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800"
                        placeholder="Paste CSV here…"
                    />
                    <p className="text-xs text-slate-500">{parsed.length} row(s) detected</p>
                </div>
            ) : (
                <div className="max-h-[50vh] overflow-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Email</th>
                                <th className="px-3 py-2">Type</th>
                                <th className="px-3 py-2">Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parsed.map((r, i) => (
                                <tr key={i} className="border-t border-slate-100">
                                    <td className="px-3 py-2 font-medium text-slate-900">{r.fullName}</td>
                                    <td className="px-3 py-2 text-slate-700">{r.email}</td>
                                    <td className="px-3 py-2 text-slate-700">{mapType(r.residentType)}</td>
                                    <td className="px-3 py-2 text-slate-700">{r.propertyUnit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
}
