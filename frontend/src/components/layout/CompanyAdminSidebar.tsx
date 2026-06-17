'use client';

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';
import type { HistoryModule } from '@/lib/historyLogs/types';
import {
    LuLayoutDashboard,
    LuBuilding2,
    LuUsers,
    LuShield,
    LuFolderKanban,
    LuTruck,
    LuPackage,
    LuFileText,
    LuReceipt,
    LuFolderOpen,
    LuChartBar,
    LuBell,
    LuSettings,
    LuCircleUser,
    LuLogOut,
    LuChevronLeft,
    LuChevronDown,
    LuBuilding,
    LuHistory,
    LuCog,
    LuFileLock2,
    LuLayoutGrid,
    LuFolderTree,
    LuBriefcase,
    LuWallet,
    LuCreditCard,
    LuTarget,
    LuCalendarDays,
    LuUserPlus,
    LuPlus,
    LuShoppingCart,
    LuFolder,
    LuMessageSquare,
    LuUser,
    LuSparkles,
    LuBrain,
    LuChartColumn,
    LuMap,
    LuDollarSign,
    LuIndianRupee,
    LuLink,
    LuCalendarCheck,
    LuClipboardList,
    LuPenLine,
    LuTrash2,
    LuArchive,
    LuUpload,
    LuShieldCheck,
    LuGrid3X3,
    LuHouse,
    LuWrench,
} from 'react-icons/lu';
import { FOOTER_POWERED_BY, LOGO_FULL_SRC, LOGO_ICON_SRC, PRODUCT_NAME } from '@/lib/branding';
import { cn } from '@/lib/utils';

