'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { EditableField, EditableSelect } from '@/components/leads/detail/InlineEditableSection';
import { EMPTY_FIELD, ResidentFieldRow } from '@/components/residents/ResidentOverviewFieldKit';
import { InlineWorkspaceSection } from '@/components/workspace/InlineWorkspaceSection';
import { Button } from '@/components/ui/Button';
import {
    createEmptyResidentVehicle,
    residentVehicleHasContent,
    RESIDENT_VEHICLE_TYPE_OPTIONS,
    type ResidentVehicle,
} from '@/lib/residentStore';
import { LuCar, LuTrash2 } from 'react-icons/lu';

function VehicleViewCard({ vehicle }: { vehicle: ResidentVehicle }) {
    return (
        <div className="rounded-lg border border-gray-200/80 bg-gray-50/60 px-3 py-2.5">
            <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-gray-200/80">
                    <LuCar className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{vehicle.vehicleName.trim() || 'Vehicle'}</p>
                    {vehicle.registrationNumber.trim() ? (
                        <p className="mt-0.5 font-mono text-xs tracking-wide text-gray-700">{vehicle.registrationNumber}</p>
                    ) : null}
                    {vehicle.vehicleType?.trim() ? (
                        <span className="mt-1 inline-block rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800">
                            {vehicle.vehicleType}
                        </span>
                    ) : null}
                    {vehicle.notes?.trim() ? <p className="mt-1.5 text-xs text-gray-500">{vehicle.notes}</p> : null}
                </div>
            </div>
        </div>
    );
}

function VehicleFormFields({
    vehicle,
    canMutate,
    onChange,
}: {
    vehicle: ResidentVehicle;
    canMutate: boolean;
    onChange: (next: ResidentVehicle) => void;
}) {
    const fieldGrid = 'grid grid-cols-1 gap-0 sm:grid-cols-2';

    return (
        <div className={fieldGrid}>
            <ResidentFieldRow label="Vehicle name">
                <EditableField
                    isEditing={canMutate}
                    value={vehicle.vehicleName}
                    onChange={(value) => onChange({ ...vehicle, vehicleName: value })}
                    placeholder="e.g. Honda City"
                    readValue={vehicle.vehicleName.trim() || EMPTY_FIELD}
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Registration no.">
                <EditableField
                    isEditing={canMutate}
                    value={vehicle.registrationNumber}
                    onChange={(value) => onChange({ ...vehicle, registrationNumber: value.toUpperCase() })}
                    placeholder="e.g. TS09AB1234"
                    readValue={
                        vehicle.registrationNumber.trim() ? (
                            <span className="font-mono text-sm tracking-wide text-gray-900">{vehicle.registrationNumber}</span>
                        ) : (
                            EMPTY_FIELD
                        )
                    }
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Type">
                <EditableSelect
                    isEditing={canMutate}
                    value={vehicle.vehicleType ?? ''}
                    onChange={(value) => onChange({ ...vehicle, vehicleType: value })}
                    placeholder="Optional"
                    options={['', ...RESIDENT_VEHICLE_TYPE_OPTIONS]}
                    readValue={
                        vehicle.vehicleType?.trim() ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
                                {vehicle.vehicleType}
                            </span>
                        ) : (
                            EMPTY_FIELD
                        )
                    }
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Notes" className="sm:col-span-2">
                <EditableField
                    isEditing={canMutate}
                    value={vehicle.notes ?? ''}
                    onChange={(value) => onChange({ ...vehicle, notes: value })}
                    placeholder="Parking slot, color, etc. (optional)"
                    readValue={vehicle.notes?.trim() || EMPTY_FIELD}
                />
            </ResidentFieldRow>
        </div>
    );
}

type Props = {
    vehicles: ResidentVehicle[];
    onVehiclesChange: (next: ResidentVehicle[]) => void;
    canMutate: boolean;
    onRequestEdit?: () => void;
};

export function ResidentVehiclesSection({ vehicles, onVehiclesChange, canMutate, onRequestEdit }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [draft, setDraft] = useState<ResidentVehicle>(() => createEmptyResidentVehicle());
    const [pendingCreateAfterEdit, setPendingCreateAfterEdit] = useState(false);

    const canAddVehicle = canMutate || Boolean(onRequestEdit);
    const list = vehicles.filter(residentVehicleHasContent);
    const countLabel = list.length === 0 ? 'No vehicles registered' : `${list.length} vehicle${list.length === 1 ? '' : 's'}`;

    const updateAt = (id: string, next: ResidentVehicle) => {
        onVehiclesChange(vehicles.map((v) => (v.id === id ? next : v)));
    };

    const removeAt = (id: string) => {
        onVehiclesChange(vehicles.filter((v) => v.id !== id));
    };

    const openCreateForm = useCallback(() => {
        setDraft(createEmptyResidentVehicle());
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

    const onAddVehicle = () => {
        if (canMutate) {
            openCreateForm();
            return;
        }
        if (onRequestEdit) {
            setPendingCreateAfterEdit(true);
            onRequestEdit();
        }
    };

    const saveNewVehicle = () => {
        if (!residentVehicleHasContent(draft)) {
            setCreateOpen(false);
            return;
        }
        onVehiclesChange([draft, ...vehicles]);
        setDraft(createEmptyResidentVehicle());
        setCreateOpen(false);
    };

    const createFormVisible = createOpen && canMutate;

    return (
        <InlineWorkspaceSection
            summaryLabel={countLabel}
            summaryBadges={
                list.length > 0 ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">Optional</span>
                ) : null
            }
            canAdd={canAddVehicle}
            addButtonLabel="Add vehicle"
            onAdd={onAddVehicle}
            createFormOpen={createFormVisible}
            createForm={
                <div
                    className="rounded-xl border border-dashed border-[color-mix(in_srgb,var(--cta-button-bg)_28%,#e5e7eb)] bg-white p-3 shadow-sm sm:p-4"
                    data-testid="resident-vehicle-create-form"
                >
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-600">New vehicle</p>
                    <p className="mb-3 text-xs text-gray-500">All fields are optional. Add as many vehicles as needed.</p>
                    <VehicleFormFields vehicle={draft} canMutate onChange={setDraft} />
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="companyOutline" size="sm" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="sm" onClick={saveNewVehicle}>
                            Add to list
                        </Button>
                    </div>
                </div>
            }
            isEmpty={list.length === 0}
            emptyState={
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-center text-sm text-gray-500">
                    {canMutate
                        ? 'No vehicles yet. Use Add vehicle to register cars, bikes, or other vehicles.'
                        : 'No vehicles registered for this resident.'}
                </p>
            }
        >
            {canMutate
                ? list.map((vehicle) => (
                      <div key={vehicle.id} className="rounded-xl border border-gray-200/80 bg-white shadow-sm">
                          <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-3 py-2.5 sm:px-4">
                              <p className="text-sm font-semibold text-gray-900">{vehicle.vehicleName.trim() || 'Vehicle'}</p>
                              <button
                                  type="button"
                                  onClick={() => removeAt(vehicle.id)}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                              >
                                  <LuTrash2 className="h-3.5 w-3.5" aria-hidden />
                                  Delete
                              </button>
                          </div>
                          <div className="px-3 py-3 sm:px-4">
                              <VehicleFormFields
                                  vehicle={vehicle}
                                  canMutate
                                  onChange={(next) => updateAt(vehicle.id, next)}
                              />
                          </div>
                      </div>
                  ))
                : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {list.map((vehicle) => (
                              <VehicleViewCard key={vehicle.id} vehicle={vehicle} />
                          ))}
                      </div>
                  )}
        </InlineWorkspaceSection>
    );
}
