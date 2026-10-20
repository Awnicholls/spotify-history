/** Resolve after `ms` milliseconds. */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run `task` for each item one after another (not in parallel), in order. For work that must
 * stay ordered or gentle on an API, without awaiting inside a loop.
 */
export const runSequentially = <T>(items: readonly T[], task: (item: T, index: number) => Promise<unknown>): Promise<void> =>
  items.reduce<Promise<void>>(
    (previous, item, index) =>
      previous.then(async () => {
        await task(item, index);
      }),
    Promise.resolve(),
  );

/**
 * Call `check` every `intervalMs` until it returns something other than `undefined`, or
 * `timeoutMs` runs out (then the last result, `undefined`, is returned).
 */
export const pollUntil = async <T>(
  check: () => Promise<T | undefined> | T | undefined,
  timeoutMs: number,
  intervalMs: number,
): Promise<T | undefined> => {
  const result = await check();
  if (result !== undefined || timeoutMs <= 0) {return result;}
  await sleep(intervalMs);
  return pollUntil(check, timeoutMs - intervalMs, intervalMs);
};
