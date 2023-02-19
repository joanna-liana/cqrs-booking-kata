import { DaprServer } from '@dapr/dapr';
import retry from 'async-retry';
import axios from 'axios';
import { Application } from 'express';
import { AddressInfo } from 'net';

import { bootstrapApp } from '../../../src/app';
import {
  EventBusType
} from '../../../src/bookings/shared/infrastructure/eventBus/eventBusFactory';

export default async (): Promise<void> => {
  const daprServer = new DaprServer('127.0.0.1', '50000', '127.0.0.1', '3001');

  const { app, orm, rabbit } = await bootstrapApp({
    db: {
      name: `test_${Date.now()}`
    },
    eventBusConfig: {
      type: EventBusType.DAPR,
      props: {
        pubSubName: 'event-bus',
        server: daprServer
      }
    }
  });

  global.rabbit = rabbit;

  await orm
    .getSchemaGenerator()
    .clearDatabase();

  await startServer(app);
};


async function startServer(app: Application): Promise<void> {
  global.server = app.listen();

  const { port } = (global.server.address() as AddressInfo);

  global.baseTestUrl = `http://localhost:${port}`;

  await retry(
    async () => axios.get(`${global.baseTestUrl}/healthcheck`),
    {
      retries: 3,
    }
  );
}
