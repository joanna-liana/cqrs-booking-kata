import { AsyncRequestHandler } from '../../../shared/application/rest/types';
import {
  BookingQueryHandler
} from './BookingQueryHandler';

interface GetBookingsControllerProps {
  queryHandler: BookingQueryHandler;
}
export const getBookingsController = (
  { queryHandler }: GetBookingsControllerProps
): AsyncRequestHandler => async (req, res, next) => {
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
};
