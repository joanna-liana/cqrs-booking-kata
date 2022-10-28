
import {
  BookingCommandHandler,
  BookingWriteModel,
  BookingWriteRegistry
} from '../../src/BookingCommandHandler';
import {
  BookingQueryHandler,
  BookingReadModel,
  BookingReadRegistry,
} from '../../src/BookingQueryHandler';
import { EventBus } from '../../src/events/EventBus';
import { InMemoryEventBus } from '../../src/events/InMemoryEventBus';
import { findFreeRoom } from '../../src/freeRoomFinder';
import {
  ROOM_ONE_NAME,
} from '../../src/rooms';

describe('Book a room use case', () => {
  const ANY_CLIENT_ID = 'client1';
  const ROOM_TO_BOOK_NAME = ROOM_ONE_NAME;

  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  let eventBus: EventBus<BookingReadModel | BookingWriteModel>;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
  });


  it('books a free room in the given period', async () => {
    // given
    const bookedRooms = [];

    const sut = commandHandlerWith(bookedRooms, eventBus);

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

    const commandHandler = commandHandlerWith(bookedRooms, eventBus);
    const queryHandler = queryHandlerWith(bookedRooms, eventBus);

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

    expect(freeRoomNames.includes(ROOM_TO_BOOK_NAME)).toBeFalsy();

  });
});

function commandHandlerWith(
  bookedRooms: BookingWriteModel[],
  eventBus: EventBus<BookingWriteModel>
): BookingCommandHandler {
  class InMemoryWriteRegistry implements BookingWriteRegistry {
    constructor(private readonly bookings: BookingWriteModel[]) {}

    makeABooking(booking: BookingWriteModel): Promise<void> {
      this.bookings.push(booking);

      return Promise.resolve();
    }
    getRoomBookings(roomName: string): Promise<BookingWriteModel[]> {
      return Promise
        .resolve(this.bookings.filter(b => b.roomName === roomName));
    }
  }

  const writeRegistry = new InMemoryWriteRegistry([...bookedRooms]);

  return new BookingCommandHandler(writeRegistry, findFreeRoom, eventBus);
}

function queryHandlerWith(
  bookedRooms: BookingWriteModel[],
  eventBus: EventBus<BookingReadModel>
): BookingQueryHandler {
  class InMemoryReadRegistry implements BookingReadRegistry {
    constructor(private readonly bookings: BookingReadModel[]) {}

    getAll(): Promise<BookingReadModel[]> {
      return Promise.resolve(this.bookings);
    }

    add(booking: BookingReadModel): Promise<void> {
      this.bookings.push(booking);

      return Promise.resolve();
    }
  }

  const readRegistry: BookingReadRegistry = new InMemoryReadRegistry(
    bookedRooms
  );

  const sut = new BookingQueryHandler(readRegistry, findFreeRoom, eventBus);

  return sut;
}
