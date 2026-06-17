export type PlatformFoundationTabId =
    | 'organization'
    | 'security'
    | 'subscription'
    | 'branding'
    | 'audit';

export type MfaMethod = 'email' | 'sms' | 'authenticator';

export type PlatformModuleId =
    | 'crm'
    | 'procurement'
    | 'vendors'
    | 'workOrders'
    | 'invoices'
    | 'accessControl'
    | 'auditLogs'
    | 'inventory'
    | 'documents';

export interface PlatformFoundationSettings {
    organization: {
        tenantId: string;
        databaseSchema: string;
        tenantStatus: 'Active' | 'Suspended' | 'Provisioning';
        businessUnitName: string;
        businessUnitCode: string;
        parentOrganization: string;
        defaultProjectScope: string;
        joiningDate: string;
        reportingManager: string;
        departmentTransfer: string;
        exitDate: string;
    };
    security: {
        mfaEnabled: boolean;
        mfaMethod: MfaMethod;
        passwordPolicy: string;
        minPasswordLength: number;
        passwordExpiryDays: number;
        requireSpecialCharacters: boolean;
        requireUppercase: boolean;
        requireNumbers: boolean;
        sessionTimeoutMinutes: number;
        deviceTracking: boolean;
        maxConcurrentSessions: number;
        autoLogout: boolean;
    };
    subscription: {
        plan: string;
        billingCycle: 'Monthly' | 'Quarterly' | 'Annual';
        status: 'Active' | 'Trial' | 'Expired' | 'Cancelled';
        expiryDate: string;
        maxUsers: number;
        activeUsers: number;
        enabledModules: PlatformModuleId[];
    };
    branding: {
        organizationLogo: string;
        darkLogo: string;
        favicon: string;
        productName: string;
        companyName: string;
        websiteUrl: string;
        supportEmail: string;
        emailHeaderLogo: string;
        footerText: string;
        emailThemeColor: string;
        watermark: string;
        exportHeader: string;
        footerBranding: string;
    };
}

export interface PlatformAuditLogEntry {
    id: string;
    actionType: string;
    module: string;
    updatedBy: string;
    previousValue: string;
    newValue: string;
    timestamp: string;
    ipAddress: string;
}
