import { Inject, Injectable } from '@nestjs/common';
import { Events } from './shared/domain/Events';
import {
  ClientProxy,
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BookingReadRegistry } from './listBookings/domain/BookingReadRegistry';
import {
  FindFreeRoom,
  findFreeRoom,
  Room,
} from './shared/domain/freeRoomFinder';
import { InMemoryReadRegistry } from './listBookings/infrastructure/InMemoryReadRegistry';

@Injectable()
export class BookingsService {
  // private readonly findFreeRoom: FindFreeRoom;
  private readonly registry: BookingReadRegistry;

  constructor(
    @Inject('BOOKINGS_SERVICE') private client: ClientProxy,
    @Inject('FindFreeRoom')
    private readonly findFreeRoom: FindFreeRoom,
  ) {
    // this.findFreeRoom = findFreeRoom;
    this.registry = new InMemoryReadRegistry([]);
  }

  @MessagePattern(Events.RoomBooked)
  registerBooking(@Payload() data: unknown, @Ctx() context: RmqContext) {
    console.log(`Pattern: ${context.getPattern()}`);

    // TODO: types, inject registry
    this.registry.add(data as any);
  }

  async freeRooms(arrival: Date, departure: Date): Promise<Room[]> {
    const bookings = await this.registry.getAll();

    return this.findFreeRoom(bookings, {
      arrival,
      departure,
    });
  }
}
