import { TemplateKey, UnitMap, UnitShape } from './types';

export const canvasWidth = 1200;
export const canvasHeight = 800;

export function uid(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export function toPointsString(points: { x: number; y: number }[]) {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
}

export function getCentroid(shape: UnitShape) {
    if (shape.type === 'rect') {
        return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
    }
    const total = shape.points.length || 1;
    const sum = shape.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / total, y: sum.y / total };
}

export function buildTemplateUnits(template: TemplateKey): UnitMap[] {
    const floorLabel = template === 'Ground Floor' ? 'Ground' : template === 'Floor 1' ? '1' : '2';
    const floorCode = template === 'Ground Floor' ? 'G' : floorLabel;
    const facings = ['East', 'West', 'North', 'South'];
    const units: UnitMap[] = [];

    const columns = 5;
    const rows = 4;
    const width = 110;
    const height = 75;
    const xStart = 120;
    const yStart = 120;
    const xGap = 26;
    const yGap = 24;

    for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < columns; c += 1) {
            const idx = r * columns + c;
            const serial = String(idx + 1).padStart(2, '0');
            const roomNumber = `${floorCode}${serial}`;
            units.push({
                id: uid('unit'),
                plotNumber: `A-${roomNumber}`,
                plotShape: 'rectangle',
                coordinates: '',
                floor: floorLabel,
                projectName: '',
                layoutName: template,
                width,
                length: height,
                facing: facings[idx % facings.length],
                roadSize: undefined,
                area: 980 + idx * 10,
                price: 5000000 + idx * 120000,
                status: idx % 7 === 0 ? 'reserved' : idx % 9 === 0 ? 'sold' : 'available',
                colorCode: idx % 7 === 0 ? '#eab308' : idx % 9 === 0 ? '#dc2626' : '#16a34a',
                assignedSales: '',
                lockStatus: 'unlocked',
                lockExpiry: '',
                lockedBy: '',
                statusChangeReason: '',
                statusChangedAt: '',
                statusChangedBy: '',
                notes: `${template} default plot`,
                shape: {
                    type: 'rect',
                    x: xStart + c * (width + xGap),
                    y: yStart + r * (height + yGap),
                    width,
                    height,
                },
            });
        }
    }
    return units;
}
