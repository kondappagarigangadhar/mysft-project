'use client';

import { MATRIX_LEGEND_PERMISSIONS, permissionBadgeClasses, permissionShortLabel } from '@/lib/accessMatrix/constants';
import { cn } from '@/lib/utils';

export function PermissionLegend({ className }: { className?: string }) {
    return (
        <div
            className={cn('flex flex-wrap items-center gap-1', className)}
            role="note"
            aria-label="Permission legend"
        >
            <span className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-500">Legend</span>
            {MATRIX_LEGEND_PERMISSIONS.map((permission) => (
                <span
                    key={permission}
                    title={permission}
                    className={cn('text-[11px]', permissionBadgeClasses(permission))}
                >
                    {permissionShortLabel(permission)}
                </span>
            ))}
        </div>
    );
}
