'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import {
    residentChipActiveClass,
    residentChipInactiveClass,
    residentInputClass,
    residentTextareaClass,
} from '@/modules/resident-portal/components/ResidentPageShell';
import {
    buildSlotLabel,
    defaultBookingDate,
    defaultEndTime,
    defaultStartTime,
    formatBookingDateDisplay,
} from '@/modules/resident-portal/amenities/amenityBookingTime';
import type { MaintenanceCategory, Priority } from '@/modules/resident-portal/utils/types';
import { MAINTENANCE_CATEGORIES, MAINTENANCE_PRIORITIES } from './maintenanceFormConstants';
import { LuCalendar, LuCamera, LuClock, LuSparkles } from 'react-icons/lu';

export type MaintenanceRequestFormValues = {
    category: MaintenanceCategory;
    priority: Priority;
    description: string;
    preferredVisitWindow: string;
    attachmentName?: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: MaintenanceRequestFormValues) => void;
    isSubmitting?: boolean;
};

function Chip({
    active,
    onClick,
    children,
    disabled,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50',
                active ? residentChipActiveClass : residentChipInactiveClass,
            )}
        >
            {children}
        </button>
    );
}

export function MaintenanceRequestFormModal({ isOpen, onClose, onSubmit, isSubmitting = false }: Props) {
    const [category, setCategory] = useState<MaintenanceCategory>('Water Leakage');
    const [priority, setPriority] = useState<Priority>('High');
    const [description, setDescription] = useState('');
    const [preferredDate, setPreferredDate] = useState(defaultBookingDate());
    const [preferredStart, setPreferredStart] = useState(defaultStartTime());
    const [preferredEnd, setPreferredEnd] = useState(defaultEndTime());
    const [attachmentName, setAttachmentName] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setCategory('Water Leakage');
        setPriority('High');
        setDescription('');
        setPreferredDate(defaultBookingDate());
        setPreferredStart(defaultStartTime());
        setPreferredEnd(defaultEndTime());
        setAttachmentName('');
    }, [isOpen]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim().length < 8) return;
        const dateLabel = formatBookingDateDisplay(preferredDate);
        const slotLabel = buildSlotLabel(preferredStart, preferredEnd);
        onSubmit({
            category,
            priority,
            description: description.trim(),
            preferredVisitWindow: `${dateLabel} · ${slotLabel}`,
            attachmentName: attachmentName.trim() || undefined,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Raise a request" maxWidthClassName="max-w-lg">
            <p className="-mt-1 mb-4 text-sm text-gray-600">Auto-assigns vendor and starts SLA tracking.</p>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <p className="text-xs font-semibold text-[rgba(0,0,0,0.9)]">Category</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {MAINTENANCE_CATEGORIES.map((c) => (
                            <Chip key={c} active={category === c} onClick={() => setCategory(c)} disabled={isSubmitting}>
                                {c}
                            </Chip>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold text-[rgba(0,0,0,0.9)]">Priority</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {MAINTENANCE_PRIORITIES.map((p) => (
                            <Chip key={p} active={priority === p} onClick={() => setPriority(p)} disabled={isSubmitting}>
                                {p}
                            </Chip>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="mr-desc" className="text-xs font-semibold text-[rgba(0,0,0,0.9)]">
                        Description
                    </label>
                    <textarea
                        id="mr-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What happened? Where is the issue?"
                        disabled={isSubmitting}
                        className={residentTextareaClass}
                    />
                    {description.trim() && description.trim().length < 8 ? (
                        <p className="text-xs font-medium text-[#cc1016]">Add a bit more detail (min 8 characters).</p>
                    ) : null}
                </div>

                <div className="space-y-1.5">
                    <span className="block text-xs font-semibold text-[rgba(0,0,0,0.9)]">Preferred visit</span>
                    <div className="relative">
                        <LuCalendar
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            aria-hidden
                        />
                        <input
                            type="date"
                            value={preferredDate}
                            onChange={(e) => setPreferredDate(e.target.value)}
                            required
                            disabled={isSubmitting}
                            className={cn(residentInputClass, 'pl-10')}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="relative">
                            <LuClock
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                aria-hidden
                            />
                            <input
                                type="time"
                                value={preferredStart}
                                onChange={(e) => setPreferredStart(e.target.value)}
                                required
                                disabled={isSubmitting}
                                aria-label="Preferred start time"
                                className={cn(residentInputClass, 'pl-10')}
                            />
                        </div>
                        <div className="relative">
                            <LuClock
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                aria-hidden
                            />
                            <input
                                type="time"
                                value={preferredEnd}
                                onChange={(e) => setPreferredEnd(e.target.value)}
                                required
                                disabled={isSubmitting}
                                aria-label="Preferred end time"
                                className={cn(residentInputClass, 'pl-10')}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-dashed border-[#e0dfdc] bg-[#fafafa] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[rgba(0,0,0,0.6)] ring-1 ring-[#e0dfdc]">
                                <LuCamera className="h-4 w-4" aria-hidden />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">Photo / video</p>
                                <p className="truncate text-xs text-[rgba(0,0,0,0.6)]">
                                    {attachmentName || 'Optional — helps faster fix'}
                                </p>
                            </div>
                        </div>
                        <label className="shrink-0 cursor-pointer rounded-full border border-[#0a66c2] bg-white px-3 py-1.5 text-xs font-semibold text-[#0a66c2] hover:bg-[#eef3f8]">
                            Upload
                            <input
                                type="file"
                                className="hidden"
                                disabled={isSubmitting}
                                onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? '')}
                            />
                        </label>
                    </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-[#eef3f8] px-3 py-2.5">
                    <LuSparkles className="h-4 w-4 shrink-0 text-[#0a66c2]" aria-hidden />
                    <p className="text-xs text-[rgba(0,0,0,0.75)]">
                        We&apos;ll route to the right team and notify you with live updates.
                    </p>
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <Button
                        type="submit"
                        className="h-10 rounded-full px-5 text-sm font-semibold"
                        isLoading={isSubmitting}
                        disabled={description.trim().length < 8}
                    >
                        Submit request
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
