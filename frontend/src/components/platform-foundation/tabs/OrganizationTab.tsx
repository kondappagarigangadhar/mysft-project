'use client';

import React, { useState } from 'react';
import {
    PF_FIELD_GRID,
    PfCollapsibleSection,
    PfFieldRow,
    PfInfoBanner,
    PfInput,
    PfSectionErrorBadge,
    PfSelect,
    PfTextarea,
    PfToggleFieldRow,
} from '@/components/platform-foundation/PlatformFoundationFormPrimitives';
import type { PlatformFoundationFieldErrors } from '@/lib/platformFoundationValidation';
import type { PlatformFoundationSettings } from '@/lib/platformFoundationTypes';
import { LuBuilding2, LuGitBranch, LuUsers } from 'react-icons/lu';

type Props = {
    settings: PlatformFoundationSettings;
    onChange: (next: PlatformFoundationSettings) => void;
    errors: PlatformFoundationFieldErrors;
};

export function OrganizationTab({ settings, onChange, errors }: Props) {
    const org = settings.organization;
    const patch = (partial: Partial<typeof org>) =>
        onChange({ ...settings, organization: { ...org, ...partial } });

    const [open, setOpen] = useState({ tenant: true, hierarchy: true, lifecycle: true });

    const hierarchyErrors = ['organization.businessUnitName', 'organization.businessUnitCode'].filter(
        (k) => errors[k],
    ).length;

    return (
        <div className="space-y-4">
            <PfCollapsibleSection
                title="TENANT ISOLATION"
                icon={LuBuilding2}
                tone="blue"
                open={open.tenant}
                onOpenChange={(o) => setOpen((s) => ({ ...s, tenant: o }))}
            >
                <div className={PF_FIELD_GRID}>
                    <PfFieldRow label="Tenant ID" fieldId="pf-tenantId">
                        <PfInput id="pf-tenantId" value={org.tenantId} readOnly disabled />
                    </PfFieldRow>
                    <PfFieldRow label="Database schema" fieldId="pf-databaseSchema">
                        <PfInput id="pf-databaseSchema" value={org.databaseSchema} readOnly disabled />
                    </PfFieldRow>
                    <PfFieldRow label="Tenant status" fieldId="pf-tenantStatus">
                        <PfSelect
                            id="pf-tenantStatus"
                            value={org.tenantStatus}
                            onChange={(v) => patch({ tenantStatus: v as typeof org.tenantStatus })}
                            options={[
                                { value: 'Active', label: 'Active' },
                                { value: 'Suspended', label: 'Suspended' },
                                { value: 'Provisioning', label: 'Provisioning' },
                            ]}
                        />
                    </PfFieldRow>
                </div>
                <PfInfoBanner>
                    Each tenant runs in an isolated database schema. Cross-tenant data access is blocked at the
                    connection layer.
                </PfInfoBanner>
            </PfCollapsibleSection>

            <PfCollapsibleSection
                title="BUSINESS HIERARCHY"
                icon={LuGitBranch}
                tone="amber"
                open={open.hierarchy}
                onOpenChange={(o) => setOpen((s) => ({ ...s, hierarchy: o }))}
                headerRight={<PfSectionErrorBadge count={hierarchyErrors} />}
            >
                <div className={PF_FIELD_GRID}>
                    <PfFieldRow
                        label="Business unit name"
                        required
                        fieldId="pf-businessUnitName"
                        error={errors['organization.businessUnitName']}
                    >
                        <PfInput
                            id="pf-businessUnitName"
                            value={org.businessUnitName}
                            onChange={(v) => patch({ businessUnitName: v })}
                            error={Boolean(errors['organization.businessUnitName'])}
                        />
                    </PfFieldRow>
                    <PfFieldRow
                        label="Business unit code"
                        required
                        fieldId="pf-businessUnitCode"
                        error={errors['organization.businessUnitCode']}
                    >
                        <PfInput
                            id="pf-businessUnitCode"
                            value={org.businessUnitCode}
                            onChange={(v) => patch({ businessUnitCode: v })}
                            error={Boolean(errors['organization.businessUnitCode'])}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Parent organization" fieldId="pf-parentOrganization">
                        <PfInput
                            id="pf-parentOrganization"
                            value={org.parentOrganization}
                            onChange={(v) => patch({ parentOrganization: v })}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Default project scope" fieldId="pf-defaultProjectScope" className="xl:col-span-2">
                        <PfTextarea
                            id="pf-defaultProjectScope"
                            value={org.defaultProjectScope}
                            onChange={(v) => patch({ defaultProjectScope: v })}
                        />
                    </PfFieldRow>
                </div>
                <PfInfoBanner variant="slate">
                    Parent → Business unit → Department → Users. Default project scope applies when creating projects
                    under this business unit.
                </PfInfoBanner>
            </PfCollapsibleSection>

            <PfCollapsibleSection
                title="USER LIFECYCLE"
                icon={LuUsers}
                tone="slate"
                open={open.lifecycle}
                onOpenChange={(o) => setOpen((s) => ({ ...s, lifecycle: o }))}
            >
                <div className={PF_FIELD_GRID}>
                    <PfFieldRow label="Joining date" fieldId="pf-joiningDate">
                        <PfInput
                            id="pf-joiningDate"
                            type="date"
                            value={org.joiningDate}
                            onChange={(v) => patch({ joiningDate: v })}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Exit date" fieldId="pf-exitDate">
                        <PfInput id="pf-exitDate" type="date" value={org.exitDate} onChange={(v) => patch({ exitDate: v })} />
                    </PfFieldRow>
                    <PfFieldRow label="Reporting manager" fieldId="pf-reportingManager">
                        <PfInput
                            id="pf-reportingManager"
                            value={org.reportingManager}
                            onChange={(v) => patch({ reportingManager: v })}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Department transfer" fieldId="pf-departmentTransfer">
                        <PfInput
                            id="pf-departmentTransfer"
                            value={org.departmentTransfer}
                            onChange={(v) => patch({ departmentTransfer: v })}
                            placeholder="e.g. Engineering → Sales"
                        />
                    </PfFieldRow>
                    <PfToggleFieldRow
                        label="Active status"
                        description="When off, exit workflow is triggered."
                        checked={!org.exitDate}
                        onChange={(active) => patch({ exitDate: active ? '' : new Date().toISOString().slice(0, 10) })}
                        badge="Lifecycle"
                    />
                </div>
            </PfCollapsibleSection>
        </div>
    );
}
