import { hmacSign } from "./hmac-sign";
/**
 * Verifies the integrity and authenticity of a message by comparing its HMAC signature
 * with an expected signature generated using the provided secret key.
 *
 * @param secret - The secret key used to generate the HMAC signature.
 * @param message - The message whose signature needs to be verified.
 * @param signature - The HMAC signature to compare against.
 * @returns A promise that resolves to `true` if the signatures match, otherwise `false`.
 */
export async function hmacVerify(
  secret: string,
  message: string,
  signature: string
): Promise<boolean> {
  const expectedSignature = await hmacSign(secret, message);
  return expectedSignature === signature;
}
