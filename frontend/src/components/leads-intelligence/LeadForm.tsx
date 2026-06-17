'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField, SelectField, TextAreaField } from '@/components/forms/Fields';
import type { IntelligenceLead, LeadSource, LeadStatus } from '@/lib/leadsIntelligenceStore';

export interface LeadFormValues {
    name: string;
    phone: string;
    email: string;
    source: LeadSource;
    status: LeadStatus;
    assignedTo: string;
    presentAddress: string;
    permanentAddress: string;
    notes: string;
}

interface LeadFormProps {
    title: string;
    ctaLabel: string;
    initialValues: LeadFormValues;
    isSubmitting?: boolean;
    onSubmit: (values: LeadFormValues) => void;
    onCancel: () => void;
    intelligenceSnapshot?: IntelligenceLead;
}

const NAME_REGEX = /^[A-Za-z\s]+$/;
const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadForm({ title, ctaLabel, initialValues, isSubmitting, onSubmit, onCancel, intelligenceSnapshot }: LeadFormProps) {
    const [values, setValues] = useState<LeadFormValues>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof LeadFormValues, string>>>({});

    const setField = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) => {
        let sanitizedValue = value;
        if (typeof value === 'string') {
            if (key === 'name') {
                sanitizedValue = value.replace(/[^A-Za-z\s]/g, '') as LeadFormValues[K];
            } else if (key === 'assignedTo') {
                sanitizedValue = value.replace(/[^A-Za-z\s]/g, '') as LeadFormValues[K];
            } else if (key === 'phone') {
                sanitizedValue = value.replace(/\D/g, '').slice(0, 10) as LeadFormValues[K];
            } else if (key === 'presentAddress' || key === 'permanentAddress') {
                sanitizedValue = value.slice(0, 500) as LeadFormValues[K];
            }
        }
        setValues((prev) => ({ ...prev, [key]: sanitizedValue }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const validate = (formValues: LeadFormValues) => {
        const nextErrors: Partial<Record<keyof LeadFormValues, string>> = {};

        if (!formValues.name.trim()) nextErrors.name = 'Name is required.';
        else if (!NAME_REGEX.test(formValues.name.trim())) nextErrors.name = 'Name can contain letters and spaces only.';

        if (!formValues.phone.trim()) nextErrors.phone = 'Phone is required.';
        else if (!PHONE_REGEX.test(formValues.phone.trim())) nextErrors.phone = 'Phone must be exactly 10 digits.';

        if (!formValues.email.trim()) nextErrors.email = 'Email is required.';
        else if (!EMAIL_REGEX.test(formValues.email.trim())) nextErrors.email = 'Please enter a valid email address.';

        if (!formValues.assignedTo.trim()) nextErrors.assignedTo = 'Assigned To is required.';

        const addrMax = 500;
        if (formValues.presentAddress.length > addrMax) nextErrors.presentAddress = `Use at most ${addrMax} characters.`;
        if (formValues.permanentAddress.length > addrMax) nextErrors.permanentAddress = `Use at most ${addrMax} characters.`;

        if (!formValues.notes.trim()) nextErrors.notes = 'Notes are required.';

        return nextErrors;
    };

    const hasErrors = Object.keys(validate(values)).length > 0;

    const handleSubmit = () => {
        const nextErrors = validate(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSubmit(values);
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-800">{title}</h1>
                <p className="text-sm text-slate-500 mt-1">Capture lead details and keep intelligence metadata ready for backend sync.</p>
            </div>

            {intelligenceSnapshot ? (
                <Card className="rounded-xl border-primary/20 bg-orange-50/40">
                    <p className="text-sm font-semibold text-slate-700">AI snapshot: Score {intelligenceSnapshot.leadScore} • Conversion {intelligenceSnapshot.conversionProbability}% • Engagement {intelligenceSnapshot.engagementScore}</p>
                    <p className="text-xs text-slate-500 mt-1">Next Action: {intelligenceSnapshot.nextBestAction}</p>
                </Card>
            ) : null}

            <Card className="rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Name" required value={values.name} onChange={(e) => setField('name', e.target.value)} maxLength={100} autoComplete="name" error={errors.name} />
                    <InputField label="Phone" required value={values.phone} onChange={(e) => setField('phone', e.target.value)} inputMode="numeric" maxLength={10} autoComplete="tel" error={errors.phone} />
                    <InputField label="Email" required value={values.email} onChange={(e) => setField('email', e.target.value)} type="email" maxLength={150} autoComplete="email" error={errors.email} />
                    <InputField label="Assigned To" required value={values.assignedTo} onChange={(e) => setField('assignedTo', e.target.value)} maxLength={100} error={errors.assignedTo} />
                    <SelectField label="Source" value={values.source} onChange={(e) => setField('source', e.target.value as LeadSource)} options={['Website', 'Referral', 'Campaign', 'Ads']} />
                    <SelectField label="Status" value={values.status} onChange={(e) => setField('status', e.target.value as LeadStatus)} options={['New', 'Contacted', 'Qualified', 'Converted', 'Lost']} />
                    <TextAreaField
                        label="Present address"
                        value={values.presentAddress}
                        onChange={(e) => setField('presentAddress', e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="House / flat no., street, area, city, state, PIN code…"
                        className="md:col-span-2"
                        error={errors.presentAddress}
                    />
                    <TextAreaField
                        label="Permanent address"
                        value={values.permanentAddress}
                        onChange={(e) => setField('permanentAddress', e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="If different from present — full address with PIN"
                        className="md:col-span-2"
                        error={errors.permanentAddress}
                    />
                    <TextAreaField label="Notes" required value={values.notes} onChange={(e) => setField('notes', e.target.value)} rows={5} className="md:col-span-2" error={errors.notes} />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="company"
                        size="cta"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        disabled={hasErrors}
                    >
                        {ctaLabel}
                    </Button>
                    <Button type="button" variant="companyOutline" size="cta" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </Card>
        </div>
    );
}
