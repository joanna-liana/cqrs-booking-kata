import { Inject, Injectable } from '@nestjs/common';
import { Events } from './shared/domain/Events';
import { ClientProxy } from '@nestjs/microservices';
import { BookingReadRegistry } from './listBookings/domain/BookingReadRegistry';
import { FindFreeRoom, Room } from './shared/domain/freeRoomFinder';
import { BookingWriteRegistry } from './bookARoom/domain/BookingWriteRegistry';
import { InMemoryWriteRegistry } from './bookARoom/infrastructure/InMemoryWriteRegistry';
import { BookingWriteModel } from './bookARoom/domain/BookingWriteModel';
import { RoomUnavailableError } from './shared/application/errors/RoomUnavailableError';

@Injectable()
export class BookingsService {
  private readonly writeRegistry: BookingWriteRegistry;

  constructor(
    @Inject('BOOKINGS_SERVICE') private eventBus: ClientProxy,
    @Inject('FindFreeRoom')
    private readonly findFreeRoom: FindFreeRoom,
    @Inject('ReadRegistry')
    private readonly readRegistry: BookingReadRegistry,
  ) {
    // TODO: inject
    this.writeRegistry = new InMemoryWriteRegistry([]);
  }
  async bookARoom(booking: BookingWriteModel) {
    const roomBookings = await this.writeRegistry.getRoomBookings(
      booking.roomName,
    );

    const freeRooms = await this.findFreeRoom(roomBookings, {
      arrival: booking.arrivalDate,
      departure: booking.departureDate,
    });

    const isRoomFree = !!freeRooms.filter((r) => r.name === booking.roomName)
      .length;

    if (!isRoomFree) {
      throw new RoomUnavailableError();
    }

    await this.writeRegistry.makeABooking(booking);
    await this.eventBus.emit(Events.RoomBooked, booking);
  }

  async freeRooms(arrival: Date, departure: Date): Promise<Room[]> {
    const bookings = await this.readRegistry.getAll();

    return this.findFreeRoom(bookings, {
      arrival,
      departure,
    });
  }
}
