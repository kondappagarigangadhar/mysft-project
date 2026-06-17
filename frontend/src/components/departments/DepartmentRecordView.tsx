'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { DepartmentProfileHeader } from '@/components/departments/DepartmentProfileHeader';
import {
    DepartmentInlineOverviewEditor,
    type DepartmentInlineDraft,
    type DepartmentInlineErrorKey,
} from '@/components/departments/DepartmentInlineOverviewEditor';
import { DepartmentAICopilotPanel } from '@/components/departments/DepartmentAICopilotPanel';
import { DepartmentDetailMoreMenu } from '@/components/departments/DepartmentDetailMoreMenu';
import {
    CTA_CARD_EDITING_RING,
    CTA_INFO_BANNER,
    CTA_INFO_BANNER_BADGE,
} from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import type { Department } from '@/data/mockData';
import { getBusinessUnits, getUsers } from '@/data/mockData';
import { createDepartment, updateDepartment } from '@/lib/departmentStore';
import { departmentProfileHref } from '@/lib/departmentRoutes';
import { formatLeadAuditTimestamp } from '@/lib/leadStore';
import { LuCalendar, LuClock3 } from 'react-icons/lu';
import { WorkspaceUtilityToolbar, DEPARTMENT_WORKSPACE_HELP } from '@/components/workspace-help';

function buildDraft(dept: Department): DepartmentInlineDraft {
    return {
        name: dept.name ?? '',
        code: dept.code ?? '',
        businessUnitName: dept.businessUnitName ?? '',
        departmentHeadName: dept.departmentHeadName ?? '',
        status: dept.status ?? 'Active',
        description: dept.description ?? '',
    };
}

function emptyDraft(): DepartmentInlineDraft {
    return {
        name: '',
        code: '',
        businessUnitName: '',
        departmentHeadName: '',
        status: 'Active',
        description: '',
    };
}

function resolveHeadId(headName: string): number | undefined {
    const t = headName.trim();
    if (!t || t === '— None —') return undefined;
    return getUsers().find((u) => u.name === t)?.id;
}

function resolveBusinessUnitId(name: string): number | undefined {
    const t = name.trim();
    if (!t) return undefined;
    return getBusinessUnits().find((bu) => bu.name === t)?.id;
}

