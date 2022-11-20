import {
  Router
} from 'express';

import {
  BookingCommandHandler
} from '../../../useCases/bookARoom/application/BookingCommandHandler';
import {
  BookingQueryHandler
} from '../../../useCases/listBookings/application/BookingQueryHandler';
import { Controller } from './Controller';
import { wrapAsync } from './middleware/wrapAsync';

// TODO: split REST API by use case
export function getBookingsRouter(
  commandHandler: BookingCommandHandler,
  queryHandler: BookingQueryHandler
): Router {
  const router = Router();

  const addBookingController: Controller = async (req, res) => {
    const { arrival, departure, clientId, room } = req.body;

    await commandHandler.bookARoom({
      arrivalDate: new Date(arrival),
      departureDate: new Date(departure),
      clientId,
      roomName: room
    });

    res.status(201).send();
  };

  router.post(
    '/bookings',
    wrapAsync(addBookingController)
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
