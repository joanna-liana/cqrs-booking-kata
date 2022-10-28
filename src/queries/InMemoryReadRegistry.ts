import {
  BookingReadModel,
  BookingReadRegistry
} from './BookingQueryHandler';

export class InMemoryReadRegistry implements BookingReadRegistry {
  constructor(private readonly bookings: BookingReadModel[]) {}

  getAll(): Promise<BookingReadModel[]> {
    return Promise.resolve(this.bookings);
  }

  add(booking: BookingReadModel): Promise<void> {
    this.bookings.push(booking);

    return Promise.resolve();
  }
}
