// Static data for mySFT Super Admin Dashboard

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  subscriptionPlan: string;
  status: 'active' | 'inactive' | 'suspended';
  users: number;
  projects: number;
  createdAt: string;
  lastActive: string;
  settings: {
    customDomain?: string;
    branding: {
      logo?: string;
      primaryColor: string;
    };
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  permissions: string[];
  phone?: string;
  avatar?: string;
}

export interface Company {
  id: string;
  name: string;
  tenantId: string;
  industry: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  projects: number;
  users: number;
  status: 'active' | 'inactive' | 'pending';
  revenue: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  tenantId: string;
  companyId: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  manager: string;
  client: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface Client {
  id: string;
  name: string;
  tenantId: string;
  companyId: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  projects: string[];
  totalValue: number;
  status: 'active' | 'inactive' | 'prospect';
  since: string;
}

export interface Vendor {
  id: string;
  name: string;
  tenantId: string;
  category: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  rating: number;
  materials: string[];
  orders: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'review';
}

export interface Material {
  id: string;
  name: string;
  tenantId: string;
  category: string;
  supplier: string;
  price: number;
  stock: number;
  unit: string;
  minStock: number;
  lastUpdated: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  clientId: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'trial';
  billingCycle: 'monthly' | 'yearly';
  nextBilling: string;
  amount: number;
  features: string[];
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  enabledForTenants: string[];
  rolloutPercentage: number;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  keyHash: string;
  permissions: string[];
  lastUsed: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'revoked';
}

export interface Webhook {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'inactive';
  lastTriggered: string;
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface SystemMetric {
  id: string;
  metricName: string;
  value: number;
  unit: string;
  timestamp: string;
  tags: Record<string, string>;
}

export interface Notification {
  id: string;
  tenantId: string;
  userId?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  content: string;
  readAt?: string;
  createdAt: string;
}

// Static Data Sets
export const tenants: Tenant[] = [
  {
    id: '1',
    name: 'Atlas Construction',
    domain: 'atlas.mysft.ai',
    subscriptionPlan: 'Enterprise',
    status: 'active',
    users: 45,
    projects: 12,
    createdAt: '2024-01-15',
    lastActive: '2024-03-12',
    settings: {
      customDomain: 'atlas-construction.com',
      branding: {
        primaryColor: '#1e40af'
      }
    }
  },
  {
    id: '2',
    name: 'BuildRight Corp',
    domain: 'buildright.mysft.ai',
    subscriptionPlan: 'Professional',
    status: 'active',
    users: 32,
    projects: 8,
    createdAt: '2024-02-20',
    lastActive: '2024-03-11',
    settings: {
      branding: {
        primaryColor: '#059669'
      }
    }
  },
  {
    id: '3',
    name: 'Metro Builders',
    domain: 'metro.mysft.ai',
    subscriptionPlan: 'Professional',
    status: 'inactive',
    users: 18,
    projects: 5,
    createdAt: '2024-03-01',
    lastActive: '2024-03-10',
    settings: {
      branding: {
        primaryColor: '#dc2626'
      }
    }
  }
];

export const users: User[] = [
  {
    id: '1',
    email: 'admin@mysft.ai',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'Super Admin',
    status: 'active',
    lastLogin: '2024-03-12T09:30:00Z',
    permissions: ['all']
  },
  {
    id: '2',
    email: 'john@atlas.com',
    firstName: 'John',
    lastName: 'Smith',
    role: 'Company Admin',
    tenantId: '1',
    status: 'active',
    lastLogin: '2024-03-12T08:15:00Z',
    permissions: ['users.manage', 'projects.manage', 'billing.view']
  },
  {
    id: '3',
    email: 'sarah@buildright.com',
    firstName: 'Sarah',
    lastName: 'Lee',
    role: 'Engineer',
    tenantId: '2',
    status: 'active',
    lastLogin: '2024-03-11T16:45:00Z',
    permissions: ['projects.view', 'tasks.manage']
  }
];

export const companies: Company[] = [
  {
    id: '1',
    name: 'Atlas Construction',
    tenantId: '1',
    industry: 'Commercial Construction',
    contactInfo: {
      email: 'contact@atlas.com',
      phone: '+1-555-0101',
      address: '123 Main St, New York, NY'
    },
    projects: 12,
    users: 45,
    status: 'active',
    revenue: 2500000,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'BuildRight Corp',
    tenantId: '2',
    industry: 'Residential Construction',
    contactInfo: {
      email: 'info@buildright.com',
      phone: '+1-555-0102',
      address: '456 Oak Ave, Los Angeles, CA'
    },
    projects: 8,
    users: 32,
    status: 'active',
    revenue: 1800000,
    createdAt: '2024-02-20'
  }
];

export const projects: Project[] = [
  {
    id: '1',
    name: 'Downtown Tower',
    tenantId: '1',
    companyId: '1',
    status: 'active',
    progress: 72,
    budget: 5000000,
    spent: 3600000,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    manager: 'John Smith',
    client: 'Metro Development',
    priority: 'high'
  },
  {
    id: '2',
    name: 'Harbor Bridge',
    tenantId: '2',
    companyId: '2',
    status: 'active',
    progress: 45,
    budget: 2000000,
    spent: 900000,
    startDate: '2024-02-01',
    endDate: '2024-10-31',
    manager: 'Sarah Lee',
    client: 'City Council',
    priority: 'medium'
  }
];

export const clients: Client[] = [
  {
    id: '1',
    name: 'Metro Development',
    tenantId: '1',
    companyId: '1',
    contactInfo: {
      email: 'projects@metrodev.com',
      phone: '+1-555-0201',
      address: '789 Business Blvd, New York, NY'
    },
    projects: ['1'],
    totalValue: 5000000,
    status: 'active',
    since: '2024-01-15'
  }
];

export const vendors: Vendor[] = [
  {
    id: '1',
    name: 'Steel Suppliers Inc',
    tenantId: '1',
    category: 'Materials',
    contactInfo: {
      email: 'sales@steelsuppliers.com',
      phone: '+1-555-0301',
      address: '321 Industrial Way, Pittsburgh, PA'
    },
    rating: 4.8,
    materials: ['Steel Beams', 'Rebar', 'Steel Plates'],
    orders: 45,
    totalSpent: 850000,
    status: 'active'
  }
];

export const materials: Material[] = [
  {
    id: '1',
    name: 'Steel Beam H-250',
    tenantId: '1',
    category: 'Structural Steel',
    supplier: 'Steel Suppliers Inc',
    price: 1250,
    stock: 150,
    unit: 'pieces',
    minStock: 50,
    lastUpdated: '2024-03-12'
  }
];

export const invoices: Invoice[] = [
  {
    id: '1',
    tenantId: '1',
    clientId: '1',
    amount: 250000,
    status: 'paid',
    dueDate: '2024-03-15',
    createdAt: '2024-03-01',
    items: [
      {
        description: 'Phase 1 Foundation Work',
        quantity: 1,
        unitPrice: 250000,
        total: 250000
      }
    ]
  }
];

export const subscriptions: Subscription[] = [
  {
    id: '1',
    tenantId: '1',
    planId: 'enterprise',
    status: 'active',
    billingCycle: 'yearly',
    nextBilling: '2025-01-15',
    amount: 12000,
    features: ['unlimited-users', 'api-access', 'custom-domain', 'priority-support']
  }
];

export const featureFlags: FeatureFlag[] = [
  {
    id: '1',
    name: 'advanced-analytics',
    description: 'Enable advanced analytics dashboard',
    enabled: true,
    enabledForTenants: ['1'],
    rolloutPercentage: 100,
    createdAt: '2024-03-01'
  }
];

export const apiKeys: ApiKey[] = [
  {
    id: '1',
    tenantId: '1',
    name: 'Production API Key',
    keyHash: 'hash123...',
    permissions: ['read', 'write'],
    lastUsed: '2024-03-12T10:30:00Z',
    createdAt: '2024-02-15',
    status: 'active'
  }
];

export const webhooks: Webhook[] = [
  {
    id: '1',
    tenantId: '1',
    url: 'https://atlas.com/webhooks/mysft',
    events: ['project.created', 'invoice.paid'],
    secret: 'secret123',
    status: 'active',
    lastTriggered: '2024-03-12T09:15:00Z'
  }
];

export const supportTickets: SupportTicket[] = [
  {
    id: '1',
    tenantId: '1',
    userId: '2',
    subject: 'Payment Gateway Issue',
    description: 'Unable to process payment for invoice #1234',
    status: 'open',
    priority: 'high',
    category: 'Billing',
    createdAt: '2024-03-12T08:00:00Z',
    updatedAt: '2024-03-12T08:00:00Z'
  }
];

export const auditLogs: AuditLog[] = [
  {
    id: '1',
    tenantId: '1',
    userId: '2',
    action: 'user.created',
    resource: 'users',
    details: 'Created new engineer account',
    ipAddress: '192.168.1.100',
    timestamp: '2024-03-12T10:30:00Z'
  }
];

export const systemMetrics: SystemMetric[] = [
  {
    id: '1',
    metricName: 'cpu_usage',
    value: 45.2,
    unit: 'percent',
    timestamp: '2024-03-12T10:00:00Z',
    tags: { server: 'web-01' }
  }
];

export const notifications: Notification[] = [
  {
    id: '1',
    tenantId: '1',
    type: 'warning',
    title: 'Subscription Renewal',
    content: 'Your subscription will renew in 7 days',
    createdAt: '2024-03-12T09:00:00Z'
  }
];
