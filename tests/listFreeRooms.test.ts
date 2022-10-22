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

  it('list only free rooms in the given period', async () => {
    // given
    const bookedRooms = [
      {
        roomName: ROOM_ONE_NAME,
        arrivalDate: new Date(2020, 1, 1),
        departureDate: new Date(2020, 1, 5),
        clientId: ANY_CLIENT_ID
      },
      {
        roomName: ROOM_TWO_NAME,
        arrivalDate: new Date(2020, 1, 10),
        departureDate: new Date(2020, 1, 12),
        clientId: ANY_CLIENT_ID
      }
    ];

    const sut = sutWith(bookedRooms);

    // when
    const freeRooms: Room[] = await sut.freeRooms(
      new Date(2020, 1, 5),
      new Date(2020, 1, 9)
    );

    // then
    expect(freeRooms).toEqual([{
      name: ROOM_THREE_NAME
    }]);
  });

  it('given no bookings, it lists all the rooms', async () => {
    // given
    const bookedRooms = [];

    const sut = sutWith(bookedRooms);

    // when
    const freeRooms: Room[] = await sut.freeRooms(
      new Date(2020, 1, 5),
      new Date(2020, 1, 9)
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
