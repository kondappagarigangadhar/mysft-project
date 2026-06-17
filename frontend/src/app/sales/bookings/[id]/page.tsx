'use client';

import React, { useState } from 'react';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    LuSave,
    LuX,
    LuUsers,
    LuCalendarDays,
    LuDollarSign,
    LuMapPin
} from 'react-icons/lu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function CreateBookingPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            router.push('/sales/bookings');
        }, 800);
    };

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Sales', href: '/sales/bookings' },
                    { label: 'Bookings', href: '/sales/bookings' },
                    { label: 'New Booking' },
                ]}
                className="mt-4 mb-4"
            />
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        New Booking
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Capture a confirmed unit booking for a customer.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer & Unit */}
                        <Card className="border-none shadow-sm">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                                <LuUsers className="text-primary" size={20} />
                                <h2 className="text-lg font-bold text-slate-800">
                                    Customer & Unit Details
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Lead Name *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Customer full name"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Phone Number *
                                        </label>
                                        <input
                                            required
                                            type="tel"
                                            placeholder="+91 XXXXX XXXXX"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Project Name *
                                        </label>
                                        <div className="relative">
                                            <LuMapPin
                                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                                size={16}
                                            />
                                            <input
                                                required
                                                type="text"
                                                placeholder="Select project"
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Unit Number *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="e.g. A-402"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Configuration (BHK / layout) *
                                        </label>
                                        <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]">
                                            <option value="">Select configuration</option>
                                            <option value="Studio">Studio</option>
                                            <option value="1 BHK">1 BHK</option>
                                            <option value="2 BHK">2 BHK</option>
                                            <option value="3 BHK">3 BHK</option>
                                            <option value="4 BHK">4 BHK</option>
                                            <option value="Penthouse">Penthouse</option>
                                            <option value="Duplex">Duplex</option>
                                            <option value="Villa">Villa</option>
                                            <option value="Plot">Plot</option>
                                            <option value="Commercial">Commercial</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Booking Date *
                                        </label>
                                        <div className="relative">
                                            <LuCalendarDays
                                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                                size={16}
                                            />
                                            <input
                                                required
                                                type="date"
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Value & Payments */}
                        <Card className="border-none shadow-sm">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                                <LuDollarSign className="text-primary" size={20} />
                                <h2 className="text-lg font-bold text-slate-800">Value & Payments</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Total Agreement Value *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="e.g. â‚¹1.2 Cr"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Amount Collected
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. â‚¹25L"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Status */}
                        <Card className="border-none shadow-sm">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                                <LuUsers className="text-primary" size={20} />
                                <h2 className="text-lg font-bold text-slate-800">Status</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Booking Status
                                    </label>
                                    <select
                                        defaultValue="Booked"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                    >
                                        <option value="Booked">Booked</option>
                                        <option value="Negotiation">Negotiation</option>
                                        <option value="Closed">Closed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                        </Card>

                        {/* Form Actions */}
                        <div className="flex flex-col gap-3">
                            <Button
                                type="submit"
                                className="w-full rounded-xl shadow-lg shadow-primary/20 h-[50px] text-md font-bold"
                                disabled={isSubmitting}
                            >
                                <LuSave className="mr-2" size={20} />{' '}
                                {isSubmitting ? 'Saving...' : 'Create Booking'}
                            </Button>
                            <Link href="/sales/bookings" className="w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full rounded-xl border-slate-200 h-[50px] text-slate-600 font-bold"
                                >
                                    <LuX className="mr-2" size={20} /> Cancel
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </CompanyAdminDashboardLayout>
    );
}

