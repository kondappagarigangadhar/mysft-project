export type ResidentType = 'Owner' | 'Tenant' | 'Family Member';

export type ApprovalStatus = 'Draft' | 'OTP Verified' | 'Pending Approval' | 'Approved' | 'Rejected';

export type PaymentStatus = 'Paid' | 'Due' | 'Overdue';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TicketStatus = 'Raised' | 'Vendor Assigned' | 'SLA Started' | 'In Progress' | 'Resolved' | 'Closed';

export type MaintenanceCategory =
    | 'Water Leakage'
    | 'Plumbing'
    | 'Electricity'
    | 'Lift Issue'
    | 'Security'
    | 'Housekeeping'
    | 'Parking'
    | 'Noise'
    | 'Other';

export type VendorTeam = 'Plumbing' | 'Electrical' | 'Elevator' | 'Security' | 'Housekeeping' | 'Facilities';

export type ResidentProfile = {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    unitNumber: string;
    residentType: ResidentType;
    moveInDate: string; // ISO date
    approvalStatus: ApprovalStatus;
    rejectionReason?: string;
    avatarUrl?: string;
    lastLoginAt?: string; // ISO datetime
    /** Links portal account to Resident Management record (`platform/community/residents`). */
    adminResidentSlug?: string;
};

export type ResidentSession = {
    isAuthenticated: boolean;
    residentId?: string;
    remember: boolean;
};

export type MaintenanceTicketUpdate = {
    id: string;
    at: string; // ISO datetime
    by: 'System' | 'Vendor' | 'Resident';
    message: string;
    status?: TicketStatus;
};

export type MaintenanceTicket = {
    id: string;
    createdAt: string; // ISO datetime
    category: MaintenanceCategory;
    description: string;
    priority: Priority;
    preferredVisitWindow?: string;
    attachments?: { name: string; url?: string }[];
    assignedTeam?: VendorTeam;
    assignedVendorName?: string;
    status: TicketStatus;
    eta?: string;
    sla: {
        startedAt?: string;
        targetMinutes: number;
        breached: boolean;
    };
    updates: MaintenanceTicketUpdate[];
    rating?: number;
    feedback?: string;
};

export type Bill = {
    id: string;
    monthLabel: string; // e.g. "Apr 2026"
    rent: number;
    maintenance: number;
    utilities: number;
    total: number;
    dueDate: string; // ISO date
    status: PaymentStatus;
    paidAt?: string; // ISO datetime
    receiptId?: string;
};

export type Notice = {
    id: string;
    title: string;
    category: 'Community' | 'Maintenance' | 'Events' | 'Security' | 'Payments';
    createdAt: string; // ISO datetime
    content: string;
    attachments?: { name: string; url?: string }[];
    pinned?: boolean;
};

export type ResidentNotification = {
    id: string;
    at: string; // ISO datetime
    channel: 'App' | 'SMS' | 'Email' | 'WhatsApp';
    title: string;
    message: string;
    read: boolean;
    kind?: 'Payment' | 'Ticket' | 'Notice' | 'Visitor' | 'Amenity' | 'Security' | 'Lease';
};

