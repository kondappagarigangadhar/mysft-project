'use client';

import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

const ALERTS = [
    'License expires in 5 days - Metro Civil Solutions',
    'Contract ends tomorrow - BluePipe Plumbing Systems',
    'Vendor rating dropped below 3 - BluePipe Plumbing Systems',
    'Assignment overdue - SafeGuard Security Services',
];

export function VendorAlertsCenterPage() {
    const [items, setItems] = useState(ALERTS);
    return (
        <div className="space-y-6">
            <Breadcrumb items={[{ label: 'Vendor List', href: '/company-admin/vendors' }, { label: 'Alerts Center' }]} />
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Vendor Alerts Center</h1>
                <Button variant="companyOutline" size="sm" onClick={() => setItems([])}>Mark all as reviewed</Button>
            </div>
            <section className="grid gap-3">
                {items.map((alert) => (
                    <article key={alert} className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                        <p className="text-sm font-medium text-amber-800">{alert}</p>
                    </article>
                ))}
                {items.length === 0 ? (
                    <article className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
                        No active alerts. You are up to date.
                    </article>
                ) : null}
            </section>
        </div>
    );
}
