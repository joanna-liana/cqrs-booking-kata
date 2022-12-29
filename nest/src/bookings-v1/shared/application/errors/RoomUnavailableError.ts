import { ApplicationError } from './ApplicationError';

export class RoomUnavailableError extends ApplicationError {
  constructor() {
    super({
      message: 'The room is unavailable in the requested period',
      status: 409,
    });
  }
}
