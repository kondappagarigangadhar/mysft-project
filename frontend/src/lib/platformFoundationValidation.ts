import type { PlatformFoundationSettings, PlatformFoundationTabId } from '@/lib/platformFoundationTypes';

export type PlatformFoundationFieldErrors = Partial<Record<string, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

export function validatePlatformFoundationSettings(
    settings: PlatformFoundationSettings,
): PlatformFoundationFieldErrors {
    const errors: PlatformFoundationFieldErrors = {};
    const { organization, security, subscription, branding } = settings;

    if (!organization.businessUnitName.trim()) {
        errors['organization.businessUnitName'] = 'Business unit name is required';
    }
    if (!organization.businessUnitCode.trim()) {
        errors['organization.businessUnitCode'] = 'Business unit code is required';
    }

    if (security.minPasswordLength < 8 || security.minPasswordLength > 128) {
        errors['security.minPasswordLength'] = 'Minimum password length must be between 8 and 128';
    }
    if (security.passwordExpiryDays < 0 || security.passwordExpiryDays > 365) {
        errors['security.passwordExpiryDays'] = 'Password expiry must be between 0 and 365 days';
    }
    if (security.maxConcurrentSessions < 1 || security.maxConcurrentSessions > 50) {
        errors['security.maxConcurrentSessions'] = 'Max concurrent sessions must be between 1 and 50';
    }

    if (subscription.maxUsers < 1) {
        errors['subscription.maxUsers'] = 'Max users must be at least 1';
    }
    if (subscription.activeUsers > subscription.maxUsers) {
        errors['subscription.activeUsers'] = 'Active users cannot exceed max users';
    }

    if (branding.supportEmail.trim() && !EMAIL_RE.test(branding.supportEmail.trim())) {
        errors['branding.supportEmail'] = 'Enter a valid support email';
    }
    if (branding.websiteUrl.trim() && !URL_RE.test(branding.websiteUrl.trim())) {
        errors['branding.websiteUrl'] = 'Website URL must start with http:// or https://';
    }
    if (!branding.productName.trim()) {
        errors['branding.productName'] = 'Product name is required';
    }

    return errors;
}

export function tabForFieldError(fieldKey: string): PlatformFoundationTabId {
    if (fieldKey.startsWith('organization.')) return 'organization';
    if (fieldKey.startsWith('security.')) return 'security';
    if (fieldKey.startsWith('subscription.')) return 'subscription';
    if (fieldKey.startsWith('branding.')) return 'branding';
    return 'organization';
}
