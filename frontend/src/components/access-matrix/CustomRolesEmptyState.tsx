'use client';

import { Button } from '@/components/ui/Button';
import { CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import { LuPlus, LuShield } from 'react-icons/lu';

type CustomRolesEmptyStateProps = {
    onCreateRole: () => void;
    className?: string;
};

export function CustomRolesEmptyState({ onCreateRole, className }: CustomRolesEmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20',
                className,
            )}
        >
            <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                <div className="absolute inset-3 rounded-xl border border-dashed border-slate-200" aria-hidden />
                <LuShield className="h-10 w-10 text-[var(--cta-button-bg)] opacity-90" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No custom roles created</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Custom roles let you define tenant-specific access columns. Create a role to build a compact permission matrix
                scoped only to your organization.
            </p>
            <Button
                type="button"
                variant="company"
                size="cta"
                className={cn('mt-6 gap-2', CTA_SHADOW_SOFT)}
                onClick={onCreateRole}
            >
                <LuPlus size={18} />
                Create role
            </Button>
        </div>
    );
}