/** Match main Sidebar behavior: avoid marking parent + child active for the same prefix. */
function navItemIsActive(pathname: string, itemPath: string): boolean {
    if (itemPath === '/company-admin/ai-command-center') {
        return pathname === '/company-admin/ai-command-center' || pathname.startsWith('/company-admin/ai-command-center/');
    }
    if (itemPath.startsWith('/company-admin/ai-command-center#')) {
        return pathname === '/company-admin/ai-command-center';
    }
    if (itemPath === '/leads') {
        return pathname === '/leads' || pathname === '/leads/';
    }
    /** Create pages — highlight only the matching “Create …” item. */
    if (itemPath === '/leads/create') {
        return pathname === '/leads/create' || pathname.startsWith('/leads/create/') || pathname === '/leads/view/new';
    }
    if (itemPath === '/leads/archived') {
        return pathname === '/leads/archived' || pathname === '/leads/archived/';
    }
    if (itemPath === '/projects-inventory/projects') {
        if (pathname.startsWith('/projects-inventory/projects/create')) return false;
        return (
            pathname === '/projects-inventory/projects' ||
            pathname === '/projects-inventory/projects/' ||
            pathname.startsWith('/projects-inventory/projects/')
        );
    }
    if (itemPath === '/projects-inventory/projects/create') {
        return pathname === '/projects-inventory/projects/create' || pathname === '/projects-inventory/projects/view/new';
    }
    if (itemPath === '/projects-inventory/inventory') {
        if (pathname.startsWith('/projects-inventory/inventory/create')) return false;
        return (
            pathname === '/projects-inventory/inventory' ||
            pathname === '/projects-inventory/inventory/' ||
            pathname.startsWith('/projects-inventory/inventory/')
        );
    }
    if (itemPath === '/projects-inventory/inventory/create') {
        return pathname === '/projects-inventory/inventory/create';
    }
    if (itemPath === '/company-admin/booking-payment/booking') {
        if (pathname.startsWith('/company-admin/booking-payment/booking/create')) return false;
        return (
            pathname === '/company-admin/booking-payment/booking' ||
            pathname === '/company-admin/booking-payment/booking/' ||
            pathname.startsWith('/company-admin/booking-payment/booking/')
        );
    }
    if (itemPath === '/company-admin/booking-payment/booking/create') {
        return pathname === '/company-admin/booking-payment/booking/create';
    }
    if (itemPath === '/company-admin/booking-payment/payments') {
        if (pathname.startsWith('/company-admin/booking-payment/payments/add')) return false;
        return (
            pathname === '/company-admin/booking-payment/payments' ||
            pathname === '/company-admin/booking-payment/payments/' ||
            pathname.startsWith('/company-admin/booking-payment/payments/')
        );
    }
    if (itemPath === '/company-admin/booking-payment/payments/add') {
        return pathname.startsWith('/company-admin/booking-payment/payments/add');
    }
    if (itemPath === '/company-admin/booking-payment/payment-links') {
        if (pathname.startsWith('/company-admin/booking-payment/payment-links/add')) return false;
        if (pathname.startsWith('/company-admin/booking-payment/payment-links/form')) return false;
        return (
            pathname === '/company-admin/booking-payment/payment-links' ||
            pathname === '/company-admin/booking-payment/payment-links/' ||
            pathname.startsWith('/company-admin/booking-payment/payment-links/')
        );
    }
    if (itemPath === '/company-admin/booking-payment/ai') {
        return pathname === '/company-admin/booking-payment/ai' || pathname.startsWith('/company-admin/booking-payment/ai/');
    }
    if (itemPath === '/company-admin/booking-payment/reports') {
        return pathname === '/company-admin/booking-payment/reports' || pathname.startsWith('/company-admin/booking-payment/reports/');
    }
    if (itemPath === '/company-admin/booking-payment/system') {
        return pathname === '/company-admin/booking-payment/system' || pathname.startsWith('/company-admin/booking-payment/system/');
    }
    if (itemPath === '/leads/intelligence') {
        return pathname === '/leads/intelligence' || pathname.startsWith('/leads/intelligence/');
    }
    if (itemPath === '/leads/ai-sales-intelligence') {
        return pathname === '/leads/ai-sales-intelligence' || pathname.startsWith('/leads/ai-sales-intelligence/');
    }
    if (itemPath === '/leads/revenue-intelligence') {
        return pathname === '/leads/revenue-intelligence' || pathname.startsWith('/leads/revenue-intelligence/');
    }
    if (itemPath === '/demand-intelligence') {
        return pathname === '/demand-intelligence' || pathname.startsWith('/demand-intelligence/');
    }
    if (itemPath === '/projects-inventory/ai-insights') {
        return pathname === '/projects-inventory/ai-insights' || pathname.startsWith('/projects-inventory/ai-insights/');
    }
    if (itemPath === '/procurement/vendor-compliance-intelligence') {
        return (
            pathname === '/procurement/vendor-compliance-intelligence' ||
            pathname.startsWith('/procurement/vendor-compliance-intelligence/')
        );
    }
    if (itemPath === '/procurement/invoice-intelligence') {
        return (
            pathname === '/procurement/invoice-intelligence' ||
            pathname.startsWith('/procurement/invoice-intelligence/')
        );
    }
    if (itemPath === '/leads/analytics') {
        return pathname === '/leads/analytics' || pathname.startsWith('/leads/analytics/');
    }
    if (itemPath === '/platform/customers') {
        if (pathname.startsWith('/platform/customers/create')) return false;
        if (pathname.startsWith('/platform/customers/view/new')) return false;
        return (
            pathname === '/platform/customers' ||
            pathname === '/platform/customers/' ||
            pathname.startsWith('/platform/customers/view/')
        );
    }
    if (itemPath === '/platform/customers/view/new') {
        const base = pathname.split('?')[0] ?? pathname;
        return base === '/platform/customers/view/new';
    }
    if (itemPath === '/platform/customers/create') {
        return pathname === '/platform/customers/create' || pathname.startsWith('/platform/customers/create/') || pathname === '/platform/customers/view/new';
    }
    if (itemPath === '/company-admin/vendors') {
        if (pathname.startsWith('/company-admin/vendors/create')) return false;
        if (pathname.startsWith('/company-admin/vendors/compliance')) return false;
        if (pathname.startsWith('/company-admin/vendors/contracts')) return false;
        if (pathname.startsWith('/company-admin/vendors/performance')) return false;
        if (pathname.startsWith('/company-admin/vendors/alerts')) return false;
        if (pathname.startsWith('/company-admin/vendors/invoices')) return false;
        return pathname === '/company-admin/vendors' || pathname === '/company-admin/vendors/' || pathname.startsWith('/company-admin/vendors/');
    }
    if (itemPath === '/company-admin/vendors/create') {
        return pathname.startsWith('/company-admin/vendors/create');
    }
    if (itemPath === '/company-admin/vendors/compliance') {
        return pathname === '/company-admin/vendors/compliance' || pathname.startsWith('/company-admin/vendors/compliance/');
    }
    if (itemPath === '/company-admin/vendors/contracts') {
        return pathname === '/company-admin/vendors/contracts' || pathname.startsWith('/company-admin/vendors/contracts/');
    }
    if (itemPath === '/company-admin/vendors/performance') {
        return pathname === '/company-admin/vendors/performance' || pathname.startsWith('/company-admin/vendors/performance/');
    }
    if (itemPath === '/company-admin/vendors/alerts') {
        return pathname === '/company-admin/vendors/alerts' || pathname.startsWith('/company-admin/vendors/alerts/');
    }
    if (itemPath === '/company-admin/vendors/invoices') {
        return pathname === '/company-admin/vendors/invoices' || pathname.startsWith('/company-admin/vendors/invoices/');
    }
    if (itemPath === '/company-admin/suppliers') {
        if (pathname.startsWith('/company-admin/suppliers/create')) return false;
        return (
            pathname === '/company-admin/suppliers' ||
            pathname === '/company-admin/suppliers/' ||
            pathname.startsWith('/company-admin/suppliers/')
        );
    }
    if (itemPath === '/company-admin/suppliers/create') {
        return pathname.startsWith('/company-admin/suppliers/create');
    }
    /** Main documents hub — do not mark active on /esign, /audit, /deleted, /contract-intelligence. */
    if (itemPath === '/company-admin/documents-compliance') {
        return pathname === '/company-admin/documents-compliance' || pathname === '/company-admin/documents-compliance/';
    }
    if (itemPath === '/company-admin/documents-compliance/contract-intelligence') {
        return (
            pathname === '/company-admin/documents-compliance/contract-intelligence' ||
            pathname.startsWith('/company-admin/documents-compliance/contract-intelligence/')
        );
    }
    if (itemPath === '/company-admin/history-logs') {
        return pathname === '/company-admin/history-logs' || pathname === '/company-admin/history-logs/';
    }
    if (itemPath === '/platform/tenants') {
        if (pathname.startsWith('/platform/tenants/drafts')) return false;
        if (pathname.startsWith('/platform/tenants/view/new')) return false;
        return (
            pathname === '/platform/tenants' ||
            pathname === '/platform/tenants/' ||
            pathname.startsWith('/platform/tenants/view/')
        );
    }
    if (itemPath === '/platform/tenants/view/new') {
        const base = pathname.split('?')[0] ?? pathname;
        return base === '/platform/tenants/view/new';
    }
    if (itemPath === '/platform/tenants/drafts') {
        return pathname === '/platform/tenants/drafts' || pathname === '/platform/tenants/drafts/';
    }
    if (itemPath === '/platform/users') {
        if (pathname.startsWith('/platform/users/drafts')) return false;
        if (pathname.startsWith('/platform/users/view/new')) return false;
        return (
            pathname === '/platform/users' ||
            pathname === '/platform/users/' ||
            pathname.startsWith('/platform/users/view/')
        );
    }
    if (itemPath === '/platform/users/view/new') {
        const base = pathname.split('?')[0] ?? pathname;
        return base === '/platform/users/view/new';
    }
    if (itemPath === '/platform/users/drafts') {
        return pathname === '/platform/users/drafts' || pathname === '/platform/users/drafts/';
    }
    if (itemPath === '/platform/access-matrix') {
        return pathname === '/platform/access-matrix' || pathname === '/platform/access-matrix/';
    }
    if (itemPath === '/platform/community/residents/intelligence') {
        return (
            pathname === '/platform/community/residents/intelligence' ||
            pathname.startsWith('/platform/community/residents/intelligence/')
        );
    }
    if (itemPath === '/platform/community/residents') {
        if (
            pathname === '/platform/community/residents/intelligence' ||
            pathname.startsWith('/platform/community/residents/intelligence/')
        ) {
            return false;
        }
        return (
            pathname === '/platform/community/residents' ||
            pathname === '/platform/community/residents/' ||
            pathname.startsWith('/platform/community/residents/')
        );
    }
    if (itemPath === '/platform/community/service-maintenance') {
        return (
            pathname === '/platform/community/service-maintenance' ||
            pathname === '/platform/community/service-maintenance/' ||
            pathname.startsWith('/platform/community/service-maintenance/')
        );
    }
    if (itemPath === '/company-admin/platform-foundation') {
        return (
            pathname === '/company-admin/platform-foundation' ||
            pathname.startsWith('/company-admin/platform-foundation/')
        );
    }
    if (itemPath === '/settings/theme') {
        return pathname === '/settings/theme' || pathname === '/settings/theme/';
    }
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function isHistoryPath(pathname: string): boolean {
    return pathname === '/company-admin/history-logs' || pathname === '/company-admin/history-logs/';
}

function hubRowActiveOnHistoryModule(
    pathname: string,
    searchParams: ReadonlyURLSearchParams,
    mod: HistoryModule
): boolean {
    return isHistoryPath(pathname) && searchParams.get('module') === mod;
}

/** Flyout sub-item active: supports module-scoped history links (`?module=...`). */
function flyoutEntryIsActive(
    pathname: string,
    searchParams: ReadonlyURLSearchParams,
    entry: SidebarNavFlyoutEntry
): boolean {
    if (entry.historyModule) {
        return isHistoryPath(pathname) && searchParams.get('module') === entry.historyModule;
    }
    const dest = entry.linkHref?.trim() || entry.path;
    if (dest.includes('?')) return false;
    if (entry.path === '/company-admin/vendors/list') {
        return (
            pathname === '/company-admin/vendors' ||
            pathname === '/company-admin/vendors/' ||
            navItemIsActive(pathname, '/company-admin/vendors/list')
        );
    }
    if (entry.path === '/company-admin/suppliers/list') {
        return (
            pathname === '/company-admin/suppliers' ||
            pathname === '/company-admin/suppliers/' ||
            navItemIsActive(pathname, '/company-admin/suppliers/list')
        );
    }
    return navItemIsActive(pathname, entry.path);
}

type SidebarNavFlyoutEntry = {
    title: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    linkHref?: string;
    replaceLink?: boolean;
    /** When set, active on `/company-admin/history-logs?module=…`. */
    historyModule?: HistoryModule;
};

/** Curved branch (vertical + rounded elbow) — reads as child of the row above. */
function ChildTreeMarker() {
    return (
        <span className="flex h-7 w-5 shrink-0 items-center justify-end pr-0.5" aria-hidden>
            <svg width="15" height="15" viewBox="0 0 15 15" className="text-white/25">
                <path
                    d="M1.25 0.75V7.5q0 1.75 1.75 1.75h10.75"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.35"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
}

const LEADS_HUB_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create Lead', path: '/leads/create', linkHref: '/leads/view/new', icon: LuPlus },
    { title: 'Import Leads', path: '/leads?import=1', icon: LuUpload },
    { title: 'Lead Drafts', path: '/leads/drafts', icon: LuFileText },
    { title: 'Archived Leads', path: '/leads/archived', icon: LuArchive },
    {
        title: 'Leads history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=leads',
        icon: LuHistory,
        historyModule: 'leads',
    },
];

const CUSTOMERS_HUB_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Add Customer', path: '/platform/customers/create', linkHref: '/platform/customers/view/new', icon: LuPlus },
    { title: 'Import Customers', path: '/platform/customers?import=1', icon: LuUpload },
    {
        title: 'Customer & Buyer history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=customers',
        icon: LuHistory,
        historyModule: 'customers',
    },
];

const LEADS_SUBMENU_CLOSE_MS = 150;

const PROJECT_SETUP_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create project', path: '/projects-inventory/projects/create', linkHref: '/projects-inventory/projects/view/new', icon: LuPlus },
    { title: 'Project Drafts', path: '/projects-inventory/projects/drafts', icon: LuFileText },
    {
        title: 'Projects history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=projects',
        icon: LuHistory,
        historyModule: 'projects',
    },
];

const INVENTORY_HUB_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Add inventory unit', path: '/projects-inventory/inventory/create', icon: LuPlus },
    {
        title: 'Inventory history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=inventory',
        icon: LuHistory,
        historyModule: 'inventory',
    },
];

