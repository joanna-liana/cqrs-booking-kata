import { Inject, Injectable } from '@nestjs/common';
import { BookingReadRegistry } from '../domain/BookingReadRegistry';
import { FindFreeRoom, Room } from '../../shared/domain/freeRoomFinder';
import { FREE_ROOM_FINDER, READ_REGISTRY } from '../../injectionTokens';

interface BookingQuery {
  arrival: Date;
  departure: Date;
}

@Injectable()
export class BookingQueryHandler {
  constructor(
    @Inject(FREE_ROOM_FINDER)
    private readonly findFreeRoom: FindFreeRoom,
    @Inject(READ_REGISTRY)
    private readonly readRegistry: BookingReadRegistry,
  ) {}

  async execute({ arrival, departure }: BookingQuery): Promise<Room[]> {
    const bookings = await this.readRegistry.getAll();

    return this.findFreeRoom(bookings, {
      arrival,
      departure,
    });
  }
}
