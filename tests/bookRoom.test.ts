import {
  Booking,
  BookingCommandHandler,
  BookingWriteRegistry
} from '../src/BookingCommandHandler';
import { findFreeRoom } from '../src/freeRoomFinder';
import {
  ROOM_ONE_NAME,
} from '../src/rooms';

describe('Book a room use case', () => {
  const ANY_CLIENT_ID = 'client1';
  const ROOM_TO_BOOK_NAME = ROOM_ONE_NAME;

  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  it('books a free room in the given period', async () => {
    // given
    const bookedRooms = [];

    const sut = sutWith(bookedRooms);

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
});

function sutWith(bookedRooms: Booking[]): BookingCommandHandler {
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
