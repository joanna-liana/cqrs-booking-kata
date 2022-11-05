import { getApp } from './app';

const bootstrap = async (port = 3000): Promise<void> => {
  (await getApp()).listen(port, () =>
    console.log(`App listening on port ${port}!`));
};

process.on('unhandledRejection', (error) => {
  console.log('unhandledRejection', error);
});

bootstrap();
