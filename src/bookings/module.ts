import { MikroORM } from '@mikro-orm/postgresql';
import { Router } from 'express';

import {
  BookingCommandHandler,
  BookingWriteModel
} from './commands/BookingCommandHandler';
import { BookingWrite } from './commands/BookingWrite.entity';
import { PostgresWriteRegistry } from './commands/PostgresWriteRegistry';
import { InMemoryEventBus } from './events/InMemoryEventBus';
import { findFreeRoom } from './freeRoomFinder';
import { BookingQueryHandler } from './queries/BookingQueryHandler';
import { BookingRead } from './queries/BookingRead.entity';
import { PostgresReadRegistry } from './queries/PostgresReadRegistry';
import { getBookingsRouter } from './restApi';

interface BookingModule {
  bookingsRouter: Router;
}
export function createBookingModule(orm: MikroORM): BookingModule {
  const writeRegistry = new PostgresWriteRegistry(
    orm.em.fork().getRepository(BookingWrite)
  );

  const eventBus = new InMemoryEventBus<BookingWriteModel>();

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
