import { EventBus } from '../../../src/bookings/shared/infrastructure/EventBus';
import {
  RabbitEventBus
} from '../../../src/bookings/shared/infrastructure/RabbitEventBus';

describe('Event bus', () => {
  const EVENT_NAME = 'TEST EVENT';

  let eventBus: EventBus<string>;

  beforeAll(() => {
    eventBus = new RabbitEventBus(
      global.rabbit.channel,
      global.rabbit.exchanges
    );
  });

  it('processes messages', async () => {
    // given
    let processingResult: string;

    await eventBus.on(EVENT_NAME, payload => {
      console.log('test handler');

      processingResult = payload + '_received';

      return Promise.resolve();
    });

    // when
    await eventBus.emit(EVENT_NAME, 'test');

    // then
    expect(processingResult).toBe('test_received');
  });
});
