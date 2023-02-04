export const endEventLoop = (): Promise<void> => new Promise(
  (resolve) => setTimeout(resolve, 2)
);
