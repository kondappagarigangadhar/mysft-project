'use client';

import React from 'react';
import { IntelligenceKpiCard } from './IntelligenceKpiCard';
import { INTELLIGENCE_KPI_DEFINITIONS, type IntelligenceKpiSummary } from './intelligenceKpiConfig';
import { cn } from '@/lib/utils';

export function IntelligenceKpiGrid({
    kpis,
    className,
    columnsClassName = 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3',
}: {
    kpis: IntelligenceKpiSummary;
    className?: string;
    columnsClassName?: string;
}) {
    return (
        <div className={cn(columnsClassName, className)}>
            {INTELLIGENCE_KPI_DEFINITIONS.map((def) => (
                <IntelligenceKpiCard
                    key={def.key}
                    title={def.title}
                    value={kpis[def.key]}
                    suffix={def.suffix}
                    sublabel={def.sublabel}
                    icon={def.icon}
                    accent={def.accent}
                />
            ))}
        </div>
    );
}
