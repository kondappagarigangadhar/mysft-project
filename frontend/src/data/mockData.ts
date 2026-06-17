export interface Company {
    id: number;
    name: string;
    owner: string;
    status: 'Active' | 'Pending' | 'Suspended' | 'Inactive';
    revenue: string;
    joinedDate: string;
    logo?: string;
    tenantCode: string;
    domain: string;
    country: string;
    plan: 'Basic' | 'Pro' | 'Enterprise';
    usersCount: number;
    createdAt: string;
    // New fields from Create Tenant form
    businessType: 'Builder' | 'Association' | 'Developer';
    email: string;
    phone: string;
    address?: string;
    city: string;
    state: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    maxUsers?: number;
    storageLimit?: number;
    lastUpdated?: string;
}

export interface Project {
    id: number;
    companyId: number;
    clientId: number;
    name: string;
    location: string;
    status: 'In Progress' | 'Planning' | 'Completed' | 'On Hold';
    progress: number;
    startDate: string;
    endDate: string;
    budget: string;
}

export interface Client {
    id: number;
    companyId: number;
    name: string;
    email: string;
    phone: string;
    status: 'Active' | 'Inactive' | 'Pending';
    location: string;
}

export interface Vendor {
    id: number;
    companyId: number;
    name: string;
    email: string;
    phone: string;
    status: 'Active' | 'Inactive' | 'Verified';
}

export interface Material {
    id: number;
    companyId: number;
    vendorId: number;
    name: string;
    category: string;
    sku: string;
    stock: string;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    phoneNumber: string;
    designation: string;
    role: string;
    /** Display name for assigned RBAC role */
    roleName?: string;
    roleDescription?: string;
    permissions?: string[];
    department: string;
    tenantId: number;
    tenantName: string;
    status: 'Active' | 'Disabled' | 'Pending' | 'Inactive' | 'Suspended';
    createdDate: string;
    joined: string;
    avatar?: string;
    businessUnitId?: number;
    businessUnitName?: string;
    /** Optional HR / directory fields */
    employeeId?: string;
    lastLogin?: string;
    updatedDate?: string;
    reportingManager?: string;
}

export interface Document {
    id: number;
    name: string;
    type: string;
    size: string;
    date: string;
    status: 'Final' | 'Draft' | 'Archived';
}

export interface Activity {
    id: number;
    type: 'Update' | 'Alert' | 'Milestone' | 'Log';
    title: string;
    description: string;
    timestamp: string;
    user: string;
}

export interface ProjectTask {
    id: number;
    projectId: number;
    name: string;
    status: 'Completed' | 'In Progress' | 'Pending' | 'Delayed';
    dueDate: string;
    assignee: string;
}

export interface SupportTicket {
    id: number;
    subject: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    category: 'Technical' | 'Billing' | 'Access' | 'Feature Request';
    createdAt: string;
    lastUpdate: string;
}

export interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'Info' | 'Success' | 'Warning' | 'Error';
    category: 'Project' | 'Finance' | 'User' | 'System';
}

export interface SecurityLog {
    id: number;
    event: string;
    user: string;
    ip: string;
    location: string;
    time: string;
    status: 'Success' | 'Failure' | 'Warning';
}

export interface BusinessUnit {
    id: number;
    name: string;
    code: string;
    parentOrganizationId: number;
    parentOrganizationName: string;
    defaultProjectScope: string[];
    createdDate: string;
    status: 'Active' | 'Inactive';
}

export interface Department {
    id: number;
    name: string;
    code: string;
    businessUnitId: number;
    businessUnitName: string;
    departmentHeadId?: number;
    departmentHeadName?: string;
    usersCount: number;
    status: 'Active' | 'Inactive';
    createdDate: string;
    /** ISO timestamp for audit row (last updated). */
    updatedAt?: string;
    description?: string;
    associatedProjectsCount?: number;
}

