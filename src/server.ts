import { getApp } from './app';

const bootstrap = (port = 3000): void => {
  getApp().listen(port, () =>
    console.log(`App listening on port ${port}!`));
};

process.on('unhandledRejection', (error) => {
  console.log('unhandledRejection', error);
});

bootstrap();
