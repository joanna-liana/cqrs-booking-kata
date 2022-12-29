import { Controller, Get, Post, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  addBooking() {
    console.log('OCCUPY ROOMS');
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
