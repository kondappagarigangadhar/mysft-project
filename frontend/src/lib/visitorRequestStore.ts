'use client';

import type { VisitorRequest, VisitorStatus } from '@/modules/resident-portal/visitors/types';

export type StoredVisitorRequest = VisitorRequest & {
    residentSlug: string;
    residentName: string;
    propertyUnit?: string;
};

let _requests: StoredVisitorRequest[] = [];
let _storeEpoch = 0;
const _listeners = new Set<() => void>();

export function subscribeVisitorStore(listener: () => void) {
    _listeners.add(listener);
    return () => {
        _listeners.delete(listener);
    };
}

export function getVisitorStoreEpoch() {
    return _storeEpoch;
}

function notify() {
    _storeEpoch += 1;
    _listeners.forEach((l) => l());
}

function seedRequests(): StoredVisitorRequest[] {
    const rows: Omit<StoredVisitorRequest, 'id'>[] = [
        {
            residentSlug: 'ramesh-kumar',
            residentName: 'Ramesh Kumar',
            propertyUnit: 'Skyline Residency — Unit 101',
            name: 'Swati Reddy',
            mobile: '+91 90000 10001',
            vehicle: 'TS09AB1234',
            when: 'Today 7:00 PM',
            status: 'Approved',
            purpose: 'Family visit',
            requestedAt: 'Today 5:30 PM',
        },
        {
            residentSlug: 'ramesh-kumar',
            residentName: 'Ramesh Kumar',
            propertyUnit: 'Skyline Residency — Unit 101',
            name: 'Rahul Mehta',
            mobile: '+91 98765 43210',
            when: 'Tomorrow 10:30 AM',
            status: 'Approved',
            purpose: 'Guest visit',
            requestedAt: 'Today 4:00 PM',
        },
        {
            residentSlug: 'priya-mehta',
            residentName: 'Priya Mehta',
            propertyUnit: 'Riverfront Tower — Unit 1204',
            name: 'Amazon Delivery',
            mobile: '—',
            when: 'Today 6:15 PM',
            status: 'Approved',
            purpose: 'Package delivery',
            requestedAt: 'Today 6:12 PM',
        },
        {
            residentSlug: 'james-nguyen',
            residentName: 'James Nguyen',
            propertyUnit: 'Skyline Courts — Apt 902',
            name: 'Priya Sharma',
            mobile: '+91 91234 56789',
            when: 'Today 3:00 PM',
            status: 'Approved',
            purpose: 'Family visit',
            requestedAt: 'Today 2:45 PM',
        },
    ];
    return rows.map((row, i) => ({
        ...row,
        id: `V-${1001 + i}`,
    }));
}

_requests = seedRequests();

export function getVisitorRequestsForResident(residentSlug: string): StoredVisitorRequest[] {
    return _requests
        .filter((r) => r.residentSlug === residentSlug)
        .sort((a, b) => (b.requestedAt ?? '').localeCompare(a.requestedAt ?? ''));
}

export function getVisitorRequestByPassId(passId: string): StoredVisitorRequest | undefined {
    return _requests.find((r) => r.id === passId);
}

export function getAllVisitorRequests(): StoredVisitorRequest[] {
    return [..._requests].sort((a, b) => (b.requestedAt ?? '').localeCompare(a.requestedAt ?? ''));
}

export function addVisitorRequest(
    input: Omit<StoredVisitorRequest, 'id'> & { id?: string },
): StoredVisitorRequest {
    const row: StoredVisitorRequest = {
        ...input,
        id: input.id ?? `V-${Math.floor(1000 + Math.random() * 9000)}`,
        status: input.status ?? 'Approved',
    };
    _requests = [row, ..._requests];
    notify();
    return row;
}

export function updateVisitorRequestStatus(passId: string, status: VisitorStatus): StoredVisitorRequest | undefined {
    const idx = _requests.findIndex((r) => r.id === passId);
    if (idx < 0) return undefined;
    const next = { ..._requests[idx]!, status };
    _requests = _requests.map((r, i) => (i === idx ? next : r));
    notify();
    return next;
}

export type VisitorRequestPatch = Partial<
    Pick<StoredVisitorRequest, 'name' | 'mobile' | 'vehicle' | 'when' | 'purpose' | 'status'>
>;

export function updateVisitorRequest(passId: string, patch: VisitorRequestPatch): StoredVisitorRequest | undefined {
    const idx = _requests.findIndex((r) => r.id === passId);
    if (idx < 0) return undefined;
    const next = { ..._requests[idx]!, ...patch };
    _requests = _requests.map((r, i) => (i === idx ? next : r));
    notify();
    return next;
}

export function deleteVisitorRequest(passId: string): boolean {
    const before = _requests.length;
    _requests = _requests.filter((r) => r.id !== passId);
    if (_requests.length === before) return false;
    notify();
    return true;
}
