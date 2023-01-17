import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { ClientsModule } from '@nestjs/microservices';
import { BookingQueryHandler } from './listBookings/application/BookingQueryHandler';
import { findFreeRoom } from './shared/domain/freeRoomFinder';
import { BookingCommandHandler } from './bookARoom/application/BookingCommandHandler';
import { BookingEventsHandler } from './listBookings/application/BookingEventsHandler';
import {
  BOOKINGS_EVENT_BUS,
  FREE_ROOM_FINDER,
  READ_REGISTRY,
  WRITE_REGISTRY,
} from './injectionTokens';
import { getRabbitConfig } from './shared/infrastructure/RabbitConfig';
import { PostgresReadRegistry } from './listBookings/infrastructure/PostgresReadRegistry';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BookingRead } from './listBookings/infrastructure/BookingRead.entity';
import { PostgresWriteRegistry } from './bookARoom/infrastructure/PostgresWriteRegistry';
import { BookingWrite } from './bookARoom/infrastructure/BookingWrite.entity';

@Module({
  imports: [
    ClientsModule.register([
      {
        ...getRabbitConfig(),
        name: BOOKINGS_EVENT_BUS,
      },
    ]),
    MikroOrmModule.forFeature([BookingRead, BookingWrite]),
  ],
  controllers: [BookingsController, BookingEventsHandler],
  providers: [
    BookingQueryHandler,
    BookingCommandHandler,
    {
      provide: FREE_ROOM_FINDER,
      useValue: findFreeRoom,
    },
    {
      provide: READ_REGISTRY,
      useClass: PostgresReadRegistry,
    },
    {
      provide: WRITE_REGISTRY,
      useClass: PostgresWriteRegistry,
    },
  ],
})
export class BookingsModule {}