export const companies: Company[] = [
    { 
        id: 6,
        name: 'Atlas Construction Group',
        owner: 'Rajesh Kumar',
        status: 'Active',
        revenue: '₹18.7M',
        joinedDate: 'Feb 2024',
        tenantCode: 'ATL-CON',
        domain: 'atlasconstruction.com',
        country: 'India',
        plan: 'Enterprise',
        usersCount: 98,
        createdAt: '2024-02-10',
        businessType: 'Builder',
        email: 'hello@atlasconstruction.com',
        phone: '+91 98765 12345',
        address: 'Atlas Corporate Center, Hitech City',
        city: 'Hyderabad',
        state: 'Telangana',
        adminName: 'Rajesh Kumar',
        adminEmail: 'rajesh.kumar@atlasconstruction.com',
        adminPhone: '+91 98765 54321',
        maxUsers: 150,
        storageLimit: 750,
        lastUpdated: '2024-03-12'
    },
    { 
        id: 1, 
        name: 'Skyline Builders', 
        owner: 'John Doe', 
        status: 'Active', 
        revenue: '₹12.4M', 
        joinedDate: 'Jan 2022',
        tenantCode: 'SKY-BLD',
        domain: 'skylinebuilders.com',
        country: 'India',
        plan: 'Enterprise',
        usersCount: 124,
        createdAt: '2022-01-15',
        businessType: 'Builder',
        email: 'contact@skylinebuilders.com',
        phone: '9876543210',
        address: '14 Builder Street, BKC',
        city: 'Mumbai',
        state: 'Maharashtra',
        adminName: 'John Doe',
        adminEmail: 'john.doe@skylinebuilders.com',
        adminPhone: '9876543211',
        maxUsers: 150,
        storageLimit: 500,
        lastUpdated: '2024-03-01'
    },
    { 
        id: 2, 
        name: 'Urban Flux Co.', 
        owner: 'Sarah Smith', 
        status: 'Active', 
        revenue: '₹8.2M', 
        joinedDate: 'Mar 2022',
        tenantCode: 'URB-FLX',
        domain: 'urbanflux.io',
        country: 'India',
        plan: 'Pro',
        usersCount: 56,
        createdAt: '2022-03-10',
        businessType: 'Developer',
        email: 'hello@urbanflux.io',
        phone: '9845001122',
        address: '7th Floor, Urban Towers',
        city: 'Bengaluru',
        state: 'Karnataka',
        adminName: 'Sarah Smith',
        adminEmail: 'sarah@urbanflux.io',
        adminPhone: '9845001123',
        maxUsers: 75,
        storageLimit: 200,
        lastUpdated: '2024-02-18'
    },
    { 
        id: 3, 
        name: 'Ironwood Const.', 
        owner: 'Mike Ross', 
        status: 'Pending', 
        revenue: '₹5.1M', 
        joinedDate: 'Jun 2023',
        tenantCode: 'IRN-CST',
        domain: 'ironwood.co',
        country: 'India',
        plan: 'Basic',
        usersCount: 12,
        createdAt: '2023-06-22',
        businessType: 'Builder',
        email: 'info@ironwood.co',
        phone: '9112233445',
        city: 'Hyderabad',
        state: 'Telangana',
        adminName: 'Mike Ross',
        adminEmail: 'mike@ironwood.co',
        adminPhone: '9112233446',
        maxUsers: 20,
        storageLimit: 50,
        lastUpdated: '2024-01-10'
    },
    { 
        id: 4, 
        name: 'Summit Group', 
        owner: 'Emma Wilson', 
        status: 'Active', 
        revenue: '₹24.0M', 
        joinedDate: 'Nov 2021',
        tenantCode: 'SUM-GRP',
        domain: 'summitgroup.com',
        country: 'India',
        plan: 'Enterprise',
        usersCount: 240,
        createdAt: '2021-11-05',
        businessType: 'Association',
        email: 'corporate@summitgroup.com',
        phone: '9222334455',
        address: 'Summit House, Connaught Place',
        city: 'Delhi',
        state: 'Delhi',
        adminName: 'Emma Wilson',
        adminEmail: 'emma@summitgroup.com',
        adminPhone: '9222334456',
        maxUsers: 300,
        storageLimit: 1000,
        lastUpdated: '2024-03-10'
    },
    { 
        id: 5, 
        name: 'Apex Structures', 
        owner: 'Chris Brown', 
        status: 'Suspended', 
        revenue: '₹3.5M', 
        joinedDate: 'Aug 2023',
        tenantCode: 'APX-STR',
        domain: 'apexstructures.net',
        country: 'India',
        plan: 'Pro',
        usersCount: 28,
        createdAt: '2023-08-12',
        businessType: 'Developer',
        email: 'admin@apexstructures.net',
        phone: '9333445566',
        city: 'Ahmedabad',
        state: 'Gujarat',
        adminName: 'Chris Brown',
        adminEmail: 'chris@apexstructures.net',
        adminPhone: '9333445567',
        maxUsers: 50,
        storageLimit: 100,
        lastUpdated: '2024-02-05'
    },
   
];

export const projects: Project[] = [
    { id: 1, companyId: 1, clientId: 1, name: 'Grand Skyline Tower', location: 'New York, NY', status: 'In Progress', progress: 65, startDate: 'Jan 12, 2024', endDate: 'Oct 30, 2025', budget: '₹4.5M' },
    { id: 2, companyId: 2, clientId: 2, name: 'Eco Residential Complex', location: 'Austin, TX', status: 'Planning', progress: 15, startDate: 'Feb 05, 2024', endDate: 'Dec 20, 2026', budget: '₹12M' },
    { id: 3, companyId: 3, clientId: 3, name: 'Metropolis Bridge', location: 'Chicago, IL', status: 'In Progress', progress: 42, startDate: 'Mar 20, 2024', endDate: 'Aug 15, 2027', budget: '₹85M' },
    { id: 4, companyId: 4, clientId: 4, name: 'Sunset Mall Renovation', location: 'Miami, FL', status: 'Completed', progress: 100, startDate: 'Nov 2022', endDate: 'Dec 2023', budget: '₹2.1M' },
    { id: 5, companyId: 1, clientId: 5, name: 'Skyline Office Suites', location: 'Seattle, WA', status: 'In Progress', progress: 30, startDate: 'May 01, 2024', endDate: 'Jun 15, 2025', budget: '₹1.8M' },
];

export const clients: Client[] = [
    { id: 1, companyId: 1, name: 'Global Invest Ltd', email: 'contact@globalinvest.com', phone: '+1 212-987-1234', status: 'Active', location: 'New York, NY' },
    { id: 2, companyId: 2, name: 'Sustainability First', email: 'info@sustain.org', phone: '+1 512-444-5566', status: 'Active', location: 'Austin, TX' },
    { id: 3, companyId: 3, name: 'City Council', email: 'infrastructure@city.gov', phone: '+1 312-000-1111', status: 'Active', location: 'Chicago, IL' },
    { id: 4, companyId: 4, name: 'Retail Assets Corp', email: 'management@retailassets.com', phone: '+1 305-222-3333', status: 'Active', location: 'Miami, FL' },
    { id: 5, companyId: 1, name: 'Pacific Northwest Group', email: 'ops@pnwgroup.com', phone: '+1 206-555-1212', status: 'Active', location: 'Seattle, WA' },
];

export const vendors: Vendor[] = [
    { id: 1, companyId: 1, name: 'Steel Core Inc.', email: 'sales@steelcore.com', phone: '+1 800-STEEL-01', status: 'Verified' },
    { id: 2, companyId: 2, name: 'EcoConcrete Solutions', email: 'orders@ecoconcrete.com', phone: '+1 888-BUILD-ECO', status: 'Verified' },
    { id: 3, companyId: 1, name: 'Rapid Glass & Glazing', email: 'glass@rapid.com', phone: '+1 877-GLASS-00', status: 'Active' },
];

