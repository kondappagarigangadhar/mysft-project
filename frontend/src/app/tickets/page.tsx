'use client';

import React from 'react';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import StatsCard from '@/components/ui/StatsCard';
import PageHeader from '@/components/ui/PageHeader';
import { LuTicket, LuPlus, LuSearch, LuClock, LuCheck, LuTriangle } from 'react-icons/lu';
import { getSupportTickets } from '@/data/mockData';
import Link from 'next/link';

export default function TicketsPage() {
    const tickets = getSupportTickets();

    const openCount = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;

    return (
        <CompanyAdminDashboardLayout>
            <PageHeader
                title="Support Tickets"
                subtitle="Track and manage help desk requests and technical issues."
                actions={
                    <Button>
                        <LuPlus className="mr-2" /> New Ticket
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 mt-6">
                <StatsCard title="Open Tickets" value={openCount.toString()} icon={LuTicket} trend="Currently unresolved" trendUp />
                <StatsCard title="Avg Resolution Time" value="4.2 hrs" icon={LuClock} trend="Down from 5.1 hrs" />
                <StatsCard title="High Priority" value="1" icon={LuTriangle} trend="Action required immediately" />
            </div>

            <Card className="p-0 overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative w-full md:max-w-xs">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:border-primary cursor-pointer hover:bg-slate-50 transition-colors">
                            <option>All Statuses</option>
                            <option>Open</option>
                            <option>In Progress</option>
                            <option>Resolved</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table
                        columns={[
                            {
                                key: 'id',
                                header: 'TICKET ID',
                                render: (row) => <span className="text-xs font-black text-slate-400 tabular-nums">#TIC-{1000 + row.id}</span>
                            },
                            {
                                key: 'subject',
                                header: 'Subject',
                                render: (row) => (
                                    <div className="flex flex-col">
                                        <Link href={`#`} className="font-bold text-slate-800 hover:text-primary transition-colors leading-tight">
                                            {row.subject}
                                        </Link>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {row.category}
                                        </span>
                                    </div>
                                )
                            },
                            {
                                key: 'priority',
                                header: 'Priority',
                                render: (row) => (
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                        ${row.priority === 'Urgent' || row.priority === 'High' ? 'bg-rose-100 text-rose-700' : ''}
                                        ${row.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : ''}
                                        ${row.priority === 'Low' ? 'bg-slate-100 text-slate-600' : ''}
                                    `}>{row.priority}</span>
                                )
                            },
                            {
                                key: 'status',
                                header: 'Status',
                                render: (row) => (
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                        ${row.status === 'Open' ? 'bg-blue-100 text-blue-700' : ''}
                                        ${row.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' : ''}
                                        ${row.status === 'Resolved' || row.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' : ''}
                                    `}>{row.status}</span>
                                )
                            },
                            { key: 'createdAt', header: 'Created At' },
                            { key: 'lastUpdate', header: 'Last Update' }
                        ]}
                        data={tickets}
                    />
                </div>
            </Card>
        </CompanyAdminDashboardLayout>
    );
}
