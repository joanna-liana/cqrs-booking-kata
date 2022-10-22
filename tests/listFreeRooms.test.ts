import { areIntervalsOverlapping } from 'date-fns';

interface Room {
  name: string;
}

interface Booking {
  clientId: string;
  roomName: string;
  arrivalDate: Date;
  departureDate: Date;
}

interface BookingReadRegistry {
  getAll(): Promise<Booking[]>;
}

const ROOM_ONE_NAME = 'Room 1';
const ROOM_TWO_NAME = 'Room 2';
const ROOM_THREE_NAME = 'Room 3';

const ALL_ROOM_NAMES = [ROOM_ONE_NAME, ROOM_TWO_NAME, ROOM_THREE_NAME];

class BookingQuery {
  constructor(private readonly registry: BookingReadRegistry) {
  }

  async freeRooms(_arrival: Date, _departure: Date): Promise<Room[]> {
    const bookings = await this.registry.getAll();

    const unavailableRoomNames = bookings
      .map(booking => {
        if (areIntervalsOverlapping(
          {
            start: booking.arrivalDate,
            end: booking.departureDate
          },
          {
            start: _arrival,
            end: _departure
          }
        )) {
          return null;
        }

        return booking;
      })
      .filter(Boolean)
      .map(booking => booking?.roomName);

    const freeRooms: Room[] = ALL_ROOM_NAMES
      .filter(name => !unavailableRoomNames.includes(name))
      .map(name => ({
        name
      }));

    return Promise.resolve(freeRooms);
  }
}

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

    const readRegistry: BookingReadRegistry = {
      getAll() {
        return Promise.resolve(bookedRooms);
      },
    };

    const sut = new BookingQuery(readRegistry);

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

    const readRegistry: BookingReadRegistry = {
      getAll() {
        return Promise.resolve(bookedRooms);
      },
    };

    const sut = new BookingQuery(readRegistry);

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
