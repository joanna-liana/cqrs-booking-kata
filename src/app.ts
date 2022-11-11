import { MikroORM } from '@mikro-orm/postgresql';
import express,
{ Application, json, NextFunction, Request, Response }
  from 'express';

import {
  BookingCommandHandler,
  BookingWriteModel
} from './bookings/commands/BookingCommandHandler';
import { BookingWrite } from './bookings/commands/BookingWrite.entity';
import {
  PostgresWriteRegistry
} from './bookings/commands/PostgresWriteRegistry';
import { ApplicationError } from './bookings/errors/ApplicationError';
import { InMemoryEventBus } from './bookings/events/InMemoryEventBus';
import { findFreeRoom } from './bookings/freeRoomFinder';
import { BookingQueryHandler } from './bookings/queries/BookingQueryHandler';
import { BookingRead } from './bookings/queries/BookingRead.entity';
import { PostgresReadRegistry } from './bookings/queries/PostgresReadRegistry';
import { setUpOrm } from './db';

export const getApp = async (): Promise<Application> => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(json());

  const orm = await setUpOrm();

  const { commandHandler, queryHandler } = createBookingModule(orm);

  app.post(
    '/bookings',
    async (req, res, next) => {
      try {
        const { arrival, departure, clientId, room } = req.body;

        await commandHandler.bookARoom({
          arrivalDate: new Date(arrival),
          departureDate: new Date(departure),
          clientId,
          roomName: room
        });

        res.status(201).send();
      } catch (err) {
        next(err);
      }
    }
  );

  app.get(
    '/bookings',
    async (req, res, next) => {
      try {
        const { arrival, departure } = req.query;

        const data = await queryHandler.freeRooms(
          new Date(arrival as string),
          new Date(departure as string)
        );

        res.status(200).json({
          data
        });
      } catch (err) {
        next(err);
      }
    }
  );

  app.use((req: Request, res: Response) => {
    res.status(404).send(`Not found ${req.path}`);
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ApplicationError) {
      return res.status(err.status).json({
        error: err.name,
        message: err.message,
      }).send();
    }

    console.error(err);

    res.status(500).send();
  });

  return app;
};

interface BookingModule {
  commandHandler: BookingCommandHandler;
  queryHandler: BookingQueryHandler;
}

function createBookingModule(orm: MikroORM): BookingModule {
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

  return {
    commandHandler, queryHandler
  };
}
