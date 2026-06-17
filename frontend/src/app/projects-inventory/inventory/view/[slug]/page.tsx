'use client';

import React, { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import {
    decodeUnitSlugParam,
    getProjectInventoryUnitHref,
    getUnitBySlug,
} from '@/lib/projectsInventoryStore';

/**
 * Legacy URL: forwards to project → Inventory tab with this unit selected.
 * All unit detail UI lives on the project view page.
 */
export default function ViewUnitPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter();
    const { slug: slugParam } = use(params);
    const unitSlug = decodeUnitSlugParam(slugParam);
    const unit = getUnitBySlug(unitSlug);

    useEffect(() => {
        if (!unit) return;
        router.replace(getProjectInventoryUnitHref(unit.projectSlug, unit.slug));
    }, [unit, router]);

    if (!unit) {
        return (
            <CompanyAdminDashboardLayout>
                <div className="max-w-3xl mx-auto pb-12">
                    <div className="mt-8 text-center">
                        <h1 className="text-2xl font-bold text-slate-800">Unit not found</h1>
                        <p className="text-slate-500 mt-2">The unit you are looking for does not exist.</p>
                        <Link href="/projects-inventory/inventory" className="mt-4 inline-block text-primary font-semibold hover:underline">
                            Back to Inventory
                        </Link>
                    </div>
                </div>
            </CompanyAdminDashboardLayout>
        );
    }

    return (
        <CompanyAdminDashboardLayout>
            <div className="max-w-3xl mx-auto pb-12 px-4">
                <p className="mt-12 text-center text-slate-500 font-medium">Opening unit in project inventory…</p>
            </div>
        </CompanyAdminDashboardLayout>
    );
}
