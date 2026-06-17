'use client';

import React from 'react';
import { ESignWorkflowDrawer } from '@/components/documents-compliance/esign-workflow/ESignWorkflowDrawer';

/**
 * Legacy entry point — delegates to the step-based {@link ESignWorkflowDrawer}.
 */
export function ESignRequestForm({
    open,
    onCancel,
    onSuccess,
}: {
    open: boolean;
    onCancel: () => void;
    onSuccess?: () => void;
    cancelLabel?: string;
}) {
    return <ESignWorkflowDrawer open={open} onDismiss={onCancel} onSuccess={onSuccess} />;
}
