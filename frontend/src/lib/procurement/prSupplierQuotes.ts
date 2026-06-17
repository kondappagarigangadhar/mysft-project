'use client';

import {
    getAllSupplierCapacity,
    getAllSupplierMaterials,
    getAllSupplierPricing,
} from '@/lib/suppliers/supplierRelationsStore';
import type { SupplierPricingRow } from '@/lib/suppliers/types';
import { getAllSupplierRecords } from '@/lib/suppliers/supplierStore';

export type PrSupplierQuoteRow = {
    supplierId: string;
    supplierName: string;
    quotedPrice: number | null;
    currency: string;
    availabilityStatus: 'Available' | 'Limited' | 'Unavailable';
    rating: number;
    isBestPrice: boolean;
    leadTimeDays: number;
    dailyCapacity: number;
    recommendationTags: string[];
};

function materialCatalogMatch(supplierId: string, materialNeedle: string): { materialName: string } | undefined {
    const needle = materialNeedle.trim().toLowerCase();
    if (!needle) return undefined;
    const rows = getAllSupplierMaterials().filter((m) => m.supplierId === supplierId);
    const exact = rows.find((m) => m.materialName.toLowerCase() === needle);
    if (exact) return { materialName: exact.materialName };
    return rows.find((m) => m.materialName.toLowerCase().includes(needle) || needle.includes(m.materialName.toLowerCase().slice(0, 6)));
}

function pricingMatch(supplierId: string, materialNeedle: string): SupplierPricingRow | undefined {
    const needle = materialNeedle.trim().toLowerCase();
    if (!needle) return undefined;
    const rows = getAllSupplierPricing().filter((p) => p.supplierId === supplierId && p.status === 'Active');
    const exact = rows.find((p) => p.material.trim().toLowerCase() === needle);
    if (exact) return exact;
    return rows.find((p) => p.material.toLowerCase().includes(needle) || needle.includes(p.material.toLowerCase().slice(0, 6)));
}

function capacityMatch(supplierId: string, materialNeedle: string) {
    const needle = materialNeedle.trim().toLowerCase();
    if (!needle) return undefined;
    const rows = getAllSupplierCapacity().filter((c) => c.supplierId === supplierId);
    const exact = rows.find((c) => c.material.trim().toLowerCase() === needle);
    if (exact) return exact;
    return rows.find((c) => c.material.toLowerCase().includes(needle) || needle.includes(c.material.toLowerCase().slice(0, 6)));
}

function suggestPrice(supplierId: string, materialNeedle: string): { price: number; currency: string } {
    const priced = pricingMatch(supplierId, materialNeedle);
    if (priced && Number.isFinite(priced.unitPrice) && priced.unitPrice > 0) {
        return { price: priced.unitPrice, currency: priced.currency.trim() || 'INR' };
    }
    const hit = materialCatalogMatch(supplierId, materialNeedle);
    const name = hit?.materialName ?? materialNeedle;
    const hash = (supplierId + name).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return { price: 800 + (hash % 4000), currency: 'INR' };
}

function availabilityFor(supplierId: string, materialNeedle: string): 'Available' | 'Limited' | 'Unavailable' {
    const cap = capacityMatch(supplierId, materialNeedle);
    if (cap) return cap.availabilityStatus;
    if (!materialCatalogMatch(supplierId, materialNeedle)) return 'Unavailable';
    const idx = supplierId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    if (idx % 7 === 0) return 'Limited';
    return 'Available';
}

function capacityMetrics(supplierId: string, material: string): { leadTimeDays: number; dailyCapacity: number } {
    const cap = capacityMatch(supplierId, material);
    return {
        leadTimeDays: cap?.leadTimeDays ?? 7 + (supplierId.length % 5),
        dailyCapacity: cap?.dailyCapacity ?? 0,
    };
}

