import { addDays, subDays } from 'date-fns';

import {
  ExistingBooking,
  findFreeRoom,
  Room
} from '../../src/freeRoomFinder';
import {
  ROOM_ONE_NAME,
} from '../../src/rooms';

describe('Free room finder', () => {
  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  const BOOKED_ROOM = ROOM_ONE_NAME;

  function bookedBetween(period: {
    arrival: Date;
    departure: Date;
  }): ExistingBooking {
    return {
      roomName: BOOKED_ROOM,
      arrivalDate: period.arrival,
      departureDate: period.departure,
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

  describe('the room is available', () => {
    let sut: Sut;

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
      'given its existing reservations fall outside of the requested period',
      async (bookedRoom) => {
        sut = sutWith([bookedRoom]);

        await expectFreeRoom();
      }
    );

    it('given it has no bookings', async () => {
      sut = sutWith([]);

      await expectFreeRoom();
    });

    async function expectFreeRoom(): Promise<void> {
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
  });
});

interface Sut {
  freeRooms: (arrival: Date, departure: Date) => Promise<Room[]>;
}

function sutWith(bookedRooms: ExistingBooking[]): Sut {
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
