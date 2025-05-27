export function decode<T = unknown>(value: string): T {
  return JSON.parse(atob(value)) as T;
}
