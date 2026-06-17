'use client';

import React, { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { decodeUnitSlugParam, getProjectInventoryUnitHref, getUnitBySlug } from '@/lib/projectsInventoryStore';

/**
 * Legacy `/inventory/edit/[slug]` — redirects to project inventory with inline edit (same UX as row “Edit”).
 */
export default function EditUnitRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter();
    const { slug: slugParam } = use(params);
    const unitSlug = decodeUnitSlugParam(slugParam);
    const unit = getUnitBySlug(unitSlug);

    useEffect(() => {
        if (!unit) return;
        router.replace(getProjectInventoryUnitHref(unit.projectSlug, unit.slug, { startInlineEdit: true }));
    }, [unit, router]);

    if (!unit) {
        return (
            <CompanyAdminDashboardLayout>
                <div className="mx-auto max-w-3xl pb-12">
                    <div className="mt-8 text-center">
                        <h1 className="text-2xl font-bold text-slate-800">Unit not found</h1>
                        <p className="mt-2 text-slate-500">The unit you are looking for does not exist.</p>
                        <Link href="/projects-inventory/inventory" className="mt-4 inline-block font-semibold text-primary hover:underline">
                            Back to Inventory
                        </Link>
                    </div>
                </div>
            </CompanyAdminDashboardLayout>
        );
    }

    return (
        <CompanyAdminDashboardLayout>
            <div className="mx-auto max-w-3xl px-4 pb-12">
                <p className="mt-12 text-center text-sm font-medium text-slate-500">Opening unit on project inventory…</p>
            </div>
        </CompanyAdminDashboardLayout>
    );
}
