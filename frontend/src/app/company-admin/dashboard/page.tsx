'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import StatsCard from '@/components/ui/StatsCard';
import PageHeader from '@/components/ui/PageHeader';
import { ExecutiveDashboardAI } from '@/components/ai/ExecutiveDashboardAI';
import { 
    LuHardHat, 
    LuCheck, 
    LuPlay,
    LuUsers,
    LuCalendar,
    LuChartBar,
} from 'react-icons/lu';

export default function CompanyAdminDashboard() {
    // Mock data for company admin dashboard
    const stats = [
        {
            title: 'Active Projects',
            value: '12',
            icon: LuHardHat,
            trend: '3 starting this month',
            color: 'text-blue-600'
        },
        {
            title: 'Completed Projects',
            value: '28',
            icon: LuCheck,
            trend: '+4 this quarter',
            color: 'text-blue-600',
            trendUp: true
        },
        {
            title: 'Ongoing Tasks',
            value: '45',
            icon: LuPlay,
            trend: '8 high priority',
            color: 'text-blue-600'
        },
        {
            title: 'Total Engineers',
            value: '18',
            icon: LuUsers,
            trend: '2 new hires',
            color: 'text-blue-600'
        },
    ];

    const recentProjects = [
        {
            id: 1,
            name: 'Skyline Tower Phase 2',
            client: 'Urban Developers',
            progress: 65,
            status: 'In Progress',
            deadline: '2024-12-15',
            budget: '₹8.5Cr',
            manager: 'Rajesh Kumar'
        },
        {
            id: 2,
            name: 'Riverside Complex',
            client: 'City Builders',
            progress: 40,
            status: 'In Progress',
            deadline: '2025-03-20',
            budget: '₹12.2Cr',
            manager: 'Priya Sharma'
        },
        {
            id: 3,
            name: 'Tech Park Expansion',
            client: 'Innovation Corp',
            progress: 85,
            status: 'In Progress',
            deadline: '2024-10-30',
            budget: '₹15.8Cr',
            manager: 'Amit Patel'
        },
        {
            id: 4,
            name: 'Green Valley Residences',
            client: 'Eco Homes Ltd',
            progress: 100,
            status: 'Completed',
            deadline: '2024-06-30',
            budget: '₹6.5Cr',
            manager: 'Sneha Reddy'
        }
    ];

    const upcomingDeadlines = [
        {
            project: 'Skyline Tower Phase 2',
            task: 'Foundation Completion',
            deadline: '2024-12-15',
            priority: 'High'
        },
        {
            project: 'Riverside Complex',
            task: 'Steel Structure Installation',
            deadline: '2024-12-20',
            priority: 'High'
        },
        {
            project: 'Tech Park Expansion',
            task: 'Final Inspection',
            deadline: '2024-12-30',
            priority: 'Medium'
        }
    ];

    return (
        <div>
            <PageHeader
                title="mySFT Dashboard"
                subtitle="Complete overview of your construction company operations"
                actions={
                    <Link href="/projects-inventory/analytics" className="inline-flex">
                        <Button type="button" variant="company" size="cta">
                            <LuChartBar className="mr-2 shrink-0" /> Analytics
                        </Button>
                    </Link>
                }
            />

            <ExecutiveDashboardAI />
        </div>
    );
}
