export function encode(object: unknown): string {
  return btoa(JSON.stringify(object));
}
