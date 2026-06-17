/**
 * Simple in-memory company store (replaces DB for demo purposes).
 * Shared across the companies list and create/edit pages via a singleton pattern.
 */
import { companies as mockCompanies, Company } from '@/data/mockData';

let _companies: Company[] = [...mockCompanies];
let _nextId = _companies.length + 1;

export function getCompanies(): Company[] {
    return _companies;
}

export function getCompanyById(id: number): Company | undefined {
    return _companies.find(c => c.id === id);
}

export function addCompany(data: Omit<Company, 'id' | 'revenue' | 'joinedDate' | 'usersCount' | 'createdAt'>) {
    const now = new Date().toISOString().split('T')[0];
    const newCompany: Company = {
        ...data,
        id: _nextId++,
        revenue: '₹0',
        joinedDate: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
        usersCount: 0,
        createdAt: now,
        lastUpdated: now,
    };
    _companies = [..._companies, newCompany];
    return newCompany;
}

export function updateCompany(id: number, data: Partial<Company>) {
    _companies = _companies.map(c => 
        c.id === id ? { ...c, ...data, lastUpdated: new Date().toISOString().split('T')[0] } : c
    );
}

export function toggleCompanyStatus(id: number) {
    _companies = _companies.map(c =>
        c.id === id ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' } : c
    );
}

export function removeCompany(id: number) {
    _companies = _companies.filter((c) => c.id !== id);
}

export function duplicateCompany(id: number): Company | undefined {
    const c = getCompanyById(id);
    if (!c) return undefined;
    const suffix = Date.now().toString(36).slice(-4).toUpperCase();
    const dup: Company = {
        ...c,
        id: _nextId++,
        name: `${c.name} (Copy)`,
        tenantCode: `${c.tenantCode}-${suffix}`,
        email: c.email.startsWith('copy-') ? c.email : `copy-${suffix.toLowerCase()}-${c.email}`,
        status: 'Pending',
        joinedDate: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
        createdAt: new Date().toISOString().slice(0, 10),
        lastUpdated: new Date().toISOString().slice(0, 10),
    };
    _companies = [..._companies, dup];
    return dup;
}
