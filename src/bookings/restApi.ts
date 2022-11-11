import { Router } from 'express';

import { BookingCommandHandler } from './commands/BookingCommandHandler';
import { BookingQueryHandler } from './queries/BookingQueryHandler';

export function getBookingsRouter(
  commandHandler: BookingCommandHandler,
  queryHandler: BookingQueryHandler
): Router {
  const router = Router();

  router.post(
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

  router.get(
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

  return router;
}
