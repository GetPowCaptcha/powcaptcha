import { uint8ArrayToHex } from "./uint8-array-to-hex";

/**
 * Computes the SHA-256 hash of the given input string.
 *
 * @param data - The input string to hash.
 * @returns A promise that resolves to the hexadecimal representation of the SHA-256 hash.
 */
export async function sha256(data: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    {
      name: "SHA-256",
    },
    new TextEncoder().encode(data)
  );
  return uint8ArrayToHex(new Uint8Array(hash));
}
