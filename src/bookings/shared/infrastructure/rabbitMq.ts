import amqp, { Channel } from 'amqplib';

export interface RabbitInstance {
  channel: Channel;
  exchanges: Record<'default' & string, string>;
}

export async function setUpEventBus(
  host = 'localhost'
): Promise<RabbitInstance> {
  const connection = await amqp.connect(`amqp://${host}`);

  const channel = await connection.createChannel();
  const exchange = 'internal';

  channel.assertExchange(exchange, 'fanout', {
    durable: true
  });

  return {
    channel,
    exchanges: {
      default: exchange
    }
  };
}
