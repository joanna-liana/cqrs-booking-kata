import { Application } from 'express';
import { AddressInfo } from 'net';
import { promisify } from 'util';

import { bootstrapApp } from '../../../src/app';

beforeAll(async () => {
  const { app, orm } = await bootstrapApp({
    db: {
      name: `test_${Date.now()}`
    }
  });

  await orm
    .getSchemaGenerator()
    .clearDatabase();

  startServer(app);
});

afterAll(async () => {
  await promisify(global.server.close.bind(global.server))();
});


function startServer(app: Application): void {
  global.server = app.listen();

  const { port } = (global.server.address() as AddressInfo);

  global.baseTestUrl = `http://localhost:${port}`;
}
