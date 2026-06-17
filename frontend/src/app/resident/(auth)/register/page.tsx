'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ResidentAuthLayout } from '@/modules/resident-portal/layouts/ResidentAuthLayout';
import { TextField } from '@/modules/resident-portal/components/TextField';
import type { ResidentType } from '@/modules/resident-portal/utils/types';
import { residentAuthApi } from '@/modules/resident-portal/store/residentSessionStore';
import { LuCalendar, LuHouse, LuIdCard, LuMail, LuPhone, LuUser, LuLock, LuShieldCheck } from 'react-icons/lu';
import { cn } from '@/lib/utils';

function isEmail(v: string) {
    return /^\S+@\S+\.\S+$/.test(v.trim());
}

export default function ResidentRegisterPage() {
    const router = useRouter();

    const [step, setStep] = useState<'form' | 'otp' | 'pending'>('form');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [unitNumber, setUnitNumber] = useState('');
    const [residentType, setResidentType] = useState<ResidentType>('Owner');
    const [moveInDate, setMoveInDate] = useState('');
    const [idUploadName, setIdUploadName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [createdResidentId, setCreatedResidentId] = useState<string | null>(null);

    const fieldErrors = useMemo(() => {
        const errs: Record<string, string> = {};
        if (fullName.trim().length < 2) errs.fullName = 'Full name is required.';
        if (phone.replace(/\D/g, '').length < 10) errs.phone = 'Enter a valid phone number.';
        if (!isEmail(email)) errs.email = 'Enter a valid email address.';
        if (!unitNumber.trim()) errs.unitNumber = 'Unit number is required.';
        if (!moveInDate) errs.moveInDate = 'Move-in date is required.';
        if (password.trim().length < 4) errs.password = 'Password must be at least 4 characters.';
        if (confirmPassword !== password) errs.confirmPassword = 'Passwords do not match.';
        return errs;
    }, [fullName, phone, email, unitNumber, moveInDate, password, confirmPassword]);

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (Object.keys(fieldErrors).length) {
            setError('Please fix the highlighted fields.');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            const res = residentAuthApi().registerResident({
                fullName,
                phone,
                email,
                unitNumber,
                residentType,
                moveInDate,
                avatarUrl: '',
                rejectionReason: undefined,
                password,
            });
            setIsLoading(false);
            if (!res.ok) {
                setError('Could not register. Please try again.');
                return;
            }
            setCreatedResidentId(res.residentId);
            setStep('otp');
        }, 650);
    };

    const submitOtp = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (otp.trim().length < 6) {
            setError('Enter the 6-digit OTP.');
            return;
        }
        if (!createdResidentId) {
            setError('Something went wrong. Please register again.');
            setStep('form');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            const res = residentAuthApi().verifyOtp({ residentId: createdResidentId, otp });
            setIsLoading(false);
            if (!res.ok) {
                setError('OTP verification failed. Please try again.');
                return;
            }
            setStep('pending');
        }, 650);
    };

    return (
        <ResidentAuthLayout>
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-white shadow-[0_14px_44px_-16px_rgba(15,23,42,0.18),0_0_0_1px_rgba(15,23,42,0.04)]">
                <div className="px-7 pb-8 pt-7 sm:px-9 sm:pb-9 sm:pt-8">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600/90">Resident Registration</p>
                    <h1 className="mt-1.5 text-[1.55rem] font-semibold tracking-tight text-slate-900">Create your account</h1>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        Register once. Verify OTP. Then your community admin approves access.
                    </p>

                    {error ? (
                        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
                    ) : null}

                    {step === 'form' ? (
                        <form onSubmit={submitForm} className="mt-6 space-y-4">
                            <TextField
                                id="reg-name"
                                label="Full Name"
                                placeholder="Your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                error={fieldErrors.fullName}
                                leftIcon={<LuUser className="h-5 w-5" />}
                                required
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <TextField
                                    id="reg-phone"
                                    label="Phone Number"
                                    placeholder="+91 98765 43210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    error={fieldErrors.phone}
                                    leftIcon={<LuPhone className="h-5 w-5" />}
                                    required
                                />
                                <TextField
                                    id="reg-email"
                                    label="Email Address"
                                    placeholder="name@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    error={fieldErrors.email}
                                    leftIcon={<LuMail className="h-5 w-5" />}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <TextField
                                    id="reg-unit"
                                    label="Property / Unit Number"
                                    placeholder="e.g. A-1208"
                                    value={unitNumber}
                                    onChange={(e) => setUnitNumber(e.target.value)}
                                    error={fieldErrors.unitNumber}
                                    leftIcon={<LuHouse className="h-5 w-5" />}
                                    required
                                />
                                <div className="space-y-2">
                                    <label className="block text-[13px] font-semibold text-slate-800">Resident Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['Owner', 'Tenant', 'Family Member'] as ResidentType[]).map((t) => {
                                            const active = residentType === t;
                                            return (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setResidentType(t)}
                                                    className={cn(
                                                        'h-12 rounded-2xl border text-sm font-semibold transition-all',
                                                        active
                                                            ? 'border-orange-200 bg-orange-50 text-slate-900 ring-2 ring-orange-200/40'
                                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                    )}
                                                >
                                                    {t === 'Family Member' ? 'Family' : t}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <TextField
                                id="reg-movein"
                                label="Move-in Date"
                                type="date"
                                value={moveInDate}
                                onChange={(e) => setMoveInDate(e.target.value)}
                                error={fieldErrors.moveInDate}
                                leftIcon={<LuCalendar className="h-5 w-5" />}
                                required
                            />

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                                <div className="flex items-start gap-3">
                                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white ring-1 ring-slate-200 text-orange-600">
                                        <LuIdCard className="h-5 w-5" aria-hidden />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900">Aadhaar / ID Upload</p>
                                        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                            Upload a government ID for verification (demo: stores filename only).
                                        </p>
                                        <div className="mt-3 flex items-center gap-3">
                                            <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                                                Choose file
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => setIdUploadName(e.target.files?.[0]?.name ?? '')}
                                                />
                                            </label>
                                            <p className="min-w-0 truncate text-sm text-slate-500">{idUploadName || 'No file selected'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <TextField
                                    id="reg-password"
                                    label="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    error={fieldErrors.password}
                                    leftIcon={<LuLock className="h-5 w-5" />}
                                    required
                                />
                                <TextField
                                    id="reg-confirm"
                                    label="Confirm Password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    error={fieldErrors.confirmPassword}
                                    leftIcon={<LuLock className="h-5 w-5" />}
                                    required
                                />
                            </div>

                            <Button type="submit" className="h-12 w-full rounded-2xl text-[15px] font-semibold" isLoading={isLoading}>
                                Continue to OTP
                            </Button>
                        </form>
                    ) : null}

                    {step === 'otp' ? (
                        <form onSubmit={submitOtp} className="mt-6 space-y-4">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
                                <div className="flex items-start gap-3">
                                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white ring-1 ring-slate-200 text-orange-600">
                                        <LuShieldCheck className="h-5 w-5" aria-hidden />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">OTP Verification</p>
                                        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                            Enter the 6-digit OTP sent to your phone/email (demo: any 6 digits).
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <TextField
                                id="reg-otp"
                                label="OTP"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                hint="Tip: enter any 6 digits for demo."
                                required
                            />
                            <Button type="submit" className="h-12 w-full rounded-2xl text-[15px] font-semibold" isLoading={isLoading}>
                                Verify OTP
                            </Button>
                        </form>
                    ) : null}

                    {step === 'pending' ? (
                        <div className="mt-6">
                            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5">
                                <p className="text-sm font-semibold text-slate-900">Pending Approval</p>
                                <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                                    Your registration is submitted and awaiting admin approval. You’ll be notified once access is enabled.
                                </p>
                            </div>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="h-11 rounded-2xl"
                                    onClick={() => router.push('/resident/login')}
                                >
                                    Back to login
                                </Button>
                                <Button
                                    className="h-11 rounded-2xl"
                                    onClick={() => {
                                        // In demo, auto-approve the created resident so user can continue.
                                        if (createdResidentId) residentAuthApi().__approve(createdResidentId);
                                        router.push('/resident/login');
                                    }}
                                >
                                    Demo: auto-approve
                                </Button>
                            </div>
                        </div>
                    ) : null}

                    <p className="mt-8 text-center text-sm text-slate-600">
                        Already have an account?{' '}
                        <Link href="/resident/login" className="font-semibold text-orange-600 hover:underline underline-offset-4">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </ResidentAuthLayout>
    );
}

