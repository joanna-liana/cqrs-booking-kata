import { DaprServer } from '@dapr/dapr';
import { MikroORM } from '@mikro-orm/postgresql';
import { Router } from 'express';

import { getBookingsRouter } from './shared/application/rest/restApi';
import { findFreeRoom } from './shared/domain/freeRoomFinder';
import { DaprEventBus } from './shared/infrastructure/DaprEventBus';
// import { RabbitEventBus } from './shared/infrastructure/RabbitEventBus';
import { RabbitInstance } from './shared/infrastructure/rabbitMq';
import {
  BookingCommandHandler
} from './useCases/bookARoom/application/BookingCommandHandler';
import {
  BookingWriteModel
} from './useCases/bookARoom/domain/BookingWriteModel';
import {
  BookingWrite
} from './useCases/bookARoom/infrastructure/BookingWrite.entity';
import {
  PostgresWriteRegistry
} from './useCases/bookARoom/infrastructure/PostgresWriteRegistry';
import {
  BookingQueryHandler
} from './useCases/listBookings/application/BookingQueryHandler';
import {
  BookingRead
} from './useCases/listBookings/infrastructure/BookingRead.entity';
import {
  PostgresReadRegistry
} from './useCases/listBookings/infrastructure/PostgresReadRegistry';


interface BookingModule {
  bookingsRouter: Router;
}

export function createBookingModule(
  orm: MikroORM,
  rabbit: RabbitInstance,
  daprServer: DaprServer,
): BookingModule {
  const writeRegistry = new PostgresWriteRegistry(
    orm.em.fork().getRepository(BookingWrite)
  );

  const eventBus = new DaprEventBus<BookingWriteModel>(
    'event-bus',
    daprServer.pubsub
  );
  // const eventBus = new RabbitEventBus<BookingWriteModel>(
  //   rabbit.channel,
  //   rabbit.exchanges
  // );

  const commandHandler = new BookingCommandHandler(
    writeRegistry,
    findFreeRoom,
    eventBus
  );

  const readRegistry = new PostgresReadRegistry(
    orm.em.fork().getRepository(BookingRead)
  );

  const queryHandler = new BookingQueryHandler(
    readRegistry,
    findFreeRoom,
    eventBus
  );

  const bookingsRouter = getBookingsRouter(commandHandler, queryHandler);

  return {
    bookingsRouter
  };
}
