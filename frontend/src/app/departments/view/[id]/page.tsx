'use client';

import React, { use, useMemo, useState } from 'react';
import { DepartmentDetailShell, DepartmentNotFound } from '@/components/departments/DepartmentDetailShell';
import { DepartmentRecordView } from '@/components/departments/DepartmentRecordView';
import { getDepartmentById } from '@/lib/departmentStore';
import type { Department } from '@/data/mockData';

export default function DepartmentViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idParam } = use(params);
    const [storeRefresh, setStoreRefresh] = useState(0);
    const createMode = idParam === 'new';

    const department = useMemo(() => {
        if (createMode) return undefined;
        const id = Number(idParam);
        if (!Number.isFinite(id)) return undefined;
        return getDepartmentById(id);
    }, [idParam, storeRefresh, createMode]);

    const createDraft = useMemo<Department>(
        () => ({
            id: 0,
            name: '',
            code: '',
            businessUnitId: 0,
            businessUnitName: '',
            usersCount: 0,
            status: 'Active',
            createdDate: new Date().toISOString().slice(0, 10),
            description: '',
        }),
        [],
    );

    if (!department && !createMode) {
        return <DepartmentNotFound />;
    }

    const breadcrumbItems = createMode
        ? ([
              { label: 'Platform Foundation', href: '/platform/tenants' },
              { label: 'Departments', href: '/departments' },
              { label: 'Create department' },
          ] as const)
        : ([
              { label: 'Platform Foundation', href: '/platform/tenants' },
              { label: 'Departments', href: '/departments' },
              { label: department!.name },
          ] as const);

    return (
        <DepartmentDetailShell breadcrumbItems={[...breadcrumbItems]}>
            <DepartmentRecordView
                department={createMode ? createDraft : department!}
                createMode={createMode}
                onBump={() => setStoreRefresh((x) => x + 1)}
            />
        </DepartmentDetailShell>
    );
}
