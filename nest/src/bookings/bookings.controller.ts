import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Events } from './shared/domain/Events';
import { BookingReadRegistry } from './listBookings/domain/BookingReadRegistry';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    @Inject('ReadRegistry')
    private readonly readRegistry: BookingReadRegistry,
  ) {}

  @Post()
  addBooking(@Body() body) {
    const { arrival, departure, clientId, room } = body;

    return this.bookingsService.bookARoom({
      arrivalDate: new Date(arrival),
      departureDate: new Date(departure),
      clientId,
      roomName: room,
    });
  }

  @Get()
  async listBookings(@Query() query) {
    const { arrival, departure } = query;

    const rooms = await this.bookingsService.freeRooms(
      new Date(arrival as string),
      new Date(departure as string),
    );

    return { data: rooms };
  }

  // TODO: separate controller
  @EventPattern(Events.RoomBooked)
  // TODO: type for data?
  async registerBooking(@Payload() data: any) {
    console.log('BOOKING REGISTERED', data);

    // TODO: types, inject registry
    await this.readRegistry.add({
      arrivalDate: new Date(data.arrivalDate),
      departureDate: new Date(data.departureDate),
      roomName: data.roomName,
    });

    console.log('READS AFTER UPDATE', await this.readRegistry.getAll());
  }
}
