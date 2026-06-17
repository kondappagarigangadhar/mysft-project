export type UnitStatus = 'available' | 'sold' | 'reserved' | 'blocked';
export type DrawMode = 'select' | 'pan';
export type MappingMode = 'upload' | 'draw' | 'template' | 'aiDraw';
export type TemplateKey = 'Ground Floor' | 'Floor 1' | 'Floor 2';

export type RectShape = { type: 'rect'; x: number; y: number; width: number; height: number };
export type PolygonShape = { type: 'polygon'; points: { x: number; y: number }[] };
export type UnitShape = RectShape | PolygonShape;

export type UnitMap = {
    id: string;
    plotNumber: string;
    plotShape: 'rectangle' | 'polygon';
    coordinates: string;
    floor: string;
    projectName: string;
    layoutName: string;
    width: number;
    length: number;
    facing: string;
    roadSize?: number;
    area: number;
    price: number;
    status: UnitStatus;
    colorCode: string;
    assignedSales: string;
    lockStatus: 'locked' | 'unlocked';
    lockExpiry?: string;
    lockedBy?: string;
    statusChangeReason?: string;
    statusChangedAt?: string;
    statusChangedBy?: string;
    notes: string;
    shape: UnitShape;
};

export type UnitFormValues = Omit<UnitMap, 'id' | 'shape'>;

export const STATUS_COLORS: Record<UnitStatus, string> = {
    available: '#16a34a',
    sold: '#dc2626',
    reserved: '#eab308',
    blocked: '#6b7280',
};

export const TEMPLATE_KEYS: TemplateKey[] = ['Ground Floor', 'Floor 1', 'Floor 2'];
export const FLOORS = ['Basement', 'Ground', '1', '2', '3', '4', '5'];

export const DEFAULT_FORM_VALUES: UnitFormValues = {
    plotNumber: '',
    plotShape: 'rectangle',
    coordinates: '',
    floor: '',
    projectName: '',
    layoutName: '',
    width: 0,
    length: 0,
    facing: '',
    roadSize: undefined,
    area: 0,
    price: 0,
    status: 'available',
    colorCode: STATUS_COLORS.available,
    assignedSales: '',
    lockStatus: 'unlocked',
    lockExpiry: '',
    lockedBy: '',
    statusChangeReason: '',
    statusChangedAt: '',
    statusChangedBy: '',
    notes: '',
};
