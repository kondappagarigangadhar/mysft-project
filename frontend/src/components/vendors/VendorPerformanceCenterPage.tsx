'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { PerformanceKpiCard } from '@/components/vendors/performance/PerformanceKpiCard';
import { StarRatingInput } from '@/components/vendors/performance/StarRatingInput';
import { VendorPerformanceSkeleton } from '@/components/vendors/performance/VendorPerformanceSkeleton';
import { RatingPill } from '@/components/vendors/VendorShared';
import { MOCK_VENDORS } from '@/lib/vendors/mockData';
import type { Vendor } from '@/lib/vendors/types';
import {
    getAverageVendorRating,
    getCompletedTaskCount,
    getSlaBreachPortfolioCount,
    isRiskVendor,
    ratingTier,
    vendorRatingTrend,
} from '@/lib/vendors/vendorPerformanceMetrics';
import { cn } from '@/lib/utils';
import {
    LuArrowDown,
    LuArrowUp,
    LuChevronRight,
    LuClipboardCheck,
    LuFilter,
    LuSearch,
    LuShieldAlert,
    LuStar,
    LuTriangleAlert,
    LuX,
} from 'react-icons/lu';

function TierBadge({ tier }: { tier: ReturnType<typeof ratingTier> }) {
    const map = {
        high: { label: 'Top', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200/70' },
        mid: { label: 'Fair', className: 'bg-amber-50 text-amber-900 ring-amber-200/70' },
        low: { label: 'At risk', className: 'bg-rose-50 text-rose-800 ring-rose-200/70' },
    };
    const t = map[tier];
    return <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1', t.className)}>{t.label}</span>;
}

function TrendMark({ vendor }: { vendor: Vendor }) {
    const t = vendorRatingTrend(vendor);
    if (t === 'up') return <LuArrowUp className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-label="Trending up" />;
    if (t === 'down') return <LuArrowDown className="h-3.5 w-3.5 shrink-0 text-rose-600" aria-label="Trending down" />;
    return <span className="text-[10px] font-semibold text-slate-400" aria-hidden>→</span>;
}

function ListPanel({
    title,
    subtitle,
    icon,
    accent,
    children,
}: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    accent: 'emerald' | 'rose';
    children: ReactNode;
}) {
    const border = accent === 'rose' ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-emerald-500';
    return (
        <section className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm', border)}>
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200/80">{icon}</span>
                <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
                </div>
            </div>
            {children}
        </section>
    );
}

const selectClass =
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]';