export const materials: Material[] = [
    { id: 1, companyId: 1, vendorId: 1, name: 'Reinforced Steel Bars', category: 'Structural', sku: 'ST-REBAR-12MM', stock: '2,500 kg', status: 'In Stock' },
    { id: 2, companyId: 2, vendorId: 2, name: 'Low-Carbon Cement', category: 'Foundation', sku: 'CEM-ECO-01', stock: '500 bags', status: 'In Stock' },
    { id: 3, companyId: 1, vendorId: 1, name: 'Structural H-Beams', category: 'Structural', sku: 'ST-HBEAM-200', stock: '45 units', status: 'Low Stock' },
];

export const users: User[] = [
    {
        id: 1,
        firstName: 'Rajesh',
        lastName: 'Kumar',
        name: 'Rajesh Kumar',
        email: 'rajesh.k@skyline.com',
        phoneNumber: '+91 98765 43210',
        designation: 'Project Manager',
        role: 'Administrator',
        department: 'Management',
        tenantId: 1,
        tenantName: 'Skyline Builders',
        status: 'Active',
        createdDate: 'Mar 2022',
        joined: '2022-03-15',
        avatar: 'https://www.freelancernearme.com/pictures/social_media/pimage-28-259-photo.png'
    },
    {
        id: 2,
        firstName: 'Priya',
        lastName: 'Sharma',
        name: 'Priya Sharma',
        email: 'priya.s@urbanflux.com',
        phoneNumber: '+91 98765 43211',
        designation: 'Site Engineer',
        role: 'Engineer',
        department: 'Engineering',
        tenantId: 2,
        tenantName: 'Urban Flux Co.',
        status: 'Active',
        createdDate: 'Jan 2023',
        joined: '2023-01-20',
        avatar: 'https://media.licdn.com/dms/image/v2/D4D03AQGvYvJRew8G9A/profile-displayphoto-shrink_200_200/B4DZZpeqWLGcAY-/0/1745526368806?e=2147483647&v=beta&t=6Gz8okVtovgsHYHPM7Xa3OCHgi2H-D5Lf0Bo_itgF-U'
    },
    {
        id: 3,
        firstName: 'Amit',
        lastName: 'Patel',
        name: 'Amit Patel',
        email: 'amit.p@skyline.com',
        phoneNumber: '+91 98765 43212',
        designation: 'Safety Officer',
        role: 'Supervisor',
        department: 'Safety',
        tenantId: 1,
        tenantName: 'Skyline Builders',
        status: 'Active',
        createdDate: 'Aug 2022',
        joined: '2022-08-10',
        avatar: 'https://i.pravatar.cc/150?u=amit'
    },
    {
        id: 4,
        firstName: 'Sneha',
        lastName: 'Reddy',
        name: 'Sneha Reddy',
        email: 'sneha.r@urbanflux.com',
        phoneNumber: '+91 98765 43213',
        designation: 'Site Engineer',
        role: 'Engineer',
        department: 'Engineering',
        tenantId: 2,
        tenantName: 'Urban Flux Co.',
        status: 'Active',
        createdDate: 'May 2023',
        joined: '2023-05-01',
        avatar: 'https://i.pravatar.cc/150?u=sneha'
    },
    {
        id: 5,
        firstName: 'Vikram',
        lastName: 'Singh',
        name: 'Vikram Singh',
        email: 'vikram.s@summit.com',
        phoneNumber: '+91 98765 43214',
        designation: 'Supervisor',
        role: 'Supervisor',
        department: 'Operations',
        tenantId: 4,
        tenantName: 'Summit Group',
        status: 'Active',
        createdDate: 'Nov 2021',
        joined: '2021-11-15',
        avatar: 'https://www.ey.com/content/dam/ey-unified-site/ey-com/en-in/campaigns/entrepreneur-of-the-year/winners-2021/ey-vivek-vikram-singh.jpg'
    },
    {
        id: 6,
        firstName: 'Nisha',
        lastName: 'Gupta',
        name: 'Nisha Gupta',
        email: 'nisha.g@skyline.com',
        phoneNumber: '+91 98765 43215',
        designation: 'Admin Staff',
        role: 'Administrator',
        department: 'Administration',
        tenantId: 1,
        tenantName: 'Skyline Builders',
        status: 'Active',
        createdDate: 'Jan 2022',
        joined: '2022-01-10',
        avatar: 'https://i.pravatar.cc/150?u=nisha'
    },
    {
        id: 7,
        firstName: 'Michael',
        lastName: 'Ross',
        name: 'Michael Ross',
        email: 'michael@summit.com',
        phoneNumber: '+91 7654321098',
        designation: 'Legal Counsel',
        role: 'Administrator',
        department: 'Management',
        tenantId: 4,
        tenantName: 'Summit Group',
        status: 'Disabled',
        createdDate: 'Dec 2025',
        joined: '2025-12-01',
        avatar: 'https://i.pravatar.cc/150?u=michael',
        businessUnitId: 4,
        businessUnitName: 'Delhi Northern'
    },
    {
        id: 8,
        firstName: 'David',
        lastName: 'Warner',
        name: 'David Warner',
        email: 'david.w@skyline.com',
        phoneNumber: '+91 98223 11223',
        designation: 'Architect',
        role: 'Engineer',
        department: 'Design',
        tenantId: 1,
        tenantName: 'Skyline Builders',
        status: 'Active',
        createdDate: 'Jan 2024',
        joined: '2024-01-15',
        avatar: 'https://media.licdn.com/dms/image/v2/D5603AQFx21_0TL6VWg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1698707535014?e=2147483647&v=beta&t=A52k9jgeTP_q539VrH7EbsA5cCORAL5rtO1oxjbUElo',
        businessUnitId: 1,
        businessUnitName: 'Hyderabad Division'
    },
    {
        id: 9,
        firstName: 'Sarah',
        lastName: 'Connor',
        name: 'Sarah Connor',
        email: 'sarah.c@urbanflux.com',
        phoneNumber: '+91 91234 56789',
        designation: 'Quantity Surveyor',
        role: 'Engineer',
        department: 'Estimation',
        tenantId: 2,
        tenantName: 'Urban Flux Co.',
        status: 'Active',
        createdDate: 'Feb 2024',
        joined: '2024-02-10',
        avatar: 'https://i.pravatar.cc/150?u=sarah',
        businessUnitId: 2,
        businessUnitName: 'Bengaluru Operations'
    },
    {
        id: 10,
        firstName: 'Robert',
        lastName: 'Downey',
        name: 'Robert Downey',
        email: 'robert.d@summit.com',
        phoneNumber: '+91 88888 77777',
        designation: 'Operations Manager',
        role: 'Administrator',
        department: 'Operations',
        tenantId: 4,
        tenantName: 'Summit Group',
        status: 'Active',
        createdDate: 'Mar 2024',
        joined: '2024-03-01',
        avatar: 'https://i.pravatar.cc/150?u=robert',
        businessUnitId: 4,
        businessUnitName: 'Delhi Northern'
    },
    {
        id: 11,
        firstName: 'Emma',
        lastName: 'Watson',
        name: 'Emma Watson',
        email: 'emma.w@skyline.com',
        phoneNumber: '+91 77777 66666',
        designation: 'HR Manager',
        role: 'Administrator',
        department: 'HR',
        tenantId: 1,
        tenantName: 'Skyline Builders',
        status: 'Active',
        createdDate: 'Apr 2024',
        joined: '2024-04-12',
        avatar: 'https://i.pravatar.cc/150?u=emma'
    },
    {
        id: 12,
        firstName: 'John',
        lastName: 'Wick',
        name: 'John Wick',
        email: 'john.wick@urbanflux.com',
        phoneNumber: '+91 99999 88888',
        designation: 'Security Specialist',
        role: 'Supervisor',
        department: 'Safety',
        tenantId: 2,
        tenantName: 'Urban Flux Co.',
        status: 'Disabled',
        createdDate: 'May 2024',
        joined: '2024-05-20',
        avatar: 'https://i.pravatar.cc/150?u=wick'
    },
    {
        id: 13,
        firstName: 'Tony',
        lastName: 'Stark',
        name: 'Tony Stark',
        email: 'tony.s@skyline.com',
        phoneNumber: '+91 12345 12345',
        designation: 'Chief Technology Officer',
        role: 'Administrator',
        department: 'IT',
        tenantId: 1,
        tenantName: 'Skyline Builders',
        status: 'Active',
        createdDate: 'Jun 2024',
        joined: '2024-06-01',
        avatar: 'https://i.pravatar.cc/150?u=tony'
    },
    {
        id: 14,
        firstName: 'Steve',
        lastName: 'Rogers',
        name: 'Steve Rogers',
        email: 'steve.r@summit.com',
        phoneNumber: '+91 54321 54321',
        designation: 'Project Coordinator',
        role: 'Supervisor',
        department: 'Management',
        tenantId: 4,
        tenantName: 'Summit Group',
        status: 'Active',
        createdDate: 'Jul 2024',
        joined: '2024-07-04',
        avatar: 'https://i.pravatar.cc/150?u=steve'
    },
    {
        id: 15,
        firstName: 'Natasha',
        lastName: 'Romanoff',
        name: 'Natasha Romanoff',
        email: 'natasha.r@urbanflux.com',
        phoneNumber: '+91 87654 87654',
        designation: 'Audit Lead',
        role: 'Administrator',
        department: 'Finance',
        tenantId: 2,
        tenantName: 'Urban Flux Co.',
        status: 'Active',
        createdDate: 'Aug 2024',
        joined: '2024-08-15',
        avatar: 'https://i.pravatar.cc/150?u=natasha'
    }
];

