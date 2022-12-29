import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BookingsService } from './bookings.service';
import { findFreeRoom } from './shared/domain/freeRoomFinder';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'BOOKINGS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://localhost:${process.env.RABBIT_PORT}`],
          queue: 'bookings',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    {
      provide: 'FindFreeRoom',
      useValue: findFreeRoom,
    },
  ],
})
export class BookingsModule {}
