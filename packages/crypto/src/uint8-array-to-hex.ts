/**
 * Converts a Uint8Array to its hexadecimal string representation.
 *
 * Each byte in the Uint8Array is converted to a two-character hexadecimal string,
 * and the resulting strings are concatenated together.
 *
 * @param uint8Array - The Uint8Array to be converted to a hexadecimal string.
 * @returns The hexadecimal string representation of the input Uint8Array.
 */
export function uint8ArrayToHex(uint8Array: Uint8Array): string {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
