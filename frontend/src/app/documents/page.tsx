'use client';

import React from 'react';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { getDocuments } from '@/data/mockData';
import { DocumentsIntelligenceWorkspace } from '@/components/documents/DocumentsIntelligenceWorkspace';
import { ComplianceAICard } from '@/components/ai/ComplianceAICard';

export default function DocumentsPage() {
    const documents = getDocuments();

    return (
        <CompanyAdminDashboardLayout>
            <DocumentsIntelligenceWorkspace documents={documents} />
            <div className="mt-6">
                <ComplianceAICard scope="documents" />
            </div>
        </CompanyAdminDashboardLayout>
    );
}
