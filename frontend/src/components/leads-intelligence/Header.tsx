'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LuCalendarRange, LuChevronDown, LuFilter, LuRotateCcw, LuSearch } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import type { LeadSource, LeadStatus } from '@/lib/leadsIntelligenceStore';

interface HeaderProps {
    searchTerm: string;
    statusFilter: 'All' | LeadStatus;
    sourceFilter: 'All' | LeadSource;
    startDate: string;
    endDate: string;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: 'All' | LeadStatus) => void;
    onSourceChange: (value: 'All' | LeadSource) => void;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
}

const selectClass =
    'h-[44px] w-full px-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary';

const dateInputClass =
    'h-[44px] w-full px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary';

export function LeadsIntelligenceHeader(props: HeaderProps) {
    const {
        searchTerm,
        statusFilter,
        sourceFilter,
        startDate,
        endDate,
        onSearchChange,
        onStatusChange,
        onSourceChange,
        onStartDateChange,
        onEndDateChange,
    } = props;

    const [filtersOpen, setFiltersOpen] = useState(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!filtersOpen) return;
        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            const el = filterDropdownRef.current;
            if (el && !el.contains(e.target as Node)) {
                setFiltersOpen(false);
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setFiltersOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown, { passive: true });
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [filtersOpen]);

    const hasActiveFilters =
        searchTerm.trim() !== '' ||
        statusFilter !== 'All' ||
        sourceFilter !== 'All' ||
        startDate !== '' ||
        endDate !== '';

    const resetFilters = () => {
        onSearchChange('');
        onStatusChange('All');
        onSourceChange('All');
        onStartDateChange('');
        onEndDateChange('');
    };

    return (
        <div className="sticky top-14 z-20 ">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div className="min-w-0 flex-1 text-left">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Leads Intelligence</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        AI-driven lead scoring, conversion prediction, and smart follow-up orchestration.
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 w-full xl:w-auto">
                    <div className="relative" ref={filterDropdownRef}>
                        <Button
                            type="button"
                            variant={filtersOpen ? 'company' : 'companyOutline'}
                            size="cta"
                            className={filtersOpen ? 'shadow-md' : ''}
                            aria-expanded={filtersOpen}
                            aria-haspopup="dialog"
                            aria-controls="leads-intelligence-filters-panel"
                            onClick={() => setFiltersOpen((o) => !o)}
                        >
                            <LuFilter className="mr-2 shrink-0" size={18} />
                            Filters
                            {!filtersOpen && hasActiveFilters ? (
                                <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                                    Active
                                </span>
                            ) : null}
                            <LuChevronDown
                                className={`ml-2 shrink-0 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
                                size={18}
                                aria-hidden
                            />
                        </Button>

                        {filtersOpen ? (
                            <div
                                id="leads-intelligence-filters-panel"
                                role="dialog"
                                aria-label="Filter leads intelligence"
                                className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(calc(100vw-2rem),36rem)] max-h-[min(70vh,640px)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-black/5 sm:p-5"
                            >
                                <div className="space-y-4">
                                    <div className="relative">
                                        <LuSearch
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                            size={18}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search by name, email, phone, assigned..."
                                            value={searchTerm}
                                            onChange={(e) => onSearchChange(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm h-[44px]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="intel-filter-status"
                                                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                                            >
                                                Status
                                            </label>
                                            <select
                                                id="intel-filter-status"
                                                value={statusFilter}
                                                onChange={(e) => onStatusChange(e.target.value as 'All' | LeadStatus)}
                                                className={selectClass}
                                            >
                                                <option value="All">All statuses</option>
                                                <option value="New">New</option>
                                                <option value="Contacted">Contacted</option>
                                                <option value="Qualified">Qualified</option>
                                                <option value="Converted">Converted</option>
                                                <option value="Lost">Lost</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="intel-filter-source"
                                                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                                            >
                                                Source
                                            </label>
                                            <select
                                                id="intel-filter-source"
                                                value={sourceFilter}
                                                onChange={(e) => onSourceChange(e.target.value as 'All' | LeadSource)}
                                                className={selectClass}
                                            >
                                                <option value="All">All sources</option>
                                                <option value="Website">Website</option>
                                                <option value="Referral">Referral</option>
                                                <option value="Campaign">Campaign</option>
                                                <option value="Ads">Ads</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5 sm:col-span-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block">
                                                Created date range
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="relative">
                                                    <LuCalendarRange
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                                        size={16}
                                                    />
                                                    <input
                                                        id="intel-filter-start"
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => onStartDateChange(e.target.value)}
                                                        className={`${dateInputClass} pl-9`}
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="intel-filter-end" className="sr-only">
                                                        End date
                                                    </label>
                                                    <input
                                                        id="intel-filter-end"
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => onEndDateChange(e.target.value)}
                                                        className={dateInputClass}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-end sm:col-span-2">
                                            <Button
                                                type="button"
                                                variant="companyOutline"
                                                size="cta"
                                                className="h-[44px] min-h-[44px] w-full sm:w-auto sm:min-w-[160px]"
                                                onClick={resetFilters}
                                            >
                                                <LuRotateCcw className="mr-2 shrink-0" size={16} />
                                                Reset filters
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                </div>
            </div>
        </div>
    );
}
