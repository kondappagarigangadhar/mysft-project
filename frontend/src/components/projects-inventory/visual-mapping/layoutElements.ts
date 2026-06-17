import { clamp, uid } from './helpers';
import { STATUS_COLORS, UnitMap, UnitStatus } from './types';

export type LayoutElement = {
    id: string;
    type: 'plot' | 'road' | 'building' | 'room';
    shape: 'rectangle' | 'square' | 'l-shape';
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: { x: number; y: number }[];
    label?: string;
    status?: 'available' | 'sold' | 'reserved';
};

export type RoadOrientation = 'horizontal' | 'vertical';

function parseLayoutHint(prompt: string): { total: number; rows: number; cols: number } {
    const lower = prompt.toLowerCase();
    let total = 16;
    let rows = 4;
    let cols = 0;

    const plotsMatch = lower.match(/(\d+)\s*plots?/);
    if (plotsMatch) total = clamp(parseInt(plotsMatch[1], 10), 1, 200);

    const rowsMatch = lower.match(/(\d+)\s*rows?/);
    if (rowsMatch) rows = clamp(parseInt(rowsMatch[1], 10), 1, 50);

    const colsMatch = lower.match(/(\d+)\s*cols?(?:umns?)?/);
    if (colsMatch) cols = clamp(parseInt(colsMatch[1], 10), 1, 50);

    if (!cols) cols = Math.max(1, Math.ceil(total / rows));
    while (rows * cols < total) cols += 1;

    return { total, rows, cols };
}

function parsePromptFlags(prompt: string) {
    const lower = prompt.toLowerCase();
    const mentionsRoad = /\broads?\b/.test(lower);
    const hasVertical = /\bvertical\b/.test(lower);
    const hasHorizontal = /\bhorizontal\b/.test(lower);
    const hasBoth = /\bboth\b/.test(lower);
    /** Vertical spine when prompt mentions vertical (or both orientations). */
    const wantsVerticalRoad = mentionsRoad && (hasVertical || hasBoth);
    /** Horizontal lanes unless only-vertical; include when horizontal or both is said. */
    const wantsHorizontalRoad = mentionsRoad && (!hasVertical || hasHorizontal || hasBoth);

    return {
        wantsRoad: mentionsRoad,
        wantsVerticalRoad,
        wantsHorizontalRoad,
        wantsLShape: /l[\s-]*shape/.test(lower) || /l-shaped/.test(lower) || /\bl\s*plots?\b/.test(lower),
        wantsBuilding: /\bbuilding\b/.test(lower) || /\bblock\b/.test(lower) || /\btower\b/.test(lower),
        wantsRooms: /\brooms?\b/.test(lower) || /\bapartments?\b/.test(lower),
        ...parseLayoutHint(prompt),
    };
}

function lShapePoints(x: number, y: number, w: number, h: number): { x: number; y: number }[] {
    return [
        { x, y },
        { x: x + w, y },
        { x: x + w, y: y + h * 0.4 },
        { x: x + w * 0.38, y: y + h * 0.4 },
        { x: x + w * 0.38, y: y + h },
        { x, y: y + h },
    ];
}

function polygonBBox(points: { x: number; y: number }[]) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Prompt-driven mock layout: plots, optional roads, L-shaped plots, building shell, nested rooms.
 * No external APIs.
 */
