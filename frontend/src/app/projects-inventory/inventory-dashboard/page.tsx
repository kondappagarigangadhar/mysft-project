'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/projects-inventory/KpiCard';
import { formatCurrencyINR, getInventoryAggregateCounts, getUnits } from '@/lib/projectsInventoryStore';
import { LuLock, LuPackage, LuShoppingBag } from 'react-icons/lu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function InventoryDashboardPage() {
    const units = useMemo(() => getUnits(), []);

    const kpis = useMemo(() => getInventoryAggregateCounts(), [units]);

    const totalValue = useMemo(() => {
        const sum = units.reduce((acc, u) => acc + (u.price || 0), 0);
        return sum;
    }, [units]);

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Projects & Inventory', href: '/projects-inventory/projects' },
                    { label: 'Inventory', href: '/projects-inventory/inventory' },
                    { label: 'Inventory Dashboard', href: '/projects-inventory/inventory-dashboard' },
                ]}
            />
            <div className="mb-6 mt-2">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inventory Dashboard</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">A clean summary of available, reserved, and sold units.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <KpiCard title="Available Units" value={kpis.available} icon={<LuShoppingBag />} />
                <KpiCard title="Reserved Units" value={kpis.reserved} icon={<LuPackage />} />
                <KpiCard title="Sold Units" value={kpis.sold} icon={<LuPackage />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-none shadow-md lg:col-span-2">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">Summary</h2>
                        <p className="text-sm text-slate-500 mt-1">Inventory snapshot across all projects.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200 p-4 bg-white">
                            <p className="text-sm font-bold text-slate-800">Total units</p>
                            <p className="text-2xl font-black text-slate-900 mt-2">{kpis.total}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4 bg-white">
                            <p className="text-sm font-bold text-slate-800">Portfolio Base Price</p>
                            <p className="text-2xl font-black text-slate-900 mt-2">{formatCurrencyINR(totalValue)}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-md">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">Next Actions</h2>
                    </div>
                    <div className="p-6 space-y-3 text-sm text-slate-700">
                        <p>
                            Review pending pricing approvals on the{' '}
                            <Link href="/projects-inventory/pricing" className="font-semibold text-primary hover:underline">
                                Pricing
                            </Link>{' '}
                            page or from any project view → Pricing tab.
                        </p>
                        <p>Lock/unlock inventory in Unit View to sync booking flow.</p>
                        <p>Use Analytics and AI Insights to refine demand strategy.</p>
                    </div>
                </Card>
            </div>
        </CompanyAdminDashboardLayout>
    );
}

