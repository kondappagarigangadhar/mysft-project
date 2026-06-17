export type WorkflowStepState = 'completed' | 'active' | 'pending';

export type WorkflowStepNav = {
    /** Element id to scroll to (collapsible sections auto-expand). */
    sectionId?: string;
    /** Switch record detail tab before scrolling. */
    tab?: string;
    /** When true, navigation is blocked in create mode until the record is saved. */
    requiresSaved?: boolean;
};

export type WorkflowStep = {
    id: string;
    label: string;
    state: WorkflowStepState;
    nav?: WorkflowStepNav;
};

/** First incomplete step is active; earlier steps completed; later steps pending. */
export function applySequentialWorkflowStates(doneFlags: boolean[]): WorkflowStepState[] {
    const firstOpen = doneFlags.findIndex((d) => !d);
    return doneFlags.map((done, i) => {
        if (done) return 'completed';
        if (firstOpen === i) return 'active';
        return 'pending';
    });
}

export function buildWorkflowSteps(
    stepDefs: Array<{ id: string; label: string; nav?: WorkflowStepNav }>,
    doneFlags: boolean[],
): WorkflowStep[] {
    const states = applySequentialWorkflowStates(doneFlags);
    return stepDefs.map((def, i) => ({
        id: def.id,
        label: def.label,
        state: states[i]!,
        nav: def.nav,
    }));
}

export function attachWorkflowStepNav(
    steps: WorkflowStep[],
    navById: Record<string, WorkflowStepNav | undefined>,
): WorkflowStep[] {
    return steps.map((step) => ({
        ...step,
        nav: step.nav ?? navById[step.id],
    }));
}
