'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    LuMail,
    LuLock,
    LuArrowRight,
    LuBuilding2,
    LuCheck,
    LuShield,
    LuLayoutGrid,
    LuUsers,
} from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import { FOOTER_POWERED_BY, LOGIN_MOBILE_TAGLINE, LOGIN_TAGLINE, LOGO_FULL_SRC, PRODUCT_NAME } from '@/lib/branding';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showRegisteredBanner, setShowRegisteredBanner] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const q = new URLSearchParams(window.location.search);
        if (q.get('registered') === '1') {
            setShowRegisteredBanner(true);
            window.history.replaceState({}, '', '/login');
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            router.push('/company-admin/ai-command-center');
        }, 1000);
    };

    return (
        <div className="lg:min-h-screen flex flex-col lg:flex-row bg-slate-50">
            {/* Brand panel — desktop */}
            <aside className="relative hidden lg:flex lg:w-[46%] xl:w-[44%] min-h-[280px] lg:min-h-screen lg:max-h-screen flex-col justify-between p-10 xl:p-12 text-white overflow-x-hidden overflow-y-auto">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url(/login-bg.png)' }}
                    aria-hidden
                />
                <div className="absolute inset-0 bg-linear-to-br from-slate-900/92 via-slate-900/85 to-slate-950/90" aria-hidden />
                <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-size-[48px_48px]" aria-hidden />

                <div className="relative z-10 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center gap-3 mb-8 xl:mb-10">
                        <img src={LOGO_FULL_SRC} alt={PRODUCT_NAME} className="h-10 w-auto max-w-[140px] object-contain" />
                        <div>
                            <p className="text-lg font-semibold tracking-tight">{PRODUCT_NAME}</p>
                            <p className="text-xs text-slate-400 font-medium">{LOGIN_TAGLINE}</p>
                        </div>
                    </div>
                    <h1 className="text-3xl xl:text-[2.15rem] font-bold tracking-tight leading-[1.15] max-w-lg">
                        One platform for sites, teams, and portfolios.
                    </h1>
                    <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-md">
                        Bring jobs, drawings, and approvals together so owners, GCs, and field teams stay aligned from pre-construction to handover.
                    </p>

                    <ul className="mt-8 xl:mt-10 space-y-3.5 max-w-md">
                        {[
                            {
                                icon: LuLayoutGrid,
                                title: 'Projects & portfolios',
                                text: 'Roll up sites, budgets, and milestones in one live view.',
                            },
                            {
                                icon: LuUsers,
                                title: 'Teams & permissions',
                                text: 'Invite stakeholders with roles that match how you work.',
                            },
                            {
                                icon: LuShield,
                                title: 'Controlled documents',
                                text: 'Share revisions, RFIs, and submittals with a clear audit trail.',
                            },
                        ].map(({ icon: Icon, title, text }) => (
                            <li
                                key={title}
                                className="flex gap-3.5 rounded-xl bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-[2px]"
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
                                    <Icon className="h-4 w-4" aria-hidden />
                                </span>
                                <span>
                                    <span className="block text-sm font-semibold text-white">{title}</span>
                                    <span className="mt-0.5 block text-xs text-slate-400 leading-snug">{text}</span>
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 xl:mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5 text-slate-400">
                            <LuCheck className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                            SOC2-ready practices
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-400">
                            <LuCheck className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                            SSO & SCIM (Enterprise)
                        </span>
                    </div>

                    <blockquote className="mt-8 xl:mt-10 pl-4 border-l-2 border-primary/50 max-w-md">
                        <p className="text-sm text-slate-300 italic leading-relaxed">
                            “We finally have one place for the office and the field—less chasing email, more building.”
                        </p>
                        <footer className="mt-2 text-xs text-slate-500 not-italic">— Operations lead, multi-site developer</footer>
                    </blockquote>
                </div>

                <p className="relative z-10 text-xs text-slate-500 mt-10 pt-2 border-t border-white/10">
                    {FOOTER_POWERED_BY}
                </p>
            </aside>

            {/* Form — light warm panel */}
            <main className="relative flex flex-1 flex-col items-center lg:justify-center px-5 py-12 sm:px-8 overflow-hidden bg-linear-to-br from-orange-50/95 via-amber-50/40 to-stone-100/90">
                <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(249,115,22,0.14),transparent_55%)]"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(251,191,36,0.08),transparent_50%)]"
                    aria-hidden
                />
                <div className="relative z-10 w-full max-w-[420px]">
                    {/* Mobile brand */}
                    <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
                        <img src={LOGO_FULL_SRC} alt={PRODUCT_NAME} className="h-10 w-auto max-w-[120px] object-contain" />
                        <div>
                            <p className="text-lg font-bold text-slate-800 tracking-tight">{PRODUCT_NAME}</p>
                            <p className="text-xs text-slate-500">{LOGIN_MOBILE_TAGLINE}</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.04)]">
                        
                        <div className="px-7 pb-8 pt-7 sm:px-9 sm:pb-9 sm:pt-8">
                            <div className="mb-7 text-center lg:text-left">
                                {showRegisteredBanner ? (
                                    <p
                                        className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-left text-sm text-emerald-900"
                                        role="status"
                                    >
                                        Account created. You can sign in with your email when your admin enables access.
                                    </p>
                                ) : null}
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/90">
                                    Sign in
                                </p>
                                <h2 className="mt-1.5 text-[1.375rem] font-semibold tracking-tight text-slate-900">
                                    Welcome to {PRODUCT_NAME}
                                </h2>
                                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                                    Enter your work email and password to open your workspace.
                                </p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="login-email"
                                        className="block text-[13px] font-medium text-slate-700"
                                    >
                                        Work email
                                    </label>
                                    <div className="relative group">
                                        <LuMail
                                            className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary"
                                            size={18}
                                            aria-hidden
                                        />
                                        <input
                                            id="login-email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            placeholder="name@company.com"
                                            className="h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50/50 pl-11 pr-3.5 text-[15px] text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/12"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-end justify-between gap-3">
                                        <label
                                            htmlFor="login-password"
                                            className="text-[13px] font-medium text-slate-700"
                                        >
                                            Password
                                        </label>
                                        <button
                                            type="button"
                                            className="shrink-0 pb-0.5 text-xs font-medium text-primary underline-offset-4 hover:text-orange-600 hover:underline"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <LuLock
                                            className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary"
                                            size={18}
                                            aria-hidden
                                        />
                                        <input
                                            id="login-password"
                                            type="password"
                                            required
                                            autoComplete="current-password"
                                            placeholder="Your password"
                                            className="h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50/50 pl-11 pr-3.5 text-[15px] text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/12"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-[14px] border border-slate-100 bg-slate-50/60 px-3.5 py-3">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        className="h-4 w-4 shrink-0 rounded-[5px] border-slate-300 text-primary focus:ring-2 focus:ring-primary/30"
                                    />
                                    <label
                                        htmlFor="remember"
                                        className="cursor-pointer text-[13px] leading-snug text-slate-600 select-none"
                                    >
                                        Stay signed in on this browser
                                    </label>
                                </div>

                                <div className="pt-1">
                                    <Button
                                        type="submit"
                                        className="h-12 w-full rounded-[14px] text-[15px] font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.06)] group"
                                        isLoading={isLoading}
                                    >
                                        Continue to dashboard
                                        <LuArrowRight
                                            className="ml-2 h-[18px] w-[18px] group-hover:translate-x-0.5 transition-transform"
                                            aria-hidden
                                        />
                                    </Button>
                                </div>
                            </form>

                            <div className="mt-8 flex items-center gap-3">
                                <div className="h-px flex-1 bg-linear-to-r from-transparent via-slate-200 to-transparent" aria-hidden />
                                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                    New here
                                </span>
                                <div className="h-px flex-1 bg-linear-to-r from-transparent via-slate-200 to-transparent" aria-hidden />
                            </div>

                            <p className="mt-4 text-center text-sm text-slate-600">
                                Need an account?{' '}
                                <Link
                                    href="/register"
                                    className="font-semibold text-primary underline-offset-4 hover:text-orange-600 hover:underline"
                                >
                                    Create one
                                </Link>
                            </p>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-[11px] text-slate-400 lg:hidden">
                        {FOOTER_POWERED_BY}
                    </p>
                </div>
            </main>
        </div>
    );
}
