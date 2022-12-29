export type EventHandler<TPayload = unknown> = (
  payload: TPayload,
) => Promise<void>;

export interface EventBus<TPayload = unknown> {
  on: (eventName: string, handler: EventHandler<TPayload>) => Promise<void>;
  emit: (eventName: string, payload: unknown) => Promise<void>;
}
