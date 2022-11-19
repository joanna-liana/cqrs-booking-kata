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

  async on(eventName: string, handler: EventHandler<TPayload>): Promise<void> {
    const { queue } = await this.channel.assertQueue(eventName);

    console.log(`[*] Subscribed to messages in ${queue}`);

    await this.channel.bindQueue(queue, this.exchanges.default, '');

    await this.channel.consume(queue, async (msg) => {
      console.log(`[${queue}] Message received`);

      if (!msg?.content) {
        console.log(`[${queue}] Message without content`);

        return;
      }

      const parsedContent: TPayload = JSON.parse(msg.content.toString());

      console.log(`[${queue}] Message:`, parsedContent);

      await handler(parsedContent);

      this.channel.ack(msg);

      console.log(
        `[${queue}] Message processed and acked`,
        parsedContent
      );
    }, {
      noAck: false
    });
  }
}
