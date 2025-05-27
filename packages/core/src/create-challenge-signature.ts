import { hmacSign } from '@powcaptcha/crypto';

import type { ChallengeInterface } from './interfaces/challenge.interface';

/**
 * Generates a unique challenge signature by signing a hashed representation of the challenge object.
 * The challenge signature is used to identify a challenge and its solutions and to prevent tampering.
 * The `signature` property of the challenge is excluded from the hash to ensure consistency.
 *
 * @param secret - A secret key used for signing the challenge.
 * @param challenge - The challenge object to be signed. The `id` property will be excluded from the hash.
 * @returns A promise that resolves to the signed challenge ID as a string.
 */
export function createChallengeSignature(
  secret: string,
  challenge: ChallengeInterface
): Promise<string> {
  // remove id from challenge to hash before signing
  const toHashChallenge = {
    ...challenge,
    signature: undefined,
  };
  return hmacSign(secret, JSON.stringify(toHashChallenge));
}
