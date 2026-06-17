import type { Vendor } from '@/lib/vendors/types';
import { MOCK_VENDOR_ASSIGNMENTS, MOCK_VENDORS } from '@/lib/vendors/mockData';

export function getCompletedTaskCount(): number {
    return MOCK_VENDOR_ASSIGNMENTS.filter((a) => a.status === 'Completed').length;
}

/** Portfolio SLA breach incidents (vendor-rolled + delayed open work). */
export function getSlaBreachPortfolioCount(): number {
    const vendorBreaches = MOCK_VENDORS.reduce((sum, v) => sum + v.slaBreaches, 0);
    const delayedOpen = MOCK_VENDOR_ASSIGNMENTS.filter((a) => a.status === 'Delayed').length;
    return vendorBreaches + delayedOpen;
}

export function getAverageVendorRating(vendors: Vendor[]): number {
    if (vendors.length === 0) return 0;
    return vendors.reduce((s, v) => s + v.rating, 0) / vendors.length;
}

export type RatingTier = 'high' | 'mid' | 'low';

export function ratingTier(rating: number): RatingTier {
    if (rating >= 4.2) return 'high';
    if (rating >= 3.4) return 'mid';
    return 'low';
}

/** Simple trend heuristic from operational signals (demo — replace with time-series from API). */
export function vendorRatingTrend(vendor: Vendor): 'up' | 'down' | 'flat' {
    if (vendor.delays >= 4 || vendor.slaBreaches >= 3) return 'down';
    if (vendor.delays <= 1 && vendor.rating >= 4.3) return 'up';
    return 'flat';
}

export function isRiskVendor(v: Vendor): boolean {
    return v.rating < 3.5 || v.delays >= 4 || v.slaBreaches >= 2;
}
