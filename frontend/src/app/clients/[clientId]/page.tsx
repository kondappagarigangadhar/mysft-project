'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
    LuUser,
    LuBuilding2,
    LuMail,
    LuPhone,
    LuMapPin,
    LuActivity,
    LuFolderKanban,
    LuCreditCard,
    LuFileText,
    LuChevronLeft,
    LuPlus,
    LuEye,
    LuPencil,
    LuCircleCheck,
    LuHistory
} from 'react-icons/lu';
import Link from 'next/link';
import { tenantViewHref } from '@/lib/tenantRoutes';
import {
    getClientById,
    getCompanyById,
    getProjectsByCompanyId,
    getDocuments,
    getActivities
} from '@/data/mockData';
import { Table } from '@/components/ui/Table';

const tabs = [
    { id: 'overview', label: 'Overview', icon: LuActivity },
    { id: 'projects', label: 'Projects', icon: LuFolderKanban },
    { id: 'payments', label: 'Payments', icon: LuCreditCard },
    { id: 'documents', label: 'Documents', icon: LuFileText },
    { id: 'activity', label: 'Activity', icon: LuHistory },
];

export default function ClientDetailsPage() {
    const params = useParams();
    const clientId = parseInt(params.clientId as string);
    const [activeTab, setActiveTab] = useState('overview');

    const client = getClientById(clientId);
    const company = client ? getCompanyById(client.companyId) : null;
    const clientProjects = company ? getProjectsByCompanyId(company.id) : [];
    const clientDocs = getDocuments();
    const clientActivities = getActivities();

    if (!client) {
        return (
            <CompanyAdminDashboardLayout>
                <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-black text-slate-800">Client Not Found</h2>
                    <Link href="/clients" className="text-primary font-bold mt-4 inline-block hover:underline">Back to Clients</Link>
                </div>
            </CompanyAdminDashboardLayout>
        );
    }

    const ActionButtons = ({ viewUrl }: { viewUrl?: string }) => (
        <div className="flex items-center gap-2 justify-end">
            {viewUrl && (
                <Link href={viewUrl}>
                    <button className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm ring-1 ring-slate-100">
                        <LuEye size={14} />
                    </button>
                </Link>
            )}
            <button className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm ring-1 ring-slate-100">
                <LuPencil size={14} />
            </button>
        </div>
    );

    return (
        <CompanyAdminDashboardLayout>
            <div className="mb-6">
                <Link
                    href="/clients"
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors group w-fit"
                >
                    <LuChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                    Back to Clients
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                {/* Profile Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-8 border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-[2rem] text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                        <div className="w-24 h-24 rounded-[2rem] bg-slate-900 mx-auto mb-6 flex items-center justify-center text-primary text-3xl font-black shadow-xl shadow-orange-100 transform rotate-3">
                            {client.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">{client.name}</h2>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">{client.status} Relationship</span>

                        <div className="mt-8 pt-8 border-t border-slate-50 space-y-4 text-left">
                            <div className="flex items-center gap-4 group">
                                <span className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all"><LuMail size={18} /></span>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Primary Email</p>
                                    <p className="text-sm font-bold text-slate-700">{client.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <span className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all"><LuPhone size={18} /></span>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone Line</p>
                                    <p className="text-sm font-bold text-slate-700">{client.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <span className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all"><LuMapPin size={18} /></span>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Registration Office</p>
                                    <p className="text-sm font-bold text-slate-700">{client.location}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-2xl">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contracting Entity</h3>
                        {company && (
                            <Link href={tenantViewHref(company.id)} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                                    {company.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{company.name}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Main Partner</p>
                                </div>
                            </Link>
                        )}
                    </Card>

                    <Button className="w-full rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">Edit Client Data</Button>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit max-w-full overflow-x-auto">
                        <div className="flex items-center gap-1 min-w-max">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl",
                                        activeTab === tab.id
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {activeTab === 'overview' && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <Card className="p-8 border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-[2rem]">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Portfolio</h4>
                                        <div className="flex items-end gap-3">
                                            <span className="text-5xl font-black text-slate-800 tabular-nums tracking-tighter">{clientProjects.length}</span>
                                            <span className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Active Projects</span>
                                        </div>
                                    </Card>
                                    <Card className="p-8 border-none shadow-sm ring-1 ring-slate-100 bg-slate-900 rounded-[2rem] text-white overflow-hidden relative group">
                                        <LuCreditCard className="absolute top-4 right-4 text-white/10 group-hover:text-primary/20 transition-all" size={80} />
                                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Total Managed Investment</h4>
                                        <div className="flex items-end gap-3 relative z-10">
                                            <span className="text-5xl font-black text-white tabular-nums tracking-tighter">$8.2M</span>
                                            <span className="text-xs font-black text-primary mb-2 uppercase tracking-widest">USD Equity</span>
                                        </div>
                                    </Card>
                                </div>
                                <Card className="p-8 border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-[2rem]">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Recent Engagement Activity</h3>
                                        <button onClick={() => setActiveTab('activity')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All Records</button>
                                    </div>
                                    <div className="space-y-6">
                                        {clientActivities.slice(0, 3).map((activity, idx) => (
                                            <div key={idx} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-primary flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                    <LuActivity size={18} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-sm font-black text-slate-800 tracking-tight">{activity.title}</h4>
                                                        <span className="text-[10px] font-bold text-slate-300">•</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tabular-nums">{activity.timestamp}</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500 leading-relaxed">{activity.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </>
                        )}

                        {activeTab === 'projects' && (
                            <Card className="p-0 overflow-hidden border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-[2rem]">
                                <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Contracted Projects</h3>
                                    <Button size="sm" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-4"><LuPlus className="mr-2" size={14} /> New Contract</Button>
                                </div>
                                <Table
                                    columns={[
                                        {
                                            key: 'name',
                                            header: 'Project Designation',
                                            render: (row) => (
                                                <Link href="/projects-inventory/projects" className="flex items-center gap-3 group">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-primary flex items-center justify-center font-black text-[10px]">PC</div>
                                                    <span className="font-bold text-slate-800 group-hover:text-primary transition-colors">{row.name}</span>
                                                </Link>
                                            )
                                        },
                                        { key: 'status', header: 'State', render: (row) => <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-tight">{row.status}</span> },
                                        { key: 'budget', header: 'Est. Value', render: (row) => <span className="text-xs font-bold text-slate-800 tabular-nums">{row.budget}</span> },
                                        { key: 'actions', header: '', render: () => <ActionButtons viewUrl="/projects-inventory/projects" /> }
                                    ]}
                                    data={clientProjects}
                                />
                            </Card>
                        )}

                        {activeTab === 'payments' && (
                            <Card className="p-0 overflow-hidden border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-[2rem]">
                                <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Financial Ledger</h3>
                                </div>
                                <Table
                                    columns={[
                                        { key: 'id', header: 'TXN ID', render: (row) => <span className="text-xs font-black text-slate-400 tabular-nums">#INV-882{row.id}</span> },
                                        { key: 'amount', header: 'Billable Amount', render: () => <span className="text-sm font-black text-slate-800 tabular-nums">$42,500.00</span> },
                                        { key: 'date', header: 'Payment Date', render: () => <span className="text-xs font-bold text-slate-500">Mar 10, 2024</span> },
                                        {
                                            key: 'status',
                                            header: 'Settlement',
                                            render: () => (
                                                <div className="flex items-center gap-2">
                                                    <LuCircleCheck className="text-emerald-500" size={14} />
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Released</span>
                                                </div>
                                            )
                                        },
                                        { key: 'actions', header: '', render: () => <ActionButtons /> }
                                    ]}
                                    data={[1, 2, 3]}
                                />
                                <div className="p-4 bg-slate-50 text-center">
                                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">Download Annual Statement</button>
                                </div>
                            </Card>
                        )}

                        {activeTab === 'documents' && (
                            <Card className="p-0 overflow-hidden border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-[2rem]">
                                <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Contractual Documents</h3>
                                    <Button variant="outline" size="sm" className="rounded-xl font-black uppercase text-[10px] tracking-widest"><LuPlus className="mr-2" size={14} /> Upload Doc</Button>
                                </div>
                                <Table
                                    columns={[
                                        {
                                            key: 'name',
                                            header: 'Asset Identity',
                                            render: (row) => (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-primary flex items-center justify-center"><LuFileText size={16} /></div>
                                                    <span className="font-bold text-slate-800">{row.name}</span>
                                                </div>
                                            )
                                        },
                                        { key: 'type', header: 'Meta', render: (row) => <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.type} • {row.size}</span> },
                                        { key: 'actions', header: '', render: () => <ActionButtons /> }
                                    ]}
                                    data={clientDocs}
                                />
                            </Card>
                        )}

                        {activeTab === 'activity' && (
                            <Card className="p-8 border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-[2rem]">
                                <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Executive Engagement Timeline</h3>
                                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                                    {clientActivities.map((activity, idx) => (
                                        <div key={idx} className="relative pl-10">
                                            <div className={cn(
                                                "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm z-10",
                                                activity.type === 'Milestone' ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-600"
                                            )}>
                                                <LuHistory size={12} />
                                            </div>
                                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-50 group hover:border-slate-200 hover:bg-white transition-all shadow-sm shadow-transparent hover:shadow-slate-100/50">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">{activity.title}</h4>
                                                        <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{activity.description}</p>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tabular-nums tracking-widest">{activity.timestamp}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </CompanyAdminDashboardLayout>
    );
}