const BOOKING_HUB_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create booking', path: '/company-admin/booking-payment/booking/create', icon: LuPlus },
    { title: 'Booking Drafts', path: '/company-admin/booking-payment/booking/drafts', icon: LuFileText },
    {
        title: 'Bookings history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=bookings',
        icon: LuHistory,
        historyModule: 'bookings',
    },
];

const PAYMENTS_HUB_FLYOUT: SidebarNavFlyoutEntry[] = [
    {
        title: 'Add payment',
        path: '/company-admin/booking-payment/payments/add',
        linkHref: `/company-admin/booking-payment/payments/add?returnTo=${encodeURIComponent('/company-admin/booking-payment/payments')}`,
        icon: LuPlus,
    },
    {
        title: 'Payments history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=payments',
        icon: LuHistory,
        historyModule: 'payments',
    },
];

const PAYMENT_LINKS_HUB_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create new link', path: '/company-admin/booking-payment/payment-links/add', icon: LuPlus },
    { title: 'Links list', path: '/company-admin/booking-payment/payment-links', icon: LuLink },
    {
        title: 'Payments history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=payments',
        icon: LuHistory,
        historyModule: 'payments',
    },
];

const DOCUMENTS_HUB_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Add document', path: '/company-admin/documents-compliance/view/new', icon: LuUpload },
    {
        title: 'Documents history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=documents',
        icon: LuHistory,
        historyModule: 'documents',
    },
];

const ESIGN_HUB_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'New eSign request', path: '/company-admin/documents-compliance/esign/new', icon: LuPlus },
    { title: 'eSign requests', path: '/company-admin/documents-compliance/esign', icon: LuPenLine },
    {
        title: 'Documents history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=documents',
        icon: LuHistory,
        historyModule: 'documents',
    },
];

/** Platform Foundation → Tenants: list row + flyout (create + drafts). */
const PLATFORM_TENANTS_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create tenant', path: '/platform/tenants/view/new', icon: LuPlus },
    { title: 'Tenant drafts', path: '/platform/tenants/drafts', icon: LuFileText },
];

/** Platform Foundation → Users: list row + flyout (create + drafts). */
const PLATFORM_USERS_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create user', path: '/platform/users/view/new', icon: LuPlus },
    { title: 'User drafts', path: '/platform/users/drafts', icon: LuFileText },
];

function tenantsHubRowIsActive(pathname: string, _searchParams: ReadonlyURLSearchParams): boolean {
    if (navItemIsActive(pathname, '/platform/tenants/drafts')) return true;
    if (navItemIsActive(pathname, '/platform/tenants/view/new')) return true;
    if (navItemIsActive(pathname, '/platform/tenants')) return true;
    return false;
}

function usersHubRowIsActive(pathname: string, _searchParams: ReadonlyURLSearchParams): boolean {
    if (navItemIsActive(pathname, '/platform/users/drafts')) return true;
    if (navItemIsActive(pathname, '/platform/users/view/new')) return true;
    if (navItemIsActive(pathname, '/platform/users')) return true;
    return false;
}

/** Procurement → Vendor management: main row + right flyout (same pattern as Booking / Payments). */
const VENDOR_MANAGEMENT_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create vendor', path: '/company-admin/vendors/create', icon: LuPlus },
    { title: 'Vendor list', path: '/company-admin/vendors/list', icon: LuUsers },
    { title: 'Vendor invoices', path: '/company-admin/vendors/invoices', icon: LuReceipt },
    { title: 'Vendor compliance', path: '/company-admin/vendors/compliance', icon: LuShieldCheck },
    { title: 'Vendor contracts', path: '/company-admin/vendors/contracts', icon: LuFileText },
    { title: 'Vendor performance', path: '/company-admin/vendors/performance', icon: LuChartBar },
    { title: 'Vendor alerts center', path: '/company-admin/vendors/alerts', icon: LuBell },
    {
        title: 'Vendors history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=vendors',
        icon: LuHistory,
        historyModule: 'vendors',
    },
];

/** Vendors list row: keep hover flyout minimal (create + history). */
const VENDORS_LIST_QUICK_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create vendor', path: '/company-admin/vendors/create', icon: LuPlus },
    {
        title: 'Vendors history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=vendors',
        icon: LuHistory,
        historyModule: 'vendors',
    },
];

const SUPPLIER_MANAGEMENT_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create supplier', path: '/company-admin/suppliers/create', icon: LuPlus },
    { title: 'Supplier list', path: '/company-admin/suppliers/list', icon: LuUsers },
    {
        title: 'Suppliers history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=suppliers',
        icon: LuHistory,
        historyModule: 'suppliers',
    },
];

/** Suppliers list row: keep hover flyout minimal (create + history). */
const SUPPLIERS_LIST_QUICK_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create supplier', path: '/company-admin/suppliers/create', icon: LuPlus },
    {
        title: 'Suppliers history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=suppliers',
        icon: LuHistory,
        historyModule: 'suppliers',
    },
];

/** Vendor management → Vendor Assignments: main row + flyout (create + drafts). */
const WORK_ORDERS_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create vendor assignment', path: '/work-orders/view/new', icon: LuPlus },
    { title: 'Vendor assignment drafts', path: '/work-orders/drafts', icon: LuFileText },
    {
        title: 'Vendor assignments history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=work_orders',
        icon: LuHistory,
        historyModule: 'work_orders',
    },
];

/** Procurement → Purchase Requests (Step 1). */
const PURCHASE_REQUESTS_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create request', path: '/procurement/requests/view/new', icon: LuPlus },
    {
        title: 'Purchase requests history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=purchase_requests',
        icon: LuHistory,
        historyModule: 'purchase_requests',
    },
];

/** Procurement → Purchase Orders. */
const PURCHASE_ORDERS_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create purchase order', path: '/procurement/purchase-orders/view/new', icon: LuPlus },
    {
        title: 'Purchase orders history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=purchase_orders',
        icon: LuHistory,
        historyModule: 'purchase_orders',
    },
];

function purchaseRequestsHubRowIsActive(pathname: string, searchParams: ReadonlyURLSearchParams): boolean {
    if (hubRowActiveOnHistoryModule(pathname, searchParams, 'purchase_requests')) return true;
    if (pathname === '/procurement/requests' || pathname === '/procurement/requests/') return true;
    if (pathname.startsWith('/procurement/requests/')) return true;
    return false;
}

function purchaseOrdersHubRowIsActive(pathname: string, searchParams: ReadonlyURLSearchParams): boolean {
    if (hubRowActiveOnHistoryModule(pathname, searchParams, 'purchase_orders')) return true;
    if (pathname === '/procurement/purchase-orders' || pathname === '/procurement/purchase-orders/') return true;
    if (pathname.startsWith('/procurement/purchase-orders/')) return true;
    return false;
}

/** Any route under `/work-orders` (highlights Work orders hub row + flyout targets). */
function workOrdersHubRowIsActive(pathname: string, searchParams: ReadonlyURLSearchParams): boolean {
    if (hubRowActiveOnHistoryModule(pathname, searchParams, 'work_orders')) return true;
    if (pathname === '/work-orders' || pathname === '/work-orders/') return true;
    if (pathname.startsWith('/work-orders/')) return true;
    return false;
}

/** Procurement → Invoice & Payments: main row + flyout (create + drafts + history). */
const INVOICES_FLYOUT: SidebarNavFlyoutEntry[] = [
    { title: 'Create invoice', path: '/company-admin/invoices/view/new', icon: LuPlus },
    { title: 'Invoice drafts', path: '/company-admin/invoices/drafts', icon: LuFileText },
    {
        title: 'Invoice history',
        path: '/company-admin/history-logs',
        linkHref: '/company-admin/history-logs?module=invoices',
        icon: LuHistory,
        historyModule: 'invoices',
    },
];

/** Any route under `/company-admin/invoices` (highlights Invoice & Payments hub row + flyout targets). */
function invoicesHubRowIsActive(pathname: string, searchParams: ReadonlyURLSearchParams): boolean {
    if (hubRowActiveOnHistoryModule(pathname, searchParams, 'invoices')) return true;
    if (pathname === '/company-admin/invoices' || pathname === '/company-admin/invoices/') return true;
    if (pathname.startsWith('/company-admin/invoices/')) return true;
    return false;
}

