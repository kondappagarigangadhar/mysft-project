'use client';

import React, { use, useMemo, useState } from 'react';
import { ProjectDetailShell, ProjectNotFound } from '@/components/projects-inventory/ProjectDetailShell';
import { ProjectRecordTabs } from '@/components/projects-inventory/ProjectRecordTabs';
import { getProjectBySlug, type Project } from '@/lib/projectsInventoryStore';

export default function ViewProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [storeRefresh, setStoreRefresh] = useState(0);

    const createMode = slug === 'new';
    const project = useMemo(() => (createMode ? undefined : getProjectBySlug(slug)), [slug, storeRefresh, createMode]);

    const createDraftProject = React.useMemo<Project>(() => {
        const nowIso = new Date().toISOString();
        return {
            id: 0,
            slug: 'new',
            project_id: 'PR-NEW',
            project_name: '',
            project_type: '' as unknown as Project['project_type'],
            location: '—',
            total_units: 0,
            project_status: '' as unknown as Project['project_status'],
            approval_status: '' as unknown as Project['approval_status'],
            created_at: nowIso,
            updated_at: nowIso,
            archived: false,
        };
    }, []);

    React.useEffect(() => {
        try {
            window.localStorage.setItem('activeProjectSlug', slug);
        } catch {
            // ignore
        }
    }, [slug]);

    if (!project && !createMode) {
        return <ProjectNotFound />;
    }

    const breadcrumbItems = createMode
        ? ([{ label: 'Projects & Inventory', href: '/projects-inventory/projects' }, { label: 'Create project' }] as const)
        : ([{ label: 'Projects & Inventory', href: '/projects-inventory/projects' }, { label: 'Projects', href: '/projects-inventory/projects' }, { label: project!.project_name }] as const);

    return (
        <ProjectDetailShell breadcrumbItems={[...breadcrumbItems]}>
            <ProjectRecordTabs
                project={(createMode ? createDraftProject : project!) as Project}
                listVersion={storeRefresh}
                onBump={() => setStoreRefresh((x) => x + 1)}
                createMode={createMode}
            />
        </ProjectDetailShell>
    );
}
