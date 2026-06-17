'use client';

import React, { use, useMemo, useState } from 'react';
import type { User } from '@/data/mockData';
import { companies, getUserById } from '@/data/mockData';
import { UserDetailShell, UserNotFound } from '@/components/users/UserDetailShell';
import { UserRecordTabs } from '@/components/users/UserRecordTabs';
import { userListHref } from '@/lib/userRoutes';

function buildNewUserDraft(): User {
    const first = companies[0];
    return {
        id: 0,
        firstName: '',
        lastName: '',
        name: '',
        email: '',
        phoneNumber: '',
        designation: '',
        role: 'Engineer',
        department: 'Engineering',
        tenantId: first?.id ?? 1,
        tenantName: first?.name ?? '',
        status: 'Pending',
        createdDate: '',
        joined: new Date().toISOString().slice(0, 10),
    };
}

export default function UserViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [storeRefresh, setStoreRefresh] = useState(0);
    const createMode = id === 'new';
    const numericId = createMode ? 0 : Number(id);
    const user = useMemo(() => {
        void storeRefresh;
        return createMode ? undefined : getUserById(numericId);
    }, [createMode, numericId, storeRefresh]);
    const createDraft = useMemo(() => buildNewUserDraft(), []);

    if (!createMode && (Number.isNaN(numericId) || !user)) {
        return <UserNotFound />;
    }

    const breadcrumbItems = createMode
        ? ([{ label: 'Users', href: userListHref() }, { label: 'Create user' }] as const)
        : ([{ label: 'Users', href: userListHref() }, { label: user!.name }] as const);

    return (
        <UserDetailShell breadcrumbItems={[...breadcrumbItems]}>
            <UserRecordTabs user={(createMode ? createDraft : user!) as User} listVersion={storeRefresh} onBump={() => setStoreRefresh((x) => x + 1)} createMode={createMode} />
        </UserDetailShell>
    );
}
