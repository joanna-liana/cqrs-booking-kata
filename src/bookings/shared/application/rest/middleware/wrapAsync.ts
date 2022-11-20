import { RequestHandler } from 'express';

import { Controller } from "../Controller";

export const wrapAsync = (controller: Controller): RequestHandler => async (
  req,
  res,
  next
): Promise<void> => {
  try {
    await controller(req, res, next);
  } catch (err) {
    next(err);
  }
};
