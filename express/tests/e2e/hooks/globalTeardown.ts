import { promisify } from 'util';

export default async (): Promise<void> => {
  await global.rabbit.channel.close();
  await global.rabbit.connection.close();

  await promisify(global.server.close.bind(global.server))();
};
