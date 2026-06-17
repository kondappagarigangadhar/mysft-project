/** Content model for workspace detail/view contextual help popovers. */
export type WorkspaceHelpContent = {
    title: string;
    subtitle?: string;
    purpose: string;
    /** Bullet list — e.g. "What you can manage". */
    features?: string[];
    /** Ordered steps — e.g. workflow. */
    workflow?: string[];
    /** Bullet list — e.g. best practices / tips. */
    tips?: string[];
};
