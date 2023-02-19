export type EventPayload<TPayload> = object & TPayload;

export type EventHandler<TPayload = unknown> = (
  payload: EventPayload<TPayload>
) => Promise<void>;

export interface EventBus<EventPayload> {
  on: (eventName: string, handler: EventHandler<EventPayload>) => Promise<void>;
  emit: (eventName: string, payload: unknown) => Promise<void>;
}
