'use client';

import type { ReactNode } from 'react';
import {
    LuLayoutDashboard,
    LuHouse,
    LuWrench,
    LuCreditCard,
    LuUsers,
    LuDumbbell,
    LuBell,
    LuFileText,
    LuCircleUser,
    LuLifeBuoy,
} from 'react-icons/lu';

export type ResidentNavItem = {
    key: string;
    label: string;
    href: string;
    icon: ReactNode;
};

export const RESIDENT_NAV: ResidentNavItem[] = [
    { key: 'dashboard', label: 'Dashboard', href: '/resident/dashboard', icon: <LuLayoutDashboard className="h-[18px] w-[18px]" /> },
    { key: 'unit', label: 'My Unit', href: '/resident/unit', icon: <LuHouse className="h-[18px] w-[18px]" /> },
    { key: 'maintenance', label: 'Maintenance Requests', href: '/resident/maintenance', icon: <LuWrench className="h-[18px] w-[18px]" /> },
    { key: 'billing', label: 'Billing & Payments', href: '/resident/billing', icon: <LuCreditCard className="h-[18px] w-[18px]" /> },
    { key: 'visitors', label: 'Visitors', href: '/resident/visitors', icon: <LuUsers className="h-[18px] w-[18px]" /> },
    { key: 'amenities', label: 'Amenities', href: '/resident/amenities', icon: <LuDumbbell className="h-[18px] w-[18px]" /> },
    { key: 'notices', label: 'Community Notices', href: '/resident/notices', icon: <LuBell className="h-[18px] w-[18px]" /> },
    { key: 'documents', label: 'Documents', href: '/resident/documents', icon: <LuFileText className="h-[18px] w-[18px]" /> },
    { key: 'profile', label: 'Profile & Security', href: '/resident/profile', icon: <LuCircleUser className="h-[18px] w-[18px]" /> },
    { key: 'support', label: 'Support', href: '/resident/support', icon: <LuLifeBuoy className="h-[18px] w-[18px]" /> },
];

