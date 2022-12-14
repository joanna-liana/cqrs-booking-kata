import { Application } from 'express';
import { AddressInfo } from 'net';
import { promisify } from 'util';

import { bootstrapApp } from '../../../src/app';

beforeAll(async () => {
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

  startServer(app);
});

afterAll(async () => {
  await global.rabbit.channel.close();
  await global.rabbit.connection.close();

  console.log('RABBIT CLOSED');

  await promisify(global.server.close.bind(global.server))();

  console.log('SERVER CLOSED');
});


function startServer(app: Application): void {
  global.server = app.listen();

  const { port } = (global.server.address() as AddressInfo);

  global.baseTestUrl = `http://localhost:${port}`;
}
