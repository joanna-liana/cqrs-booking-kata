import { RoomUnavailableError } from '../../../shared/application/errors/RoomUnavailableError';
import { Events } from '../../../shared/domain/Events';
import { FindFreeRoom } from '../../../shared/domain/freeRoomFinder';
import { EventBus } from '../../../shared/infrastructure/EventBus';
import { BookingWriteModel } from '../domain/BookingWriteModel';
import { BookingWriteRegistry } from '../domain/BookingWriteRegistry';

export class BookingCommandHandler {
  constructor(
    private readonly writeRegistry: BookingWriteRegistry,
    private readonly findFreeRoom: FindFreeRoom,
    private readonly eventBus: EventBus<BookingWriteModel>,
  ) {}

  // TODO: maybe change this into a command
  // but that would be a breaking change given the requirements!
  async bookARoom(booking: BookingWriteModel): Promise<void> {
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
}
