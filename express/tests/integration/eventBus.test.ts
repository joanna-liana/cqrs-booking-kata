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
    // TODO: enable after debug
    // [
    //   'In memory',
    //   (): EventBus => new InMemoryEventBus(
    //     new EventEmitter()
    //   ),
    // ],
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
    rabbit = await setUpEventBus({
      host: 'localhost',
      port: 5673
    });
  });

  beforeEach(async () => {
    await rabbit.channel.deleteQueue(EVENT_NAME);
  });

  afterAll(async () => {
    await rabbit.connection.close();
  });

  describe('processes messages using the provided handler', () => {
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

  describe('processes messages only for the registered events', () => {
    it.each(busFactories)('%s', async (_name, eventBusFactory) => {
      // given
      const ANOTHER_EVENT_NAME = EVENT_NAME + '_antoher';
      const message = 'test';
      const eventHandler = jest.fn();
      const eventBus = eventBusFactory();

      await eventBus.on(EVENT_NAME, eventHandler);

      // when
      await eventBus.emit(ANOTHER_EVENT_NAME, message);
      await endEventLoop();

      // then
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('processes messages with multiple handlers', () => {
    it.each(busFactories)('%s', async (_name, eventBusFactory) => {
      // given
      const message = 'test';
      const eventHandlerOne = jest.fn();
      const eventHandlerTwo = jest.fn();

      const eventBus = eventBusFactory();

      await eventBus.on(EVENT_NAME, eventHandlerOne);
      await eventBus.on(EVENT_NAME, eventHandlerTwo);

      // when
      await eventBus.emit(EVENT_NAME, message);
      await endEventLoop();

      // then
      expect(eventHandlerOne).toHaveBeenCalledWith(message);
      expect(eventHandlerTwo).toHaveBeenCalledWith(message);
    });
  });
});
