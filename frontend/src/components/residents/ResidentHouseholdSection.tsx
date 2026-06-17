'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { EditableField, EditableSelect } from '@/components/leads/detail/InlineEditableSection';
import { EMPTY_FIELD, ResidentFieldRow } from '@/components/residents/ResidentOverviewFieldKit';
import { InlineWorkspaceSection } from '@/components/workspace/InlineWorkspaceSection';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
    createEmptyHouseholdMember,
    householdMemberHasContent,
    HOUSEHOLD_RELATIONSHIP_OPTIONS,
    type ResidentHouseholdMember,
} from '@/lib/residentStore';
import { LuTrash2, LuUsers } from 'react-icons/lu';

function HouseholdViewCard({ member }: { member: ResidentHouseholdMember }) {
    return (
        <div className="rounded-lg border border-gray-200/80 bg-gray-50/60 px-3 py-2.5">
            <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-gray-200/80">
                    <LuUsers className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{member.fullName.trim() || 'Household member'}</p>
                    {member.relationship?.trim() ? (
                        <span className="mt-1 inline-block rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800">
                            {member.relationship}
                        </span>
                    ) : null}
                    {member.phoneNumber?.trim() ? (
                        <p className="mt-1.5 text-xs text-gray-600">{member.phoneNumber}</p>
                    ) : null}
                    {member.notes?.trim() ? <p className="mt-1 text-xs text-gray-500">{member.notes}</p> : null}
                </div>
            </div>
        </div>
    );
}

function HouseholdFormFields({
    member,
    canMutate,
    onChange,
}: {
    member: ResidentHouseholdMember;
    canMutate: boolean;
    onChange: (next: ResidentHouseholdMember) => void;
}) {
    return (
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
            <ResidentFieldRow label="Full name">
                <EditableField
                    isEditing={canMutate}
                    value={member.fullName}
                    onChange={(value) => onChange({ ...member, fullName: value })}
                    placeholder="e.g. Lakshmi Kumar"
                    readValue={member.fullName.trim() || EMPTY_FIELD}
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Relationship">
                <EditableSelect
                    isEditing={canMutate}
                    value={member.relationship ?? ''}
                    onChange={(value) => onChange({ ...member, relationship: value })}
                    placeholder="Optional"
                    options={['', ...HOUSEHOLD_RELATIONSHIP_OPTIONS]}
                    readValue={member.relationship?.trim() || EMPTY_FIELD}
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Phone">
                <EditableField
                    isEditing={canMutate}
                    type="tel"
                    value={member.phoneNumber ?? ''}
                    onChange={(value) => onChange({ ...member, phoneNumber: value })}
                    placeholder="Optional"
                    readValue={member.phoneNumber?.trim() || EMPTY_FIELD}
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Notes" className="sm:col-span-2">
                <EditableField
                    isEditing={canMutate}
                    value={member.notes ?? ''}
                    onChange={(value) => onChange({ ...member, notes: value })}
                    placeholder="Optional"
                    readValue={member.notes?.trim() || EMPTY_FIELD}
                />
            </ResidentFieldRow>
        </div>
    );
}

type Props = {
    householdMembers: ResidentHouseholdMember[];
    onHouseholdChange: (next: ResidentHouseholdMember[]) => void;
    canMutate: boolean;
    onRequestEdit?: () => void;
};

export function ResidentHouseholdSection({ householdMembers, onHouseholdChange, canMutate, onRequestEdit }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [draft, setDraft] = useState<ResidentHouseholdMember>(() => createEmptyHouseholdMember());
    const [pendingCreateAfterEdit, setPendingCreateAfterEdit] = useState(false);

    const canAdd = canMutate || Boolean(onRequestEdit);
    const list = householdMembers.filter(householdMemberHasContent);
    const countLabel =
        list.length === 0 ? 'No household members listed' : `${list.length} household member${list.length === 1 ? '' : 's'}`;

    const updateAt = (id: string, next: ResidentHouseholdMember) => {
        onHouseholdChange(householdMembers.map((m) => (m.id === id ? next : m)));
    };

    const removeAt = (id: string) => {
        onHouseholdChange(householdMembers.filter((m) => m.id !== id));
    };

    const openCreateForm = useCallback(() => {
        setDraft(createEmptyHouseholdMember());
        setCreateOpen(true);
    }, []);

    useEffect(() => {
        if (!canMutate) setCreateOpen(false);
    }, [canMutate]);

    useEffect(() => {
        if (canMutate && pendingCreateAfterEdit) {
            setPendingCreateAfterEdit(false);
            openCreateForm();
        }
    }, [canMutate, pendingCreateAfterEdit, openCreateForm]);

    const onAdd = () => {
        if (canMutate) {
            openCreateForm();
            return;
        }
        if (onRequestEdit) {
            setPendingCreateAfterEdit(true);
            onRequestEdit();
        }
    };

    const saveNew = () => {
        if (!householdMemberHasContent(draft)) {
            setCreateOpen(false);
            return;
        }
        onHouseholdChange([draft, ...householdMembers]);
        setDraft(createEmptyHouseholdMember());
        setCreateOpen(false);
    };

    return (
        <InlineWorkspaceSection
            summaryLabel={countLabel}
            canAdd={canAdd}
            addButtonLabel="Add member"
            onAdd={onAdd}
            createFormOpen={createOpen && canMutate}
            createForm={
                <div className="rounded-xl border border-dashed border-[color-mix(in_srgb,var(--cta-button-bg)_28%,#e5e7eb)] bg-white p-3 shadow-sm sm:p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-600">New household member</p>
                    <p className="mb-3 text-xs text-gray-500">All fields are optional. Add family or others living in the unit.</p>
                    <HouseholdFormFields member={draft} canMutate onChange={setDraft} />
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="companyOutline" size="sm" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="sm" onClick={saveNew}>
                            Add to list
                        </Button>
                    </div>
                </div>
            }
            isEmpty={list.length === 0}
            emptyState={
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-center text-sm text-gray-500">
                    {canMutate
                        ? 'No household members yet. Use Add member to list people living in this unit.'
                        : 'No household members on file.'}
                </p>
            }
        >
            {canMutate
                ? list.map((member) => (
                      <div key={member.id} className="rounded-xl border border-gray-200/80 bg-white shadow-sm">
                          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 sm:px-4">
                              <p className="text-sm font-semibold text-gray-900">{member.fullName.trim() || 'Household member'}</p>
                              <button
                                  type="button"
                                  onClick={() => removeAt(member.id)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                              >
                                  <LuTrash2 className="h-3.5 w-3.5" aria-hidden />
                                  Delete
                              </button>
                          </div>
                          <div className="px-3 py-3 sm:px-4">
                              <HouseholdFormFields member={member} canMutate onChange={(next) => updateAt(member.id, next)} />
                          </div>
                      </div>
                  ))
                : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {list.map((member) => (
                              <HouseholdViewCard key={member.id} member={member} />
                          ))}
                      </div>
                  )}
        </InlineWorkspaceSection>
    );
}
