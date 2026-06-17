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
    LuFileCheck, LuCheck, LuDollarSign, LuTarget,
    LuEye, LuPencil, LuTrash2, LuUsers, LuX, LuCreditCard
} from 'react-icons/lu';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getBookings, Booking } from '@/data/mockData';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function BookingsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const allBookings = getBookings();

    const filteredBookings = allBookings.filter(booking => 
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.unitNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Sales', href: '/sales/bookings' },
                    { label: 'Bookings' },
                ]}
            />
            {/* Header */}
            <div className="mb-6 mt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Bookings</h1>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Manage property bookings, payments, and conversion milestones.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none rounded-xl border-slate-200 h-[42px] bg-white hover:bg-slate-50 shadow-sm">
                        <LuDownload className="mr-2" size={16} /> Export
                    </Button>
                    <Link href="/sales/bookings/create" className="flex-1 sm:flex-none">
                        <Button className="w-full rounded-xl shadow-md shadow-primary/10 h-[42px]">
                            <LuPlus className="mr-2" size={18} /> New Booking
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatsCard title="Total Bookings" value={42} icon={LuFileCheck} trend="5 from last month" trendUp={true} />
                <StatsCard title="Monthly Sales" value="â‚¹8.4 Cr" icon={LuDollarSign} trend="12% increase" trendUp={true} />
                <StatsCard title="Pending Payments" value="â‚¹1.2 Cr" icon={LuCreditCard} trend="3 overdue" trendUp={false} />
                <StatsCard title="Conversion" value="18%" icon={LuTarget} trend="Stable" trendUp={true} />
            </div>

            {/* Filters */}
            <Card className="mb-6 border-none shadow-sm bg-white p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[240px] relative">
                        <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by customer, project or unit..."
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
                            key: 'customerName',
                            header: 'Customer',
                            render: (row: Booking) => (
                                <Link href={`/sales/bookings/${row.id}`} className="flex items-center gap-3 group">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-xs text-center group-hover:bg-emerald-200 transition-colors">
                                        {row.customerName.charAt(0)}
                                    </div>
                                    <span className="font-semibold text-slate-800 group-hover:text-primary transition-colors">{row.customerName}</span>
                                </Link>
                            )
                        },
                        {
                            key: 'projectName',
                            header: 'Project / Unit',
                            render: (row: Booking) => (
                                <Link href={`/sales/bookings/${row.id}`} className="flex flex-col hover:text-primary transition-colors">
                                    <span className="text-sm text-slate-800 font-bold">{row.projectName}</span>
                                    <span className="text-xs text-slate-500">{row.unitNo} â€¢ {row.unitType}</span>
                                </Link>
                            )
                        },
                        {
                            key: 'totalAmount',
                            header: 'Inventory Value',
                            render: (row: Booking) => (
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-800">{row.totalAmount}</span>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Total Price</span>
                                </div>
                            )
                        },
                        {
                            key: 'paidAmount',
                            header: 'Collected',
                            render: (row: Booking) => (
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-emerald-600">{row.paidAmount}</span>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Paid to Date</span>
                                </div>
                            )
                        },
                        {
                            key: 'bookingDate',
                            header: 'Booking Date',
                            render: (row: Booking) => <span className="text-sm font-medium text-slate-600">{row.bookingDate}</span>
                        },
                        {
                            key: 'status',
                            header: 'Status',
                            render: (row: Booking) => <StatusBadge status={row.status} />
                        },
                        {
                            key: 'actions',
                            header: '',
                            render: (row: Booking) => (
                                <div className="flex justify-end gap-1">
                                    <Link href={`/sales/bookings/${row.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                            <LuEye size={18} />
                                        </Button>
                                    </Link>
                                    <Link href={`/sales/bookings/${row.id}/edit`}>
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
                    data={paginatedBookings}
                />
                
                <div className="p-4 border-t border-slate-100">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredBookings.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={filteredBookings.length}
                        itemsPerPage={itemsPerPage}
                        label="bookings"
                    />
                </div>
            </Card>
        </CompanyAdminDashboardLayout>
    );
}
