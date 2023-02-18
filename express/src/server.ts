import { DaprServer } from '@dapr/dapr';

import { bootstrapApp } from './app';

const daprHost = '127.0.0.1';
const daprPort = '50000'; // Dapr Sidecar Port of this Example Server
const serverHost = '127.0.0.1'; // App Host of this Example Server
const serverPort = '3001'; // App Port of this Example Server

const bootstrap = async (port = 3000): Promise<void> => {
  const daprServer = new DaprServer(serverHost, serverPort, daprHost, daprPort);
  const { app } = await bootstrapApp({
    daprServer
  });

  await daprServer.start();

  app.listen(port, () => console.log(`App listening on port ${port}!`));
};

process.on('unhandledRejection', (error) => {
  console.log('unhandledRejection', error);
});

bootstrap();
