import { RequestHandler } from 'express';

import { AsyncRequestHandler } from '../types';

export const wrapAsync = (
  handler: AsyncRequestHandler
): RequestHandler => async (req, res, next): Promise<void> => {
  try {
    await handler(req, res, next);
  } catch (err) {
    next(err);
  }
};
