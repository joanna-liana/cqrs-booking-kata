import { areIntervalsOverlapping } from 'date-fns';

import { ALL_ROOM_NAMES } from './rooms';

export interface Room {
  name: string;
}

export interface Booking {
  clientId: string;
  roomName: string;
  arrivalDate: Date;
  departureDate: Date;
}

export interface BookingReadRegistry {
  getAll(): Promise<Booking[]>;
}

export class BookingQuery {
  constructor(private readonly registry: BookingReadRegistry) {
  }

  async freeRooms(arrival: Date, departure: Date): Promise<Room[]> {
    const bookings = await this.registry.getAll();

    const bookedRoomNames = bookings
      .map(booking => {
        const isRoomUnavailable = areIntervalsOverlapping(
          {
            start: booking.arrivalDate,
            end: booking.departureDate
          },
          {
            start: arrival,
            end: departure
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
}