/** Mutable workspace copy for Users module (list + record). Seed `users` stays immutable. */
let _usersWorkspace: User[] = users.map((u) => ({ ...u }));
let _nextUserId = Math.max(0, ..._usersWorkspace.map((x) => x.id)) + 1;

function syncUserDisplayName(u: User): User {
    const combined = `${u.firstName} ${u.lastName}`.trim();
    return { ...u, name: combined || u.name };
}

export function getUsers(): User[] {
    return _usersWorkspace;
}

export function getUserById(id: number): User | undefined {
    return _usersWorkspace.find((row) => row.id === id);
}

export function getUsersByCompanyId(companyId: number): User[] {
    return _usersWorkspace.filter((u) => u.tenantId === companyId);
}

export function addUserRecord(data: Omit<User, 'id'>): User {
    const row = syncUserDisplayName({ ...data, id: _nextUserId++ });
    _usersWorkspace = [..._usersWorkspace, row];
    return row;
}

export function updateUserRecord(id: number, patch: Partial<User>): void {
    _usersWorkspace = _usersWorkspace.map((u) => {
        if (u.id !== id) return u;
        return syncUserDisplayName({ ...u, ...patch });
    });
}

export function deleteUserRecord(id: number): void {
    _usersWorkspace = _usersWorkspace.filter((u) => u.id !== id);
}

export function duplicateUserRecord(id: number): User | undefined {
    const src = getUserById(id);
    if (!src) return undefined;
    const suffix = Date.now().toString(36).slice(-4).toUpperCase();
    const [local, domain] = src.email.includes('@') ? src.email.split('@') : [src.email, 'tenant.local'];
    const email = `${local}+copy${suffix}@${domain}`;
    const { id: _omit, ...rest } = src;
    return addUserRecord({
        ...rest,
        email,
        firstName: src.firstName,
        lastName: src.lastName,
        status: 'Pending',
        createdDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(',', ''),
        joined: new Date().toISOString().slice(0, 10),
    });
}

export const documents: Document[] = [
    { id: 1, name: 'Structural Blueprints V2', type: 'PDF', size: '25.4 MB', date: 'Feb 12, 2024', status: 'Final' },
    { id: 2, name: 'Site Safety Protocol', type: 'DOCX', size: '1.2 MB', date: 'Jan 05, 2024', status: 'Final' },
    { id: 3, name: 'Material Quality Report', type: 'PDF', size: '4.8 MB', date: 'Mar 01, 2024', status: 'Draft' },
    { id: 4, name: 'Permit #A-4250-X', type: 'LINK', size: '-', date: 'Dec 20, 2023', status: 'Final' },
];

