import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { ClientsModule } from '@nestjs/microservices';
import { BookingQueryHandler } from './listBookings/application/BookingQueryHandler';
import { findFreeRoom } from './shared/domain/freeRoomFinder';
import { InMemoryReadRegistry } from './listBookings/infrastructure/InMemoryReadRegistry';
import { BookingCommandHandler } from './bookARoom/application/BookingCommandHandler';
import { InMemoryWriteRegistry } from './bookARoom/infrastructure/InMemoryWriteRegistry';
import { BookingEventsHandler } from './listBookings/application/BookingEventsHandler';
import {
  BOOKINGS_EVENT_BUS,
  FREE_ROOM_FINDER,
  READ_REGISTRY,
  WRITE_REGISTRY,
} from './injectionTokens';
import { RabbitConfig } from './shared/infrastructure/RabbitConfig';

@Module({
  imports: [
    ClientsModule.register([
      {
        ...RabbitConfig,
        name: BOOKINGS_EVENT_BUS,
      },
    ]),
  ],
  controllers: [BookingsController, BookingEventsHandler],
  providers: [
    BookingQueryHandler,
    BookingCommandHandler,
    {
      provide: FREE_ROOM_FINDER,
      useValue: findFreeRoom,
    },
    // TODO: use Postgres
    {
      provide: READ_REGISTRY,
      useValue: new InMemoryReadRegistry([]),
    },
    {
      provide: WRITE_REGISTRY,
      useValue: new InMemoryWriteRegistry([]),
    },
  ],
})
export class BookingsModule {}
