'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { VendorCoverageAssignment, VendorCoveragePriority } from '@/lib/vendors/types';
import {
    getVendorCoverageAssignment,
    saveVendorCoverageAssignment,
    VENDOR_COVERAGE_CATEGORY_OPTIONS,
    VENDOR_COVERAGE_PROJECT_OPTIONS,
    VENDOR_COVERAGE_UPDATED_EVENT,
} from '@/lib/vendors/vendorCoverageStore';
import { cn } from '@/lib/utils';
import { CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';

const PRIORITY_OPTIONS: VendorCoveragePriority[] = ['Low', 'Medium', 'High', 'Critical'];

const selectClass = cn(
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800',
    CTA_INPUT_FOCUS,
);

function MultiSelectField({
    label,
    values,
    options,
    onChange,
    disabled,
}: {
    label: string;
    values: string[];
    options: readonly string[];
    onChange: (next: string[]) => void;
    disabled?: boolean;
}) {
    const toggle = (opt: string) => {
        if (disabled) return;
        onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);
    };

    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
                {options.map((opt) => {
                    const active = values.includes(opt);
                    return (
                        <button
                            key={opt}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggle(opt)}
                            className={cn(
                                'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                                active
                                    ? 'border-[var(--cta-button-bg)] bg-[var(--cta-button-bg)]/10 text-[var(--cta-button-bg)]'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                                disabled && 'cursor-not-allowed opacity-60',
                            )}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function VendorCoverageAssignmentSection({
    vendorId,
    readOnly,
}: {
    vendorId: string;
    readOnly?: boolean;
}) {
    const [coverage, setCoverage] = useState<VendorCoverageAssignment>(() => getVendorCoverageAssignment(vendorId));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setCoverage(getVendorCoverageAssignment(vendorId));
    }, [vendorId]);

    useEffect(() => {
        const refresh = () => setCoverage(getVendorCoverageAssignment(vendorId));
        window.addEventListener(VENDOR_COVERAGE_UPDATED_EVENT, refresh);
        return () => window.removeEventListener(VENDOR_COVERAGE_UPDATED_EVENT, refresh);
    }, [vendorId]);

    const onSave = () => {
        setSaving(true);
        saveVendorCoverageAssignment({ ...coverage, vendorId });
        setSaving(false);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2000);
    };

    return (
        <article id="wf-vendor-coverage" className="scroll-mt-24 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Vendor coverage</p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">Vendor Coverage Assignment</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Projects, towers, categories, and priority levels used by the service-request auto assignment engine.
                    </p>
                </div>
                {!readOnly ? (
                    <Button type="button" variant="company" size="sm" onClick={onSave} isLoading={saving}>
                        {saved ? 'Saved' : 'Save coverage'}
                    </Button>
                ) : null}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <MultiSelectField
                    label="Projects covered"
                    values={coverage.projectsCovered}
                    options={VENDOR_COVERAGE_PROJECT_OPTIONS}
                    onChange={(projectsCovered) => setCoverage((c) => ({ ...c, projectsCovered }))}
                    disabled={readOnly}
                />
                <MultiSelectField
                    label="Towers covered"
                    values={coverage.towersCovered}
                    options={VENDOR_COVERAGE_PROJECT_OPTIONS}
                    onChange={(towersCovered) => setCoverage((c) => ({ ...c, towersCovered }))}
                    disabled={readOnly}
                />
                <MultiSelectField
                    label="Categories covered"
                    values={coverage.categoriesCovered}
                    options={VENDOR_COVERAGE_CATEGORY_OPTIONS}
                    onChange={(categoriesCovered) => setCoverage((c) => ({ ...c, categoriesCovered }))}
                    disabled={readOnly}
                />
                <MultiSelectField
                    label="Preferred priority levels"
                    values={coverage.preferredPriorityLevels}
                    options={PRIORITY_OPTIONS}
                    onChange={(preferredPriorityLevels) =>
                        setCoverage((c) => ({ ...c, preferredPriorityLevels: preferredPriorityLevels as VendorCoveragePriority[] }))
                    }
                    disabled={readOnly}
                />
                <label className="lg:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Service areas</span>
                    <input
                        className={selectClass}
                        value={coverage.serviceAreas.join(', ')}
                        disabled={readOnly}
                        onChange={(e) =>
                            setCoverage((c) => ({
                                ...c,
                                serviceAreas: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                            }))
                        }
                        placeholder="Hyderabad, Telangana, Mumbai"
                    />
                    <p className="mt-1 text-xs text-slate-500">Comma-separated cities or regions.</p>
                </label>
            </div>
        </article>
    );
}
