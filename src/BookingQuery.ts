import { areIntervalsOverlapping } from 'date-fns';

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

export const ROOM_ONE_NAME = 'Room 1';
export const ROOM_TWO_NAME = 'Room 2';
export const ROOM_THREE_NAME = 'Room 3';

const ALL_ROOM_NAMES = [ROOM_ONE_NAME, ROOM_TWO_NAME, ROOM_THREE_NAME];

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
            inclusive: true
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