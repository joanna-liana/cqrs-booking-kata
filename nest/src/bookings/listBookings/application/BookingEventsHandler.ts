import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Events } from '../../shared/domain/Events';
import { BookingReadRegistry } from '../domain/BookingReadRegistry';
import { READ_REGISTRY } from '../../injectionTokens';

@Controller()
export class BookingEventsHandler {
  constructor(
    @Inject(READ_REGISTRY)
    private readonly readRegistry: BookingReadRegistry,
  ) {}

  @EventPattern(Events.RoomBooked)
  async registerBooking(@Payload() data: Record<string, string>) {
    console.log('BOOKING REGISTERED', data);

    await this.readRegistry.add({
      arrivalDate: new Date(data.arrivalDate),
      departureDate: new Date(data.departureDate),
      roomName: data.roomName,
    });

    console.log('READS AFTER UPDATE', await this.readRegistry.getAll());
  }
}
