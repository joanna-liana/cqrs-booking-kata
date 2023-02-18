import { DaprClient } from '@dapr/dapr';
import IServerPubSub from '@dapr/dapr/interfaces/Server/IServerPubSub';

import { EventBus, EventHandler } from './EventBus';

type EventName = string;

// TODO: inject logger
export class DaprEventBus<
  TPayload extends object
> implements EventBus<TPayload> {
  private readonly client: DaprClient;
  private handlersByEvent = new Map<EventName, EventHandler<TPayload>[]>;

  constructor(
    private readonly pubSubName: string,
    private readonly pubSubServer: IServerPubSub,
  ) {

    this.client = new DaprClient('localhost', '50000');
  }

  emit(eventName: EventName, payload: TPayload): Promise<void> {
    this.client.pubsub.publish(
      this.pubSubName,
      eventName,
      payload
    );

    return Promise.resolve();
  }

  async on(event: EventName, handler: EventHandler<TPayload>): Promise<void> {
    this.registerEventHandler(event, handler);

    // TODO: this likely shouldn't be done on every handler registration, only
    // for the first one
    await this.registerEventConsumer(event);

    console.log(`[*] Subscribed to messages for ${event}`);
  }

  private async registerEventConsumer(event: EventName): Promise<void> {

    await this.pubSubServer.subscribe(
      this.pubSubName,
      event,
      async (data: TPayload) => {
        console.log(`[${event}] Message received:`, data);

        await Promise.all(
          this.handlersByEvent.get(event).map(h => h(data))
        );

        console.log(
          `[${event}] Message processed:`,
          data
        );
      }
    );
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
