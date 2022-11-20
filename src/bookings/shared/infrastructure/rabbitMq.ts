import amqp, { Channel, Connection } from 'amqplib';

export interface RabbitInstance {
  channel: Channel;
  exchanges: Record<'default' & string, string>;
  connection: Connection;
}

export async function setUpEventBus(
  host = 'localhost'
): Promise<RabbitInstance> {
  const connection = await amqp.connect(`amqp://${host}`);

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
