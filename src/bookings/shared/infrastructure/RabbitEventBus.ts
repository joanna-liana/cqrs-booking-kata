import { EventBus, EventHandler } from './EventBus';
import { RabbitInstance } from './rabbitMq';

// TODO: inject logger
export class RabbitEventBus<TPayload> implements EventBus<TPayload> {
  private handlerByEvent = new Map<string, EventHandler<TPayload>[]>;

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

    await this.channel.bindQueue(queue, this.exchanges.default, eventName);

    this.handlerByEvent.get(eventName) ?
      this.handlerByEvent.get(eventName).push(handler) :
      this.handlerByEvent.set(eventName, [handler]);

    await this.channel.consume(queue, async (msg) => {
      console.log(`[${queue}] Message received`, msg);

      if (!msg?.content) {
        console.log(`[${queue}] Message without content`);

        return;
      }

      const parsedContent: TPayload = JSON.parse(msg.content.toString());

      console.log(`[${queue}] Message:`, parsedContent);

      await Promise.all(
        this.handlerByEvent.get(eventName).map(h => h(parsedContent))
      );

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
