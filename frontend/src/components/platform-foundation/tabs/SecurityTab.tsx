'use client';

import React, { useState } from 'react';
import {
    PF_FIELD_GRID,
    PfCollapsibleSection,
    PfFieldRow,
    PfInput,
    PfSectionErrorBadge,
    PfSelect,
    PfToggleFieldRow,
} from '@/components/platform-foundation/PlatformFoundationFormPrimitives';
import type { PlatformFoundationFieldErrors } from '@/lib/platformFoundationValidation';
import type { MfaMethod, PlatformFoundationSettings } from '@/lib/platformFoundationTypes';
import { LuKeyRound, LuLock, LuShield } from 'react-icons/lu';
import { cn } from '@/lib/utils';

type Props = {
    settings: PlatformFoundationSettings;
    onChange: (next: PlatformFoundationSettings) => void;
    errors: PlatformFoundationFieldErrors;
};

const MFA_OPTIONS: { value: MfaMethod; label: string; desc: string }[] = [
    { value: 'email', label: 'Email OTP', desc: 'One-time code sent to registered email' },
    { value: 'sms', label: 'SMS OTP', desc: 'One-time code sent to verified mobile' },
    { value: 'authenticator', label: 'Authenticator app', desc: 'TOTP via Google Authenticator, Authy, etc.' },
];

export function SecurityTab({ settings, onChange, errors }: Props) {
    const sec = settings.security;
    const patch = (partial: Partial<typeof sec>) =>
        onChange({ ...settings, security: { ...sec, ...partial } });

    const [open, setOpen] = useState({ mfa: true, auth: true, session: true });

    const authErrors = ['security.minPasswordLength', 'security.passwordExpiryDays'].filter((k) => errors[k]).length;
    const sessionErrors = ['security.maxConcurrentSessions'].filter((k) => errors[k]).length;

    return (
        <div className="space-y-4">
            <PfCollapsibleSection
                title="MFA SETTINGS"
                icon={LuShield}
                tone="blue"
                open={open.mfa}
                onOpenChange={(o) => setOpen((s) => ({ ...s, mfa: o }))}
            >
                <div className={PF_FIELD_GRID}>
                    <PfToggleFieldRow
                        label="MFA enabled"
                        description="Require a second factor at sign-in for all users."
                        checked={sec.mfaEnabled}
                        onChange={(v) => patch({ mfaEnabled: v })}
                        badge={sec.mfaEnabled ? 'Active' : undefined}
                    />
                    {sec.mfaEnabled ? (
                        <PfFieldRow label="MFA method" fieldId="pf-mfaMethod" className="xl:col-span-2">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                {MFA_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => patch({ mfaMethod: opt.value })}
                                        className={cn(
                                            'rounded-lg border px-3 py-2 text-left text-sm transition',
                                            sec.mfaMethod === opt.value
                                                ? 'border-[var(--cta-button-bg)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] ring-1 ring-[var(--cta-button-bg)]'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300',
                                        )}
                                    >
                                        <span className="font-semibold text-gray-900">{opt.label}</span>
                                        <p className="mt-0.5 text-xs text-gray-500">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </PfFieldRow>
                    ) : null}
                </div>
            </PfCollapsibleSection>

            <PfCollapsibleSection
                title="AUTHENTICATION SETTINGS"
                icon={LuKeyRound}
                tone="amber"
                open={open.auth}
                onOpenChange={(o) => setOpen((s) => ({ ...s, auth: o }))}
                headerRight={<PfSectionErrorBadge count={authErrors} />}
            >
                <div className={PF_FIELD_GRID}>
                    <PfFieldRow label="Password policy" fieldId="pf-passwordPolicy">
                        <PfSelect
                            id="pf-passwordPolicy"
                            value={sec.passwordPolicy}
                            onChange={(v) => patch({ passwordPolicy: v })}
                            options={[
                                { value: 'Enterprise Standard', label: 'Enterprise Standard' },
                                { value: 'Strict', label: 'Strict' },
                                { value: 'Custom', label: 'Custom' },
                            ]}
                        />
                    </PfFieldRow>
                    <PfFieldRow
                        label="Min password length"
                        fieldId="pf-minPasswordLength"
                        error={errors['security.minPasswordLength']}
                    >
                        <PfInput
                            id="pf-minPasswordLength"
                            type="number"
                            value={String(sec.minPasswordLength)}
                            onChange={(v) => patch({ minPasswordLength: Number(v) || 0 })}
                            error={Boolean(errors['security.minPasswordLength'])}
                        />
                    </PfFieldRow>
                    <PfFieldRow
                        label="Password expiry (days)"
                        fieldId="pf-passwordExpiryDays"
                        error={errors['security.passwordExpiryDays']}
                    >
                        <PfInput
                            id="pf-passwordExpiryDays"
                            type="number"
                            value={String(sec.passwordExpiryDays)}
                            onChange={(v) => patch({ passwordExpiryDays: Number(v) || 0 })}
                            error={Boolean(errors['security.passwordExpiryDays'])}
                        />
                    </PfFieldRow>
                    <PfToggleFieldRow
                        label="Special characters"
                        checked={sec.requireSpecialCharacters}
                        onChange={(v) => patch({ requireSpecialCharacters: v })}
                    />
                    <PfToggleFieldRow
                        label="Uppercase"
                        checked={sec.requireUppercase}
                        onChange={(v) => patch({ requireUppercase: v })}
                    />
                    <PfToggleFieldRow
                        label="Numbers"
                        checked={sec.requireNumbers}
                        onChange={(v) => patch({ requireNumbers: v })}
                    />
                </div>
            </PfCollapsibleSection>

            <PfCollapsibleSection
                title="SESSION CONTROLS"
                icon={LuLock}
                tone="slate"
                open={open.session}
                onOpenChange={(o) => setOpen((s) => ({ ...s, session: o }))}
                headerRight={<PfSectionErrorBadge count={sessionErrors} />}
            >
                <div className={PF_FIELD_GRID}>
                    <PfFieldRow label="Session timeout" fieldId="pf-sessionTimeout">
                        <PfSelect
                            id="pf-sessionTimeout"
                            value={String(sec.sessionTimeoutMinutes)}
                            onChange={(v) => patch({ sessionTimeoutMinutes: Number(v) })}
                            options={[
                                { value: '15', label: '15 min' },
                                { value: '30', label: '30 min' },
                                { value: '60', label: '60 min' },
                                { value: '120', label: '120 min' },
                            ]}
                        />
                    </PfFieldRow>
                    <PfFieldRow
                        label="Max concurrent sessions"
                        fieldId="pf-maxConcurrentSessions"
                        error={errors['security.maxConcurrentSessions']}
                    >
                        <PfInput
                            id="pf-maxConcurrentSessions"
                            type="number"
                            value={String(sec.maxConcurrentSessions)}
                            onChange={(v) => patch({ maxConcurrentSessions: Number(v) || 1 })}
                            error={Boolean(errors['security.maxConcurrentSessions'])}
                        />
                    </PfFieldRow>
                    <PfToggleFieldRow
                        label="Device tracking"
                        description="Log device fingerprint on each login."
                        checked={sec.deviceTracking}
                        onChange={(v) => patch({ deviceTracking: v })}
                    />
                    <PfToggleFieldRow
                        label="Auto logout"
                        description="End session after idle timeout."
                        checked={sec.autoLogout}
                        onChange={(v) => patch({ autoLogout: v })}
                    />
                </div>
            </PfCollapsibleSection>
        </div>
    );
}
