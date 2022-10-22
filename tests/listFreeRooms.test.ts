import { addDays, subDays } from 'date-fns';

import {
  Booking,
  BookingQuery,
  BookingReadRegistry,
  Room,
  ROOM_ONE_NAME,
  ROOM_THREE_NAME,
  ROOM_TWO_NAME,
} from './BookingQuery';

describe('List free rooms use case', () => {
  const ANY_CLIENT_ID = 'client1';

  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  // it('list only free rooms in the given period', async () => {
  //   // given
  //   const bookedRooms = [
  //     {
  //       roomName: ROOM_ONE_NAME,
  //       arrivalDate: new Date(2020, 1, 1),
  //       departureDate: ARRIVAL_DATE,
  //       clientId: ANY_CLIENT_ID
  //     },
  //     {
  //       roomName: ROOM_TWO_NAME,
  //       arrivalDate: ARRIVAL_DATE,
  //       departureDate: DEPARTURE_DATE,
  //       clientId: ANY_CLIENT_ID
  //     }
  //   ];

  //   const sut = sutWith(bookedRooms);

  //   // when
  //   const freeRooms: Room[] = await sut.freeRooms(
  //     ARRIVAL_DATE,
  //     DEPARTURE_DATE
  //   );

  //   // then
  //   expect(freeRooms).toEqual([{
  //     name: ROOM_THREE_NAME
  //   }]);
  // });

  // it('given no bookings, it lists all the rooms', async () => {
  //   // given
  //   const bookedRooms: Booking[] = [];

  //   const sut = sutWith(bookedRooms);

  //   // when
  //   const freeRooms: Room[] = await sut.freeRooms(
  //     ARRIVAL_DATE,
  //     DEPARTURE_DATE
  //   );

  //   // then
  //   expect(freeRooms).toEqual([
  //     {
  //       name: ROOM_ONE_NAME,
  //     },
  //     {
  //       name: ROOM_TWO_NAME
  //     },
  //     {
  //       name: ROOM_THREE_NAME
  //     }
  //   ]);
  // });

  // it('given all rooms booked, it lists all no rooms', async () => {
  //   // given
  //   const bookedRooms = [
  //     {
  //       roomName: ROOM_ONE_NAME,
  //       arrivalDate: new Date(2020, 1, 1),
  //       departureDate: ARRIVAL_DATE,
  //       clientId: ANY_CLIENT_ID
  //     },
  //     {
  //       roomName: ROOM_TWO_NAME,
  //       arrivalDate: new Date(2020, 1, 10),
  //       departureDate: new Date(2020, 1, 12),
  //       clientId: ANY_CLIENT_ID
  //     },
  //     {
  //       roomName: ROOM_THREE_NAME,
  //       arrivalDate: new Date(2020, 1, 11),
  //       departureDate: new Date(2020, 1, 12),
  //       clientId: ANY_CLIENT_ID
  //     }
  //   ];

  //   const sut = sutWith(bookedRooms);

  //   // when
  //   const freeRooms: Room[] = await sut.freeRooms(
  //     ARRIVAL_DATE,
  //     DEPARTURE_DATE
  //   );

  //   // then
  //   expect(freeRooms).toEqual([]);
  // });

  describe('Booked room filter rules', () => {
    const BOOKED_ROOM = ROOM_ONE_NAME;

    const FREE_ROOMS = [
      {
        name: ROOM_TWO_NAME
      },
      {
        name: ROOM_THREE_NAME
      }
    ];

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

    const testCases = [
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

    it.each(testCases)('exclude overlapping dates', async (bookedRoom) => {
      const sut = sutWith([bookedRoom]);

      // when
      const freeRooms: Room[] = await sut.freeRooms(
        ARRIVAL_DATE,
        DEPARTURE_DATE
      );

      // then
      expect(freeRooms).toEqual(FREE_ROOMS);
    });
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
