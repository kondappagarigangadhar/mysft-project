'use client';

import React from 'react';
import { COMPLIANCE_ROLE_LABELS, type ComplianceDemoRole } from '@/lib/complianceRbac';
import { useComplianceRole } from '@/hooks/useComplianceRole';
import { cn } from '@/lib/utils';
import { CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';

const ORDER: ComplianceDemoRole[] = ['super_admin', 'company_admin', 'staff', 'viewer'];

export function ComplianceDemoRoleSelect({ className }: { className?: string }) {
    const { role, setRole } = useComplianceRole();

    return (
        <div className={cn('flex flex-col gap-1', className)}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Demo role (RBAC)</label>
            <select
                value={role}
                onChange={(e) => setRole(e.target.value as ComplianceDemoRole)}
                className={cn(
                    'h-10 min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm',
                    CTA_INPUT_FOCUS,
                )}
            >
                {ORDER.map((r) => (
                    <option key={r} value={r}>
                        {COMPLIANCE_ROLE_LABELS[r]}
                    </option>
                ))}
            </select>
            <p className="text-[11px] text-slate-500">
                Simulates permissions. Production uses your auth session.
            </p>
        </div>
    );
}
