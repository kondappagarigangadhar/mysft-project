'use client';

import React, { useState } from 'react';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import StatsCard from '@/components/ui/StatsCard';
import PageHeader from '@/components/ui/PageHeader';
import { LuBell, LuPlus, LuSearch, LuCheck, LuTriangle, LuX, LuInfo, LuSettings } from 'react-icons/lu';
import { getUserNotifications } from '@/data/mockData';
import { SmartNotificationModal } from '@/components/ai/SmartNotificationModal';
import { NotificationsAIMeta } from '@/components/ai/NotificationsAIMeta';

export default function NotificationsPage() {
    const notifications = getUserNotifications();
    const [smartOpen, setSmartOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <CompanyAdminDashboardLayout>
            <SmartNotificationModal isOpen={smartOpen} onClose={() => setSmartOpen(false)} />
            <PageHeader
                title="Notifications"
                subtitle="View system alerts, project updates, and direct mentions."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" className="border-slate-200" onClick={() => setSmartOpen(true)}>
                            Generate Smart Notification
                        </Button>
                        <Button variant="outline" className="border-slate-200">
                            <LuSettings className="mr-2" /> Notification Settings
                        </Button>
                    </div>
                }
            />

            <NotificationsAIMeta />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 mt-6">
                <StatsCard title="Unread Alerts" value={unreadCount.toString()} icon={LuBell} trend="Requires attention" />
                <StatsCard title="System Announcements" value="2" icon={LuInfo} trend="Global platform updates" />
                <StatsCard title="Action Items" value="1" icon={LuCheck} trend="Pending tasks" />
            </div>

            <Card className="p-0 overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative w-full md:max-w-xs">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-800 font-bold h-10">
                            Mark all as read
                        </Button>
                    </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {notifications.map((notification) => (
                        <div key={notification.id} className={`p-4 flex gap-4 transition-colors hover:bg-slate-50 ${!notification.read ? 'bg-blue-50/30' : 'bg-white'}`}>
                            <div className="shrink-0 mt-1">
                                {notification.type === 'Success' && <LuCheck className="text-emerald-500" size={20} />}
                                {notification.type === 'Warning' && <LuTriangle className="text-amber-500" size={20} />}
                                {notification.type === 'Error' && <LuX className="text-rose-500" size={20} />}
                                {notification.type === 'Info' && <LuInfo className="text-blue-500" size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h4 className={`text-sm truncate ${!notification.read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                                        {notification.title}
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                                        {notification.time}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 break-words mb-2">
                                    {notification.message}
                                </p>
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                    ${notification.category === 'Project' ? 'bg-indigo-100 text-indigo-700' : ''}
                                    ${notification.category === 'Finance' ? 'bg-emerald-100 text-emerald-700' : ''}
                                    ${notification.category === 'User' ? 'bg-purple-100 text-purple-700' : ''}
                                    ${notification.category === 'System' ? 'bg-slate-100 text-slate-600' : ''}
                                `}>
                                    {notification.category}
                                </span>
                            </div>
                            {!notification.read && (
                                <div className="shrink-0 flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                </div>
                            )}
                        </div>
                    ))}
                    {notifications.length === 0 && (
                        <div className="p-12 text-center">
                            <LuBell className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-800 mb-1">All caught up!</h3>
                            <p className="text-slate-500 font-medium">You don&apos;t have any new notifications.</p>
                        </div>
                    )}
                </div>
            </Card>
        </CompanyAdminDashboardLayout>
    );
}
