'use client';

import { cn } from '@/lib/utils';

function Shimmer({ className }: { className?: string }) {
    return <div className={cn('animate-pulse rounded-lg bg-slate-200/80', className)} />;
}

export function VendorPerformanceSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <Shimmer className="h-4 w-48" />
                <Shimmer className="h-9 w-72 max-w-full" />
                <Shimmer className="h-4 w-full max-w-xl" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                        <div className="flex justify-between gap-3">
                            <div className="flex-1 space-y-3">
                                <Shimmer className="h-3 w-24" />
                                <Shimmer className="h-8 w-16" />
                                <Shimmer className="h-3 w-32" />
                            </div>
                            <Shimmer className="h-12 w-12 shrink-0 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <Shimmer className="h-5 w-56" />
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Shimmer className="h-11 w-full" />
                    <Shimmer className="h-11 w-full" />
                    <Shimmer className="h-24 w-full md:col-span-2" />
                    <Shimmer className="h-11 w-32 md:col-span-2" />
                </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                        <Shimmer className="h-5 w-40" />
                        <div className="mt-4 space-y-3">
                            {[1, 2, 3, 4].map((j) => (
                                <Shimmer key={j} className="h-16 w-full rounded-xl" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
