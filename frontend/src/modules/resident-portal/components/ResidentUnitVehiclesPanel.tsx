'use client';

import React, { useState } from 'react';
import { ResidentVehiclesSection } from '@/components/residents/ResidentVehiclesSection';
import { useResidentVehicles } from '@/hooks/useResidentVehicles';
import { DEMO_RESIDENT_SLUG } from '@/lib/residentDemoProfile';
import { useResidentSession } from '@/modules/resident-portal/store/residentSessionStore';
import { Button } from '@/components/ui/Button';
import { LuCarFront } from 'react-icons/lu';
import { SectionCard } from './SectionCard';

export function ResidentUnitVehiclesPanel() {
    const { currentResident } = useResidentSession();
    const adminSlug = currentResident?.adminResidentSlug ?? DEMO_RESIDENT_SLUG;
    const { vehicles, onVehiclesChange, isLinked } = useResidentVehicles(adminSlug);
    const [managing, setManaging] = useState(false);

    return (
        <SectionCard
            title="My vehicles"
            subtitle={managing ? 'Editing — changes save automatically' : 'Registered vehicles for your unit'}
            icon={<LuCarFront className="h-5 w-5" aria-hidden />}
            accent="blue"
            action={
                isLinked ? (
                    <Button
                        type="button"
                        variant={managing ? 'companyOutline' : 'company'}
                        size="sm"
                        onClick={() => setManaging((v) => !v)}
                    >
                        {managing ? 'Done' : 'Manage vehicles'}
                    </Button>
                ) : null
            }
        >
            {!isLinked ? (
                <p className="text-sm text-[rgba(0,0,0,0.65)]">
                    Your portal account is not linked to a resident record yet. Contact the admin team to register vehicles.
                </p>
            ) : (
                <ResidentVehiclesSection vehicles={vehicles} onVehiclesChange={onVehiclesChange} canMutate={managing} />
            )}
        </SectionCard>
    );
}
