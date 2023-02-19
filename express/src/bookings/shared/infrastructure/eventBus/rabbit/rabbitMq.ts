import amqp, { Channel, Connection } from 'amqplib';

export interface RabbitInstance {
  channel: Channel;
  exchanges: Record<'default' & string, string>;
  connection: Connection;
}

export interface EventBusConfig {
  host?: string;
  port?: number;
}

export async function setUpEventBus(
  { host = 'localhost', port = 5673 }: EventBusConfig = {
  }
): Promise<RabbitInstance> {
  console.log('RABBIT', host, port);
  const connection = await amqp.connect(`amqp://${host}:${port}`);

  const channel = await connection.createChannel();
  const exchange = 'internal';

  await channel.assertExchange(exchange, 'direct', {
    durable: true
  });

  return {
    channel,
    exchanges: {
      default: exchange
    },
    connection
  };
}
