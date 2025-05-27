import type { ChallengeInterface } from './interfaces/challenge.interface';
import type { SolutionInterface } from './interfaces/solution.interface';

import { hashProblem } from './hash-problem';

export interface ValidateSolutionResponse {
  isValid: boolean;
  error?: 'EXPIRED' | 'INVALID_CHALLENGE' | 'INVALID_SOLUTION';
}

/**
 * Validates a solution against a given challenge.
 *
 * @param solution - The solution provided by the user, containing the challenge ID and solutions for each problem.
 * @param challenge - The challenge to validate against, containing the problems, difficulty levels, and TTL.
 * @returns A promise that resolves to a `ValidateSolutionResponse` object indicating whether the solution is valid
 *          and, if invalid, the reason for the failure.
 *
 * The validation process includes:
 * - Checking if the challenge's TTL (time-to-live) has expired.
 * - Verifying that the solution's `challenge_id` matches the challenge's `id`.
 * - Ensuring that each problem in the challenge has a corresponding solution in the provided solution.
 * - Computing the SHA-256 hash of the concatenated problem and solution, and verifying that it meets the required difficulty.
 *
 * Possible errors:
 * - `"EXPIRED"`: The challenge's TTL has expired.
 * - `"INVALID_CHALLENGE"`: The solution's `challenge_id` does not match the challenge's `id`.
 * - `"INVALID_SOLUTION"`: A solution is missing or does not meet the required difficulty.
 */
export const validateSolution = async (
  solution: SolutionInterface,
  challenge: ChallengeInterface
): Promise<ValidateSolutionResponse> => {
  // first check if ttl is not expired
  if (challenge.ttl && Date.now() > challenge.ttl) {
    return {
      isValid: false,
      error: 'EXPIRED',
    };
  }
  if (solution.challenge_id !== challenge.id) {
    return {
      isValid: false,
      error: 'INVALID_CHALLENGE',
    };
  }
  for (let i = 0; i < challenge.challenges.length; i++) {
    if (Array.isArray(solution.solutions) === false) {
      return {
        isValid: false,
        error: 'INVALID_SOLUTION',
      };
    }
    const n: number | null = solution.solutions[i];
    // check if index exists in solution and is a number
    if (typeof n !== 'number') {
      return {
        isValid: false,
        error: 'INVALID_SOLUTION',
      };
    }

    const problem = challenge.challenges[i].problem;
    const difficulty = challenge.challenges[i].difficulty;

    const hash = await hashProblem(challenge.signature, problem, n);

    if (!hash.startsWith('0'.repeat(difficulty))) {
      console.log('Invalid solution for problem', i, hash, n);
      return {
        isValid: false,
        error: 'INVALID_SOLUTION',
      };
    }
  }
  return {
    isValid: true,
  };
};
