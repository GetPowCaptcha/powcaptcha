import { getRandomValues } from '@powcaptcha/crypto';

import type { ChallengeInterface } from './interfaces/challenge.interface';

import { createChallengeSignature } from './create-challenge-signature';

export type CreateChallengeParams = {
  secret: string;
  difficulty?: number;
  challengesCount?: number;
  variableDifficulty?: {
    min: number;
    max: number;
  };
} & Omit<ChallengeInterface, 'id' | 'signature' | 'challenges'>;

/**
 * Creates a challenge object with a specified number of challenges, difficulty, and time-to-live (TTL).
 *
 * @param params - The parameters for creating the challenge.
 * @param params.secret - A required secret string used for generating the challenge ID.
 * @param params.difficulty - The default difficulty level for the challenges (default is 3).
 * @param params.ttl - The time-to-live for the challenge in milliseconds (default is 1 day).
 * @param params.challenges - The number of challenges to generate (default is 10).
 * @param params.variableDifficulty - An optional object specifying a range for variable difficulty.
 * @param params.variableDifficulty.min - The minimum difficulty level (must be greater than 0).
 * @param params.variableDifficulty.max - The maximum difficulty level (must be greater than 0 and greater than or equal to `min`).
 *
 * @returns A promise that resolves to a `Challenge` object containing the generated challenges.
 *
 * @throws {Error} If the `secret` parameter is not valid.
 * @throws {Error} If the `challenges` parameter is less than 1.
 * @throws {Error} If `variableDifficulty.min` or `variableDifficulty.max` is less than 1.
 * @throws {Error} If `variableDifficulty.min` is greater than `variableDifficulty.max`.
 */
export async function createChallenge({
  secret,
  difficulty: defaultDifficulty = 3,
  variableDifficulty,
  // 1 day ttl
  ttl = 24 * 60 * 60 * 1000,
  challengesCount = 10,
  version = 1,
  ...rest
}: CreateChallengeParams): Promise<ChallengeInterface> {
  const challenge: ChallengeInterface = {
    id: 'chlg_' + crypto.randomUUID().replace(/-/g, ''),
    signature: '',
    ttl: Date.now() + ttl,
    challenges: [],
    version,
    ...rest,
  };
  // Validate params
  if (!secret) {
    throw new Error('secret is required');
  }
  if (challengesCount < 1) {
    throw new Error('challenges must be greater than 0');
  }

  if (variableDifficulty) {
    if (variableDifficulty.min < 1 || variableDifficulty.max < 1) {
      throw new Error('variableDifficulty min and max must be greater than 0');
    }
    if (variableDifficulty.min > variableDifficulty.max) {
      throw new Error('variableDifficulty min must be less than variableDifficulty max');
    }
  }

  for (let i = 0; i < challengesCount; i++) {
    const problem = getRandomValues();
    let difficulty = defaultDifficulty;
    if (variableDifficulty) {
      difficulty = Math.floor(
        Math.random() * (variableDifficulty.max + 1 - variableDifficulty.min) +
          variableDifficulty.min
      );
    }
    challenge.challenges.push({
      problem,
      difficulty,
    });
  }

  challenge.signature = await createChallengeSignature(secret, challenge);

  return challenge;
}
