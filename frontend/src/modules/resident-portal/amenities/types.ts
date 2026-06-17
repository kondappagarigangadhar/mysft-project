export type AmenityType = 'Gym' | 'Clubhouse' | 'Guest Room' | 'Swimming Pool';

export type AmenityBookingStatus = 'Booked' | 'Pending' | 'Cancelled';

export type AmenityBooking = {
    id: string;
    amenity: AmenityType;
    /** ISO date `YYYY-MM-DD` */
    bookingDate: string;
    slot: string;
    status: AmenityBookingStatus;
    maxOccupancy: number;
    bookedAt?: string;
};
