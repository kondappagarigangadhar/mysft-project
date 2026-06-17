'use client';

import React, { useState } from 'react';
import {
    PF_FIELD_GRID,
    PfCollapsibleSection,
    PfFieldRow,
    PfInput,
    PfSectionErrorBadge,
} from '@/components/platform-foundation/PlatformFoundationFormPrimitives';
import type { PlatformFoundationFieldErrors } from '@/lib/platformFoundationValidation';
import type { PlatformFoundationSettings } from '@/lib/platformFoundationTypes';
import { LuFileText, LuMail, LuPalette } from 'react-icons/lu';

type Props = {
    settings: PlatformFoundationSettings;
    onChange: (next: PlatformFoundationSettings) => void;
    errors: PlatformFoundationFieldErrors;
};

export function BrandingTab({ settings, onChange, errors }: Props) {
    const brand = settings.branding;
    const patch = (partial: Partial<typeof brand>) =>
        onChange({ ...settings, branding: { ...brand, ...partial } });

    const [open, setOpen] = useState({ brand: true, platform: true, email: true, export: true });

    const platformErrors = ['branding.productName', 'branding.websiteUrl', 'branding.supportEmail'].filter(
        (k) => errors[k],
    ).length;

    return (
        <div className="space-y-4">
            <PfCollapsibleSection
                title="BRAND SETTINGS"
                icon={LuPalette}
                tone="blue"
                open={open.brand}
                onOpenChange={(o) => setOpen((s) => ({ ...s, brand: o }))}
            >
                <div className={PF_FIELD_GRID}>
                    <PfFieldRow label="Organization logo" fieldId="pf-orgLogo">
                        <PfInput
                            id="pf-orgLogo"
                            value={brand.organizationLogo}
                            onChange={(v) => patch({ organizationLogo: v })}
                            placeholder="/logo.png"
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Dark logo" fieldId="pf-darkLogo">
                        <PfInput id="pf-darkLogo" value={brand.darkLogo} onChange={(v) => patch({ darkLogo: v })} />
                    </PfFieldRow>
                    <PfFieldRow label="Favicon" fieldId="pf-favicon">
                        <PfInput id="pf-favicon" value={brand.favicon} onChange={(v) => patch({ favicon: v })} />
                    </PfFieldRow>
                </div>
            </PfCollapsibleSection>

            <PfCollapsibleSection
                title="PLATFORM BRANDING"
                icon={LuFileText}
                tone="amber"
                open={open.platform}
                onOpenChange={(o) => setOpen((s) => ({ ...s, platform: o }))}
                headerRight={<PfSectionErrorBadge count={platformErrors} />}
            >
                <div className={PF_FIELD_GRID}>
                    <PfFieldRow
                        label="Product name"
                        required
                        fieldId="pf-productName"
                        error={errors['branding.productName']}
                    >
                        <PfInput
                            id="pf-productName"
                            value={brand.productName}
                            onChange={(v) => patch({ productName: v })}
                            error={Boolean(errors['branding.productName'])}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Company name" fieldId="pf-companyName">
                        <PfInput
                            id="pf-companyName"
                            value={brand.companyName}
                            onChange={(v) => patch({ companyName: v })}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Website URL" fieldId="pf-websiteUrl" error={errors['branding.websiteUrl']}>
                        <PfInput
                            id="pf-websiteUrl"
                            value={brand.websiteUrl}
                            onChange={(v) => patch({ websiteUrl: v })}
                            error={Boolean(errors['branding.websiteUrl'])}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Support email" fieldId="pf-supportEmail" error={errors['branding.supportEmail']}>
                        <PfInput
                            id="pf-supportEmail"
                            type="email"
                            value={brand.supportEmail}
                            onChange={(v) => patch({ supportEmail: v })}
                            error={Boolean(errors['branding.supportEmail'])}
                        />
                    </PfFieldRow>
                </div>
            </PfCollapsibleSection>

            <PfCollapsibleSection
                title="EMAIL BRANDING"
                icon={LuMail}
                tone="slate"
                open={open.email}
                onOpenChange={(o) => setOpen((s) => ({ ...s, email: o }))}
            >
                <div className={PF_FIELD_GRID}>
                    <PfFieldRow label="Email header logo" fieldId="pf-emailHeaderLogo">
                        <PfInput
                            id="pf-emailHeaderLogo"
                            value={brand.emailHeaderLogo}
                            onChange={(v) => patch({ emailHeaderLogo: v })}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Email theme color" fieldId="pf-emailThemeColor">
                        <PfInput
                            id="pf-emailThemeColor"
                            value={brand.emailThemeColor}
                            onChange={(v) => patch({ emailThemeColor: v })}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Footer text" fieldId="pf-footerText" className="xl:col-span-2">
                        <PfInput id="pf-footerText" value={brand.footerText} onChange={(v) => patch({ footerText: v })} />
                    </PfFieldRow>
                </div>
            </PfCollapsibleSection>

            <PfCollapsibleSection
                title="PDF / EXPORT BRANDING"
                icon={LuFileText}
                tone="slate"
                open={open.export}
                onOpenChange={(o) => setOpen((s) => ({ ...s, export: o }))}
            >
                <div className={PF_FIELD_GRID}>
                    <PfFieldRow label="Watermark" fieldId="pf-watermark">
                        <PfInput id="pf-watermark" value={brand.watermark} onChange={(v) => patch({ watermark: v })} />
                    </PfFieldRow>
                    <PfFieldRow label="Export header" fieldId="pf-exportHeader">
                        <PfInput
                            id="pf-exportHeader"
                            value={brand.exportHeader}
                            onChange={(v) => patch({ exportHeader: v })}
                        />
                    </PfFieldRow>
                    <PfFieldRow label="Footer branding" fieldId="pf-footerBranding" className="xl:col-span-2">
                        <PfInput
                            id="pf-footerBranding"
                            value={brand.footerBranding}
                            onChange={(v) => patch({ footerBranding: v })}
                        />
                    </PfFieldRow>
                </div>
            </PfCollapsibleSection>
        </div>
    );
}
