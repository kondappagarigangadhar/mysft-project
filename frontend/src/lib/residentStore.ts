'use client';

/**
 * Resident records — demo in-memory store (same pattern as `leadStore`).
 */

import { DEMO_RESIDENT_PROFILE, DEMO_RESIDENT_SLUG } from '@/lib/residentDemoProfile';

export type ResidentType = 'Owner' | 'Tenant' | 'Family Member';
export type ResidentStatusValue = 'Active' | 'Inactive' | 'Vacated';

export const RESIDENT_TYPE_OPTIONS: ResidentType[] = ['Owner', 'Tenant', 'Family Member'];
export const RESIDENT_STATUS_OPTIONS: ResidentStatusValue[] = ['Active', 'Inactive', 'Vacated'];
export const RESIDENT_USER_ROLE_OPTIONS = ['Resident Admin', 'Household Member', 'Guest Viewer', 'Property Liaison'] as const;
export type ResidentUserRole = (typeof RESIDENT_USER_ROLE_OPTIONS)[number];

/** Property / unit choices for dropdowns (demo catalogue). */
export const RESIDENT_PROPERTY_UNIT_OPTIONS: string[] = [
    'Skyline Residency — Unit 101',
    'Riverfront Tower — Unit 1204',
    'Riverfront Tower — Unit 0802',
    'Skyline Courts — Apt 902',
    'Garden Plaza — Villa 07',
    'Marina Views — Penthouse B',
    'Central Annex — Suite 310',
    'Courtyard Commons — Apt 055',
];

export type ResidentIdentityDocument = {
    id: string;
    fileName: string;
    sizeLabel: string;
    uploadedAt: string;
    mimeType: string;
    /** Optional demo payload for preview/download */
    blobUrl?: string;
};

export type NoticeCategory = 'General' | 'Emergency' | 'Event';
export const NOTICE_CATEGORY_OPTIONS: NoticeCategory[] = ['General', 'Emergency', 'Event'];

export type NoticeAudienceType = 'All' | 'Owners' | 'Tenants';
export const NOTICE_AUDIENCE_OPTIONS: NoticeAudienceType[] = ['All', 'Owners', 'Tenants'];

export type ResidentNoticeAttachment = {
    id: string;
    fileName: string;
    sizeLabel: string;
    uploadedAt: string;
    mimeType: string;
    blobUrl?: string;
};

export type ResidentNotice = {
    id: string;
    title: string;
    category: NoticeCategory;
    description: string;
    attachment: ResidentNoticeAttachment | null;
    publishDate: string;
    expiryDate: string;
    audienceTypes: NoticeAudienceType[];
    sendPushNotification: boolean;
    createdAt: string;
    updatedAt: string;
};

export type CommunityOccupancyType = 'Owner' | 'Tenant';
export const COMMUNITY_OCCUPANCY_TYPE_OPTIONS: CommunityOccupancyType[] = ['Owner', 'Tenant'];

export type CommunityOccupancyStatus = 'Occupied' | 'Vacant';
export const COMMUNITY_OCCUPANCY_STATUS_OPTIONS: CommunityOccupancyStatus[] = ['Occupied', 'Vacant'];

export const RESIDENT_TAG_PRESETS = ['VIP', 'Defaulter', 'Committee'] as const;
export type ResidentTagPreset = (typeof RESIDENT_TAG_PRESETS)[number];

export type ResidentTimelineLog = {
    id: string;
    at: string;
    kind: 'move-in' | 'move-out';
    note: string;
};

export const RESIDENT_VEHICLE_TYPE_OPTIONS = ['Car', 'Bike', 'Scooter', 'EV', 'Other'] as const;
export type ResidentVehicleType = (typeof RESIDENT_VEHICLE_TYPE_OPTIONS)[number];

/** Optional resident vehicles — none required; residents may register multiple. */
export type ResidentVehicle = {
    id: string;
    vehicleName: string;
    registrationNumber: string;
    vehicleType?: string;
    notes?: string;
};

