'use client';

import { MOCK_VENDOR_CONTRACTS, MOCK_VENDOR_DOCUMENTS } from '@/lib/vendors/mockData';
import type { VendorContract, VendorDocument } from '@/lib/vendors/types';
import { appendModuleContract, appendModuleDocument, getModuleContracts, getModuleDocuments } from '@/lib/vendors/vendorModuleStore';

export function getAllCatalogDocuments(): VendorDocument[] {
    const byId = new Map<string, VendorDocument>();
    for (const doc of [...MOCK_VENDOR_DOCUMENTS, ...getModuleDocuments()]) {
        byId.set(doc.id, doc);
    }
    return Array.from(byId.values());
}

export function getAllCatalogContracts(): VendorContract[] {
    const byId = new Map<string, VendorContract>();
    for (const c of [...MOCK_VENDOR_CONTRACTS, ...getModuleContracts()]) {
        byId.set(c.id, c);
    }
    return Array.from(byId.values());
}

export function getDocumentsForVendor(vendorId: string): VendorDocument[] {
    return getAllCatalogDocuments().filter((d) => d.vendorId === vendorId);
}

export function getContractsForVendor(vendorId: string): VendorContract[] {
    return getAllCatalogContracts().filter((c) => c.vendorId === vendorId);
}

/** Documents in the catalog not already on this vendor (for link-from-library flow). */
export function getLinkableDocumentsForVendor(vendorId: string): VendorDocument[] {
    const onVendor = new Set(getDocumentsForVendor(vendorId).map((d) => `${d.type}|${d.documentName}|${d.fileName ?? ''}`));
    return getAllCatalogDocuments().filter((d) => {
        if (d.vendorId === vendorId) return false;
        const key = `${d.type}|${d.documentName}|${d.fileName ?? ''}`;
        return !onVendor.has(key);
    });
}

/** Contracts in the catalog not already on this vendor. */
export function getLinkableContractsForVendor(vendorId: string): VendorContract[] {
    const onVendor = new Set(getContractsForVendor(vendorId).map((c) => `${c.contractName}|${c.startDate}|${c.endDate}`));
    return getAllCatalogContracts().filter((c) => {
        if (c.vendorId === vendorId) return false;
        const key = `${c.contractName}|${c.startDate}|${c.endDate}`;
        return !onVendor.has(key);
    });
}

export function linkDocumentToVendor(source: VendorDocument, vendorId: string): VendorDocument {
    const linked: VendorDocument = {
        ...source,
        id: `DOC-${Date.now()}`,
        vendorId,
        uploadedDate: new Date().toISOString().slice(0, 10),
    };
    appendModuleDocument(linked);
    return linked;
}

export function linkContractToVendor(source: VendorContract, vendorId: string): VendorContract {
    const linked: VendorContract = {
        ...source,
        id: `CNT-${Date.now()}`,
        vendorId,
    };
    appendModuleContract(linked);
    return linked;
}
