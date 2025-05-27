/**
 * Helper function to execute a promise with a timeout.
 * @param promise The promise to execute.
 * @param timeoutMs The maximum wait time in milliseconds.
 * @param timeoutValue The value to return if the promise exceeds the timeout.
 * @returns A promise that resolves with the result of the original promise or with timeoutValue.
 */
export function promiseWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutValue: T | { error: string } = { error: 'timeout' }
): Promise<T | { error: string }> {
  if (timeoutMs <= 0) {
    return promise; // Timeout disabled
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T | { error: string }>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve(timeoutValue);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}
