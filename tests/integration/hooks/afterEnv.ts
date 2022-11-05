import { AddressInfo } from 'net';
import { promisify } from 'util';

import { getApp } from '../../../src/app';

beforeAll(async () => {
  const app = await getApp();

  global.server = app.listen();

  const { port } = (global.server.address() as AddressInfo);

  global.baseTestUrl = `http://localhost:${port}`;
});

afterAll(async () => {
  await promisify(global.server.close.bind(global.server))();
});