export function createEmptyResidentVehicle(): ResidentVehicle {
    return {
        id: `vehicle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        vehicleName: '',
        registrationNumber: '',
        vehicleType: '',
        notes: '',
    };
}

export function residentVehicleHasContent(v: ResidentVehicle) {
    return Boolean(v.vehicleName.trim() || v.registrationNumber.trim() || v.notes?.trim());
}

/** Drop blank rows; normalize plate and optional fields (admin + portal share this). */
export function sanitizeResidentVehicles(list: ResidentVehicle[]): ResidentVehicle[] {
    return list
        .filter(residentVehicleHasContent)
        .map((v) => ({
            ...v,
            vehicleName: v.vehicleName.trim(),
            registrationNumber: v.registrationNumber.trim().toUpperCase(),
            vehicleType: v.vehicleType?.trim() || undefined,
            notes: v.notes?.trim() || undefined,
        }));
}

export function countResidentVehicles(slug: string): number {
    const row = _residents.find((r) => r.slug === slug && !r.deletedAt);
    if (!row) return 0;
    return sanitizeResidentVehicles(hydrateResident(row).vehicles ?? []).length;
}

export const HOUSEHOLD_RELATIONSHIP_OPTIONS = [
    'Spouse',
    'Child',
    'Parent',
    'Sibling',
    'Relative',
    'Domestic help',
    'Other',
] as const;

export type HouseholdRelationship = (typeof HOUSEHOLD_RELATIONSHIP_OPTIONS)[number];

/** Optional household members living in the unit — none required. */
export type ResidentHouseholdMember = {
    id: string;
    fullName: string;
    relationship?: string;
    phoneNumber?: string;
    notes?: string;
};

export function createEmptyHouseholdMember(): ResidentHouseholdMember {
    return {
        id: `household-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fullName: '',
        relationship: '',
        phoneNumber: '',
        notes: '',
    };
}

export function householdMemberHasContent(m: ResidentHouseholdMember) {
    return Boolean(m.fullName.trim() || m.relationship?.trim() || m.phoneNumber?.trim() || m.notes?.trim());
}

export function sanitizeResidentHousehold(list: ResidentHouseholdMember[]): ResidentHouseholdMember[] {
    return list
        .filter(householdMemberHasContent)
        .map((m) => ({
            ...m,
            fullName: m.fullName.trim(),
            relationship: m.relationship?.trim() || undefined,
            phoneNumber: m.phoneNumber?.trim() || undefined,
            notes: m.notes?.trim() || undefined,
        }));
}

export function countResidentHouseholdMembers(slug: string): number {
    const row = _residents.find((r) => r.slug === slug && !r.deletedAt);
    if (!row) return 0;
    return sanitizeResidentHousehold(hydrateResident(row).householdMembers ?? []).length;
}

export type ResidentCommunityRecord = {
    directoryResidentName: string;
    unitNumber: string;
    occupancyType: CommunityOccupancyType;
    contactVisibility: boolean;
    timelineLogs: ResidentTimelineLog[];
    occupancyStatus: CommunityOccupancyStatus;
    residentSearchQuery: string;
    tags: string[];
};

