import { EventBus, EventHandler } from './EventBus';
import { RabbitInstance } from './rabbitMq';

type EventName = string;

// TODO: inject logger
export class RabbitEventBus<TPayload> implements EventBus<TPayload> {
  private handlersByEvent = new Map<EventName, EventHandler<TPayload>[]>;

  constructor(
    private readonly channel: RabbitInstance['channel'],
    private readonly exchanges: RabbitInstance['exchanges'],
  ) {}

  emit(eventName: EventName, payload: unknown): Promise<void> {
    this.channel.publish(
      this.exchanges.default,
      eventName,
      Buffer.from(JSON.stringify(payload))
    );

    return Promise.resolve();
  }

  async on(event: EventName, handler: EventHandler<TPayload>): Promise<void> {
    await this.setUpEventQueue(event);

    this.registerEventHandler(event, handler);

    // TODO: this likely shouldn't be done on every handler registration, only
    // for the first one
    await this.registerEventConsumer(event);

    console.log(`[*] Subscribed to messages for ${event}`);
  }

  private async setUpEventQueue(eventName: EventName): Promise<void> {
    const { queue } = await this.channel.assertQueue(eventName);

    await this.channel.bindQueue(queue, this.exchanges.default, eventName);
  }

  private async registerEventConsumer(event: EventName): Promise<void> {
    await this.channel.consume(event, async (msg) => {
      console.log(`[${event}] Message received`, msg);

      if (!msg?.content) {
        console.log(`[${event}] Message without content`);

        return;
      }

      const parsedContent: TPayload = JSON.parse(msg.content.toString());

      console.log(`[${event}] Message:`, parsedContent);

      await Promise.all(
        this.handlersByEvent.get(event).map(h => h(parsedContent))
      );

      this.channel.ack(msg);

      console.log(
        `[${event}] Message processed and acked`,
        parsedContent
      );
    }, {
      noAck: false
    });
  }

  private registerEventHandler(
    eventName: EventName,
    handler: EventHandler<TPayload>
  ): void {
    const eventHandlers = this.handlersByEvent.get(eventName);

    eventHandlers ?
      eventHandlers.push(handler) :
      this.handlersByEvent.set(eventName, [handler]);
  }
}