function attachRecommendationTags(rows: PrSupplierQuoteRow[]): PrSupplierQuoteRow[] {
    const priced = rows.filter((r) => r.quotedPrice != null && r.quotedPrice > 0);
    const minPrice = priced.length ? Math.min(...priced.map((r) => r.quotedPrice!)) : null;
    const minLead = rows.length ? Math.min(...rows.map((r) => r.leadTimeDays)) : 0;
    const maxCap = rows.length ? Math.max(...rows.map((r) => r.dailyCapacity)) : 0;
    const maxRating = rows.length ? Math.max(...rows.map((r) => r.rating)) : 0;

    return rows.map((r) => {
        const tags: string[] = [];
        if (minPrice != null && r.quotedPrice === minPrice) tags.push('Lowest Price');
        if (r.availabilityStatus === 'Available') tags.push('Best Availability');
        if (r.leadTimeDays === minLead && minLead > 0) tags.push('Fast Delivery');
        if (r.rating === maxRating && maxRating > 0) tags.push('Top Rated Supplier');
        if (r.dailyCapacity === maxCap && maxCap > 0) tags.push('High Capacity');
        return { ...r, recommendationTags: tags };
    });
}

export type PrSupplierQuotePreserve = Pick<PrSupplierQuoteRow, 'supplierId' | 'quotedPrice' | 'currency'>;

export function preserveQuotesFromStored(
    quotes: PrSupplierQuotePreserve[],
): PrSupplierQuoteRow[] {
    return quotes.map((q) => ({
        supplierId: q.supplierId,
        supplierName: '',
        quotedPrice: q.quotedPrice,
        currency: q.currency,
        availabilityStatus: 'Available' as const,
        rating: 4,
        isBestPrice: false,
        leadTimeDays: 0,
        dailyCapacity: 0,
        recommendationTags: [],
    }));
}

/** Active suppliers with catalog alignment for the PR material. */
export function buildPrSupplierQuoteRows(material: string, preserve?: PrSupplierQuoteRow[]): PrSupplierQuoteRow[] {
    const suppliers = getAllSupplierRecords().filter((s) => s.status === 'Active');
    const prevById = new Map((preserve ?? []).map((r) => [r.supplierId, r]));
    const rows: PrSupplierQuoteRow[] = suppliers.map((s) => {
        const prev = prevById.get(s.id);
        const hint = suggestPrice(s.id, material);
        const metrics = capacityMetrics(s.id, material);
        return {
            supplierId: s.id,
            supplierName: s.name,
            quotedPrice: prev?.quotedPrice ?? hint.price,
            currency: prev?.currency ?? hint.currency,
            availabilityStatus: availabilityFor(s.id, material),
            rating: typeof s.rating === 'number' ? Math.min(5, Math.max(1, Math.round(Number(s.rating)))) : 4,
            isBestPrice: false,
            leadTimeDays: metrics.leadTimeDays,
            dailyCapacity: metrics.dailyCapacity,
            recommendationTags: [],
        };
    });
    return attachRecommendationTags(recomputeBestPriceFlags(rows));
}

export function recomputeBestPriceFlags(rows: PrSupplierQuoteRow[]): PrSupplierQuoteRow[] {
    const priced = rows.map((r) => r.quotedPrice).filter((p): p is number => p != null && Number.isFinite(p) && p > 0);
    const min = priced.length ? Math.min(...priced) : null;
    return rows.map((r) => ({
        ...r,
        isBestPrice: min != null && r.quotedPrice != null && r.quotedPrice === min,
    }));
}

/** Highest rating among quoted suppliers; tie-break: lower quoted price. */
export function computeBestSupplierQuoteId(rows: PrSupplierQuoteRow[]): string | null {
    const quoted = rows.filter((r) => r.quotedPrice != null && Number.isFinite(r.quotedPrice) && r.quotedPrice > 0);
    if (!quoted.length) return null;
    const maxR = Math.max(...quoted.map((r) => r.rating));
    const top = quoted.filter((r) => r.rating === maxR);
    top.sort((a, b) => (a.quotedPrice! - b.quotedPrice!));
    return top[0]?.supplierId ?? null;
}
