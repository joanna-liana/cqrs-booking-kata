import { EventEmitter } from 'events';

import { EventBus, EventHandler } from './EventBus';


export class InMemoryEventBus implements EventBus {
  constructor(private readonly eventEmitter = new EventEmitter()) {}

  emit(eventName: string, payload: unknown): Promise<void> {
    this.eventEmitter.emit(eventName, payload);

    return Promise.resolve();
  }

  on(eventName: string, handler: EventHandler): Promise<void> {
    this.eventEmitter.on(eventName, handler);

    return Promise.resolve();
  }
}
