import { EventEmitter } from 'events';

import { FindFreeRoom } from './freeRoomFinder';

export interface Room {
  name: string;
}

export interface BookingReadModel {
  clientId: string;
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
    private readonly eventBus: any = new EventEmitter(),
  ) {
    this.eventBus.on('ROOM_BOOKED', async (booking: BookingReadModel) => {
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
