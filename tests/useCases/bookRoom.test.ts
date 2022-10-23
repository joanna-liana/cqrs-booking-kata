import {
  Booking,
  BookingCommandHandler,
  BookingWriteRegistry
} from '../../src/BookingCommandHandler';
import {
  BookingQueryHandler,
  BookingReadRegistry,
} from '../../src/BookingQueryHandler';
import { findFreeRoom } from '../../src/freeRoomFinder';
import {
  ROOM_ONE_NAME,
} from '../../src/rooms';

describe('Book a room use case', () => {
  const ANY_CLIENT_ID = 'client1';
  const ROOM_TO_BOOK_NAME = ROOM_ONE_NAME;

  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  it('books a free room in the given period', async () => {
    // given
    const bookedRooms = [];

    const sut = commandHandlerWith(bookedRooms);

    const booking = {
      clientId: ANY_CLIENT_ID,
      roomName: ROOM_TO_BOOK_NAME,
      arrivalDate: ARRIVAL_DATE,
      departureDate: DEPARTURE_DATE,
    };

    // when
    await sut.bookARoom(booking);

    // then
    await expect(() => sut.bookARoom(booking)).rejects.toBeTruthy();
  });

  it('ensures the booked room will not be listed as available', async () => {
    // given
    const bookedRooms = [];

    const commandHandler = commandHandlerWith(bookedRooms);
    const queryHandler = queryHandlerWith(bookedRooms);

    const booking = {
      clientId: ANY_CLIENT_ID,
      roomName: ROOM_TO_BOOK_NAME,
      arrivalDate: ARRIVAL_DATE,
      departureDate: DEPARTURE_DATE,
    };

    // when
    await commandHandler.bookARoom(booking);

    // then
    const freeRooms = await queryHandler
      .freeRooms(ARRIVAL_DATE, DEPARTURE_DATE);

    const freeRoomNames = freeRooms.map(r => r.name);

    // TODO: WHY IS THIS PASSING?
    expect(freeRoomNames.includes(ROOM_TO_BOOK_NAME)).toBeFalsy();

  });
});

function commandHandlerWith(bookedRooms: Booking[]): BookingCommandHandler {
  class InMemoryWriteRegistry implements BookingWriteRegistry {
    constructor(private readonly bookings: Booking[]) {}

    makeABooking(booking: Booking): Promise<void> {
      this.bookings.push(booking);

      return Promise.resolve();
    }
    getRoomBookings(roomName: string): Promise<Booking[]> {
      return Promise.resolve(bookedRooms.filter(b => b.roomName === roomName));
    }
  }

  const writeRegistry = new InMemoryWriteRegistry(bookedRooms);

  return new BookingCommandHandler(writeRegistry, findFreeRoom);
}

function queryHandlerWith(bookedRooms: Booking[]): BookingQueryHandler {
  const readRegistry: BookingReadRegistry = {
    getAll() {
      return Promise.resolve(bookedRooms);
    },
  };

  const sut = new BookingQueryHandler(readRegistry, findFreeRoom);

  return sut;
}
