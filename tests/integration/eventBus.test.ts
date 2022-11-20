import EventEmitter from 'events';

import { EventBus } from '../../src/bookings/shared/infrastructure/EventBus';
import {
  InMemoryEventBus
} from '../../src/bookings/shared/infrastructure/InMemoryEventBus';
import {
  RabbitEventBus
} from '../../src/bookings/shared/infrastructure/RabbitEventBus';
import {
  RabbitInstance,
  setUpEventBus
} from '../../src/bookings/shared/infrastructure/rabbitMq';
import { endEventLoop } from '../helpers';

type EventBusFactory = () => EventBus;

describe('Event bus', () => {
  const EVENT_NAME = 'TEST EVENT';

  let rabbit: RabbitInstance;

  const busFactories: [string, EventBusFactory][] = [
    [
      'In memory',
      (): EventBus => new InMemoryEventBus(
        new EventEmitter()
      ),
    ],
    [
      'via RabbitMQ',
      (): EventBus => new RabbitEventBus(
        rabbit.channel,
        rabbit.exchanges
      )
    ]
  ];

  beforeAll(async () => {
    // TODO: use env var
    rabbit = await setUpEventBus('localhost:5673');
  });

  beforeEach(async () => {
    await rabbit.channel.deleteQueue(EVENT_NAME);
  });

  describe('processes messages', () => {
    it.each(busFactories)('%s', async (_name, eventBusFactory) => {
      // given
      const message = 'test';
      const eventHandler = jest.fn();
      const eventBus = eventBusFactory();

      await eventBus.on(EVENT_NAME, eventHandler);

      // when
      await eventBus.emit(EVENT_NAME, message);
      await endEventLoop();

      // then
      expect(eventHandler).toHaveBeenCalledWith(message);
    });
  });

  // TODO: test processesing messages only for the registered events
});
