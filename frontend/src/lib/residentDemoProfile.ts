/**
 * Canonical demo resident — kept in sync between Resident Management (admin)
 * and the Resident Portal SSO / quick-login account.
 */
export const DEMO_RESIDENT_SLUG = 'ramesh-kumar';

export const DEMO_RESIDENT_PORTAL_ID = 'resident_demo_1';

export const DEMO_RESIDENT_PROFILE = {
    fullName: 'Ramesh Kumar',
    email: 'ramesh.kumar@example.com',
    phone: '9876543210',
    phoneDisplay: '+91 98765 43210',
    propertyUnit: 'Skyline Residency — Unit 101',
    unitNumber: '101',
    communityName: 'Skyline Residency',
    residentType: 'Owner' as const,
    moveInDate: '2024-06-15',
    loginUsername: 'ramesh.kumar',
    emergencyContact: '9876500001',
    userRole: 'Resident Admin' as const,
};
