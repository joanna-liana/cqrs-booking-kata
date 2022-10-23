import {
  ROOM_ONE_NAME,
} from '../src/rooms';

export interface Booking {
  clientId: string;
  roomName: string;
  arrivalDate: Date;
  departureDate: Date;
}

class BookingCommand {
  constructor(private readonly writeRegistry: BookingWriteRegistry) {}

  bookARoom(booking: Booking): Promise<void> {
    return this.writeRegistry.makeABooking(booking);
  }
}

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
    expect(() => sut.bookARoom(booking)).toThrowError();
  });
});

export interface BookingWriteRegistry {
  makeABooking(booking: Booking): Promise<void>;
}

function sutWith(_bookedRooms: Booking[]): BookingCommand {
  const writeRegistry: BookingWriteRegistry = {
    makeABooking() {
      return Promise.resolve();
    },
  };

  return new BookingCommand(writeRegistry);
}