export type Resident = {
    id: number;
    slug: string;
    residentCode: string;
    fullName: string;
    residentType: ResidentType;
    phoneNumber: string;
    email: string;
    propertyUnit: string;
    moveInDate: string; // yyyy-mm-dd
    residentStatus: ResidentStatusValue;
    emergencyContactNumber: string;
    userRole: ResidentUserRole;
    portalAccessEnabled: boolean;
    loginUsername: string;
    temporaryPassword: string;
    accessExpiryDate: string; // yyyy-mm-dd
    identityDocument: ResidentIdentityDocument | null;
    vehicles?: ResidentVehicle[];
    householdMembers?: ResidentHouseholdMember[];
    notices: ResidentNotice[];
    communityRecord: ResidentCommunityRecord;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

function defaultCommunityRecord(r: Pick<Resident, 'fullName' | 'propertyUnit' | 'residentType' | 'moveInDate'>): ResidentCommunityRecord {
    const unit = r.propertyUnit.includes('—') ? r.propertyUnit.split('—').pop()?.trim() ?? r.propertyUnit : r.propertyUnit;
    const occType: CommunityOccupancyType = r.residentType === 'Owner' ? 'Owner' : 'Tenant';
    return {
        directoryResidentName: r.fullName,
        unitNumber: unit,
        occupancyType: occType,
        contactVisibility: true,
        timelineLogs: r.moveInDate
            ? [
                  {
                      id: `tl-${Date.now()}`,
                      at: `${r.moveInDate}T10:00`,
                      kind: 'move-in',
                      note: 'Initial move-in recorded',
                  },
              ]
            : [],
        occupancyStatus: 'Occupied',
        residentSearchQuery: '',
        tags: [],
    };
}

/** Demo notices tailored per resident for static workspace previews. */
function seedNoticesForResident(slug: string): ResidentNotice[] {
    const catalog: Record<string, Omit<ResidentNotice, 'id' | 'createdAt' | 'updatedAt'>[]> = {
        'ramesh-kumar': [
            {
                title: 'Welcome to Skyline Residency',
                category: 'General',
                description:
                    'Your resident portal is active for Unit 101. Complete profile verification and upload move-in documents within 7 days.',
                attachment: null,
                publishDate: '2024-06-20T10:00',
                expiryDate: '2026-12-31T18:00',
                audienceTypes: ['Owners'],
                sendPushNotification: true,
            },
            {
                title: 'Clubhouse renovation — June schedule',
                category: 'Event',
                description:
                    'The community clubhouse will host a resident meet-and-greet on Sunday 5:00 PM. RSVP via the portal amenities section.',
                attachment: null,
                publishDate: '2026-05-15T09:00',
                expiryDate: '2026-06-15T20:00',
                audienceTypes: ['All'],
                sendPushNotification: false,
            },
        ],
        'priya-mehta': [
            {
                title: 'Elevator maintenance — Tower A',
                category: 'General',
                description:
                    'Scheduled maintenance on elevators 1–2 this Saturday 9:00–14:00. Please use stairwell B if needed. Security will assist residents on floors 8+.',
                attachment: null,
                publishDate: '2026-05-10T09:00',
                expiryDate: '2026-05-17T18:00',
                audienceTypes: ['All'],
                sendPushNotification: true,
            },
            {
                title: 'Annual general meeting — May 28',
                category: 'Event',
                description:
                    'Owners and committee members are invited to the AGM in the Riverfront clubhouse at 18:30. Agenda: budget review, amenity upgrades, and Q&A.',
                attachment: null,
                publishDate: '2026-05-01T12:00',
                expiryDate: '2026-05-28T23:59',
                audienceTypes: ['Owners'],
                sendPushNotification: false,
            },
        ],
        'james-nguyen': [
            {
                title: 'Welcome to Skyline Courts — portal setup',
                category: 'General',
                description:
                    'Your resident portal is active. Complete profile verification and upload move-in photos within 7 days to unlock amenity bookings.',
                attachment: null,
                publishDate: '2025-11-20T10:00',
                expiryDate: '2026-06-30T18:00',
                audienceTypes: ['Tenants'],
                sendPushNotification: true,
            },
            {
                title: 'Fitness centre refurbishment',
                category: 'Event',
                description:
                    'The gym on level 2 will close 22–24 May for equipment upgrades. Temporary passes are available for the partner gym across the street.',
                attachment: null,
                publishDate: '2026-05-05T08:00',
                expiryDate: '2026-05-25T20:00',
                audienceTypes: ['All'],
                sendPushNotification: false,
            },
        ],
        'ananya-iyer': [
            {
                title: 'Community town hall',
                category: 'Event',
                description:
                    'Join the quarterly town hall in the clubhouse at 18:30. RSVP via the resident portal. Light refreshments will be served.',
                attachment: null,
                publishDate: '2026-04-01T12:00',
                expiryDate: '2026-04-15T23:59',
                audienceTypes: ['Owners', 'Tenants'],
                sendPushNotification: false,
            },
        ],
        'oliver-schmidt': [
            {
                title: 'Water supply interruption',
                category: 'Emergency',
                description:
                    'Emergency valve repair may interrupt water supply for 2 hours on Tuesday morning. Store drinking water in advance.',
                attachment: null,
                publishDate: '2026-03-20T08:00',
                expiryDate: '2026-03-21T20:00',
                audienceTypes: ['All'],
                sendPushNotification: true,
            },
            {
                title: 'Penthouse lift service notice',
                category: 'General',
                description:
                    'Express lift B will run on reduced hours during lobby renovation. Use lift A before 09:00 and after 19:00 without restriction.',
                attachment: null,
                publishDate: '2026-02-10T09:00',
                expiryDate: '2026-03-31T18:00',
                audienceTypes: ['Owners'],
                sendPushNotification: false,
            },
        ],
        'maria-lopez': [
            {
                title: 'Parcel locker PIN reset',
                category: 'General',
                description:
                    'Locker bank C PINs were reset for security. Collect your new PIN from concierge with photo ID between 09:00–18:00.',
                attachment: null,
                publishDate: '2026-04-18T11:00',
                expiryDate: '2026-05-18T18:00',
                audienceTypes: ['Tenants'],
                sendPushNotification: true,
            },
            {
                title: 'Fire safety drill — Central Annex',
                category: 'Emergency',
                description:
                    'Mandatory fire drill on Saturday 07:30. Follow marshals to assembly point P2. Elevators will be out of service during the drill.',
                attachment: null,
                publishDate: '2026-05-12T07:00',
                expiryDate: '2026-05-14T12:00',
                audienceTypes: ['All'],
                sendPushNotification: true,
            },
        ],
    };
    const rows = catalog[slug] ?? [
        {
            title: 'Community notice board',
            category: 'General' as NoticeCategory,
            description: 'Standard community announcement for this resident profile.',
            attachment: null,
            publishDate: '2026-05-01T09:00',
            expiryDate: '2026-12-31T18:00',
            audienceTypes: ['All'] as NoticeAudienceType[],
            sendPushNotification: false,
        },
    ];
    return rows.map((row, i) => seedNotice({ ...row, id: `notice-${slug}-${i + 1}` }));
}

function seedHouseholdForResident(slug: string): ResidentHouseholdMember[] {
    const catalog: Record<string, Omit<ResidentHouseholdMember, 'id'>[]> = {
        'ramesh-kumar': [
            { fullName: 'Lakshmi Kumar', relationship: 'Spouse', phoneNumber: '9876500002' },
            { fullName: 'Arjun Kumar', relationship: 'Child', notes: 'School ID on file' },
        ],
        'priya-mehta': [
            { fullName: 'Rahul Mehta', relationship: 'Spouse' },
            { fullName: 'Aisha Mehta', relationship: 'Child' },
        ],
        'james-nguyen': [{ fullName: 'Mai Nguyen', relationship: 'Spouse', phoneNumber: '9876500013' }],
        'ananya-iyer': [{ fullName: 'Vikram Iyer', relationship: 'Parent' }],
        'oliver-schmidt': [
            { fullName: 'Clara Schmidt', relationship: 'Spouse' },
            { fullName: 'Leo Schmidt', relationship: 'Child' },
        ],
        'maria-lopez': [
            { fullName: 'Carlos Lopez', relationship: 'Spouse', phoneNumber: '9556611112' },
            { fullName: 'Sofia Lopez', relationship: 'Child' },
        ],
    };
    const rows = catalog[slug] ?? [];
    return rows.map((row, i) => ({ ...row, id: `household-${slug}-${i + 1}` }));
}

function seedVehiclesForResident(slug: string): ResidentVehicle[] {
    const catalog: Record<string, Omit<ResidentVehicle, 'id'>[]> = {
        'ramesh-kumar': [
            {
                vehicleName: 'Honda City',
                registrationNumber: 'TS09AB1234',
                vehicleType: 'Car',
                notes: 'Basement slot B-12',
            },
            {
                vehicleName: 'Honda Activa',
                registrationNumber: 'TS09XY9876',
                vehicleType: 'Scooter',
            },
        ],
        'priya-mehta': [
            {
                vehicleName: 'BMW X5',
                registrationNumber: 'MH12CD5678',
                vehicleType: 'Car',
                notes: 'Covered parking P3-08',
            },
        ],
        'james-nguyen': [
            {
                vehicleName: 'Tesla Model 3',
                registrationNumber: 'KA03EV2201',
                vehicleType: 'EV',
                notes: 'EV charging bay E-02',
            },
        ],
        'oliver-schmidt': [
            {
                vehicleName: 'Mercedes E-Class',
                registrationNumber: 'DL01AB9999',
                vehicleType: 'Car',
            },
            {
                vehicleName: 'Royal Enfield',
                registrationNumber: 'DL01XY4455',
                vehicleType: 'Bike',
            },
        ],
        'ananya-iyer': [
            {
                vehicleName: 'Hyundai Creta',
                registrationNumber: 'KA05MH3344',
                vehicleType: 'Car',
                notes: 'Visitor parking P1-22',
            },
        ],
        'maria-lopez': [
            {
                vehicleName: 'Toyota Yaris',
                registrationNumber: 'TN07BK7788',
                vehicleType: 'Car',
                notes: 'Slot C-14',
            },
            {
                vehicleName: 'TVS Jupiter',
                registrationNumber: 'TN07SC1122',
                vehicleType: 'Scooter',
            },
        ],
    };
    const rows = catalog[slug] ?? [];
    return rows.map((row, i) => ({ ...row, id: `vehicle-${slug}-${i + 1}` }));
}

function hydrateResident(row: Resident): Resident {
    return {
        ...row,
        vehicles: row.vehicles ?? seedVehiclesForResident(row.slug),
        householdMembers: row.householdMembers ?? seedHouseholdForResident(row.slug),
        notices: row.notices?.length ? row.notices : seedNoticesForResident(row.slug),
        communityRecord:
            row.communityRecord ??
            defaultCommunityRecord({
                fullName: row.fullName,
                propertyUnit: row.propertyUnit,
                residentType: row.residentType,
                moveInDate: row.moveInDate,
            }),
    };
}

function seedNotice(partial: Omit<ResidentNotice, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): ResidentNotice {
    const now = new Date().toISOString();
    return {
        id: partial.id ?? `notice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: partial.title,
        category: partial.category,
        description: partial.description,
        attachment: partial.attachment,
        publishDate: partial.publishDate,
        expiryDate: partial.expiryDate,
        audienceTypes: partial.audienceTypes,
        sendPushNotification: partial.sendPushNotification,
        createdAt: now,
        updatedAt: now,
    };
}

function slugify(raw: string): string {
    return raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 72);
}

let _nextId = 9100;

function formatResidentCode(id: number) {
    return `RES-${String(id).padStart(5, '0')}`;
}

function ensureUniqueSlug(base: string): string {
    const taken = new Set(_residents.map((r) => r.slug));
    if (!taken.has(base)) return base;
    let i = 2;
    while (taken.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
}

const seedNow = new Date().toISOString();

const _seed: Resident[] = [
    {
        id: 90000,
        slug: DEMO_RESIDENT_SLUG,
        residentCode: formatResidentCode(90000),
        fullName: DEMO_RESIDENT_PROFILE.fullName,
        residentType: DEMO_RESIDENT_PROFILE.residentType,
        phoneNumber: DEMO_RESIDENT_PROFILE.phone,
        email: DEMO_RESIDENT_PROFILE.email,
        propertyUnit: DEMO_RESIDENT_PROFILE.propertyUnit,
        moveInDate: DEMO_RESIDENT_PROFILE.moveInDate,
        residentStatus: 'Active',
        emergencyContactNumber: DEMO_RESIDENT_PROFILE.emergencyContact,
        userRole: DEMO_RESIDENT_PROFILE.userRole,
        portalAccessEnabled: true,
        loginUsername: DEMO_RESIDENT_PROFILE.loginUsername,
        temporaryPassword: 'Temp#90000',
        accessExpiryDate: '2027-06-30',
        identityDocument: {
            id: 'doc-ramesh',
            fileName: 'aadhaar-ramesh-kumar.pdf',
            sizeLabel: '380 KB',
            uploadedAt: seedNow,
            mimeType: 'application/pdf',
        },
        vehicles: seedVehiclesForResident(DEMO_RESIDENT_SLUG),
        householdMembers: seedHouseholdForResident(DEMO_RESIDENT_SLUG),
        notices: seedNoticesForResident(DEMO_RESIDENT_SLUG),
        communityRecord: {
            ...defaultCommunityRecord({
                fullName: DEMO_RESIDENT_PROFILE.fullName,
                propertyUnit: DEMO_RESIDENT_PROFILE.propertyUnit,
                residentType: DEMO_RESIDENT_PROFILE.residentType,
                moveInDate: DEMO_RESIDENT_PROFILE.moveInDate,
            }),
            tags: ['VIP'],
        },
        createdAt: seedNow,
        updatedAt: seedNow,
        deletedAt: null,
    },
    {
        id: 90001,
        slug: 'priya-mehta',
        residentCode: formatResidentCode(90001),
        fullName: 'Priya Mehta',
        residentType: 'Owner',
        phoneNumber: '9820012345',
        email: 'priya.mehta@example.com',
        propertyUnit: 'Riverfront Tower — Unit 1204',
        moveInDate: '2024-02-01',
        residentStatus: 'Active',
        emergencyContactNumber: '9811122233',
        userRole: 'Resident Admin',
        portalAccessEnabled: true,
        loginUsername: 'priya.mehta',
        temporaryPassword: 'Temp#90001',
        accessExpiryDate: '2027-01-31',
        identityDocument: {
            id: 'doc-1',
            fileName: 'passport-scan.pdf',
            sizeLabel: '420 KB',
            uploadedAt: seedNow,
            mimeType: 'application/pdf',
        },
        vehicles: seedVehiclesForResident('priya-mehta'),
        householdMembers: seedHouseholdForResident('priya-mehta'),
        notices: seedNoticesForResident('priya-mehta'),
        communityRecord: {
            ...defaultCommunityRecord({
                fullName: 'Priya Mehta',
                propertyUnit: 'Riverfront Tower — Unit 1204',
                residentType: 'Owner',
                moveInDate: '2024-02-01',
            }),
            tags: ['VIP', 'Committee'],
        },
        createdAt: seedNow,
        updatedAt: seedNow,
        deletedAt: null,
    },
    {
        id: 90002,
        slug: 'james-nguyen',
        residentCode: formatResidentCode(90002),
        fullName: 'James Nguyen',
        residentType: 'Tenant',
        phoneNumber: '9876500011',
        email: 'james.nguyen@example.com',
        propertyUnit: 'Skyline Courts — Apt 902',
        moveInDate: '2025-11-18',
        residentStatus: 'Active',
        emergencyContactNumber: '9876500012',
        userRole: 'Household Member',
        portalAccessEnabled: true,
        loginUsername: 'j.nguyen',
        temporaryPassword: 'Temp#90002',
        accessExpiryDate: '2026-06-01',
        identityDocument: null,
        vehicles: seedVehiclesForResident('james-nguyen'),
        householdMembers: seedHouseholdForResident('james-nguyen'),
        notices: seedNoticesForResident('james-nguyen'),
        communityRecord: {
            ...defaultCommunityRecord({
                fullName: 'James Nguyen',
                propertyUnit: 'Skyline Courts — Apt 902',
                residentType: 'Tenant',
                moveInDate: '2025-11-18',
            }),
            tags: ['VIP'],
        },
        createdAt: seedNow,
        updatedAt: seedNow,
        deletedAt: null,
    },
    {
        id: 90003,
        slug: 'ananya-iyer',
        residentCode: formatResidentCode(90003),
        fullName: 'Ananya Iyer',
        residentType: 'Family Member',
        phoneNumber: '9123459876',
        email: 'ananya.iyer@example.com',
        propertyUnit: 'Garden Plaza — Villa 07',
        moveInDate: '2023-08-10',
        residentStatus: 'Inactive',
        emergencyContactNumber: '9123400000',
        userRole: 'Guest Viewer',
        portalAccessEnabled: false,
        loginUsername: 'ananya.iyer',
        temporaryPassword: '',
        accessExpiryDate: '2025-12-15',
        identityDocument: {
            id: 'doc-2',
            fileName: 'aadhaar-redacted.pdf',
            sizeLabel: '310 KB',
            uploadedAt: seedNow,
            mimeType: 'application/pdf',
        },
        vehicles: seedVehiclesForResident('ananya-iyer'),
        householdMembers: seedHouseholdForResident('ananya-iyer'),
        notices: seedNoticesForResident('ananya-iyer'),
        communityRecord: {
            ...defaultCommunityRecord({
                fullName: 'Ananya Iyer',
                propertyUnit: 'Garden Plaza — Villa 07',
                residentType: 'Family Member',
                moveInDate: '2023-08-10',
            }),
            occupancyStatus: 'Vacant',
            tags: ['Defaulter'],
        },
        createdAt: seedNow,
        updatedAt: seedNow,
        deletedAt: null,
    },
    {
        id: 90004,
        slug: 'oliver-schmidt',
        residentCode: formatResidentCode(90004),
        fullName: 'Oliver Schmidt',
        residentType: 'Owner',
        phoneNumber: '9003344556',
        email: 'oliver.schmidt@example.com',
        propertyUnit: 'Marina Views — Penthouse B',
        moveInDate: '2022-05-21',
        residentStatus: 'Vacated',
        emergencyContactNumber: '9003344999',
        userRole: 'Property Liaison',
        portalAccessEnabled: false,
        loginUsername: 'o.schmidt',
        temporaryPassword: 'Temp#90004',
        accessExpiryDate: '2025-03-01',
        identityDocument: null,
        vehicles: seedVehiclesForResident('oliver-schmidt'),
        householdMembers: seedHouseholdForResident('oliver-schmidt'),
        notices: seedNoticesForResident('oliver-schmidt'),
        communityRecord: {
            ...defaultCommunityRecord({
                fullName: 'Oliver Schmidt',
                propertyUnit: 'Marina Views — Penthouse B',
                residentType: 'Owner',
                moveInDate: '2022-05-21',
            }),
            occupancyStatus: 'Vacant',
            timelineLogs: [
                { id: 'tl-oliver-in', at: '2022-05-21T11:00', kind: 'move-in', note: 'Move-in completed' },
                { id: 'tl-oliver-out', at: '2025-02-28T16:00', kind: 'move-out', note: 'Vacated — keys returned' },
            ],
        },
        createdAt: seedNow,
        updatedAt: seedNow,
        deletedAt: null,
    },
    {
        id: 90005,
        slug: 'maria-lopez',
        residentCode: formatResidentCode(90005),
        fullName: 'Maria Lopez',
        residentType: 'Tenant',
        phoneNumber: '9556677889',
        email: 'maria.lopez@example.com',
        propertyUnit: 'Central Annex — Suite 310',
        moveInDate: '2026-01-05',
        residentStatus: 'Active',
        emergencyContactNumber: '9556611111',
        userRole: 'Household Member',
        portalAccessEnabled: true,
        loginUsername: 'maria.lopez',
        temporaryPassword: 'Temp#90005',
        accessExpiryDate: '2026-12-31',
        identityDocument: {
            id: 'doc-3',
            fileName: 'drivers-license.jpg',
            sizeLabel: '1.1 MB',
            uploadedAt: seedNow,
            mimeType: 'image/jpeg',
        },
        vehicles: seedVehiclesForResident('maria-lopez'),
        householdMembers: seedHouseholdForResident('maria-lopez'),
        notices: seedNoticesForResident('maria-lopez'),
        communityRecord: {
            ...defaultCommunityRecord({
                fullName: 'Maria Lopez',
                propertyUnit: 'Central Annex — Suite 310',
                residentType: 'Tenant',
                moveInDate: '2026-01-05',
            }),
            tags: ['Committee'],
        },
        createdAt: seedNow,
        updatedAt: seedNow,
        deletedAt: null,
    },
];

_nextId = Math.max(..._seed.map((r) => r.id), _nextId) + 1;

let _residents: Resident[] = [..._seed];

let _residentStoreEpoch = 0;
const _residentStoreListeners = new Set<() => void>();

export function subscribeResidentStore(listener: () => void) {
    _residentStoreListeners.add(listener);
    return () => {
        _residentStoreListeners.delete(listener);
    };
}

export function getResidentStoreEpoch() {
    return _residentStoreEpoch;
}

function notifyResidentStore() {
    _residentStoreEpoch += 1;
    _residentStoreListeners.forEach((listener) => listener());
}

export function getResidents(): Resident[] {
    return _residents.filter((r) => !r.deletedAt).map(hydrateResident);
}

export function getArchivedResidents(): Resident[] {
    return _residents.filter((r) => Boolean(r.deletedAt)).map(hydrateResident);
}

export function getResidentBySlug(slug: string): Resident | undefined {
    const row = _residents.find((r) => r.slug === slug && !r.deletedAt);
    return row ? hydrateResident(row) : undefined;
}

export function getResidentBySlugIncludingArchived(slug: string): Resident | undefined {
    const row = _residents.find((r) => r.slug === slug);
    return row ? hydrateResident(row) : undefined;
}

export function peekNextResidentId(): number {
    return Math.max(..._residents.map((r) => r.id), _nextId - 1, 89999) + 1;
}

export function peekNextResidentCode(): string {
    return formatResidentCode(peekNextResidentId());
}

/** New-record scaffold for `/…/view/new` workspace (not persisted until save). */
export function createDraftResidentRecord(): Resident {
    const now = new Date().toISOString();
    const ymd = now.slice(0, 10);
    const code = peekNextResidentCode();
    return {
        id: -1,
        slug: 'new',
        residentCode: code,
        fullName: '',
        residentType: 'Tenant',
        phoneNumber: '',
        email: '',
        propertyUnit: RESIDENT_PROPERTY_UNIT_OPTIONS[0] ?? '',
        moveInDate: ymd,
        residentStatus: 'Active',
        emergencyContactNumber: '',
        userRole: 'Household Member',
        portalAccessEnabled: false,
        loginUsername: '',
        temporaryPassword: '',
        accessExpiryDate: ymd,
        identityDocument: null,
        notices: [],
        communityRecord: defaultCommunityRecord({
            fullName: '',
            propertyUnit: RESIDENT_PROPERTY_UNIT_OPTIONS[0] ?? '',
            residentType: 'Tenant',
            moveInDate: ymd,
        }),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
    };
}

export function bulkSetResidentStatus(slugs: string[], status: ResidentStatusValue): void {
    const set = new Set(slugs);
    const now = new Date().toISOString();
    _residents = _residents.map((r) => (set.has(r.slug) && !r.deletedAt ? { ...r, residentStatus: status, updatedAt: now } : r));
}

export function bulkArchiveResidents(slugs: string[]): void {
    const set = new Set(slugs);
    const now = new Date().toISOString();
    _residents = _residents.map((r) =>
        set.has(r.slug) && !r.deletedAt ? { ...r, deletedAt: now, updatedAt: now, residentStatus: 'Vacated' } : r,
    );
}

export function bulkDeleteResidentsPermanent(slugs: string[]): void {
    const set = new Set(slugs);
    _residents = _residents.filter((r) => !set.has(r.slug));
}

export function addResident(patch: Omit<Partial<Resident>, 'id' | 'slug' | 'residentCode'> & Pick<Resident, 'fullName'>): Resident {
    const id = peekNextResidentId();
    _nextId = id + 1;
    const slug = ensureUniqueSlug(slugify(`${patch.fullName}-${id}`));
    const now = new Date().toISOString();
    const ymd = now.slice(0, 10);
    const row: Resident = {
        id,
        slug,
        residentCode: formatResidentCode(id),
        fullName: patch.fullName.trim(),
        residentType: patch.residentType ?? 'Tenant',
        phoneNumber: patch.phoneNumber?.trim() ?? '',
        email: patch.email?.trim() ?? '',
        propertyUnit: patch.propertyUnit ?? RESIDENT_PROPERTY_UNIT_OPTIONS[0] ?? '',
        moveInDate: patch.moveInDate ?? ymd,
        residentStatus: patch.residentStatus ?? 'Active',
        emergencyContactNumber: patch.emergencyContactNumber?.trim() ?? '',
        userRole: patch.userRole ?? 'Household Member',
        portalAccessEnabled: patch.portalAccessEnabled ?? false,
        loginUsername: patch.loginUsername?.trim() ?? '',
        temporaryPassword: patch.temporaryPassword ?? '',
        accessExpiryDate: patch.accessExpiryDate ?? ymd,
        identityDocument: patch.identityDocument ?? null,
        vehicles: patch.vehicles ?? [],
        householdMembers: patch.householdMembers ?? [],
        notices: patch.notices ?? [],
        communityRecord:
            patch.communityRecord ??
            defaultCommunityRecord({
                fullName: patch.fullName.trim(),
                propertyUnit: patch.propertyUnit ?? RESIDENT_PROPERTY_UNIT_OPTIONS[0] ?? '',
                residentType: patch.residentType ?? 'Tenant',
                moveInDate: patch.moveInDate ?? ymd,
            }),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
    };
    _residents = [..._residents, row];
    notifyResidentStore();
    return row;
}

export function upsertResidentNotice(
    slug: string,
    notice: ResidentNotice,
): Resident | undefined {
    const prev = _residents.find((r) => r.slug === slug);
    if (!prev) return undefined;
    const idx = prev.notices.findIndex((n) => n.id === notice.id);
    const now = new Date().toISOString();
    const row: ResidentNotice = { ...notice, updatedAt: now, createdAt: idx >= 0 ? prev.notices[idx]!.createdAt : now };
    const notices = idx >= 0 ? prev.notices.map((n) => (n.id === notice.id ? row : n)) : [...prev.notices, row];
    return updateResident(slug, { notices });
}

export function deleteResidentNotice(slug: string, noticeId: string): Resident | undefined {
    const prev = _residents.find((r) => r.slug === slug);
    if (!prev) return undefined;
    return updateResident(slug, { notices: prev.notices.filter((n) => n.id !== noticeId) });
}

export function updateResidentCommunityRecord(
    slug: string,
    patch: Partial<ResidentCommunityRecord>,
): Resident | undefined {
    const prev = _residents.find((r) => r.slug === slug);
    if (!prev) return undefined;
    return updateResident(slug, { communityRecord: { ...prev.communityRecord, ...patch } });
}

export function addResidentTimelineLog(
    slug: string,
    log: Omit<ResidentTimelineLog, 'id'> & { id?: string },
): Resident | undefined {
    const prev = _residents.find((r) => r.slug === slug);
    if (!prev) return undefined;
    const entry: ResidentTimelineLog = { ...log, id: log.id ?? `tl-${Date.now()}` };
    return updateResidentCommunityRecord(slug, {
        timelineLogs: [...prev.communityRecord.timelineLogs, entry],
    });
}

export function updateResident(slug: string, patch: Partial<Omit<Resident, 'id' | 'slug' | 'residentCode'>>): Resident | undefined {
    const prev = _residents.find((r) => r.slug === slug);
    if (!prev) return undefined;
    const now = new Date().toISOString();
    const next: Resident = { ...prev, ...patch, slug: prev.slug, id: prev.id, residentCode: prev.residentCode, updatedAt: now };
    _residents = _residents.map((r) => (r.slug === slug ? next : r));
    notifyResidentStore();
    return next;
}

/** Archive (soft-hide) — same semantics as archived leads. */
export function archiveResident(slug: string): boolean {
    const r = _residents.find((x) => x.slug === slug && !x.deletedAt);
    if (!r) return false;
    const now = new Date().toISOString();
    updateResident(slug, { deletedAt: now, residentStatus: 'Vacated' });
    return true;
}

/** Remove record permanently from the demo store. */
export function deleteResidentPermanent(slug: string): boolean {
    const before = _residents.length;
    _residents = _residents.filter((x) => x.slug !== slug);
    return _residents.length < before;
}

export function duplicateResident(slug: string): Resident | undefined {
    const src = _residents.find((r) => r.slug === slug && !r.deletedAt);
    if (!src) return undefined;
    const copyName = `${src.fullName} (Copy)`;
    const copy = addResident({
        fullName: copyName,
        residentType: src.residentType,
        phoneNumber: src.phoneNumber,
        email: src.email,
        propertyUnit: src.propertyUnit,
        moveInDate: src.moveInDate,
        residentStatus: 'Active',
        emergencyContactNumber: src.emergencyContactNumber,
        userRole: src.userRole,
        portalAccessEnabled: src.portalAccessEnabled,
        loginUsername: `${src.loginUsername}_copy`,
        temporaryPassword: src.temporaryPassword,
        accessExpiryDate: src.accessExpiryDate,
        identityDocument: src.identityDocument ? { ...src.identityDocument, id: `doc-${Date.now()}`, uploadedAt: new Date().toISOString() } : null,
        vehicles: src.vehicles?.map((v) => ({ ...v, id: `vehicle-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })) ?? [],
        householdMembers:
            src.householdMembers?.map((m) => ({ ...m, id: `household-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })) ?? [],
        notices: src.notices.map((n) => ({ ...n, id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })),
        communityRecord: { ...src.communityRecord, timelineLogs: [...src.communityRecord.timelineLogs] },
    });
    return copy;
}

export function normalizeResidentPhoneDigits(phone: string): string {
    return String(phone ?? '').replace(/\D/g, '');
}
