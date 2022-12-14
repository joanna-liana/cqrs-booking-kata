/* eslint-disable max-len */
import { findFreeRoom, Room } from '../../../src/bookings/shared/domain/freeRoomFinder';
import { ROOM_ONE_NAME, ROOM_THREE_NAME, ROOM_TWO_NAME } from '../../../src/bookings/shared/domain/rooms';
import { BookingQueryHandler } from '../../../src/bookings/useCases/listBookings/application/BookingQueryHandler';
import { BookingReadModel } from '../../../src/bookings/useCases/listBookings/domain/BookingReadModel';
import { BookingReadRegistry } from '../../../src/bookings/useCases/listBookings/domain/BookingReadRegistry';
import { InMemoryReadRegistry } from '../../../src/bookings/useCases/listBookings/infrastructure/InMemoryReadRegistry';
/* eslint-enable max-len */

describe('List free rooms use case', () => {
  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  function bookedRoom(roomName: string): BookingReadModel {
    return ({
      roomName,
      arrivalDate: ARRIVAL_DATE,
      departureDate: DEPARTURE_DATE,
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

  it('given no bookings, it lists all the rooms', async () => {
    // given
    const bookedRooms: BookingReadModel[] = [];

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

function sutWith(bookedRooms: BookingReadModel[]): BookingQueryHandler {
  const readRegistry: BookingReadRegistry = new InMemoryReadRegistry(
    bookedRooms
  );

  return new BookingQueryHandler(readRegistry, findFreeRoom);
}
