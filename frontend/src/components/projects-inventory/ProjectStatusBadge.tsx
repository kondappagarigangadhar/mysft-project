'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ProjectStatus } from '@/lib/projectsInventoryStore';

export function ProjectStatusBadge({ status }: { status: ProjectStatus | string }) {
    const s = status as ProjectStatus;

    const styles =
        s === 'active'
            ? 'bg-green-50 text-green-700 border-green-100'
            : s === 'upcoming'
              ? 'bg-orange-50 text-orange-700 border-orange-100'
              : s === 'sold out'
                ? 'bg-red-50 text-red-700 border-red-100'
                : 'bg-slate-50 text-slate-700 border-slate-200';

    return <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold border', styles)}>{status}</span>;
}