export function generateLayout(prompt: string): LayoutElement[] {
    const hints = parsePromptFlags(prompt);
    const { total, rows, cols } = hints;

    const cellW = hints.wantsRooms ? 104 : 78;
    const cellH = hints.wantsRooms ? 88 : 58;
    const gapX = hints.wantsRoad ? 20 : 14;
    const baseGapY = 14;
    const roadH = 14;
    /** Extra row spacing when roads are requested (visual lane between rows). */
    const rowStride = cellH + baseGapY + (hints.wantsRoad && hints.wantsHorizontalRoad ? roadH + 6 : 0);

    const startX = 56;
    const startY = 56;

    const gridW = cols * cellW + (cols - 1) * gapX;
    const gridH = rows * cellH + (rows - 1) * baseGapY + (hints.wantsHorizontalRoad ? (rows - 1) * (roadH + 6) : 0);

    const elements: LayoutElement[] = [];

    if (hints.wantsBuilding) {
        elements.push({
            id: 'el-building-cluster',
            type: 'building',
            shape: 'rectangle',
            x: startX - 20,
            y: startY - 20,
            width: gridW + (hints.wantsVerticalRoad ? 28 : 40),
            height: gridH + 40,
            label: 'Building footprint',
        });
    }

    const statuses: Array<'available' | 'sold' | 'reserved'> = ['available', 'sold', 'reserved'];

    for (let i = 0; i < total; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = startX + col * (cellW + gapX);
        const y = startY + row * rowStride;

        if (hints.wantsHorizontalRoad && col === 0 && row > 0) {
            const roadY = y - (roadH + 6) + baseGapY;
            elements.push({
                id: `el-road-h-${row}`,
                type: 'road',
                shape: 'rectangle',
                x: startX - 4,
                y: roadY,
                width: gridW + 8,
                height: roadH,
                label: `Road (row ${row})`,
            });
        }

        const rowLetter = String.fromCharCode(65 + (row % 26));
        const plotId = `${rowLetter}-${String(col + 1).padStart(2, '0')}`;
        const status = statuses[i % statuses.length];

        const useL = hints.wantsLShape && i % 3 === 0;

        if (useL) {
            const pts = lShapePoints(x, y, cellW, cellH);
            elements.push({
                id: plotId,
                type: 'plot',
                shape: 'l-shape',
                x,
                y,
                points: pts,
                label: plotId,
                status,
            });
        } else {
            elements.push({
                id: plotId,
                type: 'plot',
                shape: hints.wantsRooms ? 'square' : 'rectangle',
                x,
                y,
                width: cellW,
                height: cellH,
                label: plotId,
                status,
            });

            if (hints.wantsRooms) {
                const pad = 8;
                const innerW = (cellW - pad * 3) / 2;
                const innerH = (cellH - pad * 3) / 2;
                let rn = 0;
                for (let rr = 0; rr < 2; rr++) {
                    for (let cc = 0; cc < 2; cc++) {
                        rn++;
                        elements.push({
                            id: `${plotId}-room-${rn}`,
                            type: 'room',
                            shape: 'square',
                            x: x + pad + cc * (innerW + pad),
                            y: y + pad + rr * (innerH + pad),
                            width: innerW,
                            height: innerH,
                            label: `Rm ${rn}`,
                        });
                    }
                }
            }
        }
    }

    if (hints.wantsVerticalRoad && cols >= 2) {
        const splitAfter = Math.max(0, Math.floor(cols / 2) - 1);
        const roadX = startX + (splitAfter + 1) * cellW + splitAfter * gapX + gapX / 2 - roadH / 2;
        elements.push({
            id: 'el-road-v-main',
            type: 'road',
            shape: 'rectangle',
            x: roadX,
            y: startY - 4,
            width: roadH,
            height: gridH + 8,
            label: 'Vertical road',
        });
    }

    return elements;
}

export function layoutElementsToUnitMaps(elements: LayoutElement[], projectName: string, layoutName: string): UnitMap[] {
    const facings = ['N', 'E', 'S', 'W'];
    const plots = elements.filter((e) => e.type === 'plot');
    return plots.map((el, i) => {
        const status = (el.status ?? 'available') as UnitStatus;
        const facing = facings[i % facings.length];

        if (el.shape === 'l-shape' && el.points && el.points.length >= 3) {
            const box = polygonBBox(el.points);
            return {
                id: uid('ai'),
                plotNumber: el.label || el.id,
                plotShape: 'polygon',
                coordinates: JSON.stringify(el.points),
                floor: 'Ground',
                projectName,
                layoutName,
                width: Math.max(1, box.width),
                length: Math.max(1, box.height),
                facing,
                area: Math.max(1, box.width * box.height),
                price: 1_000_000 + i * 50_000,
                status,
                colorCode: STATUS_COLORS[status],
                assignedSales: '',
                lockStatus: 'unlocked',
                notes: 'AI layout (plot)',
                shape: { type: 'polygon', points: el.points.map((p) => ({ x: p.x, y: p.y })) },
            };
        }

        const w = el.width ?? 80;
        const h = el.height ?? 60;
        return {
            id: uid('ai'),
            plotNumber: el.label || el.id,
            plotShape: 'rectangle',
            coordinates: `x:${Math.round(el.x)},y:${Math.round(el.y)},w:${Math.round(w)},h:${Math.round(h)}`,
            floor: 'Ground',
            projectName,
            layoutName,
            width: w,
            length: h,
            facing,
            area: w * h,
            price: 1_000_000 + i * 50_000,
            status,
            colorCode: STATUS_COLORS[status],
            assignedSales: '',
            lockStatus: 'unlocked',
            notes: 'AI layout (plot)',
            shape: { type: 'rect', x: el.x, y: el.y, width: w, height: h },
        };
    });
}

/**
 * Example output (illustrative) — same shape as `generateLayout` return values:
 * @example
 * [
 *   { id: "el-building-cluster", type: "building", shape: "rectangle", x: 36, y: 36, width: 420, height: 320, label: "Building footprint" },
 *   { id: "el-road-h-1", type: "road", shape: "rectangle", x: 52, y: 174, width: 400, height: 14, label: "Road (row 1)" },
 *   { id: "A-01", type: "plot", shape: "rectangle", x: 56, y: 56, width: 104, height: 88, label: "A-01", status: "available" },
 *   { id: "A-01-room-1", type: "room", shape: "square", x: 64, y: 64, width: 40, height: 36, label: "Rm 1" },
 *   { id: "B-01", type: "plot", shape: "l-shape", x: 56, y: 194, points: [...], label: "B-01", status: "sold" },
 * ]
 */
export const EXAMPLE_LAYOUT_OUTPUT: LayoutElement[] = generateLayout('8 plots in 2 rows, road, building, rooms, L shape');
