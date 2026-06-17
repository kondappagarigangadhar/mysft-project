'use client';

import React, { useState } from 'react';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import StatsCard from '@/components/ui/StatsCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import { 
    LuPlus, LuSearch, LuFilter, LuDownload,
    LuCalendarDays, LuCheck, LuClock, LuTarget,
    LuEye, LuPencil, LuTrash2, LuUsers, LuX, LuMapPin
} from 'react-icons/lu';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getSiteVisits, SiteVisit } from '@/data/mockData';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function SiteVisitsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const allVisits = getSiteVisits();

    const filteredVisits = allVisits.filter(visit => 
        visit.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedVisits = filteredVisits.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Sales', href: '/sales/site-visits' },
                    { label: 'Site Visits' },
                ]}
            />
            {/* Header */}
            <div className="mb-6 mt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Site Visits</h1>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Track and schedule property site visits for potential buyers.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none rounded-xl border-slate-200 h-[42px] bg-white hover:bg-slate-50 shadow-sm">
                        <LuDownload className="mr-2" size={16} /> Export
                    </Button>
                    <Link href="/sales/site-visits/create" className="flex-1 sm:flex-none">
                        <Button className="w-full rounded-xl shadow-md shadow-primary/10 h-[42px]">
                            <LuPlus className="mr-2" size={18} /> Schedule Visit
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatsCard title="Total Visits" value={145} icon={LuCalendarDays} trend="12% from last month" trendUp={true} />
                <StatsCard title="Scheduled" value={12} icon={LuClock} trend="Today" trendUp={false} />
                <StatsCard title="Completed" value={85} icon={LuCheck} trend="8% increase" trendUp={true} />
                <StatsCard title="Conversion Rate" value="24%" icon={LuTarget} trend="Stable" trendUp={true} />
            </div>

            {/* Filters */}
            <Card className="mb-6 border-none shadow-sm bg-white p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[240px] relative">
                        <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by lead name or project..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                        />
                    </div>
                    <Button variant="outline" className="rounded-xl border-slate-200 h-[44px] px-6">
                        <LuFilter className="mr-2" size={16} /> Filters
                    </Button>
                </div>
            </Card>

            {/* Table */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <Table
                    columns={[
                        {
                            key: 'leadName',
                            header: 'Lead Name',
                            render: (row: SiteVisit) => (
                                <Link href={`/sales/site-visits/${row.id}`} className="flex items-center gap-3 group">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs group-hover:bg-blue-200 transition-colors">
                                        {row.leadName.charAt(0)}
                                    </div>
                                    <span className="font-semibold text-slate-800 group-hover:text-primary transition-colors">{row.leadName}</span>
                                </Link>
                            )
                        },
                        {
                            key: 'projectName',
                            header: 'Project',
                            render: (row: SiteVisit) => (
                                <Link href={`/sales/site-visits/${row.id}`} className="flex items-center gap-2 group hover:text-primary transition-colors">
                                    <LuMapPin className="text-slate-400" size={14} />
                                    <span className="text-sm text-slate-600 font-medium">{row.projectName}</span>
                                </Link>
                            )
                        },
                        {
                            key: 'visitDate',
                            header: 'Date & Time',
                            render: (row: SiteVisit) => (
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-800">{row.visitDate}</span>
                                    <span className="text-xs text-slate-500">{row.visitTime}</span>
                                </div>
                            )
                        },
                        {
                            key: 'visitorCount',
                            header: 'Visitors',
                            render: (row: SiteVisit) => <span className="text-sm font-medium text-slate-600">{row.visitorCount} Person(s)</span>
                        },
                        {
                            key: 'status',
                            header: 'Status',
                            render: (row: SiteVisit) => <StatusBadge status={row.status} />
                        },
                        {
                            key: 'assignedTo',
                            header: 'Assigned To',
                            render: (row: SiteVisit) => (
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                        {row.assignedTo.split(' ')[0][0]}
                                    </div>
                                    <span className="text-xs font-medium text-slate-600">{row.assignedTo}</span>
                                </div>
                            )
                        },
                        {
                            key: 'actions',
                            header: '',
                            render: (row: SiteVisit) => (
                                <div className="flex justify-end gap-1 pr-1">
                                    <Link href={`/sales/site-visits/${row.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                            <LuEye size={18} />
                                        </Button>
                                    </Link>
                                    <Link href={`/sales/site-visits/${row.id}/edit`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                            <LuPencil size={18} />
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600">
                                        <LuTrash2 size={18} />
                                    </Button>
                                </div>
                            )
                        }
                    ]}
                    data={paginatedVisits}
                />
                
                <div className="p-4 border-t border-slate-100">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredVisits.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={filteredVisits.length}
                        itemsPerPage={itemsPerPage}
                        label="site visits"
                    />
                </div>
            </Card>
        </CompanyAdminDashboardLayout>
    );
}
