import {
  Router
} from 'express';

import {
  BookingCommandHandler
} from '../../../useCases/bookARoom/application/BookingCommandHandler';
import {
  addBookingController
} from '../../../useCases/bookARoom/application/restController';
import {
  BookingQueryHandler
} from '../../../useCases/listBookings/application/BookingQueryHandler';
import { wrapAsync } from './middleware/wrapAsync';

const BASE_PATH = '/bookings';

export function getBookingsRouter(
  commandHandler: BookingCommandHandler,
  queryHandler: BookingQueryHandler
): Router {
  const router = Router();

  router.post(
    BASE_PATH,
    wrapAsync(addBookingController({
      commandHandler
    }))
  );

  router.get(
    BASE_PATH,
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
