'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LuBanknote,
    LuCircleAlert,
    LuClock,
    LuTrendingUp,
} from 'react-icons/lu';
import {
    getBookingPaymentSummary,
    getBookings,
    getPaymentLedgerRows,
    type BookingRecord,
    type PaymentInstallmentLine,
    type PaymentLedgerRow,
    type PaymentMode,
    type PaymentRecordStatus,
} from '@/lib/bookingPaymentMockStore';
import type { Project } from '@/lib/projectsInventoryStore';
import { cn } from '@/lib/utils';

import {
    BpStatusBadge,
    EmptyState,
    FilterSelect,
    formatINR,
    formatProjectDate,
    OpenInModuleLink,
    paymentStatusTone,
    ProjectTabPagination,
    ProjectTabSection,
    ProjectTabToolbar,
    SimpleTable,
    SummaryCard,
    SummaryCardGrid,
    type SimpleTableColumn,
} from './ProjectRelationalUI';

const PAGE_SIZE = 10;

const STATUS_FILTERS = ['All', 'Completed', 'Pending', 'Failed'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

type ProjectPaymentRow = {
    paymentSlug: string;
    bookingSlug: string;
    bookingCode: string;
    customerName: string;
    receiptNumber: string;
    amount: number;
    date: string;
    mode: PaymentMode;
    status: PaymentRecordStatus;
    milestoneName: string;
};

function bookingsForProject(projectName: string): BookingRecord[] {
    const target = projectName.trim().toLowerCase();
    if (!target) return [];
    return getBookings().filter((b) => (b.projectName || '').trim().toLowerCase() === target);
}

function isOverdue(line: PaymentInstallmentLine): boolean {
    return line.status === 'Overdue';
}

function deriveProjectPayments(projectName: string): {
    rows: ProjectPaymentRow[];
    overdueAmount: number;
} {
    const bookings = bookingsForProject(projectName);
    const customerByBooking = new Map(bookings.map((b) => [b.slug, (b.customerName || '').trim() || 'Customer']));
    const codeByBooking = new Map(bookings.map((b) => [b.slug, b.leadId.trim() || b.slug]));

    let overdueAmount = 0;
    const rows: ProjectPaymentRow[] = [];

    for (const b of bookings) {
        const ledger = getPaymentLedgerRows(b.slug);
        for (const p of ledger as PaymentLedgerRow[]) {
            rows.push({
                paymentSlug: p.slug,
                bookingSlug: p.bookingSlug,
                bookingCode: codeByBooking.get(p.bookingSlug) ?? '—',
                customerName: customerByBooking.get(p.bookingSlug) ?? 'Customer',
                receiptNumber: p.receiptNumber,
                amount: p.amount,
                date: p.date,
                mode: p.mode,
                status: p.status,
                milestoneName: p.milestoneName || '—',
            });

            for (const line of p.installmentLinesDisplay ?? []) {
                if (isOverdue(line)) overdueAmount += line.pendingAmount;
            }
        }
    }

    rows.sort((a, b) => (a.date < b.date ? 1 : -1));
    return { rows, overdueAmount };
}

type Props = {
    project: Project;
    storeVersion: number;
};

export function ProjectPaymentsTab({ project, storeVersion }: Props) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    const [page, setPage] = useState(1);

    const { rows, overdueAmount } = useMemo(
        () => deriveProjectPayments(project.project_name),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [project.project_name, project.slug, storeVersion],
    );

    // Project-level financial summary (across bookings, not ledger lines).
    const financial = useMemo(() => {
        const bookings = bookingsForProject(project.project_name);
        let totalRevenue = 0;
        let collected = 0;
        let pending = 0;
        for (const b of bookings) {
            const sum = getBookingPaymentSummary(b.slug);
            totalRevenue += sum?.unitPrice ?? b.unitPrice ?? 0;
            collected += sum?.paidCompleted ?? 0;
            pending += sum?.outstanding ?? 0;
        }
        return { totalRevenue, collected, pending, overdueAmount };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project.project_name, project.slug, storeVersion, overdueAmount]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (statusFilter !== 'All' && r.status !== statusFilter) return false;
            if (!q) return true;
            return (
                r.customerName.toLowerCase().includes(q) ||
                r.receiptNumber.toLowerCase().includes(q) ||
                r.bookingCode.toLowerCase().includes(q) ||
                r.mode.toLowerCase().includes(q)
            );
        });
    }, [rows, search, statusFilter]);

    const totalItems = filtered.length;
    const paginated = useMemo(
        () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filtered, page],
    );

    const columns: SimpleTableColumn<ProjectPaymentRow>[] = useMemo(
        () => [
            {
                key: 'customer',
                header: 'Customer',
                render: (r) => (
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{r.customerName}</p>
                        <p className="truncate text-xs text-gray-500">{r.bookingCode}</p>
                    </div>
                ),
            },
            {
                key: 'receipt',
                header: 'Receipt #',
                hideBelow: 'md',
                render: (r) => <span className="font-mono text-xs text-gray-700">{r.receiptNumber || '—'}</span>,
            },
            {
                key: 'milestone',
                header: 'Purpose',
                hideBelow: 'lg',
                render: (r) => <span className="truncate text-sm text-gray-700">{r.milestoneName}</span>,
            },
            {
                key: 'amount',
                header: 'Amount',
                align: 'right',
                render: (r) => <span className="font-semibold text-gray-900">{formatINR(r.amount)}</span>,
            },
            {
                key: 'date',
                header: 'Date',
                hideBelow: 'sm',
                render: (r) => <span className="text-sm text-gray-700">{formatProjectDate(r.date)}</span>,
            },
            {
                key: 'mode',
                header: 'Mode',
                hideBelow: 'md',
                render: (r) => (
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {r.mode}
                    </span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                render: (r) => <BpStatusBadge tone={paymentStatusTone(r.status)}>{r.status}</BpStatusBadge>,
            },
            {
                key: 'actions',
                header: '',
                align: 'right',
                render: (r) => (
                    <OpenInModuleLink
                        href={`/company-admin/booking-payment/payments/view/${encodeURIComponent(r.paymentSlug)}`}
                        label="Open"
                    />
                ),
            },
        ],
        [],
    );

    return (
        <div className="space-y-4">
            <SummaryCardGrid>
                <SummaryCard
                    tone="blue"
                    label="Total revenue"
                    value={formatINR(financial.totalRevenue)}
                    sublabel="Sum of booking values"
                    icon={<LuBanknote size={18} aria-hidden />}
                />
                <SummaryCard
                    tone="emerald"
                    label="Collected"
                    value={formatINR(financial.collected)}
                    sublabel={`${financial.totalRevenue > 0 ? Math.round((financial.collected / financial.totalRevenue) * 100) : 0}% of total revenue`}
                    icon={<LuTrendingUp size={18} aria-hidden />}
                />
                <SummaryCard
                    tone="amber"
                    label="Pending"
                    value={formatINR(financial.pending)}
                    sublabel="Outstanding balance"
                    icon={<LuClock size={18} aria-hidden />}
                />
                <SummaryCard
                    tone="rose"
                    label="Overdue"
                    value={formatINR(financial.overdueAmount)}
                    sublabel={cn(financial.overdueAmount > 0 ? 'Past-due installments' : 'No overdue installments')}
                    icon={<LuCircleAlert size={18} aria-hidden />}
                />
            </SummaryCardGrid>

            <ProjectTabSection
                title="Payments ledger"
                description="All collections across bookings in this project."
                actions={
                    <OpenInModuleLink
                        href={`/company-admin/booking-payment/payments?project=${encodeURIComponent(project.project_name)}`}
                        label="Open Payments module"
                    />
                }
            >
                <div className="space-y-4">
                    <ProjectTabToolbar
                        searchValue={search}
                        onSearchChange={(v) => {
                            setSearch(v);
                            setPage(1);
                        }}
                        searchPlaceholder="Search customer, receipt, mode…"
                        leftAdornment={
                            <FilterSelect
                                label="Status"
                                value={statusFilter}
                                onChange={(v) => {
                                    setStatusFilter(v);
                                    setPage(1);
                                }}
                                options={STATUS_FILTERS.map((s) => ({ value: s, label: s }))}
                            />
                        }
                    />

                    {rows.length === 0 ? (
                        <EmptyState
                            title="No payments recorded yet."
                            description="Payments collected for this project's bookings will appear here as they are entered."
                        />
                    ) : totalItems === 0 ? (
                        <EmptyState
                            title="No payments match your filters."
                            description="Adjust the search or status filter to see more results."
                        />
                    ) : (
                        <>
                            <SimpleTable<ProjectPaymentRow>
                                columns={columns}
                                rows={paginated}
                                getRowKey={(r) => r.paymentSlug}
                                onRowClick={(r) =>
                                    router.push(
                                        `/company-admin/booking-payment/payments/view/${encodeURIComponent(r.paymentSlug)}`,
                                    )
                                }
                            />
                            <ProjectTabPagination
                                currentPage={page}
                                totalItems={totalItems}
                                onPageChange={setPage}
                                pageSize={PAGE_SIZE}
                                label="payments"
                            />
                        </>
                    )}
                </div>
            </ProjectTabSection>
        </div>
    );
}
