'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { PlatformFoundationTabBar } from '@/components/platform-foundation/PlatformFoundationTabBar';
import { PlatformFoundationStickySaveBar } from '@/components/platform-foundation/PlatformFoundationStickySaveBar';
import { normalizePlatformFoundationTab } from '@/components/platform-foundation/platformFoundationTabIds';
import { OrganizationTab } from '@/components/platform-foundation/tabs/OrganizationTab';
import { SecurityTab } from '@/components/platform-foundation/tabs/SecurityTab';
import { SubscriptionTab } from '@/components/platform-foundation/tabs/SubscriptionTab';
import { BrandingTab } from '@/components/platform-foundation/tabs/BrandingTab';
import { AuditLogsTab } from '@/components/platform-foundation/tabs/AuditLogsTab';
import { focusPanelFieldById } from '@/components/leads/leadPanelValidationUtils';
import {
    clonePlatformFoundationSettings,
    loadPlatformFoundationSettings,
    resetPlatformFoundationSettings,
    savePlatformFoundationSettings,
} from '@/lib/platformFoundationStore';
import {
    tabForFieldError,
    validatePlatformFoundationSettings,
    type PlatformFoundationFieldErrors,
} from '@/lib/platformFoundationValidation';
import type { PlatformFoundationSettings, PlatformFoundationTabId } from '@/lib/platformFoundationTypes';
import { LuRotateCcw, LuSave } from 'react-icons/lu';

const FIELD_ID_MAP: Record<string, string> = {
    'organization.businessUnitName': 'pf-businessUnitName',
    'organization.businessUnitCode': 'pf-businessUnitCode',
    'security.minPasswordLength': 'pf-minPasswordLength',
    'security.passwordExpiryDays': 'pf-passwordExpiryDays',
    'security.maxConcurrentSessions': 'pf-maxConcurrentSessions',
    'subscription.maxUsers': 'pf-maxUsers',
    'subscription.activeUsers': 'pf-activeUsers',
    'branding.productName': 'pf-productName',
    'branding.websiteUrl': 'pf-websiteUrl',
    'branding.supportEmail': 'pf-supportEmail',
};

export function PlatformFoundationWorkspace() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = normalizePlatformFoundationTab(searchParams.get('tab'));

    const [saved, setSaved] = useState<PlatformFoundationSettings>(() => loadPlatformFoundationSettings());
    const [draft, setDraft] = useState<PlatformFoundationSettings>(() => loadPlatformFoundationSettings());
    const [errors, setErrors] = useState<PlatformFoundationFieldErrors>({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        const loaded = loadPlatformFoundationSettings();
        setSaved(loaded);
        setDraft(loaded);
    }, []);

    const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

    const setTab = useCallback(
        (tab: PlatformFoundationTabId) => {
            router.replace(`/company-admin/platform-foundation?tab=${tab}`, { scroll: false });
        },
        [router],
    );

    const handleReset = () => {
        const defaults = resetPlatformFoundationSettings();
        setSaved(defaults);
        setDraft(clonePlatformFoundationSettings(defaults));
        setErrors({});
        setToast('Settings reset to defaults.');
        window.setTimeout(() => setToast(null), 3000);
    };

    const handleDiscard = () => {
        setDraft(clonePlatformFoundationSettings(saved));
        setErrors({});
    };

    const handleSave = () => {
        const nextErrors = validatePlatformFoundationSettings(draft);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            const firstKey = Object.keys(nextErrors)[0];
            const tab = tabForFieldError(firstKey);
            setTab(tab);
            const fieldId = FIELD_ID_MAP[firstKey];
            if (fieldId) window.requestAnimationFrame(() => focusPanelFieldById(fieldId));
            return;
        }
        setSaving(true);
        savePlatformFoundationSettings(draft);
        setSaved(clonePlatformFoundationSettings(draft));
        setSaving(false);
        setToast('Platform settings saved successfully.');
        window.setTimeout(() => setToast(null), 3000);
    };

    const handleHeaderSave = () => {
        if (isDirty) handleSave();
        else {
            setToast('No changes to save.');
            window.setTimeout(() => setToast(null), 2000);
        }
    };

    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Platform Foundation', href: '/platform/tenants' },
                    { label: 'Organization & Security Settings', href: '/company-admin/platform-foundation' },
                ]}
            />
            <PageHeader
                title="Platform Foundation"
                subtitle="Organization & security settings — tenant isolation, MFA, subscription, branding, and audit."
                actions={
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={handleReset}>
                            <LuRotateCcw size={18} aria-hidden />
                            Reset
                        </Button>
                        <Button type="button" variant="company" size="cta" className="gap-2" onClick={handleHeaderSave} disabled={saving}>
                            <LuSave size={18} aria-hidden />
                            Save Changes
                        </Button>
                    </div>
                }
            />

            <PlatformFoundationTabBar active={activeTab} onChange={setTab} />

            <div className="min-h-[min(24rem,70vh)] rounded-xl border border-gray-100 bg-white px-3 py-4 shadow-sm sm:px-4">
                {activeTab === 'organization' && (
                    <OrganizationTab settings={draft} onChange={setDraft} errors={errors} />
                )}
                {activeTab === 'security' && <SecurityTab settings={draft} onChange={setDraft} errors={errors} />}
                {activeTab === 'subscription' && (
                    <SubscriptionTab settings={draft} onChange={setDraft} errors={errors} />
                )}
                {activeTab === 'branding' && <BrandingTab settings={draft} onChange={setDraft} errors={errors} />}
                {activeTab === 'audit' && <AuditLogsTab />}
            </div>

            {isDirty ? (
                <PlatformFoundationStickySaveBar onDiscard={handleDiscard} onSave={handleSave} saving={saving} />
            ) : null}

            {toast ? (
                <div
                    className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-lg"
                    role="status"
                >
                    {toast}
                </div>
            ) : null}
        </>
    );
}
