'use client';

import React, { Suspense } from 'react';
import { HistoryLogsPage } from '@/components/history-logs/HistoryLogsPage';

function HistoryLogsFallback() {
    return <div className="w-full px-4 py-12 text-center text-sm text-slate-500">Loading history logs…</div>;
}

export default function CompanyAdminHistoryLogsPage() {
    return (
        <Suspense fallback={<HistoryLogsFallback />}>
            <HistoryLogsPage />
        </Suspense>
    );
}