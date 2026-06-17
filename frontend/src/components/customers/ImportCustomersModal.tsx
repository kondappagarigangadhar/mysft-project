'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { addCustomer, type LeadSource } from '@/lib/customersStore';

const LEAD_SOURCES: LeadSource[] = ['Website', 'Facebook Ads', 'Google Ads', 'Referral', 'Walk-in', 'Broker'];

export function ImportCustomersModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
    const [csvText, setCsvText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleImport = () => {
        const lines = csvText
            .trim()
            .split(/\r?\n/)
            .filter((l) => l.trim());
        if (lines.length < 2) {
            setError('Paste CSV with header row and at least one data row.');
            return;
        }
        const header = lines[0]!.toLowerCase().split(',').map((h) => h.trim());
        const nameIdx = header.findIndex((h) => h.includes('name'));
        const phoneIdx = header.findIndex((h) => h.includes('phone'));
        const emailIdx = header.findIndex((h) => h.includes('email'));
        const projectIdx = header.findIndex((h) => h.includes('project'));
        const unitIdx = header.findIndex((h) => h.includes('unit'));
        const execIdx = header.findIndex((h) => h.includes('executive') || h.includes('assigned'));
        if (nameIdx < 0 || phoneIdx < 0) {
            setError('CSV must include name and phone columns.');
            return;
        }
        let count = 0;
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i]!.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
            const fullName = cols[nameIdx] ?? '';
            const phone = cols[phoneIdx] ?? '';
            if (!fullName || !phone) continue;
            addCustomer({
                fullName,
                phone,
                email: emailIdx >= 0 ? cols[emailIdx] ?? '' : '',
                projectName: projectIdx >= 0 ? cols[projectIdx] ?? '—' : '—',
                unitNumber: unitIdx >= 0 ? cols[unitIdx] ?? '—' : '—',
                assignedExecutive: execIdx >= 0 ? cols[execIdx] ?? 'Unassigned' : 'Unassigned',
                leadSource: 'Website',
            });
            count += 1;
        }
        if (!count) {
            setError('No valid rows imported.');
            return;
        }
        setError(null);
        setCsvText('');
        onImported();
        onClose();
    };

    return (
        <Modal isOpen={open} onClose={onClose} title="Import customers" maxWidthClassName="max-w-lg">
            <p className="mb-3 text-sm text-slate-600">
                Paste CSV with columns: fullName, phone, email, projectName, unitNumber, assignedExecutive (demo import).
            </p>
            <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
                placeholder="fullName,phone,email,projectName,unitNumber,assignedExecutive&#10;Ramesh Kumar,9876543210,ramesh@email.com,Skyline Residency,101,Amit Sales"
            />
            {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
                <Button variant="companyOutline" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="company" onClick={handleImport}>
                    Import
                </Button>
            </div>
        </Modal>
    );
}
