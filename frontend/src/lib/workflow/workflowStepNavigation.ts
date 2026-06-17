import type { WorkflowStep, WorkflowStepNav } from '@/lib/workflow/workflowStepTypes';

const SCROLL_OFFSET_PX = 132;

/** Expand collapsed workflow section (if present) and scroll it into view. */
export function scrollToWorkflowSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (!el) return;

    const toggle = el.querySelector<HTMLButtonElement>('button[aria-expanded="false"]');
    toggle?.click();

    window.requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
}

export type WorkflowStepHandlerOptions = {
    currentTab?: string;
    setTab?: (tab: string) => void;
    isCreate?: boolean;
    onBlocked?: (message: string) => void;
    /** For cross-route tab changes (e.g. project overview → inventory tab). */
    onTabRoute?: (tab: string, sectionId?: string) => void;
};

export function createWorkflowStepHandler(options: WorkflowStepHandlerOptions) {
    return (step: WorkflowStep) => {
        const nav = step.nav;
        if (!nav?.sectionId && !nav?.tab) return;

        if (options.isCreate && nav.requiresSaved) {
            options.onBlocked?.('Save the record first to open this section.');
            return;
        }

        const scroll = () => {
            if (nav.sectionId) scrollToWorkflowSection(nav.sectionId);
        };

        if (nav.tab && options.onTabRoute) {
            options.onTabRoute(nav.tab, nav.sectionId);
            if (nav.sectionId) window.setTimeout(scroll, 120);
            return;
        }

        if (nav.tab && options.setTab && options.currentTab !== nav.tab) {
            options.setTab(nav.tab);
            if (nav.sectionId) window.setTimeout(scroll, 120);
            else window.setTimeout(scroll, 80);
            return;
        }

        scroll();
    };
}

/** Re-export for workflow modules that define nav maps alongside step ids. */
export type { WorkflowStepNav };
