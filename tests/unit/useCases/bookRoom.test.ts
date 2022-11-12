/* eslint-disable max-len */

import { findFreeRoom } from '../../../src/bookings/shared/domain/freeRoomFinder';
import {
  ROOM_ONE_NAME,
} from '../../../src/bookings/shared/domain/rooms';
import { EventBus } from '../../../src/bookings/shared/infrastructure/EventBus';
import { InMemoryEventBus } from '../../../src/bookings/shared/infrastructure/InMemoryEventBus';
import { BookingCommandHandler } from '../../../src/bookings/useCases/bookARoom/application/BookingCommandHandler';
import { BookingWriteModel } from '../../../src/bookings/useCases/bookARoom/domain/BookingWriteModel';
import {
  InMemoryWriteRegistry
} from '../../../src/bookings/useCases/bookARoom/infrastructure/InMemoryWriteRegistry';
import { BookingQueryHandler } from '../../../src/bookings/useCases/listBookings/application/BookingQueryHandler';
import { BookingReadModel } from '../../../src/bookings/useCases/listBookings/domain/BookingReadModel';
import { BookingReadRegistry } from '../../../src/bookings/useCases/listBookings/domain/BookingReadRegistry';
import {
  InMemoryReadRegistry
} from '../../../src/bookings/useCases/listBookings/infrastructure/InMemoryReadRegistry';
/* eslint-enable max-len */

describe('Book a room use case', () => {
  const ANY_CLIENT_ID = 'client1';
  const ROOM_TO_BOOK_NAME = ROOM_ONE_NAME;

  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  let eventBus: EventBus<BookingReadModel & BookingWriteModel>;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
  });


  it('books a free room in the given period', async () => {
    // given
    const bookedRooms: BookingWriteModel[] = [];

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
    const bookedRooms: BookingWriteModel[] = [];

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
  const writeRegistry = new InMemoryWriteRegistry([...bookedRooms]);

  return new BookingCommandHandler(writeRegistry, findFreeRoom, eventBus);
}

function queryHandlerWith(
  bookedRooms: BookingWriteModel[],
  eventBus: EventBus<BookingReadModel>
): BookingQueryHandler {
  const readRegistry: BookingReadRegistry = new InMemoryReadRegistry(
    bookedRooms
  );

  return new BookingQueryHandler(readRegistry, findFreeRoom, eventBus);
}
