import { residentViewHref } from '@/lib/residentRoutes';
import { serviceMaintenanceViewHref } from '@/lib/serviceMaintenanceRoutes';

export type ResidentIntelTab = 'overview' | 'lease' | 'service';

export const RESIDENT_INTEL_SECTION_IDS = {
    attention: 'ri-attention',
    actions: 'ri-actions',
    engagement: 'ri-engagement',
    risk: 'ri-risk',
    ranking: 'ri-ranking',
    table: 'ri-table',
} as const;

export function getResidentIntelHref(residentSlug: string, tab: ResidentIntelTab = 'overview'): string {
    if (tab === 'lease') {
        return `${residentViewHref(residentSlug)}?tab=lease`;
    }
    if (tab === 'service') {
        return '/platform/community/service-maintenance';
    }
    return residentViewHref(residentSlug);
}

export function getResidentIntelServiceHref(ticketSlug: string): string {
    return serviceMaintenanceViewHref(ticketSlug);
}

export function getResidentIntelActionHref(residentSlug: string, title: string, serviceTicketSlug?: string): string {
    const lower = title.toLowerCase();
    if (serviceTicketSlug || lower.includes('ticket') || lower.includes('maintenance') || lower.includes('sla')) {
        return serviceTicketSlug ? getResidentIntelServiceHref(serviceTicketSlug) : getResidentIntelHref(residentSlug, 'service');
    }
    if (lower.includes('lease') || lower.includes('compliance') || lower.includes('move-in')) {
        return getResidentIntelHref(residentSlug, 'lease');
    }
    if (lower.includes('portal') || lower.includes('access') || lower.includes('login')) {
        return `${residentViewHref(residentSlug)}?tab=portal`;
    }
    if (lower.includes('notice') || lower.includes('community')) {
        return `${residentViewHref(residentSlug)}?tab=community`;
    }
    return getResidentIntelHref(residentSlug, 'overview');
}
