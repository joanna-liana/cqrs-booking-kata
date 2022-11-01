import express,
{ Application, json, NextFunction, Request, Response }
  from 'express';

import {
  BookingCommandHandler,
  BookingWriteModel
} from './bookings/commands/BookingCommandHandler';
import {
  InMemoryWriteRegistry
} from './bookings/commands/InMemoryWriteRegistry';
import { ApplicationError } from './bookings/errors/ApplicationError';
import { InMemoryEventBus } from './bookings/events/InMemoryEventBus';
import { findFreeRoom } from './bookings/freeRoomFinder';
import { BookingQueryHandler } from './bookings/queries/BookingQueryHandler';
import { InMemoryReadRegistry } from './bookings/queries/InMemoryReadRegistry';

export const getApp = (): Application => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(json());

  const writeRegistry = new InMemoryWriteRegistry([]);
  const eventBus = new InMemoryEventBus<BookingWriteModel>();

  const commandHandler = new BookingCommandHandler(
    writeRegistry,
    findFreeRoom,
    eventBus
  );

  const readRegistry = new InMemoryReadRegistry([]);

  const queryHandler = new BookingQueryHandler(
    readRegistry,
    findFreeRoom,
    eventBus
  );

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
