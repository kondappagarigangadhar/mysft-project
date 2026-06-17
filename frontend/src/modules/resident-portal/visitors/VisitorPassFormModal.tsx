'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { residentInputClass } from '@/modules/resident-portal/components/ResidentPageShell';
import type { VisitorRequest } from './types';
import {
    defaultVisitDateTimeLocal,
    formatVisitWhenFromDateTimeLocal,
    visitWhenToDateTimeLocal,
} from './visitorPassTime';
import { LuCar, LuClock, LuPhone } from 'react-icons/lu';

export type VisitorPassFormValues = {
    name: string;
    mobile: string;
    vehicle?: string;
    when: string;
    purpose?: string;
};

type Props = {
    /** `null` = invite / create mode */
    pass: VisitorRequest | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: VisitorPassFormValues) => void;
    submitLabel?: string;
    /** Modal title when creating (default: Invite visitor) */
    createTitle?: string;
    disabled?: boolean;
};

function emptyFormState() {
    return {
        name: '',
        mobile: '',
        vehicle: '',
        visitAt: defaultVisitDateTimeLocal(),
        purpose: 'Guest visit',
    };
}

export function VisitorPassFormModal({
    pass,
    isOpen,
    onClose,
    onSubmit,
    submitLabel,
    createTitle = 'Invite visitor',
    disabled = false,
}: Props) {
    const isCreate = pass === null;
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [vehicle, setVehicle] = useState('');
    const [visitAt, setVisitAt] = useState(defaultVisitDateTimeLocal());
    const [purpose, setPurpose] = useState('Guest visit');

    useEffect(() => {
        if (!isOpen) return;
        if (!pass) {
            const empty = emptyFormState();
            setName(empty.name);
            setMobile(empty.mobile);
            setVehicle(empty.vehicle);
            setVisitAt(empty.visitAt);
            setPurpose(empty.purpose);
            return;
        }
        setName(pass.name);
        setMobile(pass.mobile === '—' ? '' : pass.mobile);
        setVehicle(pass.vehicle ?? '');
        setVisitAt(visitWhenToDateTimeLocal(pass.when));
        setPurpose(pass.purpose ?? 'Guest visit');
    }, [isOpen, pass]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || disabled) return;
        onSubmit({
            name: name.trim(),
            mobile: mobile.trim() || '—',
            vehicle: vehicle.trim() || undefined,
            when: formatVisitWhenFromDateTimeLocal(visitAt),
            purpose: purpose.trim() || undefined,
        });
        onClose();
    };

    const title = isCreate ? createTitle : `Edit — ${pass.name}`;
    const primaryLabel = submitLabel ?? (isCreate ? 'Create & share pass' : 'Save changes');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClassName="max-w-md">
            <form onSubmit={submit} className="space-y-3.5">
                <div className="space-y-1.5">
                    <label htmlFor="vp-name" className="block text-xs font-semibold text-gray-800">
                        Name
                    </label>
                    <input
                        id="vp-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Visitor full name"
                        required
                        disabled={disabled}
                        className={cn(residentInputClass, 'pl-3')}
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="vp-mobile" className="block text-xs font-semibold text-gray-800">
                        Mobile
                    </label>
                    <div className="relative">
                        <LuPhone
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            aria-hidden
                        />
                        <input
                            id="vp-mobile"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            placeholder="+91 90000 00000"
                            disabled={disabled}
                            className={residentInputClass}
                        />
                    </div>
                    {isCreate ? (
                        <p className="text-[11px] text-gray-500">Used for quick SMS share after the pass is created</p>
                    ) : null}
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="vp-vehicle" className="block text-xs font-semibold text-gray-800">
                        Vehicle <span className="font-normal text-gray-500">(optional)</span>
                    </label>
                    <div className="relative">
                        <LuCar
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            aria-hidden
                        />
                        <input
                            id="vp-vehicle"
                            value={vehicle}
                            onChange={(e) => setVehicle(e.target.value)}
                            placeholder="TS09AB1234"
                            disabled={disabled}
                            className={residentInputClass}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="vp-purpose" className="block text-xs font-semibold text-gray-800">
                        Purpose <span className="font-normal text-gray-500">(optional)</span>
                    </label>
                    <input
                        id="vp-purpose"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="Guest visit"
                        disabled={disabled}
                        className={cn(residentInputClass, 'pl-3')}
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="vp-visit-at" className="block text-xs font-semibold text-gray-800">
                        Visit date & time
                    </label>
                    <div className="relative">
                        <LuClock
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            aria-hidden
                        />
                        <input
                            id="vp-visit-at"
                            type="datetime-local"
                            value={visitAt}
                            onChange={(e) => setVisitAt(e.target.value)}
                            required
                            disabled={disabled}
                            className={cn(residentInputClass, 'pl-10')}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!name.trim() || disabled}
                        className="rounded-full bg-[#0a66c2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {primaryLabel}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/** @deprecated Use VisitorPassFormModal */
export function VisitorPassEditModal(
    props: Omit<Props, 'pass'> & { pass: VisitorRequest | null },
) {
    return <VisitorPassFormModal {...props} />;
}
