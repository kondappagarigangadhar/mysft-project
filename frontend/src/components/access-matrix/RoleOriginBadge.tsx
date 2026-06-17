'use client';

import { isDefaultMatrixRole } from '@/lib/accessMatrix/seed';
import type { MatrixRole } from '@/lib/accessMatrix/types';
import { cn } from '@/lib/utils';

type RoleOriginBadgeProps = {
    role: Pick<MatrixRole, 'name' | 'isSystem'>;
    size?: 'xs' | 'sm';
    className?: string;
};

/** Distinguishes platform default (seed) roles from user-created custom roles. */
export function RoleOriginBadge({ role, size = 'xs', className }: RoleOriginBadgeProps) {
    const isDefault = isDefaultMatrixRole(role);
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center rounded-full border font-bold uppercase tracking-wide',
                size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
                isDefault
                    ? 'border-slate-200 bg-slate-50 text-slate-600'
                    : 'border-[color-mix(in_srgb,var(--cta-button-bg)_32%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-[var(--cta-button-bg)]',
                className,
            )}
            title={
                isDefault
                    ? 'Platform default role — included with the matrix seed'
                    : 'Custom role — created via Add role or Clone'
            }
        >
            {isDefault ? 'Default' : 'Custom'}
        </span>
    );
}

/** Static legend chips (no role instance required). */
export function RoleOriginLegend() {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600" role="note">
            <span className="font-semibold text-slate-700">Role types</span>
            <span className="inline-flex items-center gap-1.5">
                <RoleOriginBadge role={{ name: 'Super Admin', isSystem: true }} />
                <span>Platform seed</span>
            </span>
            <span className="text-slate-300" aria-hidden>
                ·
            </span>
            <span className="inline-flex items-center gap-1.5">
                <RoleOriginBadge role={{ name: '', isSystem: false }} />
                <span>You added</span>
            </span>
        </div>
    );
}