export function VendorPerformanceCenterPage() {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [minDelays, setMinDelays] = useState(0);
    const [ratingVendorId, setRatingVendorId] = useState(MOCK_VENDORS[0]?.id ?? '');
    const [taskStars, setTaskStars] = useState(0);
    const [taskFeedback, setTaskFeedback] = useState('');
    const [ratingAttempted, setRatingAttempted] = useState(false);
    const [ratingSuccess, setRatingSuccess] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const t = window.setTimeout(() => setLoading(false), 720);
        return () => window.clearTimeout(t);
    }, []);

    useEffect(() => {
        const id = window.setTimeout(() => {
            setSearch((prev) => (prev === searchDraft.trim() ? prev : searchDraft.trim()));
        }, 320);
        return () => window.clearTimeout(id);
    }, [searchDraft]);

    const filteredVendors = useMemo(() => {
        const q = search.trim().toLowerCase();
        return MOCK_VENDORS.filter((v) => {
            if (q && !`${v.name} ${v.id}`.toLowerCase().includes(q)) return false;
            if (minRating > 0 && v.rating < minRating - 1e-6) return false;
            if (minDelays > 0 && v.delays < minDelays) return false;
            return true;
        });
    }, [search, minRating, minDelays]);

    const kpiVendors = filteredVendors.length > 0 ? filteredVendors : MOCK_VENDORS;
    const tasksCompleted = getCompletedTaskCount();
    const slaBreaches = getSlaBreachPortfolioCount();
    const avgRating = getAverageVendorRating(kpiVendors);

    const topRated = useMemo(() => [...filteredVendors].sort((a, b) => b.rating - a.rating).slice(0, 5), [filteredVendors]);

    const riskVendors = useMemo(
        () => [...filteredVendors].filter(isRiskVendor).sort((a, b) => b.delays - a.delays || b.slaBreaches - a.slaBreaches),
        [filteredVendors],
    );

    const hasActiveFilters = search.trim() !== '' || minRating > 0 || minDelays > 0;

    const resetFilters = () => {
        setMinRating(0);
        setMinDelays(0);
        setSearchDraft('');
        setSearch('');
        setDrawerOpen(false);
    };

    const submitTaskRating = () => {
        setRatingAttempted(true);
        setRatingSuccess(false);
        if (taskStars < 1 || !ratingVendorId) return;
        setRatingSuccess(true);
        setTaskStars(0);
        setTaskFeedback('');
        setRatingAttempted(false);
        window.setTimeout(() => setRatingSuccess(false), 4200);
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl space-y-6">
                <Breadcrumb items={[{ label: 'Vendor Management', href: '/company-admin/vendors/list' }, { label: 'Performance Center' }]} />
                <VendorPerformanceSkeleton />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 pb-10">
            <header className="space-y-1">
                <Breadcrumb items={[{ label: 'Vendor Management', href: '/company-admin/vendors/list' }, { label: 'Performance Center' }]} />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Vendor Performance Center</h1>
                <p className="max-w-2xl text-sm text-slate-600">Search in the bar below; use Filters for rating and delay thresholds (same pattern as Leads).</p>
            </header>

            {/* Toolbar — Leads list pattern */}
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 sm:order-1">
                    <div className="relative min-w-[200px] flex-1 max-w-xl">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search vendor name or ID…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') setSearch(searchDraft.trim());
                            }}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--cta-button-bg)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                            aria-label="Search vendors"
                        />
                    </div>
                </div>
                <div className="order-1 flex flex-wrap items-center justify-end gap-2 sm:order-2">
                    <Button
                        type="button"
                        variant={drawerOpen ? 'company' : 'companyOutline'}
                        size="cta"
                        className="gap-2"
                        onClick={() => setDrawerOpen(true)}
                    >
                        <LuFilter size={18} />
                        Filters
                        {hasActiveFilters ? (
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">On</span>
                        ) : null}
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-3 sm:p-5">
                    <PerformanceKpiCard
                        title="Tasks completed"
                        value={tasksCompleted}
                        subtitle="Completed work orders in portfolio."
                        variant="success"
                        trend={{ direction: 'up', label: 'Demo trend' }}
                        icon={<LuClipboardCheck className="h-5 w-5" />}
                    />
                    <PerformanceKpiCard
                        title="SLA breach exposure"
                        value={slaBreaches}
                        subtitle="Vendor SLA rollups + delayed open tasks."
                        variant="danger"
                        trend={{ direction: 'flat', label: slaBreaches > 8 ? 'Elevated risk' : 'Within band' }}
                        icon={<LuShieldAlert className="h-5 w-5" />}
                    />
                    <PerformanceKpiCard
                        title="Avg. vendor rating"
                        value={avgRating > 0 ? avgRating.toFixed(2) : '—'}
                        subtitle={filteredVendors.length !== MOCK_VENDORS.length ? `${filteredVendors.length} in filter` : 'All vendors'}
                        variant="neutral"
                        trend={{
                            direction: avgRating >= 4 ? 'up' : avgRating >= 3.5 ? 'flat' : 'down',
                            label: 'Quality signal',
                        }}
                        icon={<LuStar className="h-5 w-5" />}
                    />
                </div>

                <div className="p-4 sm:p-5">
                    <h2 className="text-sm font-bold text-slate-900">Task completion rating</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Stars required · feedback optional</p>
                    <div className="mt-4 grid gap-5 lg:grid-cols-12 lg:gap-6">
                        <div className="space-y-4 lg:col-span-4">
                            <div>
                                <label htmlFor="perf-vendor-select" className="mb-1 block text-xs font-semibold text-slate-600">
                                    Vendor <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    id="perf-vendor-select"
                                    value={ratingVendorId}
                                    onChange={(e) => setRatingVendorId(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                                >
                                    {MOCK_VENDORS.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name} ({v.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <StarRatingInput
                                value={taskStars}
                                onChange={setTaskStars}
                                error={ratingAttempted && taskStars < 1 ? 'Select 1–5 stars.' : undefined}
                                label="Completion rating"
                            />
                        </div>
                        <div className="lg:col-span-5">
                            <label htmlFor="perf-feedback" className="mb-1 block text-xs font-semibold text-slate-600">
                                Feedback <span className="font-normal text-slate-400">(optional)</span>
                            </label>
                            <textarea
                                id="perf-feedback"
                                value={taskFeedback}
                                onChange={(e) => setTaskFeedback(e.target.value)}
                                rows={4}
                                placeholder="Timeliness, quality, communication…"
                                className="min-h-[120px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                            />
                        </div>
                        <div className="flex flex-col justify-end gap-2 lg:col-span-3">
                            {ratingSuccess ? (
                                <p className="text-sm font-medium text-emerald-700" role="status">
                                    Saved (demo).
                                </p>
                            ) : null}
                            <Button type="button" variant="company" size="cta" className="w-full lg:w-auto lg:self-end" onClick={submitTaskRating}>
                                Submit rating
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <ListPanel
                    title="Top rated vendors"
                    subtitle="Highest composite rating in the current filter."
                    accent="emerald"
                    icon={<LuStar className="h-4 w-4 text-emerald-600" />}
                >
                    <ul className="divide-y divide-slate-100">
                        {topRated.length === 0 ? (
                            <li className="px-4 py-10 text-center text-sm text-slate-500 sm:px-5">No vendors match filters.</li>
                        ) : (
                            topRated.map((vendor) => {
                                const tier = ratingTier(vendor.rating);
                                return (
                                    <li key={vendor.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="truncate font-semibold text-slate-900">{vendor.name}</span>
                                                <TierBadge tier={tier} />
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {vendor.id} · {vendor.city}
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <RatingPill rating={vendor.rating} />
                                                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                                    <TrendMark vendor={vendor} />
                                                    Trend
                                                </span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/company-admin/vendors/${encodeURIComponent(vendor.id)}`}
                                            className="inline-flex h-9 shrink-0 items-center justify-center gap-1 self-start rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[var(--cta-button-bg)] hover:border-[color-mix(in_srgb,var(--cta-button-bg)_38%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] sm:self-center"
                                        >
                                            Details
                                            <LuChevronRight className="h-4 w-4 opacity-70" aria-hidden />
                                        </Link>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </ListPanel>

                <ListPanel
                    title="Risk vendors"
                    subtitle="Low rating, delays, or SLA pressure."
                    accent="rose"
                    icon={<LuTriangleAlert className="h-4 w-4 text-rose-600" />}
                >
                    <ul className="divide-y divide-slate-100">
                        {riskVendors.length === 0 ? (
                            <li className="px-4 py-10 text-center text-sm text-slate-500 sm:px-5">No risk vendors in this filter.</li>
                        ) : (
                            riskVendors.map((vendor) => (
                                <li key={vendor.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-slate-900">{vendor.name}</p>
                                        <p className="text-xs text-slate-500">{vendor.id}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">Delays {vendor.delays}</span>
                                            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-800 ring-1 ring-rose-200/80">
                                                SLA {vendor.slaBreaches}
                                            </span>
                                            <RatingPill rating={vendor.rating} />
                                        </div>
                                    </div>
                                    <Link
                                        href={`/company-admin/vendors/${encodeURIComponent(vendor.id)}`}
                                        className="inline-flex h-9 shrink-0 items-center justify-center gap-1 self-start rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-900 hover:bg-rose-100 sm:self-center"
                                    >
                                        Details
                                        <LuChevronRight className="h-4 w-4 opacity-70" aria-hidden />
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                </ListPanel>
            </div>

            {drawerOpen ? (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
                        aria-label="Close filters"
                        onClick={() => setDrawerOpen(false)}
                    />
                    <aside
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                        role="dialog"
                        aria-label="Advanced filters"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Advanced filters</h2>
                            <button
                                type="button"
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                onClick={() => setDrawerOpen(false)}
                            >
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <p className="text-xs text-slate-500">
                                <span className="font-semibold tabular-nums text-slate-800">{filteredVendors.length}</span> vendor
                                {filteredVendors.length === 1 ? '' : 's'} match the current search and filters.
                            </p>
                            <div>
                                <label htmlFor="perf-drawer-min-rating" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Min. rating
                                </label>
                                <select
                                    id="perf-drawer-min-rating"
                                    value={String(minRating)}
                                    onChange={(e) => setMinRating(Number(e.target.value))}
                                    className={`mt-1.5 ${selectClass}`}
                                >
                                    <option value={0}>All ratings</option>
                                    <option value={1}>1.0+</option>
                                    <option value={2}>2.0+</option>
                                    <option value={3}>3.0+</option>
                                    <option value={4}>4.0+</option>
                                    <option value={4.5}>4.5+ (top tier)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="perf-drawer-min-delays" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Min. delays
                                </label>
                                <select
                                    id="perf-drawer-min-delays"
                                    value={minDelays}
                                    onChange={(e) => setMinDelays(Number(e.target.value))}
                                    className={`mt-1.5 ${selectClass}`}
                                >
                                    <option value={0}>Any</option>
                                    <option value={1}>1+</option>
                                    <option value={3}>3+</option>
                                    <option value={5}>5+</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
                            <Button type="button" variant="companyOutline" size="cta" className="flex-1" onClick={resetFilters}>
                                Reset
                            </Button>
                            <Button type="button" variant="company" size="cta" className="flex-1" onClick={() => setDrawerOpen(false)}>
                                Apply
                            </Button>
                        </div>
                    </aside>
                </>
            ) : null}
        </div>
    );
}
