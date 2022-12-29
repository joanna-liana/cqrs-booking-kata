import { BookingWriteModel } from './BookingWriteModel';

export interface BookingWriteRegistry {
  makeABooking(booking: BookingWriteModel): Promise<void>;
  getRoomBookings(roomName: string): Promise<BookingWriteModel[]>;
}
