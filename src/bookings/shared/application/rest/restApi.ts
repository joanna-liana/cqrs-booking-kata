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
import { getBookingsController } from '../../../useCases/listBookings/application/getBookingsController';
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
    wrapAsync(getBookingsController({
      queryHandler
    }))
  );

  return router;
}
