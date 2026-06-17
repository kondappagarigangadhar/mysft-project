import {
    COMPANY_NAME,
    FAVICON_SRC,
    LOGO_FULL_SRC,
    LOGO_ICON_SRC,
    PRODUCT_NAME,
    PRODUCT_WEBSITE,
} from '@/lib/branding';
import type { PlatformAuditLogEntry, PlatformFoundationSettings } from '@/lib/platformFoundationTypes';

const STORAGE_KEY = 'arris-platform-foundation-v1';

export const PLATFORM_MODULE_LABELS: Record<
    import('@/lib/platformFoundationTypes').PlatformModuleId,
    string
> = {
    crm: 'CRM',
    procurement: 'Procurement',
    vendors: 'Vendors',
    workOrders: 'Work Orders',
    invoices: 'Invoices',
    accessControl: 'Access Control',
    auditLogs: 'Audit Logs',
    inventory: 'Inventory',
    documents: 'Documents',
};

export const DEFAULT_PLATFORM_FOUNDATION_SETTINGS: PlatformFoundationSettings = {
    organization: {
        tenantId: 'TNT-SKYLINE-001',
        databaseSchema: 'tenant_skyline_builders',
        tenantStatus: 'Active',
        businessUnitName: 'Hyderabad Division',
        businessUnitCode: 'HYD01',
        parentOrganization: 'Skyline Builders Pvt Ltd',
        defaultProjectScope: 'Residential Projects, Commercial Complexes',
        joiningDate: '2024-03-15',
        reportingManager: 'Rajesh Kumar',
        departmentTransfer: 'Engineering → Sales (Feb 2026)',
        exitDate: '',
    },
    security: {
        mfaEnabled: true,
        mfaMethod: 'authenticator',
        passwordPolicy: 'Enterprise Standard',
        minPasswordLength: 12,
        passwordExpiryDays: 90,
        requireSpecialCharacters: true,
        requireUppercase: true,
        requireNumbers: true,
        sessionTimeoutMinutes: 30,
        deviceTracking: true,
        maxConcurrentSessions: 3,
        autoLogout: true,
    },
    subscription: {
        plan: 'Enterprise',
        billingCycle: 'Annual',
        status: 'Active',
        expiryDate: '2027-03-31',
        maxUsers: 250,
        activeUsers: 142,
        enabledModules: [
            'crm',
            'procurement',
            'vendors',
            'workOrders',
            'invoices',
            'accessControl',
            'auditLogs',
            'inventory',
            'documents',
        ],
    },
    branding: {
        organizationLogo: LOGO_FULL_SRC,
        darkLogo: LOGO_ICON_SRC,
        favicon: FAVICON_SRC,
        productName: PRODUCT_NAME,
        companyName: COMPANY_NAME,
        websiteUrl: `https://${PRODUCT_WEBSITE}`,
        supportEmail: 'support@mysft.ai',
        emailHeaderLogo: LOGO_FULL_SRC,
        footerText: 'Powered by Requanto Technologies',
        emailThemeColor: '#0092ff',
        watermark: 'CONFIDENTIAL',
        exportHeader: 'Skyline Builders — Official Export',
        footerBranding: 'mySFT · Real estate unified SaaS',
    },
};

export const MOCK_PLATFORM_AUDIT_LOGS: PlatformAuditLogEntry[] = [
    {
        id: 'aud-1',
        actionType: 'Updated',
        module: 'Security',
        updatedBy: 'Priya Sharma',
        previousValue: 'MFA: Disabled',
        newValue: 'MFA: Enabled (Authenticator)',
        timestamp: '2026-05-15T14:22:00Z',
        ipAddress: '103.21.45.88',
    },
    {
        id: 'aud-2',
        actionType: 'Updated',
        module: 'Subscription',
        updatedBy: 'Admin',
        previousValue: 'Max users: 200',
        newValue: 'Max users: 250',
        timestamp: '2026-05-14T09:10:00Z',
        ipAddress: '103.21.45.88',
    },
    {
        id: 'aud-3',
        actionType: 'Updated',
        module: 'Branding',
        updatedBy: 'Nisha Gupta',
        previousValue: 'Primary: #f97316',
        newValue: 'Primary: #0092ff',
        timestamp: '2026-05-12T16:45:00Z',
        ipAddress: '49.36.12.201',
    },
    {
        id: 'aud-4',
        actionType: 'Created',
        module: 'Organization',
        updatedBy: 'System',
        previousValue: '—',
        newValue: 'Business unit: Bengaluru Operations',
        timestamp: '2026-05-10T11:00:00Z',
        ipAddress: '10.0.0.1',
    },
    {
        id: 'aud-5',
        actionType: 'Updated',
        module: 'Security',
        updatedBy: 'Security Admin',
        previousValue: 'Session timeout: 60 min',
        newValue: 'Session timeout: 30 min',
        timestamp: '2026-05-08T08:30:00Z',
        ipAddress: '192.168.1.45',
    },
    {
        id: 'aud-6',
        actionType: 'Updated',
        module: 'Subscription',
        updatedBy: 'Billing Ops',
        previousValue: 'Module: Documents disabled',
        newValue: 'Module: Documents enabled',
        timestamp: '2026-05-05T13:15:00Z',
        ipAddress: '103.21.45.88',
    },
    {
        id: 'aud-7',
        actionType: 'Login',
        module: 'Access Control',
        updatedBy: 'john@skyline.com',
        previousValue: '—',
        newValue: 'Successful login',
        timestamp: '2026-05-04T07:12:00Z',
        ipAddress: '45.12.88.92',
    },
    {
        id: 'aud-8',
        actionType: 'Updated',
        module: 'Organization',
        updatedBy: 'HR Admin',
        previousValue: 'Reporting: Amit Patel',
        newValue: 'Reporting: Rajesh Kumar',
        timestamp: '2026-05-01T10:00:00Z',
        ipAddress: '103.21.45.88',
    },
];

function cloneSettings(s: PlatformFoundationSettings): PlatformFoundationSettings {
    return JSON.parse(JSON.stringify(s)) as PlatformFoundationSettings;
}

export function loadPlatformFoundationSettings(): PlatformFoundationSettings {
    if (typeof window === 'undefined') return cloneSettings(DEFAULT_PLATFORM_FOUNDATION_SETTINGS);
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return cloneSettings(DEFAULT_PLATFORM_FOUNDATION_SETTINGS);
        const parsed = JSON.parse(raw) as PlatformFoundationSettings;
        return { ...cloneSettings(DEFAULT_PLATFORM_FOUNDATION_SETTINGS), ...parsed };
    } catch {
        return cloneSettings(DEFAULT_PLATFORM_FOUNDATION_SETTINGS);
    }
}

export function savePlatformFoundationSettings(settings: PlatformFoundationSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resetPlatformFoundationSettings(): PlatformFoundationSettings {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    return cloneSettings(DEFAULT_PLATFORM_FOUNDATION_SETTINGS);
}

export { cloneSettings as clonePlatformFoundationSettings };
