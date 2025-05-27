import { uint8ArrayToHex } from "./uint8-array-to-hex";

/**
 * Generates a cryptographically secure random value and returns it as a hexadecimal string.
 *
 * This method uses the `crypto.getRandomValues` function to create a random
 * 32-byte Uint8Array and then converts it to a hexadecimal string representation.
 *
 * @returns {string} A hexadecimal string representing the generated random value.
 */
export function getRandomValues(): string {
  const randomProblem = crypto.getRandomValues(new Uint8Array(32));
  return uint8ArrayToHex(randomProblem);
}
