'use client';

import React from 'react';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAdminTheme } from '@/components/theme/AdminThemeProvider';
import { AdminThemeControls } from '@/components/theme/AdminThemeControls';
import { LuPalette, LuRotateCcw, LuSave, LuChartBar } from 'react-icons/lu';

export default function AdminThemeSettingsPage() {
    const { resetTheme, saveTheme } = useAdminTheme();

    return (
        <CompanyAdminDashboardLayout>
             <Breadcrumb
                items={[
                    { label: 'Platform Foundation', href: '/platform/tenants' },
                    { label: 'Foundation Settings', href: '/company-admin/platform-foundation' },
                    { label: 'Theme', href: '/settings/theme' },
                ]}
            />
            <PageHeader
                title="Admin Theme Settings"
                subtitle="Customize sidebar and top navbar colors with live preview."
                actions={
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => resetTheme()}>
                            <LuRotateCcw size={18} />
                            Reset to default
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="gap-2"
                            onClick={() => {
                                saveTheme();
                            }}
                        >
                            <LuSave size={18} />
                            Save theme
                        </Button>
                    </div>
                }
            />

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
                <Card className="border-none shadow-sm ring-1 ring-slate-200 lg:col-span-7" contentClassName="p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <LuPalette className="text-blue-600" size={18} />
                        <h3 className="text-lg font-bold text-slate-800">Colors</h3>
                    </div>

                    <AdminThemeControls variant="drawer" />

                    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        Tip: Use high-contrast text colors for accessibility (e.g. white text on dark backgrounds).
                    </div>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-slate-200 lg:col-span-5" contentClassName="p-6">
                    <h3 className="text-lg font-bold text-slate-800">Colors preview</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Same styles as the Company Admin Dashboard Analytics control (<span className="font-mono text-xs">company</span> +{' '}
                        <span className="font-mono text-xs">cta</span>). Adjust colors on the left — preview updates live.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6">
                        <Button type="button" variant="company" size="cta" className="gap-2">
                            <LuChartBar size={18} className="shrink-0" />
                            Analytics
                        </Button>
                        <span className="text-xs text-slate-500">Hover to check hover colors.</span>
                    </div>
                </Card>
            </div>
        </CompanyAdminDashboardLayout>
    );
}

