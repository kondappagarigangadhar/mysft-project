'use client';

import Link from 'next/link';
import { LuBuilding2, LuExternalLink, LuMapPin } from 'react-icons/lu';
import { getProjectByName } from '@/lib/work-orders/workOrderCatalog';
import { getUnits } from '@/lib/projectsInventoryStore';

export function VendorLinkedProjectCard({ projectName }: { projectName: string }) {
    const name = projectName.trim();
    if (!name) return null;

    const project = getProjectByName(name);
    if (!project) {
        return (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">Project: {name}</p>
                <p className="mt-1 text-xs text-amber-800/90">No matching project found in inventory. Select a project from the list above.</p>
            </div>
        );
    }

    const unitCount = getUnits().filter((u) => u.projectSlug === project.slug).length;

    return (
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 px-4 py-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <LuBuilding2 size={14} aria-hidden />
                        Linked project
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{project.project_name}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-600">
                        <LuMapPin size={14} className="shrink-0 text-slate-400" aria-hidden />
                        {project.location || project.city || '—'}
                    </p>
                </div>
                <Link
                    href={`/projects-inventory/view/${encodeURIComponent(project.slug)}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--cta-button-bg)] shadow-sm transition hover:bg-slate-50"
                >
                    View project
                    <LuExternalLink size={12} aria-hidden />
                </Link>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <div>
                    <dt className="text-xs font-medium text-slate-500">Type</dt>
                    <dd className="font-medium text-slate-800">{project.project_type}</dd>
                </div>
                <div>
                    <dt className="text-xs font-medium text-slate-500">Status</dt>
                    <dd className="font-medium capitalize text-slate-800">{project.project_status}</dd>
                </div>
                <div>
                    <dt className="text-xs font-medium text-slate-500">Units</dt>
                    <dd className="font-medium text-slate-800">{unitCount || project.total_units}</dd>
                </div>
                <div>
                    <dt className="text-xs font-medium text-slate-500">Project ID</dt>
                    <dd className="font-mono text-xs font-medium text-slate-800">{project.project_id}</dd>
                </div>
            </dl>
        </div>
    );
}
