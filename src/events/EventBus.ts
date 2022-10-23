
export type EventHandler<TPayload = unknown> = (
  payload: TPayload
) => Promise<void>;

export interface EventBus {
  on: (eventName: string, handler: EventHandler) => Promise<void>;
  emit: (eventName: string, payload: unknown) => Promise<void>;
}
