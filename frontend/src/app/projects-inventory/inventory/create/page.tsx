'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import {
    ARRIS_UNIT_CREATE_DRAFT_KEY,
    type UnitFormValues,
    UnitFormStandard,
    UNIT_DUPLICATE_MESSAGE,
} from '@/components/projects-inventory/UnitForm';
import {
    addUnit,
    defaultConfigurationForUnitType,
    getNextUnitCode,
    getProjectInventoryUnitHref,
    getProjects,
    type UnitAvailabilityStatus,
    type UnitType,
} from '@/lib/projectsInventoryStore';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { cn } from '@/lib/utils';
import { CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';

export default function CreateUnitPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdToast, setCreatedToast] = useState(false);
    const [serverDuplicateError, setServerDuplicateError] = useState<string | null>(null);
    const dismissCreatedToast = useCallback(() => setCreatedToast(false), []);

    const projects = useMemo(() => getProjects(), []);
    const defaultProject = projects[0];

    const initialValues = useMemo<UnitFormValues>(
        () => ({
            projectSlug: defaultProject?.slug || '',
            unit_number: '',
            unit_type: (defaultProject?.project_type || 'Apartment') as UnitType,
            configuration: defaultConfigurationForUnitType((defaultProject?.project_type || 'Apartment') as UnitType),
            unit_size: 1000,
            price: 5000000,
            offer_price: undefined,
            availability_status: 'available' as UnitAvailabilityStatus,
            block_phase: '',
            tower_block: '',
            floor: '',
            facing: '',
            plc_charges: undefined,
            gst_tax_percent: undefined,
        }),
        [defaultProject],
    );

    const clearDuplicate = useCallback(() => setServerDuplicateError(null), []);

    return (
        <CompanyAdminDashboardLayout mainClassName="!max-w-none !pb-0">
            {createdToast ? (
                <InlineToast
                    message="Unit added successfully"
                    variant="success"
                    onDismiss={dismissCreatedToast}
                />
            ) : null}
            <div className="min-h-0 w-full max-w-none bg-slate-50/50 pb-2">
                <div className="mb-4 w-full">
                    <Breadcrumb
                        items={[
                            { label: 'Projects & Inventory', href: '/projects-inventory/projects' },
                            { label: 'Inventory', href: '/projects-inventory/inventory' },
                            { label: 'Add unit' },
                        ]}
                    />
                </div>
                <div className="mx-auto w-full max-w-4xl px-4 pb-8 sm:px-0">
                    <header className="mb-3 max-w-4xl mx-auto rounded-xl border-b border-gray-200/80 bg-white px-4 py-3 lg:px-6">
                        <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Add unit</h1>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Create a unit with the same fields as on the inventory view. Sync and demand appear after you
                                    save.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push('/projects-inventory/inventory')}
                                className={cn(CTA_UTILITY_BTN, 'shrink-0 py-2')}
                            >
                                <span aria-hidden>←</span>
                                Back to inventory
                            </button>
                        </div>
                    </header>

                    <UnitFormStandard
                        initialUnitCode={getNextUnitCode()}
                        initialValues={initialValues}
                        projects={projects}
                        onCancel={() => router.push('/projects-inventory/inventory')}
                        isSubmitting={isSubmitting}
                        submitLabel="Create unit"
                        enableDraftAutosave
                        draftStorageKey={ARRIS_UNIT_CREATE_DRAFT_KEY}
                        serverDuplicateError={serverDuplicateError}
                        onClearServerDuplicate={clearDuplicate}
                        onSubmit={async (values) => {
                            flushSync(() => {
                                setIsSubmitting(true);
                            });
                            setServerDuplicateError(null);
                            try {
                                const created = addUnit({
                                    projectSlug: values.projectSlug,
                                    unit_number: values.unit_number.trim(),
                                    unit_type: values.unit_type,
                                    configuration: values.configuration.trim(),
                                    unit_size: values.unit_size,
                                    price: values.price,
                                    offer_price: values.offer_price,
                                    availability_status: values.availability_status,
                                    block_phase: values.block_phase?.trim() || undefined,
                                    tower_block: values.tower_block?.trim() || undefined,
                                    floor: values.floor?.trim() || undefined,
                                    facing: values.facing?.trim() || undefined,
                                    plc_charges: values.plc_charges,
                                    gst_tax_percent: values.gst_tax_percent,
                                });
                                if (!created) {
                                    setServerDuplicateError(UNIT_DUPLICATE_MESSAGE);
                                    setIsSubmitting(false);
                                    return;
                                }
                                try {
                                    window.localStorage.removeItem(ARRIS_UNIT_CREATE_DRAFT_KEY);
                                } catch {
                                    /* ignore */
                                }
                                setCreatedToast(true);
                                window.setTimeout(() => {
                                    router.push(getProjectInventoryUnitHref(created.projectSlug, created.slug));
                                }, 900);
                            } catch (err) {
                                setIsSubmitting(false);
                                throw err;
                            }
                        }}
                    />
                </div>
            </div>
        </CompanyAdminDashboardLayout>
    );
}