/** Space between sidebar edge and popover card (px). */
const SIDEBAR_FLYOUT_GAP_PX = 10;
/** Invisible padding toward the sidebar so the pointer can cross the gap without closing the menu. */
const SIDEBAR_FLYOUT_BRIDGE_PX = 18;
/** Approximate flyout row height when panel not measured yet (px). */
const SIDEBAR_FLYOUT_ROW_APPROX_PX = 44;
const SIDEBAR_FLYOUT_VIEWPORT_MARGIN_PX = 18;

function useIsLgViewport() {
    const [lg, setLg] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const apply = () => setLg(mq.matches);
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);
    return lg;
}

/** Leads hub row: highlights for list, flyout targets, and lead detail routes (not intelligence/analytics). */
function leadsHubRowIsActive(pathname: string, searchParams: ReadonlyURLSearchParams): boolean {
    if (hubRowActiveOnHistoryModule(pathname, searchParams, 'leads')) return true;
    if (navItemIsActive(pathname, '/leads/create')) return true;
    if (navItemIsActive(pathname, '/leads/archived')) return true;
    if (navItemIsActive(pathname, '/leads')) return true;
    if (!pathname.startsWith('/leads/')) return false;
    if (pathname.startsWith('/leads/intelligence')) return false;
    if (pathname.startsWith('/leads/ai-sales-intelligence')) return false;
    if (pathname.startsWith('/leads/revenue-intelligence')) return false;
    if (pathname.startsWith('/leads/analytics')) return false;
    return true;
}

