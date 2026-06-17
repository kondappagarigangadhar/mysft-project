'use client';

import React, { use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { DocumentDetailView } from '@/components/documents-compliance/DocumentDetailView';
import { DocumentVersionModal } from '@/components/documents-compliance/DocumentVersionModal';
import { useComplianceRole } from '@/hooks/useComplianceRole';
import { canEdit, canView } from '@/lib/complianceRbac';
import { getCurrentVersion, getDocumentById, logDownload, logView } from '@/lib/complianceDocumentsMockStore';
import { Button } from '@/components/ui/Button';

const ACTOR_NAME = 'Company Admin User';
const BASE = '/company-admin/documents-compliance';

export default function ComplianceDocumentUnifiedViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { role } = useComplianceRole();
    const [versionOpen, setVersionOpen] = React.useState(false);

    const createMode = id === 'new';
    const doc = createMode ? null : getDocumentById(id);
    const v = doc ? getCurrentVersion(doc) : undefined;

    if (!createMode && !doc) {
        return (
            <div className="space-y-6 pb-10">
                <Breadcrumb
                    items={[
                        { label: 'Documents & Compliance', href: BASE },
                        { label: 'Document management', href: BASE },
                        { label: 'Not found' },
                    ]}
                />
                <div className="mx-auto max-w-6xl">
                    <div className="bg-white rounded-xl p-8 shadow-sm ring-1 ring-slate-200/80">
                        <h1 className="text-xl font-bold text-slate-900">Document not found</h1>
                        <p className="mt-2 text-sm text-slate-600">This record may have been restored or removed.</p>
                        <Button type="button" variant="companyOutline" className="mt-6" onClick={() => router.push(BASE)}>
                            Back to Document management
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!createMode && !canView(role)) {
        return (
            <div className="space-y-6 pb-10">
                <Breadcrumb
                    items={[
                        { label: 'Documents & Compliance', href: BASE },
                        { label: 'Document management', href: BASE },
                        { label: doc?.name ?? 'Document' },
                    ]}
                />
                <div className="mx-auto max-w-6xl space-y-4 text-left">
                    <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-slate-200/80">
                        <p className="text-sm text-slate-600">Your current role cannot view this document.</p>
                        <Button type="button" variant="companyOutline" className="mt-4" onClick={() => router.push(BASE)}>
                            Back to list
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const onDownload = () => {
        if (!doc || !v) return;
        logView(doc.id, { name: ACTOR_NAME, role });
        logDownload(doc.id, { name: ACTOR_NAME, role });
        window.open(v.storageUrl, '_blank', 'noopener,noreferrer');
    };

    const editHref = `${BASE}/view/${encodeURIComponent(id)}?edit=1`;
    const tab = searchParams.get('tab');

    const breadcrumbItems = createMode
        ? ([{ label: 'Documents & Compliance', href: BASE }, { label: 'Create document' }] as const)
        : ([{ label: 'Documents & Compliance', href: BASE }, { label: 'Document management', href: BASE }, { label: doc!.name }] as const);

    return (
        <div className="space-y-6 pb-10">
            <Breadcrumb items={[...breadcrumbItems]} />

            <div className="w-full max-w-none space-y-6 text-left">
                <DocumentDetailView
                    documentId={id}
                    actorName={ACTOR_NAME}
                    actorRole={role}
                    onOpenVersions={() => setVersionOpen(true)}
                    showEdit={!createMode && canEdit(role)}
                    editHref={editHref}
                    onBackToList={() => router.push(BASE)}
                    onDownload={onDownload}
                    initialTab={tab}
                />
            </div>

            {!createMode ? (
                <DocumentVersionModal
                    open={versionOpen}
                    documentId={id}
                    onClose={() => setVersionOpen(false)}
                    uploadedBy={ACTOR_NAME}
                    userRole={role}
                />
            ) : null}
        </div>
    );
}

