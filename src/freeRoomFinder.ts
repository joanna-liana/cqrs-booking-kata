import { areIntervalsOverlapping } from 'date-fns';

import { Room } from './BookingQueryHandler';
import { ALL_ROOM_NAMES } from './rooms';

interface ExistingBooking {
  roomName: string;
  arrivalDate: Date;
  departureDate: Date;
}

export type FindFreeRoom = (
  existingBookings: ExistingBooking[],
  requestedPeriod: {
    arrival: Date;
    departure: Date;
  }
) => Promise<Room[]>;

export function findFreeRoom(
  existingBookings: ExistingBooking[],
  requestedPeriod: {
    arrival: Date;
    departure: Date;
  }
): Promise<Room[]> {
  const bookedRoomNames = existingBookings
    .map(booking => {
      const isRoomUnavailable = areIntervalsOverlapping(
        {
          start: booking.arrivalDate,
          end: booking.departureDate
        },
        {
          start: requestedPeriod.arrival,
          end: requestedPeriod.departure
        },
        {
          inclusive: false
        }
      );

      return isRoomUnavailable ? booking : null;
    })
    .map(booking => booking?.roomName);

  const freeRooms: Room[] = ALL_ROOM_NAMES
    .filter(name => !bookedRoomNames.includes(name))
    .map(name => ({
      name
    }));

  return Promise.resolve(freeRooms);
}