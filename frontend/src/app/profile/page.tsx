'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuBell,
    LuBriefcase,
    LuBuilding2,
    LuCamera,
    LuCircleUser,
    LuGlobe,
    LuMail,
    LuSave,
    LuSettings,
    LuShield,
    LuUser,
} from 'react-icons/lu';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { InputField, SelectField } from '@/components/forms/Fields';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { cn } from '@/lib/utils';

const DEFAULTS = {
    firstName: 'Naresh',
    lastName: 'Reddy',
    email: 'naresh@mysft.ai',
    phone: '+91 98765 43210',
    jobTitle: 'Platform Administrator',
    department: 'Operations',
    role: 'Super Admin',
    timezone: 'Asia/Kolkata',
    language: 'en',
    digestEmail: true,
    leadAlerts: true,
};

const SECTIONS = [
    { id: 'personal', label: 'Personal', icon: LuUser },
    { id: 'work', label: 'Work & access', icon: LuBriefcase },
    { id: 'regional', label: 'Regional', icon: LuGlobe },
    { id: 'notifications', label: 'Notifications', icon: LuBell },
    { id: 'security', label: 'Security', icon: LuShield },
] as const;

export default function ProfilePage() {
    const [firstName, setFirstName] = useState(DEFAULTS.firstName);
    const [lastName, setLastName] = useState(DEFAULTS.lastName);
    const [email] = useState(DEFAULTS.email);
    const [phone, setPhone] = useState(DEFAULTS.phone);
    const [jobTitle, setJobTitle] = useState(DEFAULTS.jobTitle);
    const [department, setDepartment] = useState(DEFAULTS.department);
    const [timezone, setTimezone] = useState(DEFAULTS.timezone);
    const [language, setLanguage] = useState(DEFAULTS.language);
    const [digestEmail, setDigestEmail] = useState(DEFAULTS.digestEmail);
    const [leadAlerts, setLeadAlerts] = useState(DEFAULTS.leadAlerts);
    const [savedFlash, setSavedFlash] = useState(false);
    const [activeSection, setActiveSection] = useState<string>('personal');

    const displayName = `${firstName} ${lastName}`.trim() || 'Your name';

    const handleSave = () => {
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 2500);
    };

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <CompanyAdminDashboardLayout>
            <div className="pb-10 lg:pb-6">
                <Breadcrumb
                    items={[
                        { label: 'Dashboard', href: '/company-admin/dashboard' },
                        { label: 'Profile' },
                    ]}
                    className="mb-6 shrink-0"
                />

                {/*
                  Desktop: fixed-height row â€” left column stays visible, only the right panel scrolls.
                  Offset â‰ˆ navbar (4rem) + main padding + breadcrumb block.
                */}
                <div className="flex flex-col gap-8 lg:h-[calc(100vh-12rem)] lg:min-h-[360px] lg:flex-row lg:items-stretch lg:gap-10 lg:overflow-hidden">
                    {/* Left rail: does not scroll with the form (scrolls only if its own content is tall) */}
                    <aside className="w-full shrink-0 lg:w-[300px] xl:w-[320px] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1">
                        <div className="space-y-4">
                            <div className="lg:hidden">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your profile</h1>
                                <p className="mt-1 text-sm text-slate-600">Personal details and preferences.</p>
                            </div>

                            <Card className="overflow-hidden border-none p-0 shadow-sm ring-1 ring-slate-200/90">
                                <div className="bg-gradient-to-br from-orange-500 to-amber-500 px-5 py-6 text-center text-white">
                                    <div className="relative mx-auto w-fit">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner ring-2 ring-white/40">
                                            <LuCircleUser size={40} strokeWidth={1.5} />
                                        </div>
                                        <button
                                            type="button"
                                            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-lg border border-white/50 bg-white text-orange-600 shadow-md transition hover:bg-orange-50"
                                            title="Update photo"
                                            aria-label="Update profile photo"
                                        >
                                            <LuCamera size={15} />
                                        </button>
                                    </div>
                                    <h2 className="mt-4 text-lg font-bold leading-tight">{displayName}</h2>
                                    <p className="mt-1 truncate text-xs text-white/90">{email}</p>
                                    <span className="mt-3 inline-block rounded-full bg-black/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                                        {DEFAULTS.role}
                                    </span>
                                </div>
                                <nav className="border-t border-slate-100 bg-white p-2" aria-label="Profile sections">
                                    <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Jump to</p>
                                    <ul className="space-y-0.5">
                                        {SECTIONS.map(({ id, label, icon: Icon }) => (
                                            <li key={id}>
                                                <button
                                                    type="button"
                                                    onClick={() => scrollToSection(id)}
                                                    className={cn(
                                                        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                                                        activeSection === id
                                                            ? 'bg-orange-50 text-orange-900'
                                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                    )}
                                                >
                                                    <Icon size={18} className={activeSection === id ? 'text-orange-600' : 'text-slate-400'} />
                                                    {label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                                <div className="border-t border-slate-100 bg-slate-50/80 p-4">
                                    <Button type="button" onClick={handleSave} className="h-11 w-full gap-2 rounded-xl font-semibold">
                                        <LuSave size={18} />
                                        Save changes
                                    </Button>
                                    <Link
                                        href="/settings"
                                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary"
                                    >
                                        <LuSettings size={18} />
                                        Org settings
                                    </Link>
                                </div>
                            </Card>
                        </div>
                    </aside>

                    {/* Right: only this column scrolls on large screens */}
                    <div className="min-h-0 min-w-0 flex-1 space-y-6 lg:overflow-y-auto lg:overscroll-contain lg:pr-2 lg:pb-2 [scrollbar-gutter:stable]">
                        <div className="hidden lg:block">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 xl:text-3xl">Your profile</h1>
                            <p className="mt-1 max-w-2xl text-sm text-slate-600">
                                Update how you appear across mySFT. Scroll this column â€” the profile card on the left stays fixed.
                            </p>
                        </div>

                        {savedFlash ? (
                            <p
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
                                role="status"
                            >
                                Profile updated â€” your preferences are saved for this session.
                            </p>
                        ) : null}

                        <section id="personal" className="scroll-mt-4 lg:scroll-mt-2">
                            <Card className="border-none p-6 shadow-sm ring-1 ring-slate-200/90">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                        <LuCircleUser size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Personal information</h3>
                                        <p className="text-xs text-slate-500">Shown on reports and activity where your name appears.</p>
                                    </div>
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <InputField label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                    <InputField label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                    <InputField
                                        label="Work email"
                                        type="email"
                                        value={email}
                                        disabled
                                        readOnly
                                        className="sm:col-span-2 opacity-80"
                                    />
                                    <InputField label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                    <InputField label="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                                    <InputField label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
                                </div>
                            </Card>
                        </section>

                        <section id="work" className="scroll-mt-28">
                            <Card className="border-none p-6 shadow-sm ring-1 ring-slate-200/90">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                        <LuBriefcase size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Work & access</h3>
                                        <p className="text-xs text-slate-500">Managed by your organization admin.</p>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform role</p>
                                    <p className="mt-1 text-base font-semibold text-slate-800">{DEFAULTS.role}</p>
                                    <p className="mt-3 text-sm text-slate-600">
                                        Need a different role or tenant? Ask your org admin or open{' '}
                                        <Link href="/settings" className="font-semibold text-primary hover:underline">
                                            Organization settings
                                        </Link>
                                        .
                                    </p>
                                </div>
                            </Card>
                        </section>

                        <section id="regional" className="scroll-mt-4 lg:scroll-mt-2">
                            <Card className="border-none p-6 shadow-sm ring-1 ring-slate-200/90">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                                        <LuGlobe size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Regional & language</h3>
                                        <p className="text-xs text-slate-500">Formats for dates, numbers, and default locale.</p>
                                    </div>
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <SelectField
                                        label="Time zone"
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        options={[
                                            { value: 'Asia/Kolkata', label: 'India (IST)' },
                                            { value: 'Asia/Dubai', label: 'Gulf (GST)' },
                                            { value: 'America/New_York', label: 'US Eastern' },
                                            { value: 'Europe/London', label: 'UK' },
                                        ]}
                                    />
                                    <SelectField
                                        label="Language"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        options={[
                                            { value: 'en', label: 'English' },
                                            { value: 'hi', label: 'Hindi' },
                                        ]}
                                    />
                                </div>
                            </Card>
                        </section>

                        <section id="notifications" className="scroll-mt-28">
                            <Card className="border-none p-6 shadow-sm ring-1 ring-slate-200/90">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                        <LuBell size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Your notifications</h3>
                                        <p className="text-xs text-slate-500">Quick toggles â€” org-wide rules live in settings.</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label
                                        className={cn(
                                            'flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3.5 transition-colors',
                                            leadAlerts ? 'border-orange-200 bg-orange-50/40' : 'border-slate-200 bg-white'
                                        )}
                                    >
                                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <LuMail className="text-slate-400" size={18} />
                                            New lead &amp; demand alerts
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={leadAlerts}
                                            onChange={(e) => setLeadAlerts(e.target.checked)}
                                            className="h-4 w-4 accent-primary"
                                        />
                                    </label>
                                    <label
                                        className={cn(
                                            'flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3.5 transition-colors',
                                            digestEmail ? 'border-orange-200 bg-orange-50/40' : 'border-slate-200 bg-white'
                                        )}
                                    >
                                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <LuBuilding2 className="text-slate-400" size={18} />
                                            Weekly activity digest
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={digestEmail}
                                            onChange={(e) => setDigestEmail(e.target.checked)}
                                            className="h-4 w-4 accent-primary"
                                        />
                                    </label>
                                </div>
                            </Card>
                        </section>

                        <section id="security" className="scroll-mt-4 lg:scroll-mt-2">
                            <Card className="border-none p-6 shadow-sm ring-1 ring-slate-200/90">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                        <LuShield size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Security</h3>
                                        <p className="text-xs text-slate-500">Password and session controls (demo UI).</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                    <Button type="button" variant="outline" className="rounded-xl border-slate-200">
                                        Change password
                                    </Button>
                                    <Button type="button" variant="outline" className="rounded-xl border-slate-200">
                                        View active sessions
                                    </Button>
                                </div>
                            </Card>
                        </section>
                    </div>
                </div>
            </div>
        </CompanyAdminDashboardLayout>
    );
}