export function DepartmentRecordView({
    department,
    createMode = false,
    onBump,
}: {
    department: Department;
    createMode?: boolean;
    onBump: () => void;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isCreate = createMode;

    const [isInlineEditing, setIsInlineEditing] = useState(isCreate);
    const [inlineDraft, setInlineDraft] = useState<DepartmentInlineDraft>(() =>
        isCreate ? emptyDraft() : buildDraft(department),
    );
    const [inlineErrors, setInlineErrors] = useState<Partial<Record<DepartmentInlineErrorKey, string>>>({});
    const [inlineSaving, setInlineSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err: boolean } | null>(null);

    const businessUnits = useMemo(() => getBusinessUnits(), []);
    const users = useMemo(() => getUsers(), []);

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        if (isCreate) return;
        setIsInlineEditing(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const base = departmentProfileHref(department.id);
        router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    }, [searchParams, department.id, router, isCreate]);

    useEffect(() => {
        if (!isInlineEditing) {
            setInlineDraft(buildDraft(department));
            setInlineErrors({});
        }
    }, [department, isInlineEditing]);

    const originalDraft = useMemo(() => buildDraft(department), [department]);
    const isInlineDirty = useMemo(() => {
        const keys = Object.keys(inlineDraft) as (keyof DepartmentInlineDraft)[];
        return keys.some((k) => inlineDraft[k] !== originalDraft[k]);
    }, [inlineDraft, originalDraft]);

    const changedByKey = useMemo(() => {
        const next: Partial<Record<DepartmentInlineErrorKey, boolean>> = {};
        (['name', 'code', 'businessUnitName', 'status'] as const).forEach((k) => {
            if (inlineDraft[k] !== originalDraft[k]) next[k] = true;
        });
        return next;
    }, [inlineDraft, originalDraft]);

    const onDraftChange = useCallback((key: keyof DepartmentInlineDraft, value: string) => {
        setInlineDraft((d) => ({ ...d, [key]: value }));
        setInlineErrors((e) => {
            const map = { ...e };
            if (key === 'name' || key === 'code' || key === 'businessUnitName' || key === 'status') {
                delete map[key];
            }
            return map;
        });
    }, []);

    const validate = (): boolean => {
        const err: Partial<Record<DepartmentInlineErrorKey, string>> = {};
        if (!inlineDraft.name.trim()) err.name = 'Department name is required';
        if (!inlineDraft.businessUnitName.trim()) err.businessUnitName = 'Business unit is required';
        if (!inlineDraft.status) err.status = 'Status is required';
        setInlineErrors(err);
        return Object.keys(err).length === 0;
    };

    const onInlineEditCancel = () => {
        if (isCreate) {
            router.push('/departments');
            return;
        }
        setInlineDraft(buildDraft(department));
        setInlineErrors({});
        setIsInlineEditing(false);
    };

    const onInlineEditSave = async ({ exitAfter }: { exitAfter: boolean }) => {
        if (!validate()) return;
        setInlineSaving(true);
        try {
            const buId = resolveBusinessUnitId(inlineDraft.businessUnitName);
            if (!buId) {
                setInlineErrors((e) => ({ ...e, businessUnitName: 'Select a valid business unit' }));
                return;
            }
            const headId = resolveHeadId(inlineDraft.departmentHeadName);
            const status = (inlineDraft.status || 'Active') as 'Active' | 'Inactive';

            if (isCreate) {
                const created = createDepartment({
                    name: inlineDraft.name.trim(),
                    code: inlineDraft.code.trim() || inlineDraft.name.trim().slice(0, 6).toUpperCase(),
                    businessUnitId: buId,
                    departmentHeadId: headId,
                    status,
                    description: inlineDraft.description.trim() || undefined,
                });
                onBump();
                router.replace(departmentProfileHref(created.id));
                setInlineToast({ msg: 'Department created.', err: false });
                if (exitAfter) setIsInlineEditing(false);
                return;
            }

            updateDepartment(department.id, {
                name: inlineDraft.name.trim(),
                code: inlineDraft.code.trim(),
                businessUnitId: buId,
                departmentHeadId: headId,
                status,
                description: inlineDraft.description.trim() || undefined,
            });
            onBump();
            setInlineToast({ msg: 'Department saved.', err: false });
            if (exitAfter) setIsInlineEditing(false);
        } finally {
            setInlineSaving(false);
        }
    };

    const headEmail = useMemo(() => {
        if (!department.departmentHeadId) return '';
        return getUsers().find((u) => u.id === department.departmentHeadId)?.email?.trim() ?? '';
    }, [department.departmentHeadId]);

    const exportDepartmentJson = useCallback((d: Department) => {
        const safe = (d.code || d.name || 'department')
            .toString()
            .trim()
            .replace(/[/\\?%*:|"<>]/g, '-')
            .replace(/\.+$/, '')
            .slice(0, 80) || 'department';
        const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safe}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    return (
        <div className="w-full min-w-0 space-y-0">
            {inlineToast ? (
                <InlineToast
                    message={inlineToast.msg}
                    variant={inlineToast.err ? 'error' : 'success'}
                    onDismiss={() => setInlineToast(null)}
                />
            ) : null}

            {isCreate ? (
                <div className={CTA_INFO_BANNER}>
                    You are creating a new department <span className={CTA_INFO_BANNER_BADGE}>Draft</span>
                </div>
            ) : null}

            {!isCreate ? (
                <>
                    <div className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                                <DepartmentDetailMoreMenu
                                    department={department}
                                    onEdit={() => setIsInlineEditing(true)}
                                    isEditing={isInlineEditing}
                                    isSaving={inlineSaving}
                                    onArchived={onBump}
                                />
                            </div>

                            <WorkspaceUtilityToolbar
                                help={DEPARTMENT_WORKSPACE_HELP}
                                triggerLabel="Department workspace help"
                                email={headEmail ?? undefined}
                                onExport={() => exportDepartmentJson(department)}
                                saving={inlineSaving}
                                isInlineEditing={isInlineEditing}
                            />
                        </div>
                    </div>

                    <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                            <span className="inline-flex items-center gap-2">
                                <LuCalendar size={14} className="text-gray-500" aria-hidden />
                                <span className="text-gray-600">Date Created</span>
                                <span className="font-medium text-gray-900">{department.createdDate}</span>
                            </span>
                            <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                            <span className="inline-flex items-center gap-2">
                                <LuClock3 size={14} className="text-gray-500" aria-hidden />
                                <span className="text-gray-600">Last updated</span>
                                <span className="font-medium text-gray-900">
                                    {formatLeadAuditTimestamp(department.updatedAt)}
                                </span>
                            </span>
                        </div>
                    </div>
                </>
            ) : null}

            <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5 mt-3">
                <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
                    <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-span-2">
                        <div
                            className={cn(
                                'flex min-h-0 min-w-0 flex-col rounded-xl border bg-white shadow-sm',
                                isInlineEditing ? CTA_CARD_EDITING_RING : 'border-gray-200/80',
                            )}
                        >
                            <div className="bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                                <DepartmentProfileHeader department={department} embedded />
                                <div className="mt-4 min-w-0">
                                    <DepartmentInlineOverviewEditor
                                        department={department}
                                        isEditing={isInlineEditing}
                                        draft={inlineDraft}
                                        errors={inlineErrors}
                                        onDraftChange={onDraftChange}
                                        businessUnitOptions={businessUnits}
                                        userOptions={users}
                                        changedByKey={changedByKey}
                                    />
                                </div>
                                {isInlineEditing ? (
                                    <div className="sticky bottom-0 z-30 mt-4 pb-1">
                                        <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {isCreate ? 'Create department to finish setup' : 'You have unsaved changes'}
                                            </p>
                                            <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:justify-end">
                                                <Button
                                                    type="button"
                                                    variant="companyOutline"
                                                    size="cta"
                                                    onClick={onInlineEditCancel}
                                                    disabled={inlineSaving}
                                                >
                                                    Cancel
                                                </Button>
                                                {!isCreate ? (
                                                    <Button
                                                        type="button"
                                                        variant="companyOutline"
                                                        size="cta"
                                                        onClick={() => void onInlineEditSave({ exitAfter: false })}
                                                        disabled={inlineSaving || !isInlineDirty}
                                                        isLoading={inlineSaving}
                                                    >
                                                        Save
                                                    </Button>
                                                ) : null}
                                                <Button
                                                    type="button"
                                                    variant="company"
                                                    size="cta"
                                                    onClick={() => void onInlineEditSave({ exitAfter: true })}
                                                    isLoading={inlineSaving}
                                                    disabled={!isCreate && !isInlineDirty}
                                                >
                                                    {isCreate ? 'Create department' : 'Save & exit'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    <div className="min-w-0 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
                        {isCreate ? (
                            <div>
                                <p className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                                    Available after department is created
                                </p>
                                <div className="pointer-events-none opacity-50">
                                    <DepartmentAICopilotPanel department={department} disabled />
                                </div>
                            </div>
                        ) : (
                            <DepartmentAICopilotPanel department={department} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