export const activities: Activity[] = [
    { id: 1, type: 'Milestone', title: 'Foundation Completed', description: 'Concrete pour for Level B2 finished ahead of schedule.', timestamp: '2h ago', user: 'David Kim' },
    { id: 2, type: 'Update', title: 'Budget Reallocation', description: 'Moved ₹45L from Landscaping to structural reinforcement.', timestamp: '5h ago', user: 'Sarah Lee' },
    { id: 3, type: 'Alert', title: 'Safety Inspection Held', description: 'Zero violations found during routine site audit.', timestamp: '1d ago', user: 'System' },
    { id: 4, type: 'Log', title: 'New Permit Uploaded', description: 'Civil Aviation permit for crane operations added.', timestamp: '2d ago', user: 'Emma Wilson' },
];

export const projectTasks: ProjectTask[] = [
    { id: 1, projectId: 1, name: 'Site Excavation', status: 'Completed', dueDate: 'Feb 15, 2024', assignee: 'John Smith' },
    { id: 2, projectId: 1, name: 'Foundation Reinforcement', status: 'In Progress', dueDate: 'May 20, 2024', assignee: 'David Kim' },
    { id: 3, projectId: 1, name: 'MEP Rough-in', status: 'Pending', dueDate: 'Aug 10, 2024', assignee: 'Sarah Lee' },
    { id: 4, projectId: 2, name: 'Design Phase Approval', status: 'Completed', dueDate: 'Mar 01, 2024', assignee: 'Emma Wilson' },
];

export const supportTickets: SupportTicket[] = [
    { id: 1, subject: 'Payment Gateway Timeout', priority: 'High', status: 'Open', category: 'Technical', createdAt: '2h ago', lastUpdate: '15m ago' },
    { id: 2, subject: 'New User Access Required', priority: 'Low', status: 'Resolved', category: 'Access', createdAt: '1d ago', lastUpdate: '4h ago' },
    { id: 3, subject: 'Subscription Tier Upgrade', priority: 'Medium', status: 'In Progress', category: 'Billing', createdAt: '3h ago', lastUpdate: '1h ago' },
];

export const userNotifications: Notification[] = [
    { id: 1, title: 'New Invoice Received', message: 'Invoice #INV-928 for Grand Skyline Tower is ready for review.', time: '2 min ago', read: false, type: 'Info', category: 'Finance' },
    { id: 2, title: 'Milestone Achieved', message: 'Project "Eco Residential" reached 50% completion.', time: '1 hour ago', read: false, type: 'Success', category: 'Project' },
    { id: 3, title: 'Security Alert', message: 'A new login from an unrecognized device in London, UK.', time: '3 hours ago', read: true, type: 'Warning', category: 'User' },
];

export const securityLogs: SecurityLog[] = [
    { id: 1, event: 'User Login', user: 'john@atlas.com', ip: '192.168.1.45', location: 'New York, US', time: 'Mar 11, 2024, 09:12 AM', status: 'Success' },
    { id: 2, event: 'API Key Created', user: 'sarah@buildright.com', ip: '192.168.2.12', location: 'Austin, US', time: 'Mar 11, 2024, 08:45 AM', status: 'Success' },
    { id: 3, event: 'Failed Password Attempt', user: 'admin@unknown.com', ip: '45.12.88.92', location: 'Moscow, RU', time: 'Mar 11, 2024, 07:22 AM', status: 'Failure' },
];

export const businessUnits: BusinessUnit[] = [
    {
        id: 1,
        name: 'Hyderabad Division',
        code: 'HYD01',
        parentOrganizationId: 1,
        parentOrganizationName: 'Skyline Builders',
        defaultProjectScope: ['Residential Projects', 'Commercial Complexes'],
        createdDate: 'Feb 2026',
        status: 'Active'
    },
    {
        id: 2,
        name: 'Bengaluru Operations',
        code: 'BLR02',
        parentOrganizationId: 2,
        parentOrganizationName: 'Urban Flux Co.',
        defaultProjectScope: ['Eco Housing', 'Infrastructure'],
        createdDate: 'Jan 2026',
        status: 'Active'
    },
    {
        id: 3,
        name: 'Mumbai Central',
        code: 'MUM03',
        parentOrganizationId: 1,
        parentOrganizationName: 'Skyline Builders',
        defaultProjectScope: ['High-rise Residential'],
        createdDate: 'Dec 2025',
        status: 'Inactive'
    },
    {
        id: 4,
        name: 'Delhi Northern',
        code: 'DEL04',
        parentOrganizationId: 4,
        parentOrganizationName: 'Summit Group',
        defaultProjectScope: ['Public Infrastructure', 'Office Spaces'],
        createdDate: 'Nov 2025',
        status: 'Active'
    }
];

