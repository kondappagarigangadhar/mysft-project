'use client';

import {
    getBookingBySlug,
    getBookingPaymentSummary,
    getPaymentPlanForBooking,
    getPaymentsForBooking,
    type BookingRecord,
    type PaymentPlan,
} from '@/lib/bookingPaymentMockStore';
import {
    computeUnitPriceBreakdown,
    enrichProjectWithDefaults,
    enrichUnitWithDefaults,
    type UnitPriceBreakdown,
} from '@/lib/projectEnterpriseHelpers';
import {
    getProjects,
    getUnits,
    type InventoryUnit,
    type Project,
    type UnitType,
} from '@/lib/projectsInventoryStore';
import type { Customer } from '@/lib/customersStore';

export type CustomerPropertyContext = {
    booking: BookingRecord | null;
    project: Project | null;
    unit: InventoryUnit | null;
    unitType: UnitType | 'Commercial' | null;
    paymentPlan: PaymentPlan | null;
    priceBreakdown: UnitPriceBreakdown | null;
    tokenAmount: number;
    advancePaid: number;
    paymentPlanLabel: string;
    chain: { customer: string; booking: string; unit: string; project: string };
    resolved: boolean;
};

const EMPTY = '—';

function norm(s: string) {
    return s.trim().toLowerCase();
}

export function findProjectByName(projectName: string): Project | undefined {
    const key = norm(projectName);
    if (!key) return undefined;
    const hit = getProjects().find((p) => norm(p.project_name) === key);
    return hit ? enrichProjectWithDefaults(hit) : undefined;
}

export function findUnitForCustomer(project: Project, unitRef: string, bookingSlug?: string): InventoryUnit | undefined {
    const ref = unitRef.trim();
    if (!ref) return undefined;
    const units = getUnits().filter((u) => u.projectSlug === project.slug);
    let hit =
        units.find((u) => u.unit_number === ref) ??
        units.find((u) => norm(u.unit_number) === norm(ref)) ??
        units.find((u) => u.unit_id === ref);
    if (!hit && bookingSlug) {
        hit = units.find((u) => u.booking_id === bookingSlug || norm(u.booking_id ?? '') === norm(bookingSlug));
    }
    return hit ? enrichUnitWithDefaults(hit) : undefined;
}

function inferUnitType(project: Project | null, unit: InventoryUnit | null): UnitType | 'Commercial' | null {
    if (unit?.unit_type) return unit.unit_type;
    if (project?.project_type) {
        const pt = norm(project.property_type ?? '');
        if (pt.includes('commercial') || pt.includes('retail') || pt.includes('office')) return 'Commercial';
        return project.project_type;
    }
    return null;
}

function computeTokenAndAdvance(bookingSlug: string, unitPrice: number): { tokenAmount: number; advancePaid: number } {
    const payments = getPaymentsForBooking(bookingSlug);
    const completed = payments.filter((p) => p.status === 'Completed');
    const advancePaid = completed.reduce((s, p) => s + p.amount, 0);
    const plan = getPaymentPlanForBooking(bookingSlug);
    const tokenMilestoneId = plan?.milestones[0]?.id ?? 'm1';
    const tokenPay = completed.find((p) => p.milestoneId === tokenMilestoneId) ?? completed[0];
    const tokenAmount = tokenPay?.amount ?? Math.round(unitPrice * 0.1);
    return { tokenAmount, advancePaid };
}

export function resolveCustomerPropertyContext(customer: Customer): CustomerPropertyContext {
    const booking = customer.bookingSlug ? getBookingBySlug(customer.bookingSlug) ?? null : null;
    const projectName = customer.projectName || booking?.projectName || '';
    const unitRef = customer.unitNumber || booking?.unitId || '';
    const project = projectName ? findProjectByName(projectName) ?? null : null;
    const unit = project ? findUnitForCustomer(project, unitRef, customer.bookingSlug) ?? null : null;
    const unitType = inferUnitType(project, unit);
    const paymentPlan = customer.bookingSlug ? getPaymentPlanForBooking(customer.bookingSlug) : null;
    const summary = customer.bookingSlug ? getBookingPaymentSummary(customer.bookingSlug) : null;
    const priceBreakdown = unit ? computeUnitPriceBreakdown(unit) : null;
    const { tokenAmount, advancePaid } = customer.bookingSlug
        ? computeTokenAndAdvance(customer.bookingSlug, summary?.unitPrice ?? booking?.unitPrice ?? customer.totalAmount)
        : { tokenAmount: 0, advancePaid: customer.paidAmount };

    const paymentPlanLabel = paymentPlan?.planName
        ? paymentPlan.planName
        : booking?.dealPaymentMode === 'direct'
          ? 'Direct payment'
          : booking?.dealPaymentMode === 'milestone'
            ? 'Milestone schedule'
            : EMPTY;

    return {
        booking,
        project,
        unit,
        unitType,
        paymentPlan,
        priceBreakdown,
        tokenAmount,
        advancePaid: advancePaid || customer.paidAmount,
        paymentPlanLabel,
        chain: {
            customer: customer.fullName || customer.customerCode,
            booking: customer.bookingId || booking?.slug || EMPTY,
            unit: unit?.unit_number || unitRef || EMPTY,
            project: project?.project_name || projectName || EMPTY,
        },
        resolved: Boolean(project && (unit || booking)),
    };
}

export type CustomerPropertyAiSignals = {
    demandScore: number;
    paymentHealth: number;
    projectRisk: 'Low' | 'Medium' | 'High';
    completionPrediction: number;
    resalePotential: 'Strong' | 'Moderate' | 'Limited';
    appreciationTrend: string;
    buyerEngagement: number;
};

export function computeCustomerPropertyAiSignals(
    customer: Customer,
    ctx: CustomerPropertyContext,
): CustomerPropertyAiSignals {
    const paymentHealth =
        customer.totalAmount > 0
            ? Math.min(98, Math.round((customer.paidAmount / customer.totalAmount) * 100))
            : 50;
    const completionPrediction = ctx.project?.construction_status?.completion_pct ?? 42;
    const demandScore = ctx.unit?.booking_prediction_pct ?? ctx.unit?.demand_trend?.at(-1) ?? 62;
    const overdue = customer.paymentStatus === 'Overdue';
    const partial = customer.paymentStatus === 'Partial';
    const projectRisk: CustomerPropertyAiSignals['projectRisk'] =
        overdue || completionPrediction < 25
            ? 'High'
            : partial || completionPrediction < 50
              ? 'Medium'
              : 'Low';
    const resalePotential: CustomerPropertyAiSignals['resalePotential'] =
        demandScore >= 75 && paymentHealth >= 70 ? 'Strong' : demandScore >= 55 ? 'Moderate' : 'Limited';
    const appreciationTrend =
        demandScore >= 70 ? '+4.2% YoY (demo index)' : demandScore >= 50 ? '+2.1% YoY (demo index)' : 'Stable (demo index)';
    const buyerEngagement = Math.min(
        95,
        45 +
            (customer.projectUpdates.length > 0 ? 15 : 0) +
            (customer.paymentHistory.length > 0 ? 20 : 0) +
            (customer.documents.length > 0 ? 10 : 0) +
            (customer.bookingStatus === 'Confirmed' ? 10 : 0),
    );
    return {
        demandScore,
        paymentHealth,
        projectRisk,
        completionPrediction,
        resalePotential,
        appreciationTrend,
        buyerEngagement,
    };
}

export function displayValue(v: string | number | boolean | null | undefined): string {
    if (v === null || v === undefined) return EMPTY;
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : EMPTY;
    const s = String(v).trim();
    return s || EMPTY;
}
