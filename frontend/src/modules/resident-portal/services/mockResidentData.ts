'use client';

import type { Bill, MaintenanceTicket, Notice, ResidentNotification, ResidentProfile } from '../utils/types';
import { DEMO_RESIDENT_PROFILE, DEMO_RESIDENT_SLUG } from '@/lib/residentDemoProfile';
import { countResidentHouseholdMembers, countResidentVehicles } from '@/lib/residentStore';
import { nowIso } from '../utils/date';

export function getMockBills(): Bill[] {
    const fmt = (yyyy: number, mm: number, dd: number) =>
        `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;

    return [
        {
            id: 'bill_current',
            monthLabel: 'Oct 2026',
            rent: 0,
            maintenance: 3200,
            utilities: 840,
            total: 4040,
            dueDate: fmt(2026, 10, 15),
            status: 'Due',
        },
        {
            id: 'bill_prev',
            monthLabel: 'Sep 2026',
            rent: 0,
            maintenance: 3200,
            utilities: 920,
            total: 4120,
            dueDate: fmt(2026, 9, 2),
            status: 'Paid',
            paidAt: nowIso(),
            receiptId: 'RCT-10421',
        },
    ];
}

export function getMockNotices(): Notice[] {
    return [
        {
            id: 'notice_1',
            title: 'Water supply maintenance (Block A)',
            category: 'Maintenance',
            createdAt: nowIso(),
            pinned: true,
            content:
                'Water supply will be interrupted on Friday 10:00 AM – 12:00 PM for scheduled valve maintenance. Please store water in advance.',
            attachments: [{ name: 'Maintenance Schedule.pdf' }],
        },
        {
            id: 'notice_2',
            title: 'Community event: Summer gathering',
            category: 'Events',
            createdAt: nowIso(),
            content: 'Join us this Sunday 6:00 PM at the clubhouse. Family-friendly games and refreshments included.',
        },
        {
            id: 'notice_3',
            title: 'Parking policy reminder',
            category: 'Security',
            createdAt: nowIso(),
            content:
                'Please ensure vehicles are parked within marked slots. Unauthorized parking may lead to towing as per community policy.',
        },
    ];
}

export function getMockTickets(): MaintenanceTicket[] {
    return [
        {
            id: 'REQ-20418',
            createdAt: nowIso(),
            category: 'Water Leakage',
            description: 'Leakage under kitchen sink. Water pooling near cabinet.',
            priority: 'High',
            preferredVisitWindow: 'Today 6:00 PM – 8:00 PM',
            attachments: [{ name: 'leak.jpg' }],
            assignedTeam: 'Plumbing',
            assignedVendorName: 'AquaFix Plumbing Co.',
            status: 'In Progress',
            eta: '2 hours',
            sla: { startedAt: nowIso(), targetMinutes: 180, breached: false },
            updates: [
                { id: 'u1', at: nowIso(), by: 'System', message: 'Issue raised successfully.', status: 'Raised' },
                { id: 'u2', at: nowIso(), by: 'System', message: 'Vendor assigned: AquaFix Plumbing Co.', status: 'Vendor Assigned' },
                { id: 'u3', at: nowIso(), by: 'Vendor', message: 'Technician en route. ETA 2 hours.', status: 'In Progress' },
            ],
        },
        {
            id: 'REQ-20377',
            createdAt: nowIso(),
            category: 'Lift Issue',
            description: 'Lift #2 stops between floors occasionally.',
            priority: 'Critical',
            preferredVisitWindow: 'Anytime',
            assignedTeam: 'Elevator',
            assignedVendorName: 'Otis Service',
            status: 'SLA Started',
            eta: '4 hours',
            sla: { startedAt: nowIso(), targetMinutes: 240, breached: false },
            updates: [
                { id: 'u1', at: nowIso(), by: 'System', message: 'Issue raised successfully.', status: 'Raised' },
                { id: 'u2', at: nowIso(), by: 'System', message: 'Vendor assigned: Otis Service', status: 'Vendor Assigned' },
                { id: 'u3', at: nowIso(), by: 'System', message: 'SLA timer started.', status: 'SLA Started' },
            ],
        },
    ];
}

export function getMockNotifications(): ResidentNotification[] {
    return [
        {
            id: 'n1',
            at: nowIso(),
            channel: 'App',
            title: 'Dues reminder',
            message: 'Maintenance dues are due in 5 days. Pay now to avoid late fee.',
            read: false,
            kind: 'Payment',
        },
        {
            id: 'n2',
            at: nowIso(),
            channel: 'WhatsApp',
            title: 'Ticket update',
            message: 'Technician assigned for REQ-20418. ETA 2 hours.',
            read: true,
            kind: 'Ticket',
        },
    ];
}

export function getMockUnitSummary(
    resident?: Pick<ResidentProfile, 'unitNumber' | 'moveInDate' | 'adminResidentSlug'>,
) {
    const d = DEMO_RESIDENT_PROFILE;
    const slug = resident?.adminResidentSlug ?? DEMO_RESIDENT_SLUG;
    return {
        unitNumber: resident?.unitNumber ?? d.unitNumber,
        community: d.communityName,
        members: countResidentHouseholdMembers(slug),
        vehicles: countResidentVehicles(slug),
        moveInDate: resident?.moveInDate ?? d.moveInDate,
    };
}

