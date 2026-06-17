export type DrawShapeType =
    | 'plot'
    | 'square'
    | 'road-h'
    | 'road-v'
    | 'cross-road'
    | 'room'
    | 'hall'
    | 'kitchen'
    | 'parking'
    | 'garden';

export type DrawShape = {
    id: string;
    type: DrawShapeType;
    x: number;
    y: number;
    width: number;
    height: number;
    /** User-defined label (e.g. room name). Falls back to type label when empty. */
    customLabel?: string;
};

export const SHAPES: { type: DrawShapeType; label: string }[] = [
    { type: 'plot', label: 'Rectangle Plot' },
    { type: 'square', label: 'Square Plot' },
    { type: 'road-h', label: 'Road Horizontal' },
    { type: 'road-v', label: 'Road Vertical' },
    { type: 'cross-road', label: 'Cross Road' },
    { type: 'room', label: 'Room' },
    { type: 'hall', label: 'Hall' },
    { type: 'kitchen', label: 'Kitchen' },
    { type: 'parking', label: 'Parking' },
    { type: 'garden', label: 'Garden' },
];

export const SHAPE_SIZES: Record<DrawShapeType, { width: number; height: number }> = {
    plot: { width: 100, height: 70 },
    square: { width: 80, height: 80 },
    'road-h': { width: 200, height: 40 },
    'road-v': { width: 40, height: 200 },
    'cross-road': { width: 120, height: 120 },
    room: { width: 60, height: 60 },
    hall: { width: 100, height: 80 },
    kitchen: { width: 70, height: 60 },
    parking: { width: 90, height: 60 },
    garden: { width: 100, height: 100 },
};

/** Tailwind background classes per type */
export const SHAPE_COLOR_CLASSES: Record<DrawShapeType, string> = {
    plot: 'bg-green-200',
    square: 'bg-green-300',
    'road-h': 'bg-gray-400',
    'road-v': 'bg-gray-400',
    'cross-road': 'bg-gray-500',
    room: 'bg-blue-200',
    hall: 'bg-blue-300',
    kitchen: 'bg-yellow-200',
    parking: 'bg-orange-200',
    garden: 'bg-green-400',
};

export const GRID_SIZE = 20;
export const MIN_SHAPE_SIZE = 24;

export function snapCoord(n: number): number {
    return Math.round(n / GRID_SIZE) * GRID_SIZE;
}

export function shapeLabel(type: DrawShapeType): string {
    return SHAPES.find((s) => s.type === type)?.label ?? type;
}

export function shapeDisplayName(shape: DrawShape): string {
    const t = shape.customLabel?.trim();
    if (t) return t;
    return shapeLabel(shape.type);
}
