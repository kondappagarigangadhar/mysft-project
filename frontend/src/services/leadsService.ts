/**
 * API-ready leads service. Swap implementations when backend is available.
 * All methods return Promises to mirror real HTTP clients.
 */

import type { Lead, LeadStatus } from '@/lib/leadStore';
import {
    bulkAssignLeads,
    bulkDeleteLeads,
    bulkSetLeadStatus,
    deleteLead,
    duplicateLead,
    getLeadBySlug,
    getLeads,
    setLeadAssignment,
    updateLead,
} from '@/lib/leadStore';

export type LeadsListParams = {
    search?: string;
    status?: LeadStatus | 'All';
    source?: string | 'All';
    assignedTo?: string | 'All';
    page?: number;
    pageSize?: number;
};

export const leadsService = {
    async list(): Promise<Lead[]> {
        return Promise.resolve(getLeads());
    },

    async getBySlug(slug: string): Promise<Lead | undefined> {
        return Promise.resolve(getLeadBySlug(slug));
    },

    async remove(slug: string): Promise<boolean> {
        return Promise.resolve(deleteLead(slug));
    },

    async assign(slug: string, assignedTo: string): Promise<void> {
        const d = new Date().toISOString().slice(0, 10);
        await Promise.resolve(
            setLeadAssignment(slug, {
                assignedTo,
                assignmentDate: d,
            }),
        );
    },

    async setStatus(slug: string, status: LeadStatus): Promise<void> {
        await Promise.resolve(bulkSetLeadStatus([slug], status));
    },

    async clone(slug: string): Promise<Lead | undefined> {
        return Promise.resolve(duplicateLead(slug));
    },

    async bulkRemove(slugs: string[]): Promise<number> {
        return Promise.resolve(bulkDeleteLeads(slugs));
    },

    async bulkAssign(slugs: string[], assignedTo: string): Promise<void> {
        await Promise.resolve(bulkAssignLeads(slugs, assignedTo));
    },

    async bulkSetStatus(slugs: string[], status: LeadStatus): Promise<void> {
        await Promise.resolve(bulkSetLeadStatus(slugs, status));
    },
};

export const leadsApiPlaceholders = {
    listEndpoint: '/api/v1/leads',
    detailEndpoint: (slug: string) => `/api/v1/leads/${encodeURIComponent(slug)}`,
    bulkEndpoint: '/api/v1/leads/bulk',
};
