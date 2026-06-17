'use client';

import React, { useMemo } from 'react';
import { useResidentHousehold } from '@/hooks/useResidentHousehold';
import { useResidentVehicles } from '@/hooks/useResidentVehicles';
import { DEMO_RESIDENT_SLUG } from '@/lib/residentDemoProfile';
import { ResidentUnitHouseholdPanel } from '@/modules/resident-portal/components/ResidentUnitHouseholdPanel';
import { ResidentUnitVehiclesPanel } from '@/modules/resident-portal/components/ResidentUnitVehiclesPanel';
import { getMockUnitSummary } from '@/modules/resident-portal/services/mockResidentData';
import { useResidentSession } from '@/modules/resident-portal/store/residentSessionStore';
import { formatShortDate } from '@/modules/resident-portal/utils/date';
import {
    ResidentPageHeader,
    ResidentPageShell,
    ResidentStatCard,
} from '@/modules/resident-portal/components/ResidentPageShell';
import { SectionCard } from '@/modules/resident-portal/components/SectionCard';
import { LuCarFront, LuHouse, LuUsers } from 'react-icons/lu';

export default function ResidentUnitPage() {
    const { currentResident } = useResidentSession();
    const adminSlug = currentResident?.adminResidentSlug ?? DEMO_RESIDENT_SLUG;
    const { vehicleCount } = useResidentVehicles(adminSlug);
    const { memberCount } = useResidentHousehold(adminSlug);
    const unit = useMemo(
        () => getMockUnitSummary(currentResident ?? undefined),
        [currentResident, vehicleCount, memberCount],
    );

    return (
        <ResidentPageShell>
            <ResidentPageHeader
                icon={<LuHouse className="h-5 w-5" aria-hidden />}
                title="My Unit"
                subtitle="Unit details, household members, and registered vehicles."
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2.5">
                <ResidentStatCard
                    label="Unit number"
                    value={currentResident?.unitNumber ?? unit.unitNumber}
                    helper={unit.community}
                />
                <ResidentStatCard
                    label="Household members"
                    value={memberCount}
                    helper="People in this unit"
                    icon={<LuUsers className="h-5 w-5" aria-hidden />}
                />
                <ResidentStatCard
                    label="Vehicles"
                    value={vehicleCount}
                    helper="Registered vehicles"
                    icon={<LuCarFront className="h-5 w-5" aria-hidden />}
                />
            </div>

            <SectionCard title="Unit summary" subtitle="Quick reference">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-2.5">
                        <dt className="text-xs text-[rgba(0,0,0,0.6)]">Community</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[rgba(0,0,0,0.9)]">{unit.community}</dd>
                    </div>
                    <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-2.5">
                        <dt className="text-xs text-[rgba(0,0,0,0.6)]">Move-in date</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[rgba(0,0,0,0.9)]">{formatShortDate(unit.moveInDate)}</dd>
                    </div>
                    <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-2.5">
                        <dt className="text-xs text-[rgba(0,0,0,0.6)]">Resident type</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[rgba(0,0,0,0.9)]">
                            {currentResident?.residentType ?? 'Resident'}
                        </dd>
                    </div>
                    <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-2.5">
                        <dt className="text-xs text-[rgba(0,0,0,0.6)]">Registered name</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[rgba(0,0,0,0.9)]">
                            {currentResident?.fullName ?? '—'}
                        </dd>
                    </div>
                </dl>
            </SectionCard>

            <ResidentUnitHouseholdPanel />
            <ResidentUnitVehiclesPanel />
        </ResidentPageShell>
    );
}
