import {
  Booking,
  BookingQueryHandler,
  BookingReadRegistry,
  Room
} from '../src/BookingQueryHandler';
import {
  findFreeRoom,
} from '../src/freeRoomFinder';
import {
  ROOM_ONE_NAME,
  ROOM_THREE_NAME,
  ROOM_TWO_NAME,
} from '../src/rooms';

describe('List free rooms use case', () => {
  const ANY_CLIENT_ID = 'client1';

  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  function bookedRoom(roomName: string): Booking {
    return ({
      roomName,
      arrivalDate: ARRIVAL_DATE,
      departureDate: DEPARTURE_DATE,
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

function sutWith(bookedRooms: Booking[]): BookingQueryHandler {
  const readRegistry: BookingReadRegistry = {
    getAll() {
      return Promise.resolve(bookedRooms);
    },
  };

  const sut = new BookingQueryHandler(readRegistry, findFreeRoom);

  return sut;
}
