import { AsyncRequestHandler } from '../../../shared/application/rest/types';
import { BookingCommandHandler } from './BookingCommandHandler';

export interface AddBookingControllerProps {
  commandHandler: BookingCommandHandler;
}

export const addBookingController =
  ({ commandHandler }: AddBookingControllerProps): AsyncRequestHandler =>
  async (req, res) => {
    const { arrival, departure, clientId, room } = req.body;

    await commandHandler.bookARoom({
      arrivalDate: new Date(arrival),
      departureDate: new Date(departure),
      clientId,
      roomName: room,
    });

    res.status(201).send();
  };
