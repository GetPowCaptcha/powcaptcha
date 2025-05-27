import { uint8ArrayToHex } from "./uint8-array-to-hex";

/**
 * Generates an HMAC (Hash-based Message Authentication Code) signature for a given message
 * using the specified secret key and the SHA-256 hashing algorithm.
 *
 * @param secret - The secret key used to generate the HMAC signature.
 * @param message - The message to be signed.
 * @returns A promise that resolves to the HMAC signature as a hexadecimal string.
 *
 */
export async function hmacSign(
  secret: string,
  message: string
): Promise<string> {
  // Navegador
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  return uint8ArrayToHex(new Uint8Array(signature));
}
