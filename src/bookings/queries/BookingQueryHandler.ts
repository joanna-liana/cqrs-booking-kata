import { EventBus } from '../events/EventBus';
import { Events } from '../events/Events';
import { InMemoryEventBus } from '../events/InMemoryEventBus';
import { FindFreeRoom } from '../freeRoomFinder';

export interface Room {
  name: string;
}

export interface BookingReadModel {
  roomName: string;
  arrivalDate: Date;
  departureDate: Date;
}

export interface BookingReadRegistry {
  getAll(): Promise<BookingReadModel[]>;
  add(booking: BookingReadModel): Promise<void>;
}

export class BookingQueryHandler {
  constructor(
    private readonly registry: BookingReadRegistry,
    private readonly findFreeRoom: FindFreeRoom,
    private readonly eventBus: EventBus<
      BookingReadModel
    > = new InMemoryEventBus(),
  ) {
    this.eventBus.on(Events.RoomBooked, async (booking) => {
      await this.registry.add(booking);
    });
  }

  async freeRooms(arrival: Date, departure: Date): Promise<Room[]> {
    const bookings = await this.registry.getAll();

    return this.findFreeRoom(bookings, {
      arrival, departure
    });
  }
}
