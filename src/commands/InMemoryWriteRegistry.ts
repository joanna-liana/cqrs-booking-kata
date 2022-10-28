import {
  BookingWriteModel,
  BookingWriteRegistry
} from './BookingCommandHandler';

export class InMemoryWriteRegistry implements BookingWriteRegistry {
  constructor(private readonly bookings: BookingWriteModel[]) {}

  makeABooking(booking: BookingWriteModel): Promise<void> {
    this.bookings.push(booking);

    return Promise.resolve();
  }
  getRoomBookings(roomName: string): Promise<BookingWriteModel[]> {
    return Promise
      .resolve(this.bookings.filter(b => b.roomName === roomName));
  }
}
