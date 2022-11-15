import { EventBus, EventHandler } from './EventBus';
import { RabbitInstance } from './rabbitMq';

// TODO: inject logger
export class RabbitEventBus<TPayload> implements EventBus<TPayload> {
  constructor(
    private readonly channel: RabbitInstance['channel'],
    private readonly exchanges: RabbitInstance['exchanges'],
  ) {}

  emit(eventName: string, payload: unknown): Promise<void> {
    this.channel.publish(
      this.exchanges.default,
      eventName,
      Buffer.from(JSON.stringify(payload))
    );

    return Promise.resolve();
  }

  // TODO: test this
  async on(eventName: string, handler: EventHandler<TPayload>): Promise<void> {
    const { queue } = await this.channel.assertQueue(eventName);

    console.log(`[*] Subscribed to messages in ${queue}`);

    this.channel.bindQueue(queue, this.exchanges.default, '');

    this.channel.consume(queue, async (msg) => {
      if (!msg.content) {
        console.log(`[${queue}] Message without content`);

        return;
      }

      const parsedContent: TPayload = JSON.parse(msg.content.toString());

      console.log(`[${queue}] Message:`, parsedContent);

      await handler(parsedContent);

      this.channel.ack(msg);
    }, {
      noAck: false
    });
  }
}
