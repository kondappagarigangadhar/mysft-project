'use client';

import React from 'react';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { LuPlus, LuSearch, LuExternalLink, LuEllipsisVertical, LuPhone } from 'react-icons/lu';
import PageHeader from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

const clients = [
    { id: 1, name: 'Global Invest Ltd', company: 'Skyline Builders', projects: 3, phone: '+1 555-0123', status: 'Active' },
    { id: 2, name: 'Sustainability First', company: 'Urban Flux Co.', projects: 1, phone: '+1 555-0456', status: 'Active' },
    { id: 3, name: 'City Council', company: 'Ironwood Const.', projects: 5, phone: '+1 555-0789', status: 'Active' },
    { id: 4, name: 'Retail Assets Corp', company: 'Summit Group', projects: 2, phone: '+1 555-0321', status: 'Pending' },
    { id: 5, name: 'Supply Chain Inc', company: 'Apex Structures', projects: 4, phone: '+1 555-0654', status: 'Active' },
];

export default function ClientsPage() {
    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Clients', href: '/clients' },
                ]}
            />
            <PageHeader
                title="Clients Management"
                subtitle="Manage your client relationships across all construction projects."
                actions={
                    <Button>
                        <LuPlus className="mr-2" /> Register Client
                    </Button>
                }
            />

            <Card className="p-0 overflow-hidden border-none shadow-sm ring-1 ring-slate-200 mt-6">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative w-full md:max-w-xs">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table
                        columns={[
                            {
                                key: 'name',
                                header: 'Client Name',
                                render: (row) => (
                                    <Link href={`/clients/${row.id}`} className="group flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-200 group-hover:bg-primary group-hover:text-white transition-all">
                                            {row.name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-slate-800 group-hover:text-primary transition-colors">{row.name}</span>
                                    </Link>
                                )
                            },
                            { key: 'company', header: 'Partner Company' },
                            {
                                key: 'projects',
                                header: 'Projects',
                                render: (row) => (
                                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100">
                                        {row.projects} Projects
                                    </span>
                                )
                            },
                            {
                                key: 'phone',
                                header: 'Phone',
                                render: (row) => (
                                    <span className="text-slate-500 font-medium flex items-center gap-2">
                                        <LuPhone size={14} className="text-slate-400" /> {row.phone}
                                    </span>
                                )
                            },
                            {
                                key: 'status',
                                header: 'Status',
                                render: (row) => (
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                        ${row.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                                    `}>{row.status}</span>
                                )
                            },
                            {
                                key: 'actions',
                                header: 'Actions',
                                render: () => (
                                    <div className="flex justify-end pr-2">
                                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all">
                                            <LuEllipsisVertical size={20} />
                                        </button>
                                    </div>
                                )
                            }
                        ]}
                        data={clients}
                    />
                </div>
            </Card>
        </CompanyAdminDashboardLayout>
    );
}
