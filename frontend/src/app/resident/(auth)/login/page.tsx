'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ResidentAuthLayout } from '@/modules/resident-portal/layouts/ResidentAuthLayout';
import { residentAuthApi } from '@/modules/resident-portal/store/residentSessionStore';
import { LuShieldCheck } from 'react-icons/lu';

export default function ResidentLoginPage() {
    const router = useRouter();
    const [remember, setRemember] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            // Simplified login: no registration flow required.
            // This signs in to the demo resident account and redirects to the dashboard.
            residentAuthApi().loginWithMySftSso({ remember });
            router.push('/resident/dashboard');
        }, 350);
    };

    return (
        <ResidentAuthLayout>
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-white shadow-[0_14px_44px_-16px_rgba(15,23,42,0.18),0_0_0_1px_rgba(15,23,42,0.04)]">
                <div className="px-7 pb-8 pt-7 sm:px-9 sm:pb-9 sm:pt-8">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600/90">Resident Login</p>
                    <h1 className="mt-1.5 text-[1.55rem] font-semibold tracking-tight text-slate-900">mySFT Resident Portal</h1>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">Sign in to manage payments, maintenance, visitors, and more.</p>

                    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
                        <div className="flex items-start gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white ring-1 ring-slate-200 text-orange-600">
                                <LuShieldCheck className="h-5 w-5" aria-hidden />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Quick sign-in</p>
                                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                    Click login to open your Resident Dashboard as{' '}
                                    <span className="font-semibold text-slate-800">Ramesh Kumar</span> (Unit 101, Skyline Residency).
                                </p>
                                <label className="mt-4 inline-flex items-center gap-3 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                        className="h-4 w-4 rounded-[6px] border-slate-300 text-orange-500 focus:ring-2 focus:ring-orange-500/25"
                                    />
                                    Remember session
                                </label>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={onSubmit} className="mt-5">
                        <Button
                            type="submit"
                            className="h-12 w-full rounded-2xl text-[15px] font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                            isLoading={isLoading}
                        >
                            Login
                        </Button>
                    </form>
                </div>
            </div>
        </ResidentAuthLayout>
    );
}

