import { sha256 } from "@powcaptcha/crypto";

/**
 * Computes a SHA-256 hash for a given challenge, problem, and number.
 *
 * @param challenge - The challenge object containing the signature.
 * @param problem - The problem string to be hashed.
 * @param n - A numeric value to include in the hash computation.
 * @returns A promise that resolves to the computed hash as a string.
 */
export function hashProblem(
  challengeSignature: string,
  problem: string,
  n: number
): Promise<string> {
  return sha256(challengeSignature + problem + n);
}
