import { DaprEventBus, DaprEventBusProps } from './dapr/DaprEventBus';
import { EventBus } from './eventBus';
import { RabbitEventBus } from './rabbit/RabbitEventBus';
import { RabbitInstance } from './rabbit/rabbitMq';

export enum EventBusType {
  RABBIT = 'Rabbit',
  DAPR = 'Dapr'
}

export type EventBusConfig = {
  type: EventBusType.RABBIT;
  props: RabbitInstance;
} | {
  type: EventBusType.DAPR;
  props: DaprEventBusProps;
}

type EventBusFactory = <TPayload>(props: unknown) => EventBus<TPayload>;

const eventBusFactory: Record<EventBusType, EventBusFactory> = {
  [EventBusType.RABBIT]: (props: RabbitInstance) => new RabbitEventBus(
    props.channel,
    props.exchanges
  ),
  [EventBusType.DAPR]: (props: DaprEventBusProps) => new DaprEventBus(
    props.pubSubName,
    props.server.pubsub
  ),
};


export function createEventBus<TPayload>(
  config: EventBusConfig
): EventBus<TPayload> {
  return eventBusFactory[config.type](config.props);
}
