import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BookingQueryHandler } from './listBookings/application/BookingQueryHandler';
import { BookingCommandHandler } from './bookARoom/application/BookingCommandHandler';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingQueryHandler: BookingQueryHandler,
    private readonly bookingCommandHandler: BookingCommandHandler,
  ) {}

  @Post()
  addBooking(@Body() body) {
    const { arrival, departure, clientId, room } = body;

    return this.bookingCommandHandler.execute({
      arrivalDate: new Date(arrival),
      departureDate: new Date(departure),
      clientId,
      roomName: room,
    });
  }

  @Get()
  async listBookings(@Query() query) {
    const { arrival, departure } = query;

    const rooms = await this.bookingQueryHandler.execute({
      arrival: new Date(arrival as string),
      departure: new Date(departure as string),
    });

    return { data: rooms };
  }
}