export const departments: Department[] = [
    { id: 1, name: 'Engineering', code: 'ENG01', businessUnitId: 1, businessUnitName: 'Hyderabad Division', departmentHeadId: 8, departmentHeadName: 'David Warner', usersCount: 22, status: 'Active', createdDate: 'Feb 2026', updatedAt: '2026-02-18T10:15:00Z', description: 'Core engineering and design teams.' },
    { id: 2, name: 'Sales', code: 'SAL02', businessUnitId: 1, businessUnitName: 'Hyderabad Division', departmentHeadId: 1, departmentHeadName: 'Rajesh Kumar', usersCount: 12, status: 'Active', createdDate: 'Feb 2026', updatedAt: '2026-02-22T09:40:00Z' },
    { id: 3, name: 'Procurement', code: 'PROC03', businessUnitId: 1, businessUnitName: 'Hyderabad Division', departmentHeadName: 'Nisha Gupta', usersCount: 8, status: 'Active', createdDate: 'Jan 2026', updatedAt: '2026-01-28T16:20:00Z' },
    { id: 4, name: 'Finance', code: 'FIN04', businessUnitId: 2, businessUnitName: 'Bengaluru Operations', departmentHeadId: 15, departmentHeadName: 'Natasha Romanoff', usersCount: 6, status: 'Active', createdDate: 'Jan 2026', updatedAt: '2026-02-05T11:00:00Z' },
    { id: 5, name: 'Site Management', code: 'SIT05', businessUnitId: 1, businessUnitName: 'Hyderabad Division', departmentHeadId: 3, departmentHeadName: 'Amit Patel', usersCount: 18, status: 'Active', createdDate: 'Feb 2026', updatedAt: '2026-02-25T08:30:00Z' },
    { id: 6, name: 'HR', code: 'HR06', businessUnitId: 1, businessUnitName: 'Hyderabad Division', departmentHeadId: 11, departmentHeadName: 'Emma Watson', usersCount: 4, status: 'Active', createdDate: 'Mar 2026', updatedAt: '2026-03-02T14:45:00Z' },
    { id: 7, name: 'Legacy Operations', code: 'LEG07', businessUnitId: 3, businessUnitName: 'Mumbai Central', usersCount: 2, status: 'Inactive', createdDate: 'Dec 2025', updatedAt: '2025-12-10T12:00:00Z' },
    { id: 8, name: 'Quality Assurance', code: 'QA08', businessUnitId: 4, businessUnitName: 'Delhi Northern', departmentHeadId: 14, departmentHeadName: 'Steve Rogers', usersCount: 5, status: 'Active', createdDate: 'Feb 2026', updatedAt: '2026-02-20T17:10:00Z' },
];

// Helper functions
export const getCompanyById = (id: number) => companies.find(c => c.id === id);
export const getProjectsByCompanyId = (companyId: number) => projects.filter(p => p.companyId === companyId);
export const getClientsByCompanyId = (companyId: number) => clients.filter(c => c.companyId === companyId);
export const getVendorsByCompanyId = (companyId: number) => vendors.filter(v => v.companyId === companyId);
export const getMaterialsByCompanyId = (companyId: number) => materials.filter(m => m.companyId === companyId);
export const getProjectById = (id: number) => projects.find(p => p.id === id);
export const getClientById = (id: number) => clients.find(c => c.id === id);
export const getVendorById = (id: number) => vendors.find(v => v.id === id);
export const getMaterialById = (id: number) => materials.find(m => m.id === id);
export const getTasksByProjectId = (projectId: number) => projectTasks.filter(t => t.projectId === projectId);
export const getDocuments = () => documents;
export const getActivities = () => activities;

export const getSupportTickets = () => supportTickets;
export const getUserNotifications = () => userNotifications;
export const getSecurityLogs = () => securityLogs;
export const getBusinessUnits = () => businessUnits;
export const getBusinessUnitById = (id: number) => businessUnits.find(bu => bu.id === id);
export const getDepartments = () => departments;
export const getDepartmentById = (id: number) => departments.find(d => d.id === id);

export interface Lead {
    id: number;
    name: string;
    email: string;
    phone: string;
    propertyType: '1 BHK' | '2 BHK' | '3 BHK' | '4 BHK' | 'Villa' | 'Duplex' | 'Commercial';
    projectName: string;
    budget: string;
    unitsInterested: number;
    familySize: string;
    familySizeCount: number;
    source: 'Website' | 'Facebook Ads' | 'Google Ads' | 'Referral' | 'Walk-in' | 'Broker';
    status: 'New' | 'Contacted' | 'Site Visit Scheduled' | 'Interested' | 'Negotiation' | 'Booked' | 'Closed' | 'Lost';
    assignedTo: string;
    createdDate: string;
    preferredContactTime?: string;
    budgetRange?: string;
    towerBlock?: string;
    campaign?: string;
    notes?: string;
    brokerAgent?: string;
}

