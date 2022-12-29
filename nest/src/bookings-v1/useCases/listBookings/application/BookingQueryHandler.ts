import { Events } from '../../../shared/domain/Events';
import { FindFreeRoom } from '../../../shared/domain/freeRoomFinder';
import { EventBus } from '../../../shared/infrastructure/EventBus';
import { InMemoryEventBus } from '../../../shared/infrastructure/InMemoryEventBus';
import { BookingReadModel } from '../domain/BookingReadModel';
import { BookingReadRegistry } from '../domain/BookingReadRegistry';
import { Room } from './dtos/Room';

export class BookingQueryHandler {
  constructor(
    private readonly registry: BookingReadRegistry,
    private readonly findFreeRoom: FindFreeRoom,
    private readonly eventBus: EventBus<BookingReadModel> = new InMemoryEventBus(),
  ) {
    this.eventBus.on(Events.RoomBooked, async (booking) => {
      await this.registry.add(booking);
    });
  }

  async freeRooms(arrival: Date, departure: Date): Promise<Room[]> {
    const bookings = await this.registry.getAll();

    return this.findFreeRoom(bookings, {
      arrival,
      departure,
    });
  }
}
