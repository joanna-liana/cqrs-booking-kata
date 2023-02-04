import { MikroORM } from '@mikro-orm/postgresql';
import express,
{ Application, json, NextFunction, Request, Response }
  from 'express';
import morgan from 'morgan';

import { createBookingModule } from './bookings/module';
import {
  ApplicationError
} from './bookings/shared/application/errors/ApplicationError';
import { DbConfig, setUpOrm } from './bookings/shared/infrastructure/db';
import {
  EventBusConfig,
  RabbitInstance,
  setUpEventBus
} from './bookings/shared/infrastructure/rabbitMq';

interface App {
  app: Application;
  orm: MikroORM;
  rabbit: RabbitInstance;
}

interface AppBootstrapConfig {
  db?: DbConfig;
  eventBus?: EventBusConfig;
}

export const bootstrapApp = async (
  { db: dbConfig, eventBus: eventBusConfig }: AppBootstrapConfig = {
  }
): Promise<App> => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(json());
  app.use(morgan('combined'));

  const rabbit = await setUpEventBus(eventBusConfig);

  const orm = await setUpOrm(dbConfig);

  const { bookingsRouter } = createBookingModule(orm, rabbit);

  app.use(bookingsRouter);

  app.get('/healthcheck', (_req: Request, res: Response) => {
    res.sendStatus(204);
  });

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
    orm,
    rabbit
  };
};
