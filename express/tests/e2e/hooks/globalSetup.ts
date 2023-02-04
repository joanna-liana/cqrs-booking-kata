import retry from 'async-retry';
import axios from 'axios';
import { Application } from 'express';
import { AddressInfo } from 'net';

import { bootstrapApp } from '../../../src/app';

export default async (): Promise<void> => {
  const { app, orm, rabbit } = await bootstrapApp({
    db: {
      name: `test_${Date.now()}`
    },
    eventBus: {
      port: 5673
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
