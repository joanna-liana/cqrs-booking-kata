import { MikroORM } from '@mikro-orm/postgresql';
import express,
{ Application, json, NextFunction, Request, Response }
  from 'express';

import { ApplicationError } from './bookings/errors/ApplicationError';
import { createBookingModule } from './bookings/module';
import { setUpOrm } from './db';

interface App {
  app: Application;
  orm: MikroORM;
}

export const bootstrapApp = async (): Promise<App> => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(json());

  const orm = await setUpOrm();

  const { bookingsRouter } = createBookingModule(orm);

  app.use(bookingsRouter);

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

  return {
    app,
    orm
  };
};
