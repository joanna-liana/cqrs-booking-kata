import { addDays, subDays } from 'date-fns';

import {
  Booking,
  Room
} from '../src/BookingQueryHandler';
import {
  findFreeRoom,
} from '../src/freeRoomFinder';
import {
  ROOM_ONE_NAME,
} from '../src/rooms';

describe('Free room finder', () => {
  const ANY_CLIENT_ID = 'client1';

  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  const BOOKED_ROOM = ROOM_ONE_NAME;

  function bookedBetween(period: {
    arrival: Date;
    departure: Date;
  }): Booking {
    return {
      roomName: BOOKED_ROOM,
      arrivalDate: period.arrival,
      departureDate: period.departure,
      clientId: ANY_CLIENT_ID
    };
  }

  const roomUnavailableTestCases = [
    bookedBetween({
      arrival: ARRIVAL_DATE, departure: DEPARTURE_DATE
    }),
    bookedBetween({
      arrival: subDays(ARRIVAL_DATE, 1), departure: DEPARTURE_DATE
    }),
    bookedBetween({
      arrival: addDays(ARRIVAL_DATE, 1), departure: DEPARTURE_DATE
    }),
    bookedBetween({
      arrival: addDays(ARRIVAL_DATE, 1), departure: subDays(DEPARTURE_DATE, 1)
    }),
  ];

  it.each(roomUnavailableTestCases)(
    // eslint-disable-next-line max-len
    'the room is not available if its existing bookings overlap with the requested period',
    async (bookedRoom) => {
      const sut = sutWith([bookedRoom]);

      // when
      const freeRooms: Room[] = await sut.freeRooms(
        ARRIVAL_DATE,
        DEPARTURE_DATE
      );

      const freeRoomNames = freeRooms.map(r => r.name);

      // then
      expect(
        freeRoomNames.includes(BOOKED_ROOM)
      ).toBeFalsy();
    }
  );

  const roomAvailableTestCases = [
    bookedBetween({
      arrival: subDays(ARRIVAL_DATE, 2),
      departure: subDays(ARRIVAL_DATE, 1)
    }),
    bookedBetween({
      arrival: addDays(DEPARTURE_DATE, 1),
      departure: addDays(DEPARTURE_DATE, 2)
    }),
    bookedBetween({
      arrival: subDays(ARRIVAL_DATE, 2),
      departure: ARRIVAL_DATE
    }),
    bookedBetween({
      arrival: DEPARTURE_DATE,
      departure: addDays(DEPARTURE_DATE, 1)
    }),
  ];

  it.each(roomAvailableTestCases)(
    // eslint-disable-next-line max-len
    'the room is available if its existing reservations fall outside of the requested period',
    async (bookedRoom) => {
      const sut = sutWith([bookedRoom]);

      // when
      const freeRooms: Room[] = await sut.freeRooms(
        ARRIVAL_DATE,
        DEPARTURE_DATE
      );

      const freeRoomNames = freeRooms.map(r => r.name);

      // then
      expect(
        freeRoomNames.includes(BOOKED_ROOM)
      ).toBeTruthy();
    }
  );

});

function sutWith(bookedRooms: Booking[]): {
  freeRooms: (arrival: Date, departure: Date) => Promise<Room[]>;
} {
  return {
    freeRooms: (arrival, departure) => findFreeRoom(
      bookedRooms,
      {
        arrival,
        departure
      }
    )
  };
}
