'use client';

import React from 'react';
import { ResidentBrand } from '../components/ResidentBrand';
import { cn } from '@/lib/utils';

export function ResidentAuthLayout({
    children,
    highlightItems,
}: {
    children: React.ReactNode;
    highlightItems?: { title: string; text: string }[];
}) {
    const items =
        highlightItems ??
        [
            { title: 'Payments & receipts', text: 'Pay dues, enable auto-pay, and download receipts anytime.' },
            { title: 'Maintenance tickets', text: 'Raise complaints, track ETA, and see transparent updates.' },
            { title: 'Visitors & amenities', text: 'Invite guests, get QR passes, and book facilities in minutes.' },
        ];

    return (
        <div className="lg:min-h-screen flex flex-col lg:flex-row bg-slate-50">
            <aside className="relative hidden lg:flex lg:w-[46%] xl:w-[44%] min-h-[280px] lg:min-h-screen flex-col justify-between p-10 xl:p-12 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950" aria-hidden />
                <div
                    className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_25%_15%,rgba(249,115,22,0.55),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(59,130,246,0.35),transparent_45%)]"
                    aria-hidden
                />
                <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-size-[56px_56px]" aria-hidden />

                <div className="relative z-10 flex flex-col flex-1 min-h-0 text-white">
                    <ResidentBrand subtitle="Smart Community Experience" className="text-white" />
                    <h1 className="mt-10 text-3xl xl:text-[2.15rem] font-bold tracking-tight leading-[1.12] max-w-lg">
                        Your community, in your pocket.
                    </h1>
                    <p className="mt-4 text-slate-300 text-sm leading-relaxed max-w-md">
                        A lightweight, mobile-first resident portal for payments, maintenance, visitors, amenities, and community updates.
                    </p>

                    <div className="mt-10 space-y-3.5 max-w-md">
                        {items.map((i) => (
                            <div
                                key={i.title}
                                className={cn(
                                    'rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-[2px]',
                                )}
                            >
                                <p className="text-sm font-semibold text-white">{i.title}</p>
                                <p className="mt-0.5 text-xs leading-snug text-slate-300">{i.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 mt-10 pt-4 border-t border-white/10 text-xs text-slate-400">
                    mySFT Resident Portal • Secure • Fast • Mobile-first
                </div>
            </aside>

            <main className="relative flex flex-1 flex-col items-center lg:justify-center px-5 py-12 sm:px-8 overflow-hidden bg-linear-to-br from-orange-50/95 via-amber-50/35 to-slate-50">
                <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(249,115,22,0.14),transparent_55%)]"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(59,130,246,0.08),transparent_50%)]"
                    aria-hidden
                />

                <div className="relative z-10 w-full max-w-[460px]">
                    <div className="flex lg:hidden items-center justify-center mb-8">
                        <ResidentBrand />
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}

