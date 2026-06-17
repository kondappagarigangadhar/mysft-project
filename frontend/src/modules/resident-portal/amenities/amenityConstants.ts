import type { AmenityType } from './types';

export const AMENITY_OPTIONS: { key: AmenityType; max: number }[] = [
    { key: 'Gym', max: 10 },
    { key: 'Clubhouse', max: 40 },
    { key: 'Guest Room', max: 4 },
    { key: 'Swimming Pool', max: 20 },
];

export function maxOccupancyForAmenity(amenity: AmenityType): number {
    return AMENITY_OPTIONS.find((a) => a.key === amenity)?.max ?? 10;
}
