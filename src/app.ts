import { MikroORM } from '@mikro-orm/postgresql';
import express,
{ Application, json, NextFunction, Request, Response }
  from 'express';

import { createBookingModule } from './bookings/module';
import {
  ApplicationError
} from './bookings/shared/application/errors/ApplicationError';
import { DbConfig, setUpOrm } from './bookings/shared/infrastructure/db';
import { setUpEventBus } from './bookings/shared/infrastructure/rabbitMq';

interface App {
  app: Application;
  orm: MikroORM;
}

interface AppBootstrapConfig {
  db?: DbConfig;
}

export const bootstrapApp = async ({ db: dbConfig }: AppBootstrapConfig = {
}): Promise<App> => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(json());

  await setUpEventBus();

  const orm = await setUpOrm(dbConfig);

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