export const leads: Lead[] = [
    {
        id: 1,
        name: 'Ramesh Kumar',
        email: 'ramesh@gmail.com',
        phone: '+91 9876543210',
        propertyType: '3 BHK',
        projectName: 'Skyline Residency',
        budget: '₹90L',
        unitsInterested: 1,
        familySize: 'Family of 4',
        familySizeCount: 4,
        source: 'Website',
        status: 'New',
        assignedTo: 'Amit Sales',
        createdDate: '2026-02-15',
        preferredContactTime: 'Evening',
        budgetRange: '₹80L - ₹1Cr',
        towerBlock: 'Tower A',
        campaign: 'Spring Launch',
        notes: 'Prefers east-facing flat with park view.',
        brokerAgent: 'City Homes Realty'
    },
    {
        id: 2,
        name: 'Anita Sharma',
        email: 'anita.sharma@yahoo.com',
        phone: '+91 9845012345',
        propertyType: '2 BHK',
        projectName: 'Urban Flux Apartments',
        budget: '₹65L',
        unitsInterested: 1,
        familySize: 'Couple',
        familySizeCount: 2,
        source: 'Google Ads',
        status: 'Contacted',
        assignedTo: 'Priya Reddy',
        createdDate: '2026-03-01',
        preferredContactTime: 'Morning',
        budgetRange: '₹60L - ₹70L',
        towerBlock: 'Block B',
        notes: 'Looking for quick move-in within 3 months.'
    },
    {
        id: 3,
        name: 'Suresh Raina',
        email: 'suresh.raina@gmail.com',
        phone: '+91 9122334455',
        propertyType: 'Villa',
        projectName: 'Summit Woods',
        budget: '₹2.5Cr',
        unitsInterested: 1,
        familySize: 'Joint Family',
        familySizeCount: 6,
        source: 'Facebook Ads',
        status: 'Site Visit Scheduled',
        assignedTo: 'Vikram Singh',
        createdDate: '2026-03-05',
        preferredContactTime: 'Anytime',
        budgetRange: '₹2Cr - ₹3Cr',
        towerBlock: 'Phase 1',
        notes: 'Joint family; needs parking for 3 cars.'
    },
    {
        id: 4,
        name: 'Meena Iyer',
        email: 'meena.iyer@outlook.com',
        phone: '+91 9222334455',
        propertyType: '4 BHK',
        projectName: 'Skyline Residency',
        budget: '₹1.5Cr',
        unitsInterested: 1,
        familySize: 'Family of 5',
        familySizeCount: 5,
        source: 'Referral',
        status: 'Interested',
        assignedTo: 'Amit Sales',
        createdDate: '2026-03-08',
        preferredContactTime: 'Afternoon',
        budgetRange: '₹1.2Cr - ₹1.8Cr',
        towerBlock: 'Tower C',
        brokerAgent: 'Prime Realty Partners'
    },
    {
        id: 5,
        name: 'Vikram Kapoor',
        email: 'vikram.kapoor@gmail.com',
        phone: '+91 9333445566',
        propertyType: '3 BHK',
        projectName: 'Eco Residential Complex',
        budget: '₹85L',
        unitsInterested: 1,
        familySize: 'Family of 3',
        familySizeCount: 3,
        source: 'Walk-in',
        status: 'Negotiation',
        assignedTo: 'Sneha Reddy',
        createdDate: '2026-03-10',
        preferredContactTime: 'Morning',
        budgetRange: '₹80L - ₹90L',
        towerBlock: 'Block D'
    },
    {
        id: 6,
        name: 'Pallavi Joshi',
        email: 'pallavi.joshi@gmail.com',
        phone: '+91 9444556677',
        propertyType: 'Commercial',
        projectName: 'Skyline Business Hub',
        budget: '₹3.2Cr',
        unitsInterested: 2,
        familySize: 'Business Owner',
        familySizeCount: 1,
        source: 'Broker',
        status: 'Booked',
        assignedTo: 'Rajesh Kumar',
        createdDate: '2026-03-11',
        preferredContactTime: 'Weekday Afternoon',
        budgetRange: '₹3Cr - ₹4Cr',
        brokerAgent: 'Corporate Spaces Associates'
    },
    {
        id: 7,
        name: 'Arjun Verma',
        email: 'arjun.verma@gmail.com',
        phone: '+91 9555667788',
        propertyType: '3 BHK',
        projectName: 'Green Valley Phase 2',
        budget: '₹72L',
        unitsInterested: 1,
        familySize: 'Family of 4',
        familySizeCount: 4,
        source: 'Website',
        status: 'Interested',
        assignedTo: 'Amit Sales',
        createdDate: '2026-02-28',
        preferredContactTime: 'Morning',
        budgetRange: '₹65L - ₹80L',
        towerBlock: 'Tower 2',
        notes: 'Token payment pending — ₹5L due this week.'
    },
    {
        id: 8,
        name: 'Sneha Kapoor',
        email: 'sneha.kapoor@outlook.com',
        phone: '+91 9666778899',
        propertyType: '2 BHK',
        projectName: 'Metro Heights',
        budget: '₹68L',
        unitsInterested: 1,
        familySize: 'Couple',
        familySizeCount: 2,
        source: 'Google Ads',
        status: 'Contacted',
        assignedTo: 'Priya Reddy',
        createdDate: '2026-03-02',
        preferredContactTime: 'Morning',
        budgetRange: '₹60L - ₹75L',
        notes: 'Booking amount pending — legal documentation in progress.'
    },
    {
        id: 9,
        name: 'Deepak Nair',
        email: 'deepak.nair@yahoo.com',
        phone: '+91 9777889900',
        propertyType: '2 BHK',
        projectName: 'Skyline Residency',
        budget: '₹55L',
        unitsInterested: 1,
        familySize: 'Single',
        familySizeCount: 1,
        source: 'Google Ads',
        status: 'New',
        assignedTo: 'Sneha Reddy',
        createdDate: '2026-03-18',
        preferredContactTime: 'Evening',
        budgetRange: '₹50L - ₹60L',
        notes: 'EOI ₹1L paid on Unit 508; ₹2L booking token pending.'
    },
    {
        id: 10,
        name: 'Kavita Menon',
        email: 'kavita.menon@gmail.com',
        phone: '+91 9888990011',
        propertyType: 'Villa',
        projectName: 'Summit Woods',
        budget: '₹2.1Cr',
        unitsInterested: 1,
        familySize: 'Family of 5',
        familySizeCount: 5,
        source: 'Referral',
        status: 'Site Visit Scheduled',
        assignedTo: 'Vikram Singh',
        createdDate: '2026-03-06',
        preferredContactTime: 'Afternoon',
        budgetRange: '₹1.8Cr - ₹2.5Cr',
        notes: '20% paid; balance ₹42L pending before registration.'
    },
    {
        id: 11,
        name: 'Rahul Desai',
        email: 'rahul.desai@gmail.com',
        phone: '+91 9900112233',
        propertyType: '3 BHK',
        projectName: 'Skyline Residency',
        budget: '₹1.12Cr',
        unitsInterested: 1,
        familySize: 'Family of 4',
        familySizeCount: 4,
        source: 'Website',
        status: 'Booked',
        assignedTo: 'Rajesh Kumar',
        createdDate: '2026-02-20',
        preferredContactTime: 'Afternoon',
        budgetRange: '₹1Cr - ₹1.2Cr',
        towerBlock: 'Tower B',
        notes: 'Paid in full — booking confirmed.'
    },
    {
        id: 12,
        name: 'Lakshi Reddy',
        email: 'lakshmi.reddy@gmail.com',
        phone: '+91 9011223344',
        propertyType: '2 BHK',
        projectName: 'Green Valley Phase 2',
        budget: '₹58L',
        unitsInterested: 1,
        familySize: 'Family of 3',
        familySizeCount: 3,
        source: 'Google Ads',
        status: 'Lost',
        assignedTo: 'Priya Reddy',
        createdDate: '2026-02-10',
        preferredContactTime: 'Morning',
        budgetRange: '₹55L - ₹65L',
        notes: 'Lost to competitor — suspected better pricing elsewhere.'
    },
    {
        id: 13,
        name: 'Rohit Khanna',
        email: 'rohit.khanna@gmail.com',
        phone: '+91 9122334456',
        propertyType: '3 BHK',
        projectName: 'Metro Heights',
        budget: '₹78L',
        unitsInterested: 1,
        familySize: 'Family of 4',
        familySizeCount: 4,
        source: 'Facebook Ads',
        status: 'Negotiation',
        assignedTo: 'Vikram Singh',
        createdDate: '2026-03-12',
        preferredContactTime: 'Evening',
        budgetRange: '₹70L - ₹85L',
        notes: 'Metro Heights Unit 804 — ₹15L token paid; loan sanction pack with bank.'
    },
    {
        id: 14,
        name: 'Nisha Patel',
        email: 'nisha.patel@gmail.com',
        phone: '+91 9233445567',
        propertyType: 'Commercial',
        projectName: 'Phoenix MarketCity Retail',
        budget: '₹95L',
        unitsInterested: 1,
        familySize: 'Business Owner',
        familySizeCount: 2,
        source: 'Referral',
        status: 'Interested',
        assignedTo: 'Amit Sales',
        createdDate: '2026-03-09',
        preferredContactTime: 'Afternoon',
        budgetRange: '₹85L - ₹1Cr',
        notes: 'Offer pending — ₹15L token on signing.'
    },
    {
        id: 15,
        name: 'Karan Mehta',
        email: 'karan.mehta@yahoo.com',
        phone: '+91 9344556678',
        propertyType: '2 BHK',
        projectName: 'Metro Heights',
        budget: '₹45L',
        unitsInterested: 1,
        familySize: 'Couple',
        familySizeCount: 2,
        source: 'Walk-in',
        status: 'New',
        assignedTo: 'Sneha Reddy',
        createdDate: '2026-03-20',
        preferredContactTime: 'Morning',
        budgetRange: '₹40L - ₹50L',
        notes: 'Alternate Unit 512 at ₹48L — ₹3L token pending.'
    }
];

