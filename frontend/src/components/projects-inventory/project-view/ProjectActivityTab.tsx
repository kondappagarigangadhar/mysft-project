'use client';

import React, { useMemo } from 'react';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import {
    bookingHubHistoryToHistoryLogEntries,
    projectActivitiesToHistoryLogEntries,
    workOrderActivitiesToHistoryLogEntries,
} from '@/lib/historyLogs/recordHistoryAdapters';
import {
    getBookings,
    getHistoryForBooking,
    type BookingRecord,
} from '@/lib/bookingPaymentMockStore';
import { getProjectActivities, getProjectBySlug } from '@/lib/projectsInventoryStore';
import { getWorkOrders } from '@/lib/workOrderStore';
import type { HistoryLogEntry } from '@/lib/historyLogs/types';

type Props = { projectSlug: string; storeVersion: number };

/**
 * Unified Project 360 history timeline.
 *
 * Aggregates events from every relational module that touches this project:
 *  - Project store activities (created / edited / archived / approval / inventory)
 *  - Booking hub histories for each booking in this project
 *  - Work order local activity logs for work orders in this project
 *
 * Global audit rows (from `getLogsForRecord('projects', slug)`) merge in
 * automatically via `RecordHistoryLogPanel`.
 */
export function ProjectActivityTab({ projectSlug, storeVersion }: Props) {
    const project = useMemo(() => getProjectBySlug(projectSlug), [projectSlug, storeVersion]);
    const projectName = project?.project_name ?? projectSlug;

    const supplemental: HistoryLogEntry[] = useMemo(() => {
        const out: HistoryLogEntry[] = [];

        // 1. Project-local activities (existing behaviour)
        const projectActivities = getProjectActivities(projectSlug);
        out.push(...projectActivitiesToHistoryLogEntries(projectSlug, projectName, projectActivities));

        const projectNameLower = projectName.trim().toLowerCase();
        if (!projectNameLower) return out;

        // 2. Booking hub histories — per booking in this project
        const bookings: BookingRecord[] = getBookings().filter(
            (b) => (b.projectName || '').trim().toLowerCase() === projectNameLower,
        );
        for (const b of bookings) {
            const bookingTitle = `Booking ${b.leadId} · ${b.customerName}`;
            const entries = getHistoryForBooking(b.slug);
            const mapped = bookingHubHistoryToHistoryLogEntries(b.slug, bookingTitle, entries).map((e) => ({
                ...e,
                // Surface booking events in the project context so they appear with project label.
                recordLabel: `${projectName} · ${bookingTitle}`,
            }));
            out.push(...mapped);
        }

        // 3. Work order activity feeds for this project
        const workOrders = getWorkOrders().filter(
            (w) => (w.projectOrProperty || '').trim().toLowerCase() === projectNameLower,
        );
        for (const w of workOrders) {
            const woTitle = `${w.workOrderId} · ${w.title}`;
            const mapped = workOrderActivitiesToHistoryLogEntries(w.slug, woTitle, w.activityLog ?? []).map((e) => ({
                ...e,
                recordLabel: `${projectName} · ${woTitle}`,
            }));
            out.push(...mapped);
        }

        return out;
    }, [projectSlug, projectName, storeVersion]);

    return (
        <div className="w-full min-w-0">
            <RecordHistoryLogPanel
                module="projects"
                recordId={projectSlug}
                recordTitle={projectName}
                supplementalEntries={supplemental}
            />
        </div>
    );
}
