import { addDays, subDays } from 'date-fns';

import {
  Booking,
  BookingQuery,
  BookingReadRegistry,
  Room,
  ROOM_ONE_NAME,
  ROOM_THREE_NAME,
  ROOM_TWO_NAME,
} from '../src/BookingQuery';

describe('List free rooms use case', () => {
  const ANY_CLIENT_ID = 'client1';

  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  describe('Key scenarios', () => {
    function bookedRoom(
      roomName: string,
      period?: { arrivalDate: Date; departureDate: Date; }
    ): Booking {
      return ({
        roomName,
        arrivalDate: period?.arrivalDate ?? ARRIVAL_DATE,
        departureDate: period?.departureDate ?? DEPARTURE_DATE,
        clientId: ANY_CLIENT_ID
      });
    }

    it('list only free rooms in the given period', async () => {
      // given
      const bookedRooms = [
        bookedRoom(ROOM_ONE_NAME),
        bookedRoom(ROOM_TWO_NAME),
      ];

      const sut = sutWith(bookedRooms);

      // when
      const freeRooms: Room[] = await sut.freeRooms(
        ARRIVAL_DATE,
        DEPARTURE_DATE
      );

      // then
      expect(freeRooms).toEqual([{
        name: ROOM_THREE_NAME
      }]);
    });

    it('list a room as free if it is booked on a different date', async () => {
      // given
      const ROOM_NAME_BOOKED_ON_DIFFERENT_DATES = ROOM_ONE_NAME;
      const bookedRooms = [
        bookedRoom(
          ROOM_NAME_BOOKED_ON_DIFFERENT_DATES,
          {
            arrivalDate: subDays(ARRIVAL_DATE, 2),
            departureDate: subDays(ARRIVAL_DATE, 1)
          }
        ),
        bookedRoom(
          ROOM_NAME_BOOKED_ON_DIFFERENT_DATES,
          {
            arrivalDate: addDays(DEPARTURE_DATE, 1),
            departureDate: addDays(DEPARTURE_DATE, 2)
          }
        ),
      ];

      const sut = sutWith(bookedRooms);

      // when
      const freeRooms: Room[] = await sut.freeRooms(
        ARRIVAL_DATE,
        DEPARTURE_DATE
      );

      // then
      const freeRoomNames = freeRooms.map(r => r.name);

      expect(
        freeRoomNames.includes(ROOM_NAME_BOOKED_ON_DIFFERENT_DATES)
      ).toBeTruthy();
    });

    it('given no bookings, it lists all the rooms', async () => {
      // given
      const bookedRooms: Booking[] = [];

      const sut = sutWith(bookedRooms);

      // when
      const freeRooms: Room[] = await sut.freeRooms(
        ARRIVAL_DATE,
        DEPARTURE_DATE
      );

      // then
      expect(freeRooms).toEqual([
        {
          name: ROOM_ONE_NAME,
        },
        {
          name: ROOM_TWO_NAME
        },
        {
          name: ROOM_THREE_NAME
        }
      ]);
    });

    it('given all rooms booked, it lists all no rooms', async () => {
      // given
      const bookedRooms = [
        bookedRoom(ROOM_ONE_NAME),
        bookedRoom(ROOM_TWO_NAME),
        bookedRoom(ROOM_THREE_NAME),
      ];

      const sut = sutWith(bookedRooms);

      // when
      const freeRooms: Room[] = await sut.freeRooms(
        ARRIVAL_DATE,
        DEPARTURE_DATE
      );

      // then
      expect(freeRooms).toEqual([]);
    });
  });

  describe('Booked room filter rules', () => {
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
        arrival: ARRIVAL_DATE, departure: subDays(DEPARTURE_DATE, 1)
      }),
      bookedBetween({
        arrival: addDays(ARRIVAL_DATE, 1), departure: DEPARTURE_DATE
      }),
      bookedBetween({
        arrival: ARRIVAL_DATE, departure: addDays(DEPARTURE_DATE, 1)
      }),
      bookedBetween({
        arrival: addDays(ARRIVAL_DATE, 1), departure: subDays(DEPARTURE_DATE, 1)
      }),
      bookedBetween({
        arrival: subDays(ARRIVAL_DATE, 1), departure: ARRIVAL_DATE
      }),
      bookedBetween({
        arrival: DEPARTURE_DATE, departure: addDays(DEPARTURE_DATE, 1)
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
      })
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

});

function sutWith(bookedRooms: Booking[]): BookingQuery {
  const readRegistry: BookingReadRegistry = {
    getAll() {
      return Promise.resolve(bookedRooms);
    },
  };

  const sut = new BookingQuery(readRegistry);

  return sut;
}
