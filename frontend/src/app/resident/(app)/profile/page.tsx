'use client';

import React, { useMemo, useState } from 'react';
import { useResidentSession } from '@/modules/resident-portal/store/residentSessionStore';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/modules/resident-portal/components/TextField';
import { SectionCard } from '@/modules/resident-portal/components/SectionCard';
import {
    ResidentPageHeader,
    ResidentPageShell,
    residentTagClass,
} from '@/modules/resident-portal/components/ResidentPageShell';
import { formatShortDate } from '@/modules/resident-portal/utils/date';
import { LuActivity, LuCircleUser, LuLock } from 'react-icons/lu';

export default function ResidentProfilePage() {
    const { currentResident } = useResidentSession();
    const [name, setName] = useState(currentResident?.fullName ?? '');
    const [phone, setPhone] = useState(currentResident?.phone ?? '');
    const [email, setEmail] = useState(currentResident?.email ?? '');
    const [unit, setUnit] = useState(currentResident?.unitNumber ?? '');
    const [type, setType] = useState<string>(currentResident?.residentType ?? 'Owner');
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');

    const activity = useMemo(
        () => [
            { at: new Date().toISOString(), text: 'Signed in to Resident Portal' },
            { at: new Date().toISOString(), text: 'Viewed billing summary' },
            { at: new Date().toISOString(), text: 'Opened maintenance ticket list' },
        ],
        [],
    );

    return (
        <ResidentPageShell wide>
            <ResidentPageHeader
                icon={<LuCircleUser className="h-5 w-5" aria-hidden />}
                title="Profile & security"
                subtitle="Update profile details and manage sign-in security."
            >
                {currentResident ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <span className={residentTagClass}>Unit {currentResident.unitNumber}</span>
                        <span className={residentTagClass}>{currentResident.residentType}</span>
                    </div>
                ) : null}
            </ResidentPageHeader>

            <div className="grid grid-cols-1 gap-2 sm:gap-2.5 xl:grid-cols-1">
                <div className="space-y-2 sm:space-y-2.5">
                    <SectionCard title="Profile details" subtitle="Your resident information">
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                            <TextField id="p-name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                            <TextField id="p-unit" label="Unit number" value={unit} onChange={(e) => setUnit(e.target.value)} />
                            <TextField id="p-phone" label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            <TextField id="p-email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <TextField id="p-type" label="Resident type" value={type} onChange={(e) => setType(e.target.value)} />
                        </div>
                        <Button className="mt-4 h-10 rounded-full px-5 text-sm font-semibold">Save changes</Button>
                    </SectionCard>

                    <SectionCard title="Security" subtitle="Password and sign-in settings">
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eef3f8] text-[#0a66c2]">
                                <LuLock className="h-5 w-5" aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">Change password</p>
                                <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.6)]">For demo, this doesn&apos;t persist yet.</p>
                                <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                    <TextField
                                        id="pw1"
                                        label="New password"
                                        type="password"
                                        value={pw}
                                        onChange={(e) => setPw(e.target.value)}
                                    />
                                    <TextField
                                        id="pw2"
                                        label="Confirm password"
                                        type="password"
                                        value={pw2}
                                        onChange={(e) => setPw2(e.target.value)}
                                    />
                                </div>
                                <Button className="mt-3.5 h-10 rounded-full px-5 text-sm font-semibold" disabled={!pw.trim() || pw !== pw2}>
                                    Update password
                                </Button>
                            </div>
                        </div>
                    </SectionCard>
                </div>

                {/* <SectionCard
                    title="Audit & activity"
                    subtitle="Recent account activity"
                    bodyClassName="divide-y divide-[#ebebeb] p-0"
                >
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[rgba(0,0,0,0.6)]">Last login</span>
                            <span className="font-semibold text-[rgba(0,0,0,0.9)]">
                                {currentResident?.lastLoginAt ? formatShortDate(currentResident.lastLoginAt) : '—'}
                            </span>
                        </div>
                    </div>
                    {activity.map((a, idx) => (
                        <div key={idx} className="flex gap-3 px-4 py-3">
                            <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eef3f8] text-[#0a66c2]">
                                <LuActivity className="h-4 w-4" aria-hidden />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-[rgba(0,0,0,0.45)]">{formatShortDate(a.at)}</p>
                                <p className="mt-0.5 text-sm font-semibold text-[rgba(0,0,0,0.9)]">{a.text}</p>
                            </div>
                        </div>
                    ))}
                </SectionCard> */}
            </div>
        </ResidentPageShell>
    );
}
