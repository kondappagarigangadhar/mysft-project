'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { InputField, SelectField, TextAreaField } from '@/components/forms/Fields';
import { normalizeLeadPhoneDigits, type LeadSource, type LeadStatus, type PropertyType } from '@/lib/leadStore';

export type LeadFormValues = {
    leadCode: string;
    name: string;
    phone: string;
    email: string;
    source: LeadSource;
    project: string;
    budgetRange: string;
    preferredUnitType: PropertyType;
    status: LeadStatus;
    assignedTo: string;
    brokerAgent: string;
    notes: string;
};

const NAME_REGEX = /^[A-Za-z\s]+$/;
const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NUMERIC_REGEX = /^\d+$/;

type FormErrors = Partial<Record<keyof LeadFormValues, string>>;

export function LeadForm({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting,
    leadSources,
    projects,
    preferredUnitTypeOptions,
    assignedTos,
    brokerAgents,
}: {
    initialValues: LeadFormValues;
    onSubmit: (values: LeadFormValues) => Promise<void> | void;
    onCancel: () => void;
    isSubmitting?: boolean;
    leadSources: LeadSource[];
    projects: string[];
    preferredUnitTypeOptions: PropertyType[];
    assignedTos: string[];
    brokerAgents: string[];
}) {
    const [values, setValues] = React.useState<LeadFormValues>(() => ({
        ...initialValues,
        phone: normalizeLeadPhoneDigits(initialValues.phone),
    }));
    const [errors, setErrors] = React.useState<FormErrors>({});

    React.useEffect(() => {
        setValues({
            ...initialValues,
            phone: normalizeLeadPhoneDigits(initialValues.phone),
        });
        setErrors({});
    }, [initialValues]);

    const validateValues = (formValues: LeadFormValues): FormErrors => {
        const nextErrors: FormErrors = {};

        if (!formValues.name.trim()) {
            nextErrors.name = 'Lead name is required.';
        } else if (!NAME_REGEX.test(formValues.name.trim())) {
            nextErrors.name = 'Lead name can contain letters and spaces only.';
        }

        if (!formValues.phone.trim()) {
            nextErrors.phone = 'Phone number is required.';
        } else if (!PHONE_REGEX.test(formValues.phone.trim())) {
            nextErrors.phone = 'Phone number must be exactly 10 digits.';
        }

        if (!formValues.email.trim()) {
            nextErrors.email = 'Email is required.';
        } else if (!EMAIL_REGEX.test(formValues.email.trim())) {
            nextErrors.email = 'Please enter a valid email address.';
        }

        if (!formValues.source) nextErrors.source = 'Lead source is required.';
        if (!formValues.project) nextErrors.project = 'Project interest is required.';
        if (!formValues.budgetRange.trim()) nextErrors.budgetRange = 'Budget is required.';
        else if (!NUMERIC_REGEX.test(formValues.budgetRange.trim())) nextErrors.budgetRange = 'Budget must contain numbers only.';
        if (!formValues.preferredUnitType) nextErrors.preferredUnitType = 'Preferred unit type is required.';
        if (!formValues.status) nextErrors.status = 'Lead status is required.';
        if (!formValues.assignedTo) nextErrors.assignedTo = 'Assignee is required.';

        if (formValues.brokerAgent && !NAME_REGEX.test(formValues.brokerAgent.trim())) {
            nextErrors.brokerAgent = 'Broker/Agent name can contain letters and spaces only.';
        }

        return nextErrors;
    };

    const sanitizeInputValue = (name: string, value: string) => {
        if (name === 'name' || name === 'brokerAgent') {
            return value.replace(/[^A-Za-z\s]/g, '');
        }
        if (name === 'phone') {
            return value.replace(/\D/g, '').slice(0, 10);
        }
        if (name === 'budgetRange') {
            return value.replace(/\D/g, '');
        }
        return value;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const sanitizedValue = sanitizeInputValue(name, value);
        setValues((prev) => ({ ...prev, [name]: sanitizedValue } as LeadFormValues));
        setErrors((prev) => {
            if (!prev[name as keyof LeadFormValues]) return prev;
            const next = { ...prev };
            delete next[name as keyof LeadFormValues];
            return next;
        });
    };

    const hasErrors = Object.keys(validateValues(values)).length > 0;

    return (
        <Card className="shadow-md bg-white p-0" contentClassName="p-0">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const nextErrors = validateValues(values);
                    setErrors(nextErrors);
                    if (Object.keys(nextErrors).length > 0) return;
                    return onSubmit(values);
                }}
            >
                <div className="p-6">
                    <div className="border-b border-slate-100 pb-6">
                        <h2 className="text-lg font-bold text-slate-800">Lead Information</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            Enter details to create or update a lead.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                        <InputField label="Lead ID" name="leadCode" value={values.leadCode} onChange={handleChange as any} disabled readOnly className="md:col-span-2" />

                        <InputField label="Lead Name" required name="name" value={values.name} onChange={handleChange as any} placeholder="e.g. Gangadhar Reddy" maxLength={100} autoComplete="name" error={errors.name} />

                        <InputField label="Phone Number" required name="phone" value={values.phone} onChange={handleChange as any} type="tel" placeholder="10 digit number" inputMode="numeric" autoComplete="tel" maxLength={10} error={errors.phone} />

                        <InputField label="Email" required name="email" value={values.email} onChange={handleChange as any} type="email" placeholder="name@email.com" autoComplete="email" maxLength={150} error={errors.email} />

                        <SelectField label="Lead Source" required name="source" value={values.source || ''} onChange={handleChange as any} options={leadSources} placeholder="Select lead source" error={errors.source} />

                        <SelectField label="Project Interest" required name="project" value={values.project || ''} onChange={handleChange as any} options={projects} placeholder="Select project" error={errors.project} />

                        <InputField label="Budget Range" required name="budgetRange" value={values.budgetRange || ''} onChange={handleChange as any} placeholder="e.g. 5000000" inputMode="numeric" maxLength={12} error={errors.budgetRange} />

                        <SelectField label="Preferred Unit Type" required name="preferredUnitType" value={values.preferredUnitType || ''} onChange={handleChange as any} options={preferredUnitTypeOptions} placeholder="Select preferred unit type" error={errors.preferredUnitType} />

                        <SelectField label="Lead Status" required name="status" value={values.status || ''} onChange={handleChange as any} options={['New', 'Qualified', 'Lost']} placeholder="Select lead status" error={errors.status} />

                        <SelectField label="Assigned To" required name="assignedTo" value={values.assignedTo || ''} onChange={handleChange as any} options={assignedTos} placeholder="Select assignee" error={errors.assignedTo} />

                        <InputField label="Broker/Agent" name="brokerAgent" value={values.brokerAgent || ''} onChange={handleChange as any} placeholder="Broker/agent name" maxLength={100} error={errors.brokerAgent} />

                        <TextAreaField label="Notes" name="notes" value={values.notes} onChange={handleChange as any} rows={6} placeholder="Add notes about customer requirements, preferences, and interactions..." />
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 pt-6">
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="cta"
                            onClick={onCancel}
                            className={cn('flex-1 sm:flex-none')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="company"
                            size="cta"
                            className="flex-1 sm:flex-none"
                            disabled={isSubmitting || hasErrors}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}

