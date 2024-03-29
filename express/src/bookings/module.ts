import { MikroORM } from '@mikro-orm/postgresql';
import { Router } from 'express';

import { getBookingsRouter } from './shared/application/rest/restApi';
import { findFreeRoom } from './shared/domain/freeRoomFinder';
import {
  createEventBus,
  EventBusConfig
} from './shared/infrastructure/eventBus/eventBusFactory';
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
  eventBusConfig: EventBusConfig,
): BookingModule {
  const writeRegistry = new PostgresWriteRegistry(
    orm.em.fork().getRepository(BookingWrite)
  );

  const eventBus = createEventBus<BookingWriteModel>(eventBusConfig);

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
