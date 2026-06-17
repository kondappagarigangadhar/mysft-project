'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField, SelectField } from '@/components/forms/Fields';
import { getLeadByLeadCode } from '@/lib/leadStore';
import {
    getAvailableUnitOptions,
    type BookingRecord,
    type DealPaymentMode,
} from '@/lib/bookingPaymentMockStore';
import { normalizePhoneDigits, validateBookingForm, type BookingFormField } from '@/lib/bookingPaymentFormValidation';

export type BookingCoreFormValues = {
    leadId: string;
    assignedTo: string;
    customerName: string;
    phone: string;
    projectName: string;
    unitId: string;
    unitConfiguration: string;
    unitPrice: string;
    bookingDate: string;
    status: BookingRecord['status'];
    dealPaymentMode: DealPaymentMode;
    /** KYC / compliance notes (optional). */
    notes?: string;
    /** Create flow only: optional advance payment (₹) recorded as first milestone; confirms booking when &gt; 0. */
    advanceAmount?: string;
};

type LeadOption = { id: string; label: string };

export function BookingCoreForm({
    variant,
    bookingSlug,
    leadOptions,
    projectOptions,
    assignedTos,
    initialValues,
    submitLabel,
    isSubmitting,
    onSubmit,
    onCancel,
    showFooterNote,
    unitOptionExtras,
}: {
    variant: 'create' | 'edit';
    bookingSlug: string | null;
    leadOptions: LeadOption[];
    projectOptions: string[];
    assignedTos: string[];
    initialValues: BookingCoreFormValues;
    submitLabel: string;
    isSubmitting: boolean;
    onSubmit: (values: BookingCoreFormValues) => void | Promise<void>;
    onCancel: () => void;
    showFooterNote?: boolean;
    /** Ensures the current booking unit appears when it is no longer “available” in inventory (edit flow). */
    unitOptionExtras?: { id: string; price: number; configuration: string }[];
}) {
    const [leadId, setLeadId] = useState(initialValues.leadId);
    const [assignedTo, setAssignedTo] = useState(initialValues.assignedTo);
    const [customerName, setCustomerName] = useState(initialValues.customerName);
    const [phone, setPhone] = useState(initialValues.phone);
    const [projectName, setProjectName] = useState(initialValues.projectName);
    const [unitId, setUnitId] = useState(initialValues.unitId);
    const [unitConfiguration, setUnitConfiguration] = useState(initialValues.unitConfiguration);
    const [unitPrice, setUnitPrice] = useState(initialValues.unitPrice);
    const [bookingDate, setBookingDate] = useState(initialValues.bookingDate);
    const [status, setStatus] = useState<BookingRecord['status']>(initialValues.status);
    const [dealPaymentMode, setDealPaymentMode] = useState<DealPaymentMode>(initialValues.dealPaymentMode);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<BookingFormField, string>>>({});

    useEffect(() => {
        setLeadId(initialValues.leadId);
        setAssignedTo(initialValues.assignedTo);
        setCustomerName(initialValues.customerName);
        setPhone(initialValues.phone);
        setProjectName(initialValues.projectName);
        setUnitId(initialValues.unitId);
        setUnitConfiguration(initialValues.unitConfiguration);
        setUnitPrice(initialValues.unitPrice);
        setBookingDate(initialValues.bookingDate);
        setStatus(initialValues.status);
        setDealPaymentMode(initialValues.dealPaymentMode);
        setFieldErrors({});
    }, [initialValues]);

    const unitOptions = useMemo(() => {
        const base = getAvailableUnitOptions(projectName);
        const extra = unitOptionExtras ?? [];
        const byId = new Map<string, { id: string; price: number; configuration: string }>();
        for (const u of extra) byId.set(u.id, u);
        for (const u of base) {
            if (!byId.has(u.id)) byId.set(u.id, u);
        }
        return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    }, [projectName, unitOptionExtras]);

    const clearField = (key: BookingFormField): void => {
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const allowed = unitOptions.some((u) => u.id === unitId);
        const nextErrors = validateBookingForm({
            leadId,
            assignedTo,
            customerName,
            phone,
            projectName,
            unitId,
            unitPrice,
            bookingDate,
            unitAllowedForProject: allowed,
        });
        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        void onSubmit({
            leadId,
            assignedTo,
            customerName,
            phone: normalizePhoneDigits(phone),
            projectName,
            unitId,
            unitConfiguration,
            unitPrice,
            bookingDate,
            status,
            dealPaymentMode,
        });
    };

    return (
        <Card className="border border-slate-200/80 shadow-lg shadow-slate-200/40 bg-white p-0 overflow-hidden">
            <form onSubmit={handleSubmit}>
                <div className="border-b border-slate-100 bg-linear-to-r from-slate-50/80 to-white px-6 py-5">
                    <h2 className="text-lg font-bold text-slate-900">Booking details</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Required fields are marked. Booking ID {variant === 'create' ? 'is assigned when you save' : 'cannot be changed'}.
                    </p>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500">Booking ID</label>
                            <input
                                readOnly
                                value={variant === 'create' ? 'Generated on save' : (bookingSlug ?? '')}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 font-mono"
                            />
                        </div>
                        <SelectField
                            label="Lead ID"
                            placeholder="Select lead"
                            required
                            value={leadId}
                            error={fieldErrors.leadId}
                            onChange={(e) => {
                                const id = e.target.value;
                                setLeadId(id);
                                clearField('leadId');
                                const lead = getLeadByLeadCode(id);
                                if (lead) setAssignedTo(lead.assignedTo);
                            }}
                            options={leadOptions.map((l) => ({ value: l.id, label: l.label }))}
                        />
                        <SelectField
                            label="Assigned To"
                            name="assignedTo"
                            placeholder="Select assignee"
                            required
                            value={assignedTo}
                            error={fieldErrors.assignedTo}
                            onChange={(e) => {
                                setAssignedTo(e.target.value);
                                clearField('assignedTo');
                            }}
                            options={
                                assignedTos.length
                                    ? assignedTos.map((name: string) => ({ value: name, label: name }))
                                    : [{ value: '', label: 'No assignees yet — add a lead first' }]
                            }
                        />
                        <InputField
                            label="Customer Name"
                            required
                            name="customerName"
                            placeholder="Required — name as on agreement"
                            value={customerName}
                            error={fieldErrors.customerName}
                            onChange={(e) => {
                                setCustomerName(e.target.value);
                                clearField('customerName');
                            }}
                            autoComplete="name"
                        />
                        <div className="space-y-1">
                            <InputField
                                label="Phone Number"
                                required
                                name="phone"
                                type="text"
                                inputMode="numeric"
                                autoComplete="tel"
                                placeholder="Digits only — e.g. 9876543210"
                                maxLength={15}
                                value={phone}
                                error={fieldErrors.phone}
                                onChange={(e) => {
                                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
                                    setPhone(digitsOnly);
                                    clearField('phone');
                                }}
                                inputClassName="font-mono tracking-wide"
                            />
                            <p className="text-[11px] text-slate-500 pl-0.5">Only numbers (10–15 digits). Spaces and symbols are removed.</p>
                        </div>
                        <SelectField
                            label="Project Name"
                            required
                            value={projectName}
                            error={fieldErrors.projectName}
                            onChange={(e) => {
                                setProjectName(e.target.value);
                                setUnitId('');
                                setUnitConfiguration('');
                                setUnitPrice('');
                                clearField('projectName');
                                clearField('unitId');
                                clearField('unitPrice');
                            }}
                            options={projectOptions.map((p) => ({ value: p, label: p }))}
                        />
                        <SelectField
                            label="Unit ID"
                            placeholder="Select unit"
                            required
                            value={unitOptions.length ? unitId : ''}
                            error={fieldErrors.unitId}
                            onChange={(e) => {
                                const v = e.target.value;
                                setUnitId(v);
                                const u = unitOptions.find((x) => x.id === v);
                                if (u) {
                                    setUnitPrice(String(u.price));
                                    setUnitConfiguration(u.configuration);
                                }
                                clearField('unitId');
                                clearField('unitPrice');
                            }}
                            options={
                                unitOptions.length
                                    ? unitOptions.map((u) => ({
                                          value: u.id,
                                          label: `${u.id} · ${u.configuration} — ₹${u.price.toLocaleString('en-IN')}`,
                                      }))
                                    : [{ value: '', label: 'No units available for this project' }]
                            }
                        />
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500">Unit configuration (BHK / layout)</label>
                            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
                                {unitId && unitConfiguration ? unitConfiguration : unitId ? '—' : 'Select a unit to see configuration'}
                            </p>
                        </div>
                        <InputField
                            label="Unit Price"
                            type="number"
                            min={1}
                            step={1}
                            required
                            value={unitPrice}
                            error={fieldErrors.unitPrice}
                            onChange={(e) => {
                                setUnitPrice(e.target.value);
                                clearField('unitPrice');
                            }}
                        />
                        <InputField
                            label="Booking Date"
                            type="date"
                            required
                            value={bookingDate}
                            error={fieldErrors.bookingDate}
                            onChange={(e) => {
                                setBookingDate(e.target.value);
                                clearField('bookingDate');
                            }}
                        />
                        <SelectField
                            label="Booking Status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as BookingRecord['status'])}
                            options={[
                                { value: 'Confirmed', label: 'Confirmed' },
                                { value: 'Pending', label: 'Pending' },
                                { value: 'Cancelled', label: 'Cancelled' },
                            ]}
                        />
                        <SelectField
                            label="Buyer payment plan"
                            value={dealPaymentMode}
                            onChange={(e) => setDealPaymentMode(e.target.value as DealPaymentMode)}
                            options={[
                                { value: 'milestone', label: 'Milestone (installment schedule)' },
                                { value: 'direct', label: 'Direct (lump payments)' },
                            ]}
                        />
                    </div>

                    {showFooterNote ? (
                        <p className="mt-6 text-xs text-slate-500 leading-relaxed">
                            {variant === 'edit' ? (
                                <>
                                    Linked payments for this booking are listed below the form. Open{' '}
                                    <span className="font-medium text-slate-700">View</span> from the booking list for full details,
                                    documents, and history.
                                </>
                            ) : (
                                <>
                                    After you create the booking, open <span className="font-medium text-slate-700">View</span> from the
                                    list (or go to booking details) to upload documents. Replacements and deletions are tracked in History.
                                </>
                            )}
                        </p>
                    ) : null}

                    <div className="mt-8 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-slate-100 pt-6">
                        <Button type="button" variant="companyOutline" size="cta" onClick={onCancel} disabled={isSubmitting} className="sm:min-w-[120px]">
                            Cancel
                        </Button>
                        <Button type="submit" variant="company" size="cta" disabled={isSubmitting} className="sm:min-w-[140px]">
                            {isSubmitting ? 'Saving…' : submitLabel}
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}
