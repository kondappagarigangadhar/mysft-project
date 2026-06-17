'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
    COMPLIANCE_ROLE_STORAGE_KEY,
    type ComplianceDemoRole,
} from '@/lib/complianceRbac';

function parseRole(raw: string | null): ComplianceDemoRole {
    if (
        raw === 'super_admin' ||
        raw === 'company_admin' ||
        raw === 'staff' ||
        raw === 'viewer'
    ) {
        return raw;
    }
    return 'company_admin';
}

const roleListeners = new Set<() => void>();

function emitRole() {
    roleListeners.forEach((l) => l());
}

function subscribeRole(onStoreChange: () => void): () => void {
    roleListeners.add(onStoreChange);
    return () => roleListeners.delete(onStoreChange);
}

function getSnapshot(): ComplianceDemoRole {
    if (typeof window === 'undefined') return 'company_admin';
    return parseRole(window.localStorage.getItem(COMPLIANCE_ROLE_STORAGE_KEY));
}

function getServerSnapshot(): ComplianceDemoRole {
    return 'company_admin';
}

export function setComplianceRoleGlobal(r: ComplianceDemoRole): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COMPLIANCE_ROLE_STORAGE_KEY, r);
    emitRole();
}

export function useComplianceRole(): {
    role: ComplianceDemoRole;
    setRole: (r: ComplianceDemoRole) => void;
} {
    const role = useSyncExternalStore(subscribeRole, getSnapshot, getServerSnapshot);

    const setRole = useCallback((r: ComplianceDemoRole) => {
        setComplianceRoleGlobal(r);
    }, []);

    return { role, setRole };
}
