import { FindFreeRoom } from './freeRoomFinder';


export interface Booking {
  clientId: string;
  roomName: string;
  arrivalDate: Date;
  departureDate: Date;
}

export interface BookingWriteRegistry {
  makeABooking(booking: Booking): Promise<void>;
  getRoomBookings(roomName: string): Promise<Booking[]>;
}
export class BookingCommandHandler {
  constructor(
    private readonly writeRegistry: BookingWriteRegistry,
    private readonly findFreeRoom: FindFreeRoom,
    private readonly eventBus: any,
  ) {}

  async bookARoom(booking: Booking): Promise<void> {
    const roomBookings = await this.writeRegistry
      .getRoomBookings(booking.roomName);

    const freeRooms = await this.findFreeRoom(
      roomBookings,
      {
        arrival: booking.arrivalDate,
        departure: booking.departureDate
      }
    );

    const isRoomFree = !!freeRooms
      .filter(r => r.name === booking.roomName)
      .length;

    if (!isRoomFree) {
      throw new Error('The room is unavailable in the requested period');
    }

    await this.writeRegistry.makeABooking(booking);
    await this.eventBus.emit('ROOM_BOOKED', booking);
  }
}
