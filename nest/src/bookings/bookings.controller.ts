import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

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
}
