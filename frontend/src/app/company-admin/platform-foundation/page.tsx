'use client';

import React, { Suspense } from 'react';
import { PlatformFoundationWorkspace } from '@/components/platform-foundation/PlatformFoundationWorkspace';

function PlatformFoundationFallback() {
    return <div className="py-12 text-center text-sm text-slate-500">Loading platform foundation…</div>;
}

export default function PlatformFoundationPage() {
    return (
        <Suspense fallback={<PlatformFoundationFallback />}>
            <PlatformFoundationWorkspace />
        </Suspense>
    );
}