export const getLeads = () => leads;
export const getLeadById = (id: number) => leads.find(l => l.id === id);

export type SiteVisitStatus = 'Scheduled' | 'Completed' | 'Pending' | 'Cancelled';

export interface SiteVisit {
    id: number;
    leadName: string;
    projectName: string;
    visitorCount: number;
    visitDate: string;
    visitTime: string;
    status: SiteVisitStatus;
    assignedTo: string;
    notes?: string;
}

export const siteVisits: SiteVisit[] = [
    {
        id: 1,
        leadName: 'Rajesh Kumar',
        projectName: 'Skyline Residency',
        visitorCount: 2,
        visitDate: '2026-03-20',
        visitTime: '10:30 AM',
        status: 'Scheduled',
        assignedTo: 'Amit Sales',
        notes: 'First visit for 3 BHK; prefers east-facing flat.'
    },
    {
        id: 2,
        leadName: 'Sneha Kapoor',
        projectName: 'Urban Flux Apartments',
        visitorCount: 3,
        visitDate: '2026-03-21',
        visitTime: '02:00 PM',
        status: 'Completed',
        assignedTo: 'Priya Reddy',
        notes: 'Very positive; requested price sheet and payment schedule.'
    },
    {
        id: 3,
        leadName: 'Vikram Malhotra',
        projectName: 'Summit Woods',
        visitorCount: 1,
        visitDate: '2026-03-22',
        visitTime: '11:00 AM',
        status: 'Pending',
        assignedTo: 'Vikram Singh',
        notes: 'Waiting for confirmation from customer on exact date.'
    },
    {
        id: 4,
        leadName: 'Ananya Sharma',
        projectName: 'Eco Residential Complex',
        visitorCount: 4,
        visitDate: '2026-03-23',
        visitTime: '04:30 PM',
        status: 'Cancelled',
        assignedTo: 'Sneha Reddy',
        notes: 'Customer cancelled due to personal reasons; to be rescheduled later.'
    },
    {
        id: 5,
        leadName: 'Arjun Verma',
        projectName: 'Skyline Residency',
        visitorCount: 2,
        visitDate: '2026-03-24',
        visitTime: '09:00 AM',
        status: 'Scheduled',
        assignedTo: 'Amit Sales'
    }
];

export const getSiteVisits = () => siteVisits;
export const getSiteVisitById = (id: number) => siteVisits.find(v => v.id === id);

// --- Sales: Bookings ---

export type BookingStatus = 'Booked' | 'Closed' | 'Negotiation' | 'Cancelled';

export interface Booking {
    id: number;
    customerName: string;
    projectName: string;
    unitNo: string;
    unitType: string;
    totalAmount: string;
    paidAmount: string;
    bookingDate: string;
    status: BookingStatus;
}

export const bookings: Booking[] = [
    {
        id: 1,
        customerName: 'Amit Bajaj',
        projectName: 'Skyline Residency',
        unitNo: 'A-402',
        unitType: '3 BHK',
        totalAmount: '₹1.2 Cr',
        paidAmount: '₹25L',
        bookingDate: '2026-03-01',
        status: 'Booked'
    },
    {
        id: 2,
        customerName: 'Sneha Reddy',
        projectName: 'Urban Flux Apartments',
        unitNo: 'B-1105',
        unitType: '2 BHK',
        totalAmount: '₹85L',
        paidAmount: '₹85L',
        bookingDate: '2026-02-15',
        status: 'Closed'
    },
    {
        id: 3,
        customerName: 'Vikram Singh',
        projectName: 'Summit Woods',
        unitNo: 'V-04',
        unitType: 'Villa',
        totalAmount: '₹3.5 Cr',
        paidAmount: '₹50L',
        bookingDate: '2026-03-10',
        status: 'Negotiation'
    },
    {
        id: 4,
        customerName: 'Priya Verma',
        projectName: 'Eco Residential Complex',
        unitNo: 'C-201',
        unitType: '1 BHK',
        totalAmount: '₹45L',
        paidAmount: '₹5L',
        bookingDate: '2026-03-12',
        status: 'Booked'
    }
];

export const getBookings = () => bookings;
export const getBookingById = (id: number) => bookings.find(b => b.id === id);

