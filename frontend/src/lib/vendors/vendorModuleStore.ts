'use client';

import type { VendorContract, VendorDocument } from '@/lib/vendors/types';

const CONTRACTS_KEY = 'arris-vendor-module-contracts-v1';
const DOCUMENTS_KEY = 'arris-vendor-module-documents-v1';

function readJson<T>(key: string): T[] {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as T[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeJson<T>(key: string, rows: T[]) {
    try {
        localStorage.setItem(key, JSON.stringify(rows));
    } catch {
        // ignore
    }
}

export function getModuleContracts(): VendorContract[] {
    return readJson<VendorContract>(CONTRACTS_KEY);
}

export function appendModuleContract(item: VendorContract) {
    writeJson(CONTRACTS_KEY, [item, ...getModuleContracts()]);
}

export function getModuleDocuments(): VendorDocument[] {
    return readJson<VendorDocument>(DOCUMENTS_KEY);
}

export function appendModuleDocument(item: VendorDocument) {
    writeJson(DOCUMENTS_KEY, [item, ...getModuleDocuments()]);
}

export function updateModuleDocument(id: string, patch: Partial<VendorDocument>) {
    const rows = getModuleDocuments();
    const idx = rows.findIndex((d) => d.id === id);
    if (idx < 0) return;
    rows[idx] = { ...rows[idx]!, ...patch };
    writeJson(DOCUMENTS_KEY, rows);
}

export function removeModuleDocument(id: string) {
    writeJson(
        DOCUMENTS_KEY,
        getModuleDocuments().filter((d) => d.id !== id),
    );
}
