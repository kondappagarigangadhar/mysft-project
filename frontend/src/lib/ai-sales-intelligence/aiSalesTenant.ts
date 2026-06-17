import { loadPlatformFoundationSettings } from '@/lib/platformFoundationStore';

/** Multi-tenant isolation — all AI queries scoped by tenantId. */
export function getDemoTenantId(): string {
    return loadPlatformFoundationSettings().organization.tenantId;
}
