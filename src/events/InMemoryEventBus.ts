import { EventEmitter } from 'events';

import { EventBus, EventHandler } from './EventBus';


export class InMemoryEventBus<TPayload> implements EventBus<TPayload> {
  constructor(private readonly eventEmitter = new EventEmitter()) {}

  emit(eventName: string, payload: unknown): Promise<void> {
    this.eventEmitter.emit(eventName, payload);

    return Promise.resolve();
  }

  on(eventName: string, handler: EventHandler<TPayload>): Promise<void> {
    this.eventEmitter.on(eventName, handler);

    return Promise.resolve();
  }
}
