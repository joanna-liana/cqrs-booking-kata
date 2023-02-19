import EventEmitter from 'events';

/* eslint-disable max-len */
import {
  EventBus
} from '../../src/bookings/shared/infrastructure/eventBus/eventBus';
import {
  InMemoryEventBus
} from '../../src/bookings/shared/infrastructure/eventBus/inMemory/InMemoryEventBus';
import {
  RabbitEventBus
} from '../../src/bookings/shared/infrastructure/eventBus/rabbit/RabbitEventBus';
import {
  RabbitInstance,
  setUpEventBus
} from '../../src/bookings/shared/infrastructure/eventBus/rabbit/rabbitMq';
/* eslint-enable max-len */
import { endEventLoop } from '../helpers';


type EventBusFactory = () => EventBus<unknown>;

let rabbit: RabbitInstance;

const busFactories: [string, EventBusFactory][] = [
  [
    'In memory',
    (): EventBus<unknown> => new InMemoryEventBus(
      new EventEmitter()
    ),
  ],
  [
    'via RabbitMQ',
    (): EventBus<unknown> => new RabbitEventBus(
      rabbit.channel,
      rabbit.exchanges
    )
  ]
  // TODO: test dapr version
];

busFactories.forEach(([_name, eventBusFactory]) => {
  describe('Event bus: ' + _name, () => {
    const EVENT_NAME = 'TEST EVENT';

    beforeAll(async () => {
      if (_name !== 'via RabbitMQ') {
        return;
      }

      // TODO: use env var
      rabbit = await setUpEventBus({
        host: 'localhost',
        port: 5673
      });
    });

    beforeEach(async () => {
      if (_name !== 'via RabbitMQ') {
        return;
      }

      await rabbit.channel.deleteQueue(EVENT_NAME);
    });

    afterAll(async () => {
      if (_name !== 'via RabbitMQ') {
        return;
      }

      await rabbit.connection.close();
    });

    it('processes messages using the provided handler', async () => {
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

    it('processes messages only for the registered events', async () => {
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

    it('processes messages with multiple handlers', async () => {
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
