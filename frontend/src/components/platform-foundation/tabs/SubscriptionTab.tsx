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
} from '@/components/platform-foundation/PlatformFoundationFormPrimitives';
import { PLATFORM_MODULE_LABELS } from '@/lib/platformFoundationStore';
import type { PlatformFoundationFieldErrors } from '@/lib/platformFoundationValidation';
import type { PlatformFoundationSettings, PlatformModuleId } from '@/lib/platformFoundationTypes';
import { LuCreditCard, LuGrid3X3, LuUsers } from 'react-icons/lu';
import { cn } from '@/lib/utils';

type Props = {
    settings: PlatformFoundationSettings;
    onChange: (next: PlatformFoundationSettings) => void;
    errors: PlatformFoundationFieldErrors;
};

const ALL_MODULES = Object.keys(PLATFORM_MODULE_LABELS) as PlatformModuleId[];

export function SubscriptionTab({ settings, onChange, errors }: Props) {
    const sub = settings.subscription;
    const patch = (partial: Partial<typeof sub>) =>
        onChange({ ...settings, subscription: { ...sub, ...partial } });

    const [open, setOpen] = useState({ plan: true, limits: true, modules: true });
    const remaining = Math.max(0, sub.maxUsers - sub.activeUsers);

    const limitErrors = ['subscription.maxUsers', 'subscription.activeUsers'].filter((k) => errors[k]).length;

    const toggleModule = (id: PlatformModuleId) => {
        const enabled = sub.enabledModules.includes(id);
        patch({
            enabledModules: enabled
                ? sub.enabledModules.filter((m) => m !== id)
                : [...sub.enabledModules, id],
        });
    };

    return (
        <div className="space-y-4">
            <PfCollapsibleSection
                title="SUBSCRIPTION PLAN"
                icon={LuCreditCard}
                tone="blue"
                open={open.plan}
                onOpenChange={(o) => setOpen((s) => ({ ...s, plan: o }))}
            >
                <div className={PF_FIELD_GRID}>
                    <PfFieldRow label="Subscription plan" fieldId="pf-plan">
                        <PfSelect
                            id="pf-plan"
                            value={sub.plan}
                            onChange={(v) => patch({ plan: v })}
                            options={[
                                { value: 'Starter', label: 'Starter' },
                                { value: 'Professional', label: 'Professional' },
                                { value: 'Enterprise', label: 'Enterprise' },
                            ]}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Billing cycle" fieldId="pf-billingCycle">
                        <PfSelect
                            id="pf-billingCycle"
                            value={sub.billingCycle}
                            onChange={(v) => patch({ billingCycle: v as typeof sub.billingCycle })}
                            options={[
                                { value: 'Monthly', label: 'Monthly' },
                                { value: 'Quarterly', label: 'Quarterly' },
                                { value: 'Annual', label: 'Annual' },
                            ]}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Subscription status" fieldId="pf-subStatus">
                        <PfSelect
                            id="pf-subStatus"
                            value={sub.status}
                            onChange={(v) => patch({ status: v as typeof sub.status })}
                            options={[
                                { value: 'Active', label: 'Active' },
                                { value: 'Trial', label: 'Trial' },
                                { value: 'Expired', label: 'Expired' },
                                { value: 'Cancelled', label: 'Cancelled' },
                            ]}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Expiry date" fieldId="pf-expiryDate">
                        <PfInput
                            id="pf-expiryDate"
                            type="date"
                            value={sub.expiryDate}
                            onChange={(v) => patch({ expiryDate: v })}
                        />
                    </PfFieldRow>
                </div>
            </PfCollapsibleSection>

            <PfCollapsibleSection
                title="USER LIMITS"
                icon={LuUsers}
                tone="amber"
                open={open.limits}
                onOpenChange={(o) => setOpen((s) => ({ ...s, limits: o }))}
                headerRight={<PfSectionErrorBadge count={limitErrors} />}
            >
                <div className={PF_FIELD_GRID}>
                    <PfFieldRow label="Max users" fieldId="pf-maxUsers" error={errors['subscription.maxUsers']}>
                        <PfInput
                            id="pf-maxUsers"
                            type="number"
                            value={String(sub.maxUsers)}
                            onChange={(v) => patch({ maxUsers: Number(v) || 0 })}
                            error={Boolean(errors['subscription.maxUsers'])}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Active users" fieldId="pf-activeUsers" error={errors['subscription.activeUsers']}>
                        <PfInput
                            id="pf-activeUsers"
                            type="number"
                            value={String(sub.activeUsers)}
                            onChange={(v) => patch({ activeUsers: Number(v) || 0 })}
                            error={Boolean(errors['subscription.activeUsers'])}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Remaining slots" fieldId="pf-remaining">
                        <PfInput id="pf-remaining" value={String(remaining)} readOnly disabled />
                    </PfFieldRow>
                </div>
                <PfInfoBanner variant="slate">
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full rounded-full bg-[var(--cta-button-bg)]"
                            style={{ width: `${Math.min(100, (sub.activeUsers / Math.max(sub.maxUsers, 1)) * 100)}%` }}
                        />
                    </div>
                    {sub.activeUsers} of {sub.maxUsers} seats in use ({remaining} remaining)
                </PfInfoBanner>
            </PfCollapsibleSection>

            <PfCollapsibleSection
                title="MODULE ACCESS"
                icon={LuGrid3X3}
                tone="slate"
                open={open.modules}
                onOpenChange={(o) => setOpen((s) => ({ ...s, modules: o }))}
            >
                <div className="border-t border-gray-200/80 p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {ALL_MODULES.map((id) => {
                            const enabled = sub.enabledModules.includes(id);
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => toggleModule(id)}
                                    className={cn(
                                        'flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition',
                                        enabled
                                            ? 'border-emerald-300 bg-emerald-50/80'
                                            : 'border-gray-200 bg-gray-50/80',
                                    )}
                                >
                                    <span className="font-semibold text-gray-900">{PLATFORM_MODULE_LABELS[id]}</span>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                            enabled ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-600',
                                        )}
                                    >
                                        {enabled ? 'On' : 'Off'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </PfCollapsibleSection>
        </div>
    );
}