/** Inline accordion: Leads + children inside the sidebar rail (no portaled flyout). */
function LeadsInlineNavRow({
    pathname,
    isCollapsed,
    onMobileNav,
    Icon,
    flyoutEntries,
}: {
    pathname: string;
    isCollapsed: boolean;
    onMobileNav: () => void;
    Icon: React.ComponentType<{ className?: string }>;
    flyoutEntries: readonly SidebarNavFlyoutEntry[];
}) {
    const isLg = useIsLgViewport();
    const [mobileExpanded, setMobileExpanded] = useState(false);
    const [desktopHover, setDesktopHover] = useState(false);
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchParams = useSearchParams();

    const isActive = leadsHubRowIsActive(pathname, searchParams);
    const listExact = navItemIsActive(pathname, '/leads');

    const clearLeaveTimer = () => {
        if (leaveTimer.current) {
            clearTimeout(leaveTimer.current);
            leaveTimer.current = null;
        }
    };

    const submenuOpen = isLg ? desktopHover : mobileExpanded;
    const parentLit = isActive || submenuOpen;

    useEffect(() => {
        return () => clearLeaveTimer();
    }, []);

    useEffect(() => {
        setMobileExpanded(false);
    }, [pathname]);

    useEffect(() => {
        if (isLg) return;
        const onChild =
            navItemIsActive(pathname, '/leads/create') ||
            navItemIsActive(pathname, '/leads/archived') ||
            (isHistoryPath(pathname) && searchParams.get('module') === 'leads');
        if (onChild) setMobileExpanded(true);
    }, [pathname, isLg, searchParams]);

    const onWrapperMouseEnter = () => {
        if (!isLg) return;
        clearLeaveTimer();
        setDesktopHover(true);
    };

    const onWrapperMouseLeave = () => {
        if (!isLg) return;
        clearLeaveTimer();
        leaveTimer.current = setTimeout(() => setDesktopHover(false), LEADS_SUBMENU_CLOSE_MS);
    };

    return (
        <div className="relative" onMouseEnter={onWrapperMouseEnter} onMouseLeave={onWrapperMouseLeave}>
                <div
                className={cn(
                    'flex items-center rounded-lg transition-[background-color,box-shadow] duration-200 ease-out',
                    parentLit ? 'shadow-sm ring-1 ring-white/20' : 'bg-transparent hover:bg-white/10',
                )}
                style={parentLit ? { backgroundColor: 'var(--sidebar-active)', color: 'var(--sidebar-text)' } : undefined}
            >
                <Link
                    href="/leads"
                    aria-current={listExact ? 'page' : undefined}
                    onClick={() => {
                        if (window.innerWidth < 1024) onMobileNav();
                    }}
                    className={cn(
                        'group flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-[14.5px] font-normal leading-snug antialiased transition-all duration-200 sm:text-[15px]',
                        isCollapsed ? 'justify-center px-1.5' : 'px-3',
                        parentLit ? 'font-semibold text-current' : 'text-current opacity-80 hover:opacity-100'
                    )}
                >
                    <Icon
                        className={cn(
                            'h-5 w-5 shrink-0',
                            parentLit ? 'text-current' : 'text-slate-300 group-hover:text-white'
                        )}
                    />
                    {!isCollapsed && (
                        <span className="min-w-0 flex-1 whitespace-normal wrap-break-word leading-snug">Leads</span>
                    )}
                </Link>
                {!isCollapsed && (
                    <button
                        type="button"
                        aria-expanded={submenuOpen}
                        aria-label={submenuOpen ? 'Collapse Leads submenu' : 'Expand Leads submenu'}
                        className="mr-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-current opacity-90 transition-colors duration-200 hover:bg-white/15 max-lg:active:bg-white/10 lg:pointer-events-none lg:opacity-70"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMobileExpanded((o) => !o);
                        }}
                    >
                        <LuChevronDown
                            strokeWidth={2.25}
                            className={cn(
                                'h-5 w-5 text-current transition-transform duration-200 ease-out',
                                submenuOpen && 'rotate-180'
                            )}
                        />
                    </button>
                )}
            </div>

            {!isCollapsed && (
                <div
                    className={cn(
                        'grid transition-[grid-template-rows] duration-200 ease-out',
                        submenuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    )}
                >
                    <div className="min-h-0 overflow-hidden">
                        <div
                            role="list"
                            className="ml-2 mt-0.5 space-y-0.5 border-l border-white/15 py-1.5 pl-3"
                        >
                            {flyoutEntries.map((entry) => {
                                const dest = entry.linkHref?.trim() || entry.path;
                                const subActive = flyoutEntryIsActive(pathname, searchParams, entry);
                                return (
                                    <Link
                                        key={entry.path + (entry.linkHref || '')}
                                        href={dest}
                                        replace={Boolean(entry.replaceLink)}
                                        role="listitem"
                                        aria-current={subActive ? 'page' : undefined}
                                        onClick={() => {
                                            if (window.innerWidth < 1024) onMobileNav();
                                        }}
                                        className={cn(
                                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-normal leading-snug text-current opacity-90 antialiased transition-all duration-200',
                                            subActive ? 'font-semibold shadow-sm' : 'opacity-85 hover:bg-white/10 hover:opacity-100',
                                        )}
                                        style={subActive ? { backgroundColor: 'var(--sidebar-active)', color: 'var(--sidebar-text)' } : undefined}
                                    >
                                        <entry.icon
                                            className={cn(
                                                'h-3.5 w-3.5 shrink-0',
                                                subActive ? 'text-current' : 'text-current opacity-70'
                                            )}
                                        />
                                        <span>{entry.title}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function projectSetupHubRowIsActive(pathname: string, searchParams: ReadonlyURLSearchParams): boolean {
    if (hubRowActiveOnHistoryModule(pathname, searchParams, 'projects')) return true;
    if (navItemIsActive(pathname, '/projects-inventory/projects/create')) return true;
    if (navItemIsActive(pathname, '/projects-inventory/projects')) return true;
    return pathname.startsWith('/projects-inventory/projects/');
}

function inventoryHubRowIsActive(pathname: string, searchParams: ReadonlyURLSearchParams): boolean {
    if (hubRowActiveOnHistoryModule(pathname, searchParams, 'inventory')) return true;
    if (navItemIsActive(pathname, '/projects-inventory/inventory/create')) return true;
    if (navItemIsActive(pathname, '/projects-inventory/inventory')) return true;
    return pathname.startsWith('/projects-inventory/inventory/');
}

function bookingHubRowIsActive(pathname: string, searchParams: ReadonlyURLSearchParams): boolean {
    if (hubRowActiveOnHistoryModule(pathname, searchParams, 'bookings')) return true;
    if (navItemIsActive(pathname, '/company-admin/booking-payment/booking/create')) return true;
    if (navItemIsActive(pathname, '/company-admin/booking-payment/booking')) return true;
    return pathname.startsWith('/company-admin/booking-payment/booking/');
}

function paymentsHubRowIsActive(pathname: string, searchParams: ReadonlyURLSearchParams): boolean {
    if (hubRowActiveOnHistoryModule(pathname, searchParams, 'payments')) return true;
    if (navItemIsActive(pathname, '/company-admin/booking-payment/payments/add')) return true;
    if (navItemIsActive(pathname, '/company-admin/booking-payment/payments')) return true;
    return pathname.startsWith('/company-admin/booking-payment/payments/');
}

function paymentLinksHubRowIsActive(pathname: string, searchParams: ReadonlyURLSearchParams): boolean {
    if (hubRowActiveOnHistoryModule(pathname, searchParams, 'payments')) return true;
    if (navItemIsActive(pathname, '/company-admin/booking-payment/payment-links/add')) return true;
    if (navItemIsActive(pathname, '/company-admin/booking-payment/payment-links/form')) return true;
    if (navItemIsActive(pathname, '/company-admin/booking-payment/payment-links')) return true;
    return pathname.startsWith('/company-admin/booking-payment/payment-links/');
}

/** Document hub: list + detail/upload routes; not eSign, audit, or deleted hubs. */
function documentsHubRowIsActive(pathname: string, searchParams: ReadonlyURLSearchParams): boolean {
    if (hubRowActiveOnHistoryModule(pathname, searchParams, 'documents')) return true;
    if (navItemIsActive(pathname, '/company-admin/documents-compliance')) return true;
    if (!pathname.startsWith('/company-admin/documents-compliance/')) return false;
    if (pathname.startsWith('/company-admin/documents-compliance/esign')) return false;
    if (pathname.startsWith('/company-admin/documents-compliance/audit')) return false;
    if (pathname.startsWith('/company-admin/documents-compliance/deleted')) return false;
    if (pathname.startsWith('/company-admin/documents-compliance/contract-intelligence')) return false;
    return true;
}

function eSignHubRowIsActive(pathname: string, searchParams: ReadonlyURLSearchParams): boolean {
    if (hubRowActiveOnHistoryModule(pathname, searchParams, 'documents')) return true;
    if (navItemIsActive(pathname, '/company-admin/documents-compliance/esign/new')) return true;
    if (navItemIsActive(pathname, '/company-admin/documents-compliance/esign')) return true;
    return pathname.startsWith('/company-admin/documents-compliance/esign/');
}

/** Vendors hub: list + profile routes; not create or sub-centers like compliance. */
function vendorsHubRowIsActive(pathname: string, _searchParams: ReadonlyURLSearchParams): boolean {
    if (pathname === '/company-admin/vendors' || pathname === '/company-admin/vendors/') return true;
    if (pathname === '/company-admin/vendors/list' || pathname.startsWith('/company-admin/vendors/list/')) return true;
    if (!pathname.startsWith('/company-admin/vendors/')) return false;
    if (pathname.startsWith('/company-admin/vendors/create')) return false;
    if (pathname.startsWith('/company-admin/vendors/compliance')) return false;
    if (pathname.startsWith('/company-admin/vendors/contracts')) return false;
    if (pathname.startsWith('/company-admin/vendors/performance')) return false;
    if (pathname.startsWith('/company-admin/vendors/alerts')) return false;
    if (pathname.startsWith('/company-admin/vendors/invoices')) return false;
    return true; // e.g. `/company-admin/vendors/[id]`
}

/** Any route under `/company-admin/suppliers` (highlights Supplier management hub row + flyout targets). */
function supplierManagementSectionIsActive(pathname: string, _searchParams: ReadonlyURLSearchParams): boolean {
    if (pathname === '/company-admin/suppliers' || pathname === '/company-admin/suppliers/') return true;
    return pathname.startsWith('/company-admin/suppliers/');
}

/** Keep desktop flyout inside the viewport: prefer below anchor top; shift up when bottom clips. */
function clampSidebarFlyoutTop(anchorTop: number, anchorBottom: number, flyoutHeight: number): number {
    const margin = SIDEBAR_FLYOUT_VIEWPORT_MARGIN_PX;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const h = Math.min(flyoutHeight, vh - margin * 2);
    let top = anchorTop;
    if (top + h > vh - margin) {
        top = anchorBottom - h;
    }
    return Math.max(margin, Math.min(top, vh - margin - h));
}

type SidebarFlyoutNavRowProps = {
    pathname: string;
    isCollapsed: boolean;
    onMobileNav: () => void;
    href: string;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    flyoutEntries: readonly SidebarNavFlyoutEntry[];
    hubRowIsActive: (pathname: string, searchParams: ReadonlyURLSearchParams) => boolean;
    /** e.g. Payments hub clears stale `?booking=` via Next `replace`. */
    replaceMainLink?: boolean;
};

function SidebarFlyoutNavRow({
    pathname,
    isCollapsed,
    onMobileNav,
    href,
    label,
    Icon,
    flyoutEntries,
    hubRowIsActive,
    replaceMainLink = false,
}: SidebarFlyoutNavRowProps) {
    const isLg = useIsLgViewport();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [hoverOpen, setHoverOpen] = useState(false);
    const [desktopMenuPos, setDesktopMenuPos] = useState<{ top: number; left: number } | null>(null);
    const anchorRef = useRef<HTMLDivElement>(null);
    const flyoutPanelRef = useRef<HTMLDivElement>(null);
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchParams = useSearchParams();

    const isActive = hubRowIsActive(pathname, searchParams);
    const flyoutOpen = isLg ? hoverOpen : mobileOpen;

    const clearLeaveTimer = () => {
        if (leaveTimer.current) {
            clearTimeout(leaveTimer.current);
            leaveTimer.current = null;
        }
    };

    const onDesktopEnter = () => {
        if (!isLg) return;
        clearLeaveTimer();
        setHoverOpen(true);
    };

    const onDesktopLeave = () => {
        if (!isLg) return;
        clearLeaveTimer();
        leaveTimer.current = setTimeout(() => setHoverOpen(false), LEADS_SUBMENU_CLOSE_MS);
    };

    const updateDesktopMenuPos = useCallback(() => {
        if (!isLg || !hoverOpen || !anchorRef.current) return;
        const r = anchorRef.current.getBoundingClientRect();
        const measured = flyoutPanelRef.current?.getBoundingClientRect().height;
        const estimated = flyoutEntries.length * SIDEBAR_FLYOUT_ROW_APPROX_PX + 20;
        const flyoutH = measured && measured > 0 ? measured : estimated;
        const top = clampSidebarFlyoutTop(r.top, r.bottom, flyoutH);
        setDesktopMenuPos({
            top,
            left: r.right + SIDEBAR_FLYOUT_GAP_PX - SIDEBAR_FLYOUT_BRIDGE_PX,
        });
    }, [isLg, hoverOpen, flyoutEntries.length]);

    useLayoutEffect(() => {
        updateDesktopMenuPos();
    }, [updateDesktopMenuPos]);

    useLayoutEffect(() => {
        if (!isLg || !hoverOpen) return;
        const id = window.requestAnimationFrame(() => updateDesktopMenuPos());
        return () => window.cancelAnimationFrame(id);
    }, [isLg, hoverOpen, pathname, updateDesktopMenuPos]);

    useEffect(() => {
        if (!isLg || !hoverOpen) return;
        const el = anchorRef.current;
        if (!el) return;
        const scrollRoot = el.closest('[data-sidebar-nav-scroll]');
        const sync = () => updateDesktopMenuPos();
        window.addEventListener('resize', sync);
        scrollRoot?.addEventListener('scroll', sync, { passive: true });
        return () => {
            window.removeEventListener('resize', sync);
            scrollRoot?.removeEventListener('scroll', sync);
        };
    }, [isLg, hoverOpen, updateDesktopMenuPos]);

    useEffect(() => {
        if (!isLg || !hoverOpen) return;
        let ro: ResizeObserver | null = null;
        const raf = window.requestAnimationFrame(() => {
            const node = flyoutPanelRef.current;
            if (!node) return;
            ro = new ResizeObserver(() => updateDesktopMenuPos());
            ro.observe(node);
        });
        return () => {
            window.cancelAnimationFrame(raf);
            ro?.disconnect();
        };
    }, [isLg, hoverOpen, updateDesktopMenuPos]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        return () => {
            if (leaveTimer.current) clearTimeout(leaveTimer.current);
        };
    }, []);

    const flyoutLinkClass = (subActive: boolean) =>
        cn(
            'group/menuitem flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out',
            subActive ? 'text-current' : 'text-current hover:translate-x-1',
        );

    const flyoutLinks = (
        <>
            {flyoutEntries.map((entry, idx) => {
                const dest = entry.linkHref?.trim() || entry.path;
                const subActive = flyoutEntryIsActive(pathname, searchParams, entry);
                const showDivider = Boolean(entry.historyModule) && idx > 0;
                return (
                    <React.Fragment key={entry.path + (entry.linkHref || '')}>
                        {showDivider ? (
                            <div className="my-2 border-t border-white/10" role="separator" aria-hidden />
                        ) : null}
                        <Link
                            href={dest}
                            replace={Boolean(entry.replaceLink)}
                            role="menuitem"
                            aria-current={subActive ? 'page' : undefined}
                            onClick={() => {
                                setMobileOpen(false);
                                setHoverOpen(false);
                                if (window.innerWidth < 1024) onMobileNav();
                            }}
                            className={cn(
                                flyoutLinkClass(subActive),
                                !subActive && 'hover:bg-black/5 hover:text-(--sidebar-hover-text)',
                            )}
                            style={
                                subActive
                                    ? { backgroundColor: 'var(--sidebar-active)', color: 'var(--sidebar-text)' }
                                    : { color: 'var(--sidebar-text)' }
                            }
                        >
                            <entry.icon
                                className={cn(
                                    'h-4 w-4 shrink-0 transition-colors duration-200',
                                    subActive ? 'text-current opacity-95' : 'text-current opacity-80'
                                )}
                            />
                            <span>{entry.title}</span>
                        </Link>
                    </React.Fragment>
                );
            })}
        </>
    );

    const desktopFlyout =
        isLg &&
        hoverOpen &&
        desktopMenuPos &&
        typeof document !== 'undefined' &&
        createPortal(
            <div
                role="menu"
                aria-hidden={false}
                style={{
                    top: desktopMenuPos.top,
                    left: desktopMenuPos.left,
                    paddingLeft: SIDEBAR_FLYOUT_BRIDGE_PX,
                }}
                className={cn(
                    'fixed z-50 flex translate-x-0 flex-col opacity-100 transition-[top,left] duration-200 ease-out',
                    'pointer-events-auto'
                )}
                onMouseEnter={onDesktopEnter}
                onMouseLeave={onDesktopLeave}
            >
                <div
                    ref={flyoutPanelRef}
                    className={cn(
                        'z-50 min-w-[220px] overflow-hidden rounded-xl border border-black/10 p-2 shadow-xl',
                        'animate-sidebar-flyout-in'
                    )}
                    style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
                >
                    {flyoutLinks}
                </div>
            </div>,
            document.body
        );

    return (
        <div
            ref={anchorRef}
            className="relative"
            onMouseEnter={onDesktopEnter}
            onMouseLeave={onDesktopLeave}
        >
            <div
                className={cn(
                    'flex items-center rounded-lg transition-all duration-200',
                    isActive ? 'shadow-sm ring-1 ring-white/25' : 'bg-transparent hover:bg-white/10',
                )}
                style={isActive ? { backgroundColor: 'var(--sidebar-active)', color: 'var(--sidebar-text)' } : undefined}
            >
                <Link
                    href={href}
                    replace={replaceMainLink}
                    aria-current={navItemIsActive(pathname, href) ? 'page' : undefined}
                    onClick={() => {
                        if (window.innerWidth < 1024) onMobileNav();
                    }}
                    className={cn(
                        'group flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-[14.5px] font-normal leading-snug antialiased transition-all duration-200 sm:text-[15px]',
                        isCollapsed ? 'justify-center px-1.5' : 'px-3',
                        isActive ? 'font-semibold text-current' : 'text-current opacity-80 hover:opacity-100'
                    )}
                >
                    <Icon
                        className={cn(
                            'h-5 w-5 shrink-0',
                            isActive ? 'text-current' : 'text-current opacity-70'
                        )}
                    />
                    {!isCollapsed && (
                        <span className="min-w-0 flex-1 whitespace-normal wrap-break-word leading-snug">{label}</span>
                    )}
                </Link>
                {!isCollapsed && (
                    <button
                        type="button"
                        aria-expanded={mobileOpen}
                        aria-haspopup="menu"
                        aria-label={mobileOpen ? `Close ${label} menu` : `Open ${label} menu`}
                        className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-current opacity-90 transition-all duration-200 hover:bg-white/15 lg:pointer-events-none lg:opacity-0"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMobileOpen((o) => !o);
                        }}
                    >
                        <LuChevronDown
                            strokeWidth={2.25}
                            className={cn(
                                'h-5 w-5 text-current transition-transform duration-200 ease-out',
                                mobileOpen && 'rotate-180'
                            )}
                        />
                    </button>
                )}
            </div>

            {/* Mobile / tablet: inline dropdown (desktop uses body portal to escape nav overflow clipping). */}
            <div
                role="menu"
                aria-hidden={!flyoutOpen}
                className={cn(
                    'mt-1 w-full overflow-hidden rounded-xl border border-black/10 p-2 shadow-xl transition-all duration-200 ease-out lg:hidden',
                    mobileOpen
                        ? 'pointer-events-auto translate-x-0 opacity-100 animate-sidebar-flyout-in'
                        : 'pointer-events-none hidden -translate-x-1 opacity-0'
                )}
                style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
            >
                {flyoutLinks}
            </div>
            {desktopFlyout}
        </div>
    );
}

const menuSections = [
    {
        title: 'Dashboard',
        icon: LuLayoutDashboard,
        path: '/company-admin/dashboard',
        isDropdown: false,
    },
    {
        title: 'AI Command Center',
        icon: LuSparkles,
        path: '/company-admin/ai-command-center',
        isDropdown: false,
    },
    {
        title: 'Platform Foundation',
        icon: LuLayoutGrid,
        isDropdown: true,
        items: [
            {
                title: 'Tenants',
                path: '/platform/tenants',
                icon: LuBuilding2,
                sidebarFlyout: PLATFORM_TENANTS_FLYOUT,
                hubRowIsActive: tenantsHubRowIsActive,
            },
            { title: 'Business Units', path: '/business-units', icon: LuBuilding },
            {
                title: 'Users',
                path: '/platform/users',
                icon: LuUsers,
                sidebarFlyout: PLATFORM_USERS_FLYOUT,
                hubRowIsActive: usersHubRowIsActive,
            },
            { title: 'Access matrix', path: '/platform/access-matrix', icon: LuGrid3X3 },
            // { title: 'Roles', path: '/roles', icon: LuShield },
            { title: 'Departments', path: '/departments', icon: LuFolderTree },
            {
                title: 'Foundation Settings',
                path: '/company-admin/platform-foundation',
                icon: LuSettings,
            },
            { title: 'Theme', path: '/settings/theme', icon: LuSparkles },
        ],
    },
   
    // {
    //     title: "Sales",
    //     icon: LuTarget,
    //     isDropdown: true,
    //     items: [
    //         { title: "Leads", path: "/sales/leads", icon: LuTarget },
    //         { title: "Site Visits", path: "/sales/site-visits", icon: LuCalendarDays },
    //         { title: "Bookings", path: "/sales/bookings", icon: LuCheck },
    //         { title: "Customers", path: "/sales/customers", icon: LuUserPlus },
    //     ],
    // },
    {
        title: 'Lead & Sales',
        icon: LuUsers,
        isDropdown: true,
        items: [
            {
                title: 'Leads',
                path: '/leads',
                icon: LuUsers,
                sidebarFlyout: LEADS_HUB_FLYOUT,
                hubRowIsActive: leadsHubRowIsActive,
                leadsInlineAccordion: true,
            },
            {
                title: 'Customer',
                path: '/platform/customers',
                icon: LuUserPlus,
                sidebarFlyout: CUSTOMERS_HUB_FLYOUT,
            },
            { title: 'Leads Intelligence', path: '/leads/intelligence', icon: LuSparkles },
            { title: 'AI Sales Intelligence', path: '/leads/ai-sales-intelligence', icon: LuBrain },
            { title: 'Revenue Intelligence Center', path: '/leads/revenue-intelligence', icon: LuIndianRupee },
            { title: 'Leads Analytics', path: '/leads/analytics', icon: LuChartColumn },
        ],
    },
    {
        title: 'Projects & Inventory Management System',
        icon: LuBriefcase,
        isDropdown: true,
        items: [
            {
                title: 'Project Setup',
                path: '/projects-inventory/projects',
                icon: LuFolderKanban,
                sidebarFlyout: PROJECT_SETUP_FLYOUT,
                hubRowIsActive: projectSetupHubRowIsActive,
            },
            {
                title: 'Inventory',
                path: '/projects-inventory/inventory',
                icon: LuPackage,
                sidebarFlyout: INVENTORY_HUB_FLYOUT,
                hubRowIsActive: inventoryHubRowIsActive,
            },
            { title: 'Pricing', path: '/projects-inventory/pricing', icon: LuDollarSign },
            { title: 'Visual Mapping', path: '/projects-inventory/visual-inventory-mapping', icon: LuMap },
            { title: 'Visual Inventory View', path: '/projects-inventory/visual-inventory-view', icon: LuMap },
            { title: 'AI Demand Intelligence', path: '/demand-intelligence', icon: LuSparkles },
            { title: 'AI Inventory Intelligence', path: '/projects-inventory/ai-insights', icon: LuSparkles },
            { title: 'Inventory Dashboard', path: '/projects-inventory/inventory-dashboard', icon: LuChartBar },
            { title: 'Analytics', path: '/projects-inventory/analytics', icon: LuChartBar },
        ],
    },
    {
        title: 'Booking & Payment Tracking',
        icon: LuWallet,
        isDropdown: true,
        items: [
            {
                title: 'Bookings',
                path: '/company-admin/booking-payment/booking',
                icon: LuCalendarCheck,
                sidebarFlyout: BOOKING_HUB_FLYOUT,
                hubRowIsActive: bookingHubRowIsActive,
            },
            {
                title: 'Payments',
                path: '/company-admin/booking-payment/payments',
                icon: LuCreditCard,
                /** Clear stale `?booking=` when opening the hub from the sidebar. */
                replaceLink: true,
                sidebarFlyout: PAYMENTS_HUB_FLYOUT,
                hubRowIsActive: paymentsHubRowIsActive,
            },
            {
                title: 'Payment Links',
                path: '/company-admin/booking-payment/payment-links',
                icon: LuLink,
                sidebarFlyout: PAYMENT_LINKS_HUB_FLYOUT,
                hubRowIsActive: paymentLinksHubRowIsActive,
            },
            { title: 'AI Booking & Payment Intelligence', path: '/company-admin/booking-payment/ai', icon: LuSparkles },
            { title: 'Insights & Reports', path: '/company-admin/booking-payment/reports', icon: LuChartBar },
            { title: 'History logs', path: '/company-admin/history-logs', icon: LuHistory },
            { title: 'System', path: '/company-admin/booking-payment/system', icon: LuSettings },
        ],
    },
    {
        title: 'Documents & Compliance',
        icon: LuFileLock2,
        isDropdown: true,
        items: [
            {
                title: 'Document Management',
                path: '/company-admin/documents-compliance',
                icon: LuFolderOpen,
                sidebarFlyout: DOCUMENTS_HUB_FLYOUT,
                hubRowIsActive: documentsHubRowIsActive,
            },
           
            {
                title: 'eSign (Aadhaar)',
                path: '/company-admin/documents-compliance/esign',
                icon: LuPenLine,
                sidebarFlyout: ESIGN_HUB_FLYOUT,
                hubRowIsActive: eSignHubRowIsActive,
            },
            { title: 'Audit & Activity', path: '/company-admin/documents-compliance/audit', icon: LuHistory },
            { title: 'Deleted Records', path: '/company-admin/documents-compliance/deleted', icon: LuTrash2 },
            { title: 'AI Contract Intelligence', path: '/company-admin/documents-compliance/contract-intelligence', icon: LuSparkles },
        ],
    },
    {
        title: 'Procurement Management',
        icon: LuBriefcase,
        isDropdown: true,
        items: [
            {
                title: 'Purchase requests',
                path: '/procurement/requests',
                icon: LuShoppingCart,
                sidebarFlyout: PURCHASE_REQUESTS_FLYOUT,
                hubRowIsActive: purchaseRequestsHubRowIsActive,
            },
            {
                title: 'Purchase orders',
                path: '/procurement/purchase-orders',
                icon: LuFileText,
                sidebarFlyout: PURCHASE_ORDERS_FLYOUT,
                hubRowIsActive: purchaseOrdersHubRowIsActive,
            },
            {
                title: 'Suppliers list',
                path: '/company-admin/suppliers',
                icon: LuTruck,
                sidebarFlyout: SUPPLIERS_LIST_QUICK_FLYOUT,
                hubRowIsActive: supplierManagementSectionIsActive,
            },
            {
                title: 'Invoice & Payments',
                path: '/company-admin/invoices',
                icon: LuReceipt,
                sidebarFlyout: INVOICES_FLYOUT,
                hubRowIsActive: invoicesHubRowIsActive,
            },
           
            {
                title: 'AI Invoice Intelligence',
                path: '/procurement/invoice-intelligence',
                icon: LuSparkles,
            },
        ],
    },
    {
        title: 'Vendor management',
        icon: LuUsers,
        isDropdown: true,
        items: [
            {
                title: 'Vendors profile',
                path: '/company-admin/vendors',
                icon: LuUsers,
                sidebarFlyout: VENDORS_LIST_QUICK_FLYOUT,
                hubRowIsActive: vendorsHubRowIsActive,
            },
            { title: 'Vendor compliance', path: '/company-admin/vendors/compliance', icon: LuShieldCheck },
            { title: 'Vendor invoices', path: '/company-admin/vendors/invoices', icon: LuReceipt },
            {
                title: 'AI Vendor Compliance Intelligence',
                path: '/procurement/vendor-compliance-intelligence',
                icon: LuSparkles,
            },
            { title: 'Vendor contracts', path: '/company-admin/vendors/contracts', icon: LuFileText },
            {
                title: 'Vendor Assignments',
                path: '/work-orders',
                icon: LuClipboardList,
                sidebarFlyout: WORK_ORDERS_FLYOUT,
                hubRowIsActive: workOrdersHubRowIsActive,
            },
            
            { title: 'Vendor performance', path: '/company-admin/vendors/performance', icon: LuChartBar },
            { title: 'Vendor alerts center', path: '/company-admin/vendors/alerts', icon: LuBell },
            
        ],
    },
    
    {
        title: 'Resident & Community Management',
        icon: LuHouse,
        isDropdown: true,
        items: [
            { title: 'Resident Management', path: '/platform/community/residents', icon: LuUsers },
            { title: 'AI Resident Intelligence', path: '/platform/community/residents/intelligence', icon: LuSparkles },
            { title: 'Service Request & Maintenance OS', path: '/platform/community/service-maintenance', icon: LuWrench },
        ],
    },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    onToggle: () => void;
    hoverProps?: HTMLAttributes<HTMLElement>;
    /** Width/background/color transition utilities; omit default from hook until first paint to avoid jitter on navigations */
    sidebarWidthTransitionClassName?: string;
}

export const CompanyAdminSidebar = ({
    isOpen,
    onClose,
    isCollapsed,
    onToggle,
    hoverProps,
    sidebarWidthTransitionClassName = 'transition-[width,background-color,color] duration-300 ease-out',
}: SidebarProps) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [openSections, setOpenSections] = useState<string[]>([]);

    // Automatically expand section if a sub-item is active
    useEffect(() => {
        menuSections.forEach((section) => {
            if (section.isDropdown && section.items) {
                const isActive = section.items.some((item) => {
                    const ext = item as {
                        sidebarFlyout?: SidebarNavFlyoutEntry[];
                        hubRowIsActive?: (p: string, s: ReadonlyURLSearchParams) => boolean;
                    };
                    if (ext.sidebarFlyout?.length && ext.hubRowIsActive) {
                        return ext.hubRowIsActive(pathname, searchParams);
                    }
                    return navItemIsActive(pathname, item.path);
                });
                if (isActive) {
                    setOpenSections((prev) => (prev.includes(section.title) ? prev : [...prev, section.title]));
                }
            }
        });
    }, [pathname, searchParams]);

    const toggleSection = (title: string) => {
        if (isCollapsed) {
            onToggle(); // Expand sidebar if it's collapsed and a section is clicked
            setOpenSections([title]);
            return;
        }
        setOpenSections(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title]
        );
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-x-0 top-14 bottom-0 z-40 bg-[#0B2A4A]/55 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                suppressHydrationWarning
                {...hoverProps}
                className={cn(
                    'fixed left-0 top-14 z-50 flex h-[calc(100dvh-3.5rem)] flex-col border-r border-black/10 shadow-md',
                    sidebarWidthTransitionClassName,
                    isCollapsed ? 'w-[68px]' : 'w-[320px]',
                    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
                style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
            >
                {/* Logo — rounded-xl clip on wrapper; overflow-hidden masks image corners */}
                <div className="flex h-20 shrink-0 items-center justify-center border-b border-white/10 bg-black/10 px-2">
                    <div
                        className={cn(
                            'flex shrink-0 items-center justify-center overflow-hidden rounded-xl',
                            isCollapsed ? 'h-10 w-10' : 'h-16 w-full max-w-[200px]'
                        )}
                    >
                        <img
                            src={isCollapsed ? LOGO_ICON_SRC : LOGO_FULL_SRC}
                            alt={PRODUCT_NAME}
                            className="h-full w-full object-contain"
                        />
                    </div>
                </div>

                {/* Navigation — scrollbar hidden for a cleaner rail */}
                <nav
                    data-sidebar-nav-scroll
                    className="flex-1 space-y-1.5 overflow-y-auto px-2 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {menuSections.map((section) => {
                        const isSectionOpen = openSections.includes(section.title);
                        const hasActiveChild =
                            section.isDropdown &&
                            section.items?.some((item) => {
                                const ext = item as {
                                    sidebarFlyout?: SidebarNavFlyoutEntry[];
                                    hubRowIsActive?: (p: string, s: ReadonlyURLSearchParams) => boolean;
                                    leadsInlineAccordion?: boolean;
                                };
                                if (ext.sidebarFlyout?.length && ext.hubRowIsActive) {
                                    return ext.hubRowIsActive(pathname, searchParams);
                                }
                                return navItemIsActive(pathname, item.path);
                            });
                        const isDirectActive = section.path && navItemIsActive(pathname, section.path);

                        if (!section.isDropdown) {
                            return (
                                <Link
                                    key={section.title}
                                    href={section.path!}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) onClose();
                                    }}
                                    className={cn(
                                        'group mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-normal leading-snug antialiased transition-all duration-200',
                                        isCollapsed ? 'justify-center px-1.5' : 'px-3',
                                        isDirectActive
                                            ? 'font-semibold shadow-sm ring-1 ring-white/20'
                                            : 'text-current opacity-80 hover:bg-white/10 hover:opacity-100'
                                    )}
                                    style={isDirectActive ? { backgroundColor: 'var(--sidebar-active)', color: 'var(--sidebar-text)' } : undefined}
                                >
                                    <span
                                        className={cn(
                                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
                                            isDirectActive
                                                ? 'bg-white/20'
                                                : 'bg-white/10 text-current opacity-80 group-hover:bg-white/15 group-hover:opacity-100'
                                        )}
                                    >
                                        <section.icon className="h-5 w-5" />
                                    </span>
                                    {!isCollapsed && (
                                        <span className="min-w-0 flex-1 whitespace-normal wrap-break-word leading-snug">
                                            {section.title}
                                        </span>
                                    )}
                                </Link>
                            );
                        }

                        return (
                            <div key={section.title} className="space-y-0.5">
                                <button
                                    type="button"
                                    onClick={() => toggleSection(section.title)}
                                    className={cn(
                                        'group flex w-full items-center gap-2.5 rounded-lg py-2.5 text-[14px] font-normal leading-snug antialiased transition-all duration-200',
                                        isCollapsed ? 'justify-center px-1.5' : 'px-2.5',
                                        isSectionOpen || hasActiveChild
                                            ? 'border border-white/15 bg-white/10 text-current'
                                            : 'border border-transparent text-current opacity-80 hover:border-white/10 hover:bg-white/10 hover:opacity-100'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
                                            hasActiveChild || isSectionOpen
                                                ? 'text-current'
                                                : 'bg-white/10 text-current opacity-80 group-hover:bg-white/15 group-hover:opacity-100'
                                        )}
                                        style={hasActiveChild || isSectionOpen ? { backgroundColor: 'var(--sidebar-active)' } : undefined}
                                    >
                                        <section.icon className="h-5 w-5" />
                                    </span>
                                    {!isCollapsed && (
                                        <>
                                            <span className="min-w-0 flex-1 whitespace-normal wrap-break-word text-left leading-snug">
                                                {section.title}
                                            </span>
                                            <LuChevronDown
                                                strokeWidth={2.25}
                                                className={cn('h-5 w-5 shrink-0 text-current opacity-90 transition-transform duration-200 ease-out', isSectionOpen && 'rotate-180')}
                                            />
                                        </>
                                    )}
                                </button>

                                {!isCollapsed && isSectionOpen && (
                                    <div className="ml-1.5 space-y-0 border-l border-white/15 py-1 pl-2.5">
                                        {section.items?.map((item) => {
                                            const flyoutExt = item as {
                                                sidebarFlyout?: SidebarNavFlyoutEntry[];
                                                hubRowIsActive?: (p: string, s: ReadonlyURLSearchParams) => boolean;
                                                replaceLink?: boolean;
                                                navDividerBefore?: boolean;
                                            };
                                            const divider = flyoutExt.navDividerBefore ? (
                                                <div
                                                    key={`${item.path}-divider`}
                                                    className="my-2 border-t border-white/10"
                                                    role="separator"
                                                    aria-hidden
                                                />
                                            ) : null;
                                            if (flyoutExt.sidebarFlyout?.length && flyoutExt.hubRowIsActive) {
                                                return (
                                                    <React.Fragment key={item.path}>
                                                        {divider}
                                                        <SidebarFlyoutNavRow
                                                            pathname={pathname}
                                                            isCollapsed={isCollapsed}
                                                            onMobileNav={onClose}
                                                            href={item.path}
                                                            label={item.title}
                                                            Icon={item.icon}
                                                            flyoutEntries={flyoutExt.sidebarFlyout}
                                                            hubRowIsActive={flyoutExt.hubRowIsActive}
                                                            replaceMainLink={Boolean(flyoutExt.replaceLink)}
                                                        />
                                                    </React.Fragment>
                                                );
                                            }
                                            const isActive = navItemIsActive(pathname, item.path);
                                            const isChild =
                                                (item as { childOfPrevious?: boolean }).childOfPrevious === true;
                                            const itemHref =
                                                (item as { linkHref?: string }).linkHref?.trim() || item.path;
                                            const replaceNav = Boolean((item as { replaceLink?: boolean }).replaceLink);
                                            return (
                                                <React.Fragment key={item.path}>
                                                    {divider}
                                                    <Link
                                                        href={itemHref}
                                                        replace={replaceNav}
                                                        aria-current={isActive ? 'page' : undefined}
                                                        onClick={() => {
                                                            if (window.innerWidth < 1024) onClose();
                                                        }}
                                                        className={cn(
                                                            'group flex items-start rounded-lg px-3 py-2 text-[13.5px] font-normal leading-snug antialiased transition-all duration-200 sm:text-[14px]',
                                                            isChild ? 'gap-2 pl-0 pr-2' : 'gap-2',
                                                            isChild && !isActive && 'bg-transparent',
                                                            isActive
                                                                ? 'font-semibold shadow-sm ring-1 ring-white/25'
                                                                : 'text-current opacity-80 hover:bg-white/10 hover:opacity-100',
                                                        )}
                                                        style={
                                                            isActive
                                                                ? { backgroundColor: 'var(--sidebar-active)', color: 'var(--sidebar-text)' }
                                                                : undefined
                                                        }
                                                    >
                                                        {isChild ? <ChildTreeMarker /> : null}
                                                        <item.icon
                                                            className={cn(
                                                                'h-5 w-5 shrink-0',
                                                                isChild && 'h-4 w-4',
                                                                isActive ? 'text-current' : 'text-current opacity-70',
                                                            )}
                                                        />
                                                        <span className="min-w-0 flex-1 whitespace-normal wrap-break-word leading-snug">
                                                            {item.title}
                                                        </span>
                                                    </Link>
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {!isCollapsed ? (
                    <p className="shrink-0 w-full border-t border-white/10 bg-(--cta-button-bg) px-3 py-3 text-center text-[10px] font-medium leading-snug text-(--cta-button-text)">
                        {FOOTER_POWERED_BY}
                    </p>
                ) : null}
            </aside>
        </>
    );
};

