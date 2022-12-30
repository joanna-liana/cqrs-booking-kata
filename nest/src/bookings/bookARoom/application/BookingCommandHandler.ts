import { Inject, Injectable } from '@nestjs/common';
import { Events } from '../../shared/domain/Events';
import { ClientProxy } from '@nestjs/microservices';
import { FindFreeRoom } from '../../shared/domain/freeRoomFinder';
import { BookingWriteRegistry } from '../domain/BookingWriteRegistry';
import { RoomUnavailableError } from '../../shared/application/errors/RoomUnavailableError';
import {
  BOOKINGS_EVENT_BUS,
  FREE_ROOM_FINDER,
  WRITE_REGISTRY,
} from '../../injectionTokens';

interface BookRoomCommand {
  clientId: string;
  roomName: string;
  arrivalDate: Date;
  departureDate: Date;
}

@Injectable()
export class BookingCommandHandler {
  constructor(
    @Inject(BOOKINGS_EVENT_BUS) private eventBus: ClientProxy,
    @Inject(FREE_ROOM_FINDER)
    private readonly findFreeRoom: FindFreeRoom,
    @Inject(WRITE_REGISTRY)
    private readonly writeRegistry: BookingWriteRegistry,
  ) {}

  async execute(command: BookRoomCommand) {
    const roomBookings = await this.writeRegistry.getRoomBookings(
      command.roomName,
    );

    const freeRooms = await this.findFreeRoom(roomBookings, {
      arrival: command.arrivalDate,
      departure: command.departureDate,
    });

    const isRoomFree = !!freeRooms.filter((r) => r.name === command.roomName)
      .length;

    if (!isRoomFree) {
      throw new RoomUnavailableError();
    }

    await this.writeRegistry.makeABooking(command);
    this.eventBus.emit(Events.RoomBooked, command);
  }
}
