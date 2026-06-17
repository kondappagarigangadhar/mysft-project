'use client';

import React, { useState } from 'react';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    LuArrowLeft,
    LuSave,
    LuX,
    LuUsers,
    LuCalendarDays,
    LuClock,
    LuMapPin,
    LuUser,
    LuMessageSquare
} from 'react-icons/lu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateSiteVisitPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            router.push('/sales/site-visits');
        }, 800);
    };

    return (
        <CompanyAdminDashboardLayout>
            <div className="mb-6 mt-4">
                <Link
                    href="/sales/site-visits"
                    className="flex items-center text-sm text-slate-500 hover:text-primary transition-colors mb-4 group"
                >
                    <LuArrowLeft
                        className="mr-2 group-hover:-translate-x-1 transition-transform"
                        size={16}
                    />{' '}
                    Back to Site Visits
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Schedule Site Visit
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Create a new property site visit for a lead.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Visit Details */}
                        <Card className="border-none shadow-sm">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                                <LuCalendarDays className="text-primary" size={20} />
                                <h2 className="text-lg font-bold text-slate-800">Visit Details</h2>
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
                                            placeholder="Search or enter lead name"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                        />
                                    </div>
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
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Visit Date *
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
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Visit Time *
                                        </label>
                                        <div className="relative">
                                            <LuClock
                                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                                size={16}
                                            />
                                            <input
                                                required
                                                type="time"
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Number of Visitors
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={10}
                                            defaultValue={2}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Visit Status
                                        </label>
                                        <select
                                            defaultValue="Scheduled"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                        >
                                            <option value="Scheduled">Scheduled</option>
                                            <option value="Pending">Pending Confirmation</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Assignment */}
                        <Card className="border-none shadow-sm">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                                <LuUsers className="text-primary" size={20} />
                                <h2 className="text-lg font-bold text-slate-800">Assignment</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Assigned To
                                    </label>
                                    <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]">
                                        <option value="">Select Sales Executive</option>
                                        <option value="Amit Sales">Amit Sales</option>
                                        <option value="Priya Reddy">Priya Reddy</option>
                                        <option value="Vikram Singh">Vikram Singh</option>
                                        <option value="Sneha Reddy">Sneha Reddy</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Primary Contact on Site
                                    </label>
                                    <div className="relative">
                                        <LuUser
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            size={16}
                                        />
                                        <input
                                            type="text"
                                            placeholder="e.g. Site incharge / CRM"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Notes */}
                        <Card className="border-none shadow-sm">
                            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                                <LuMessageSquare className="text-primary" size={18} />
                                <h2 className="text-sm font-bold text-slate-800">Visit Notes</h2>
                            </div>
                            <div className="p-4">
                                <textarea
                                    rows={4}
                                    placeholder="Special instructions, customer expectations, parking details, etc..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm resize-none"
                                />
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
                                {isSubmitting ? 'Scheduling...' : 'Schedule Visit'}
                            </Button>
                            <Link href="/sales/site-visits" className="w-full">
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

