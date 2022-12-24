import { BookingReadModel } from './BookingReadModel';

export interface BookingReadRegistry {
  getAll(): Promise<BookingReadModel[]>;
  add(booking: BookingReadModel): Promise<void>;
}
