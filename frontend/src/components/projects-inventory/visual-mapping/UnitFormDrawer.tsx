'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { InputField, SelectField, TextAreaField } from '@/components/forms/Fields';
import { FLOORS, UnitFormValues, UnitStatus } from './types';

export function UnitFormDrawer({
    isOpen,
    isEditing,
    values,
    errors,
    onChange,
    onSave,
    onDelete,
    onClose,
}: {
    isOpen: boolean;
    isEditing: boolean;
    values: UnitFormValues;
    errors: Record<string, string>;
    onChange: (updater: (prev: UnitFormValues) => UnitFormValues) => void;
    onSave: () => void;
    onDelete: () => void;
    onClose: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
            <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200 overflow-y-auto">
                <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-4">
                    <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit Unit' : 'Add Unit'}</h3>
                    <p className="text-xs text-slate-500 mt-1">Update unit details and save mapping state.</p>
                </div>
                <div className="space-y-4 p-5">
                    <InputField
                        label="Plot Number"
                        required
                        value={values.plotNumber}
                        onChange={(e) => onChange((p) => ({ ...p, plotNumber: e.target.value.replace(/[^A-Za-z0-9\s\-./]/g, '') }))}
                        error={errors.plotNumber}
                        placeholder="e.g. A-101"
                    />
                    <SelectField
                        label="Plot Shape"
                        required
                        value={values.plotShape}
                        onChange={(e) => onChange((p) => ({ ...p, plotShape: e.target.value as UnitFormValues['plotShape'] }))}
                        options={[
                            { value: 'rectangle', label: 'Rectangle' },
                            { value: 'polygon', label: 'Polygon' },
                        ]}
                        error={errors.plotShape}
                    />
                    <InputField label="Coordinates" value={values.coordinates} disabled />
                    <SelectField
                        label="Floor"
                        required
                        value={values.floor}
                        onChange={(e) => onChange((p) => ({ ...p, floor: e.target.value }))}
                        options={FLOORS.map((floor) => ({ value: floor, label: floor }))}
                        placeholder="Select floor"
                        error={errors.floor}
                    />
                    <InputField label="Project Name" required value={values.projectName} onChange={(e) => onChange((p) => ({ ...p, projectName: e.target.value }))} error={errors.projectName} />
                    <InputField label="Layout Name" required value={values.layoutName} onChange={(e) => onChange((p) => ({ ...p, layoutName: e.target.value }))} error={errors.layoutName} />
                    <InputField
                        label="Facing"
                        value={values.facing}
                        onChange={(e) => onChange((p) => ({ ...p, facing: e.target.value }))}
                        error={errors.facing}
                        placeholder="N / E / S / W"
                    />
                    <InputField label="Road Size" value={String(values.roadSize || '')} onChange={(e) => onChange((p) => ({ ...p, roadSize: Number(e.target.value.replace(/[^\d]/g, '')) || undefined }))} />
                    <InputField
                        label="Width"
                        required
                        value={String(values.width || '')}
                        onChange={(e) => onChange((p) => ({ ...p, width: Number(e.target.value.replace(/[^\d]/g, '')) || 0 }))}
                        error={errors.width}
                    />
                    <InputField
                        label="Length"
                        required
                        value={String(values.length || '')}
                        onChange={(e) => onChange((p) => ({ ...p, length: Number(e.target.value.replace(/[^\d]/g, '')) || 0 }))}
                        error={errors.length}
                    />
                    <InputField
                        label="Area"
                        value={String(values.area || '')}
                        disabled
                        placeholder="Sq.ft"
                    />
                    <InputField
                        label="Price"
                        required
                        value={String(values.price || '')}
                        onChange={(e) => onChange((p) => ({ ...p, price: Number(e.target.value.replace(/[^\d]/g, '')) || 0 }))}
                        error={errors.price}
                        placeholder="INR"
                    />
                    <SelectField
                        label="Status"
                        required
                        value={values.status}
                        onChange={(e) => onChange((p) => ({ ...p, status: e.target.value as UnitStatus }))}
                        options={[
                            { value: 'available', label: 'Available' },
                            { value: 'sold', label: 'Sold' },
                            { value: 'reserved', label: 'Reserved' },
                            { value: 'blocked', label: 'Blocked' },
                        ]}
                        error={errors.status}
                    />
                    <InputField label="Color Code" value={values.colorCode} disabled />
                    <InputField label="Assigned Sales" value={values.assignedSales} onChange={(e) => onChange((p) => ({ ...p, assignedSales: e.target.value }))} error={errors.assignedSales} />
                    <SelectField
                        label="Lock Status"
                        value={values.lockStatus}
                        onChange={(e) => onChange((p) => ({ ...p, lockStatus: e.target.value as UnitFormValues['lockStatus'] }))}
                        options={[
                            { value: 'unlocked', label: 'Unlocked' },
                            { value: 'locked', label: 'Locked' },
                        ]}
                    />
                    <InputField label="Lock Expiry" type="datetime-local" value={values.lockExpiry || ''} onChange={(e) => onChange((p) => ({ ...p, lockExpiry: e.target.value }))} error={errors.lockExpiry} />
                    <InputField label="Locked By" value={values.lockedBy || ''} onChange={(e) => onChange((p) => ({ ...p, lockedBy: e.target.value }))} />
                    <InputField label="Status Change Reason" value={values.statusChangeReason || ''} onChange={(e) => onChange((p) => ({ ...p, statusChangeReason: e.target.value }))} />
                    <TextAreaField
                        label="Notes"
                        value={values.notes}
                        onChange={(e) => onChange((p) => ({ ...p, notes: e.target.value.replace(/[^A-Za-z0-9\s\-./]/g, '') }))}
                        error={errors.notes}
                        rows={4}
                        placeholder="Add note..."
                    />
                </div>
                <div className="sticky bottom-0 border-t border-slate-100 bg-white p-4 flex items-center justify-between gap-2">
                    <div>{isEditing ? <Button type="button" variant="danger" onClick={onDelete}>Delete</Button> : null}</div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="companyOutline" size="cta" onClick={onClose}>Cancel</Button>
                        <Button type="button" variant="company" size="cta" onClick={onSave}>Save</Button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
