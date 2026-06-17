'use client';

import React, { useState } from 'react';
import { ResidentHouseholdSection } from '@/components/residents/ResidentHouseholdSection';
import { useResidentHousehold } from '@/hooks/useResidentHousehold';
import { DEMO_RESIDENT_SLUG } from '@/lib/residentDemoProfile';
import { useResidentSession } from '@/modules/resident-portal/store/residentSessionStore';
import { Button } from '@/components/ui/Button';
import { LuUsers } from 'react-icons/lu';
import { SectionCard } from './SectionCard';

export function ResidentUnitHouseholdPanel() {
    const { currentResident } = useResidentSession();
    const adminSlug = currentResident?.adminResidentSlug ?? DEMO_RESIDENT_SLUG;
    const { householdMembers, onHouseholdChange, isLinked } = useResidentHousehold(adminSlug);
    const [managing, setManaging] = useState(false);

    return (
        <SectionCard
            title="Household members"
            subtitle={managing ? 'Editing — changes save automatically' : 'People living in your unit'}
            icon={<LuUsers className="h-5 w-5" aria-hidden />}
            accent="slate"
            action={
                isLinked ? (
                    <Button
                        type="button"
                        variant={managing ? 'companyOutline' : 'company'}
                        size="sm"
                        onClick={() => setManaging((v) => !v)}
                    >
                        {managing ? 'Done' : 'Manage household'}
                    </Button>
                ) : null
            }
        >
            {!isLinked ? (
                <p className="text-sm text-[rgba(0,0,0,0.65)]">
                    Your portal account is not linked to a resident record yet. Contact the admin team to update household details.
                </p>
            ) : (
                <ResidentHouseholdSection
                    householdMembers={householdMembers}
                    onHouseholdChange={onHouseholdChange}
                    canMutate={managing}
                />
            )}
        </SectionCard>
    );
}
