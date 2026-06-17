'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { companies } from '@/data/mockData';
import type { User } from '@/data/mockData';
import { defaultPermissionsForRole, defaultRoleDescription } from '@/lib/userPermissions';
import { LuDownload } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const SAMPLE = `FirstName,LastName,Email,Phone,Designation,Role,Department,Status,RoleName,RoleDescription,TenantId
Jane,Doe,jane.doe@example.com,9876543210,Site Engineer,Engineer,Engineering,Active,Engineering Lead,Field engineering access,1`;

type Row = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    department: string;
    tenantId: string;
    designation: string;
    status: string;
};

function parseCsv(text: string): Row[] {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    if (lines.length < 2) return [];
    const h = lines[0]!.toLowerCase().split(',').map((x) => x.trim());
    const idx = (n: string) => h.findIndex((x) => x === n.toLowerCase());
    const iFn = idx('firstname');
    const iLn = idx('lastname');
    const iEm = idx('email');
    const iPh = idx('phone');
    const iR = idx('role');
    const iD = idx('department');
    const iT = idx('tenantid');
    const iDg = idx('designation');
    const iSt = idx('status');
    if (iFn < 0 || iLn < 0 || iEm < 0 || iPh < 0 || iT < 0) return [];
    const out: Row[] = [];
    for (let r = 1; r < lines.length; r++) {
        const cells = lines[r]!.split(',').map((c) => c.trim());
        out.push({
            firstName: cells[iFn] ?? '',
            lastName: cells[iLn] ?? '',
            email: cells[iEm] ?? '',
            phone: cells[iPh] ?? '',
            role: iR >= 0 ? cells[iR] ?? 'Engineer' : 'Engineer',
            department: iD >= 0 ? cells[iD] ?? 'Engineering' : 'Engineering',
            tenantId: cells[iT] ?? '',
            designation: iDg >= 0 ? cells[iDg] ?? '' : '',
            status: iSt >= 0 ? cells[iSt] ?? 'Pending' : 'Pending',
        });
    }
    return out;
}

function mapStatus(s: string): User['status'] {
    const t = s.trim().toLowerCase();
    if (t === 'inactive') return 'Inactive';
    if (t === 'disabled') return 'Disabled';
    if (t === 'suspended') return 'Suspended';
    if (t === 'pending') return 'Pending';
    return 'Active';
}

export function ImportUsersModal({
    isOpen,
    onClose,
    onImported,
    existingEmails,
}: {
    isOpen: boolean;
    onClose: () => void;
    onImported: (rows: Omit<User, 'id'>[]) => void;
    existingEmails: Set<string>;
}) {
    const [text, setText] = useState('');
    const [step, setStep] = useState<'paste' | 'preview'>('paste');
    const [busy, setBusy] = useState(false);

    const parsed = parseCsv(text);
    const drafts: Omit<User, 'id'>[] = [];
    for (const row of parsed) {
        if (!row.firstName.trim() || !row.email.trim()) continue;
        const tid = Number(row.tenantId);
        const org = companies.find((c) => c.id === tid);
        if (!org) continue;
        const em = row.email.trim().toLowerCase();
        if (existingEmails.has(em)) continue;
        const phone = row.phone.replace(/\D/g, '').slice(-10);
        const displayPhone = phone.length === 10 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : row.phone;
        const role = row.role.trim() || 'Engineer';
        drafts.push({
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            name: `${row.firstName.trim()} ${row.lastName.trim()}`.trim(),
            email: row.email.trim(),
            phoneNumber: displayPhone,
            designation: row.designation.trim() || '—',
            role,
            department: row.department.trim() || 'Engineering',
            tenantId: org.id,
            tenantName: org.name,
            status: mapStatus(row.status),
            roleName: role,
            roleDescription: defaultRoleDescription(role),
            permissions: defaultPermissionsForRole(role),
            createdDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(',', ''),
            joined: new Date().toISOString().slice(0, 10),
        });
    }

    const downloadTemplate = () => {
        const blob = new Blob([`\uFEFF${SAMPLE}`], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users-import-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const runImport = async () => {
        setBusy(true);
        try {
            if (drafts.length) onImported(drafts);
            onClose();
            setText('');
            setStep('paste');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import users"
            maxWidthClassName="max-w-2xl"
            footer={
                <>
                    <Button type="button" variant="companyOutline" size="cta" onClick={onClose}>
                        Cancel
                    </Button>
                    {step === 'paste' ? (
                        <Button type="button" variant="company" size="cta" disabled={!parsed.length} onClick={() => setStep('preview')}>
                            Preview
                        </Button>
                    ) : (
                        <Button type="button" variant="company" size="cta" disabled={busy || !drafts.length} onClick={runImport}>
                            {busy ? 'Importing…' : `Import ${drafts.length} user(s)`}
                        </Button>
                    )}
                </>
            }
        >
            <div className="space-y-4">
                <Button type="button" variant="companyOutline" size="sm" className="gap-2" onClick={downloadTemplate}>
                    <LuDownload size={16} />
                    Download sample CSV
                </Button>
                <p className="text-sm text-slate-600">
                    Columns: <strong>FirstName, LastName, Email, Phone, Role, Department, TenantId, Designation, Status</strong>. TenantId must
                    match an existing tenant id. Duplicate emails are skipped.
                </p>
                {step === 'paste' ? (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={10}
                        className={cn(
                            'w-full rounded-xl border border-slate-200 bg-slate-50/80 p-3 font-mono text-sm text-slate-900',
                            'focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_25%,transparent)]',
                        )}
                        placeholder={SAMPLE}
                    />
                ) : (
                    <div className="max-h-64 overflow-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-slate-100 text-xs font-bold uppercase text-slate-500">
                                <tr>
                                    <th className="px-3 py-2">Name</th>
                                    <th className="px-3 py-2">Email</th>
                                    <th className="px-3 py-2">Tenant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drafts.map((r, i) => (
                                    <tr key={i} className="border-t border-slate-100">
                                        <td className="px-3 py-2 font-medium">
                                            {r.firstName} {r.lastName}
                                        </td>
                                        <td className="px-3 py-2">{r.email}</td>
                                        <td className="px-3 py-2">{r.tenantName}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Modal>
    );
}
