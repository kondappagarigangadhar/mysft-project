import type { VisitorRequest } from './types';

export const MOCK_VISITOR_REQUESTS: VisitorRequest[] = [
    {
        id: 'V-1001',
        name: 'Swati Reddy',
        mobile: '+91 90000 10001',
        vehicle: 'TS09AB1234',
        when: 'Today 7:00 PM',
        status: 'Approved',
        purpose: 'Family visit',
        requestedAt: 'Today 5:30 PM',
    },
    {
        id: 'V-1002',
        name: 'Rahul Mehta',
        mobile: '+91 98765 43210',
        when: 'Tomorrow 10:30 AM',
        status: 'Approved',
        purpose: 'Guest visit',
        requestedAt: 'Today 4:00 PM',
    },
    {
        id: 'V-1003',
        name: 'Amazon Delivery',
        mobile: '—',
        when: 'Today 6:15 PM',
        status: 'Approved',
        purpose: 'Package delivery',
        requestedAt: 'Today 6:12 PM',
    },
    {
        id: 'V-1004',
        name: 'Priya Sharma',
        mobile: '+91 91234 56789',
        when: 'Today 3:00 PM',
        status: 'Approved',
        purpose: 'Family visit',
        requestedAt: 'Today 2:45 PM',
    },
    {
        id: 'V-1005',
        name: 'Swiggy Delivery',
        mobile: '—',
        when: 'Today 1:20 PM',
        status: 'Approved',
        purpose: 'Food delivery',
        requestedAt: 'Today 1:18 PM',
    },
];

/** @deprecated Use MOCK_VISITOR_REQUESTS */
export const MOCK_VISITOR_PASSES = MOCK_VISITOR_REQUESTS;
