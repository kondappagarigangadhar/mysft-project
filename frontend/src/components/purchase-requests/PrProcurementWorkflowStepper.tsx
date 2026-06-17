'use client';

import { RecordWorkflowStepper } from '@/components/workflow/RecordWorkflowStepper';
import type { WorkflowStep } from '@/lib/workflow/workflowStepTypes';

export function PrProcurementWorkflowStepper({
    steps,
    onStepNavigate,
}: {
    steps: WorkflowStep[];
    onStepNavigate?: (step: WorkflowStep) => void;
}) {
    return <RecordWorkflowStepper steps={steps} ariaLabel="Procurement workflow" onStepNavigate={onStepNavigate} />;
}
