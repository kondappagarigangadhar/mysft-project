import type { MatrixRole } from './types';
import { MATRIX_LAYOUT } from './constants';

export type RoleColumnLayout = {
    featureColPx: number;
    roleColMinPx: number;
    addRoleColPx: number;
    rolesPerPage: number;
};

export const DEFAULT_ROLE_COLUMN_LAYOUT: RoleColumnLayout = {
    featureColPx: MATRIX_LAYOUT.featureColPx,
    roleColMinPx: MATRIX_LAYOUT.roleColPx,
    addRoleColPx: MATRIX_LAYOUT.addRoleColPx,
    rolesPerPage: MATRIX_LAYOUT.rolesPerPage,
};

/** Fallback width before ResizeObserver reports (wide desktop). */
export const MATRIX_CONTAINER_WIDTH_FALLBACK_PX = 1280;

/** Fixed role slots per page (right side of the matrix). */
export function rolesPerPage(layout: RoleColumnLayout = DEFAULT_ROLE_COLUMN_LAYOUT): number {
    return Math.max(1, layout.rolesPerPage);
}

/**
 * Chunk roles into pages of exactly `rolesPerPage` columns (default 4).
 * The add-role column is shown only on the final page when `showAddRoleColumn` is true.
 */
export function buildRoleColumnPages(
    roles: MatrixRole[],
    _containerWidth: number,
    _showAddRoleColumn: boolean,
    layout: RoleColumnLayout = DEFAULT_ROLE_COLUMN_LAYOUT,
): MatrixRole[][] {
    if (roles.length === 0) return [[]];

    const pageSize = rolesPerPage(layout);
    const pages: MatrixRole[][] = [];
    for (let i = 0; i < roles.length; i += pageSize) {
        pages.push(roles.slice(i, i + pageSize));
    }
    return pages.length > 0 ? pages : [[]];
}

/** Role columns always expand to fill the viewport beside the sticky feature column. */
export function shouldFillRoleColumnsOnPage(roleCount: number): boolean {
    return roleCount > 0;
}

/** Role column width — distributes remaining viewport width across visible roles. */
export function computeDynamicRoleColPx(
    containerWidth: number,
    roleCount: number,
    showAddRoleOnPage: boolean,
    layout: RoleColumnLayout = DEFAULT_ROLE_COLUMN_LAYOUT,
): number {
    if (roleCount <= 0) return layout.roleColMinPx;

    const width = containerWidth > 0 ? containerWidth : MATRIX_CONTAINER_WIDTH_FALLBACK_PX;
    const addReserve = showAddRoleOnPage ? layout.addRoleColPx : 0;
    const available = width - layout.featureColPx - addReserve;
    const distributed = Math.floor(available / roleCount);
    return Math.max(layout.roleColMinPx, distributed);
}

/** Table uses full container width; role columns flex via `computeDynamicRoleColPx`. */
export function computeMatrixTableWidthPx(): undefined {
    return undefined;
}
