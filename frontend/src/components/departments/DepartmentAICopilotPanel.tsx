'use client';

import React, { useEffect, useState } from 'react';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import { AIConfidenceBar } from '@/components/ai/AIConfidenceBar';
import { AISkeletonShimmer } from '@/components/ai/AISkeletonShimmer';
import type { Department } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function DepartmentAICopilotPanel({ department, disabled }: { department: Department; disabled?: boolean }) {
    const [loading, setLoading] = useState(true);
    const [nextAction, setNextAction] = useState('');
    const [staffingTip, setStaffingTip] = useState('');
    const [confidence, setConfidence] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const t = window.setTimeout(() => {
            if (cancelled) return;
            const users = department.usersCount ?? 0;
            setNextAction(
                department.status === 'Inactive'
                    ? 'Review reactivation criteria and assign an interim department head before enabling workflows.'
                    : users < 5
                      ? 'Consider cross-training staff from adjacent business units to meet minimum coverage.'
                      : 'Schedule a quarterly org review with the department head and HR.',
            );
            setStaffingTip(
                `This unit has ${users} user${users === 1 ? '' : 's'} under ${department.businessUnitName || 'its business unit'}. ` +
                    (department.departmentHeadName
                        ? `${department.departmentHeadName} is listed as department head.`
                        : 'No department head is assigned yet — assign one to improve accountability.'),
            );
            setConfidence(department.departmentHeadName && department.status === 'Active' ? 84 : 68);
            setLoading(false);
        }, 480);
        return () => {
            cancelled = true;
            window.clearTimeout(t);
        };
    }, [department.id, department.name, department.status, department.usersCount, department.businessUnitName, department.departmentHeadName]);

    return (
        <AICopilotPanel title="Department AI Copilot">
            {loading ? (
                <div className="space-y-2">
                    <AISkeletonShimmer className="h-3 w-full" />
                    <AISkeletonShimmer className="h-3 w-4/5" />
                    <AISkeletonShimmer className="h-3 w-full" />
                </div>
            ) : (
                <>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Recommended action</p>
                        <p className={cn('mt-1 font-medium text-slate-900', disabled && 'opacity-60')}>{nextAction}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Staffing insight</p>
                        <p className={cn('mt-1 leading-relaxed text-slate-700', disabled && 'opacity-60')}>{staffingTip}</p>
                    </div>
                    <AIConfidenceBar value={confidence} />
                </>
            )}
        </AICopilotPanel>
    );
}
