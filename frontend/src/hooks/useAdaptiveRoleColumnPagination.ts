'use client';

import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import type { MatrixRole } from '@/lib/accessMatrix/types';
import {
    buildRoleColumnPages,
    computeDynamicRoleColPx,
    computeMatrixTableWidthPx,
    DEFAULT_ROLE_COLUMN_LAYOUT,
    MATRIX_CONTAINER_WIDTH_FALLBACK_PX,
    shouldFillRoleColumnsOnPage,
    rolesPerPage,
} from '@/lib/accessMatrix/roleColumnPagination';

type Options = {
    showAddRoleColumn: boolean;
    rolePageIndex: number;
};

export function useAdaptiveRoleColumnPagination(
    containerRef: RefObject<HTMLDivElement | null>,
    orderedVisibleRoles: MatrixRole[],
    { showAddRoleColumn, rolePageIndex }: Options,
) {
    const [containerWidth, setContainerWidth] = useState(0);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = () => {
            const next = el.clientWidth;
            setContainerWidth((prev) => (prev === next ? prev : next));
        };

        update();
        const observer = new ResizeObserver(() => update());
        observer.observe(el);
        return () => observer.disconnect();
    }, [containerRef]);

    const measuredWidth = containerWidth > 0 ? containerWidth : MATRIX_CONTAINER_WIDTH_FALLBACK_PX;

    const rolePages = useMemo(
        () => buildRoleColumnPages(orderedVisibleRoles, measuredWidth, showAddRoleColumn, DEFAULT_ROLE_COLUMN_LAYOUT),
        [orderedVisibleRoles, measuredWidth, showAddRoleColumn],
    );

    const rolePageCount = Math.max(1, rolePages.length);
    const safeRolePageIndex = Math.min(Math.max(0, rolePageIndex), rolePageCount - 1);
    const paginatedVisibleRoles = rolePages[safeRolePageIndex] ?? [];
    const showAddRoleOnPage = showAddRoleColumn && safeRolePageIndex === rolePageCount - 1;

    const fillRoleColumns = useMemo(
        () => shouldFillRoleColumnsOnPage(paginatedVisibleRoles.length),
        [paginatedVisibleRoles.length],
    );

    const dynamicRoleColPx = useMemo(
        () =>
            computeDynamicRoleColPx(
                measuredWidth,
                paginatedVisibleRoles.length,
                showAddRoleOnPage,
                DEFAULT_ROLE_COLUMN_LAYOUT,
            ),
        [measuredWidth, paginatedVisibleRoles.length, showAddRoleOnPage],
    );

    const matrixTableWidthPx = useMemo(() => computeMatrixTableWidthPx(), []);

    return {
        containerWidth: measuredWidth,
        rolePageCount,
        safeRolePageIndex,
        paginatedVisibleRoles,
        showAddRoleOnPage,
        fillRoleColumns,
        dynamicRoleColPx,
        matrixTableWidthPx,
        rolesPerPage: rolesPerPage(DEFAULT_ROLE_COLUMN_LAYOUT),
    };
}
