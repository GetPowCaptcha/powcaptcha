import type { ChallengeInterface, ChallengeItem } from './interfaces/challenge.interface';
import type { SolutionInterface } from './interfaces/solution.interface';

import { hashProblem } from './hash-problem';

/**
 * Parameters for solving a challenge.
 *
 * @property abortController - An optional `AbortController` instance to allow cancellation of the challenge-solving process.
 * @property onStarted - A callback function that is invoked when the challenge-solving process starts.
 * @property onProblemStarted - A callback function that is invoked when a specific problem within the challenge starts.
 *                              Receives the problem's index as an argument.
 * @property onSolutionFound - A callback function that is invoked when a solution for a specific problem is found.
 *                              Receives the problem's index, the solution item as arguments and the total number of solutions found.
 * @property onEnded - A callback function that is invoked when the challenge-solving process ends.
 *                    Receives the solution object as an argument.
 */
interface SolveChallengeParams {
  abortController?: AbortController;
  onStarted?: () => void;
  onEnded?: (solution: SolutionInterface) => void;
  onProblemStarted?: (index: number) => void;
  onSolutionFound?: (index: number, solution: number, totalSolutionsFound: number) => void;
}

/**
 * Solves a given challenge by finding solutions to its problems based on the specified difficulty.
 *
 * Note: This method is intended for development purposes only as it will block the main thread and is not efficient.
 * It serves as a fallback for non-secure domains, but it is not advisable to use in production environments. Please see @solveChallengeWithWorker for a more efficient solution.
 *
 * @param challenge - The challenge object containing the problems to solve and their respective difficulties.
 * @param params - Optional parameters to customize the solving process.
 * @param params.onStarted - Callback invoked when the solving process starts.
 * @param params.onProblemStarted - Callback invoked when solving of a specific problem starts, with the problem index as an argument.
 * @param params.onSolutionFound - Callback invoked when a solution is found for a specific problem, with the problem index and solution details as arguments.
 * @param params.abortController - An AbortController instance to allow cancellation of the solving process.
 * @param params.onEnded - Callback invoked when the solving process ends.
 *
 * @returns A promise that resolves to a `Solution` object containing the challenge ID and an array of solutions for each problem.
 *
 * @throws Will throw an error if the challenge is invalid or if the solving process is aborted.
 */
export async function solveChallenge(
  challenge: ChallengeInterface,
  params?: SolveChallengeParams
): Promise<SolutionInterface> {
  // check if challenge is valid
  if (!challenge?.challenges || challenge.challenges.length === 0) {
    throw new Error('Invalid challenge');
  }
  const { onStarted, onProblemStarted, onSolutionFound, abortController } = params ?? {};

  const started = Date.now();

  const solutions: SolutionInterface = {
    challenge_id: challenge.id,
    solutions: [],
    time: Date.now(),
  };
  if (onStarted) {
    onStarted();
  }
  let totalSolutionsFound = 0;
  // internal function to solve a challenge asynchronously
  const solveChallengeInternal = async (challengeItem: ChallengeItem, i: number) => {
    if (onProblemStarted) {
      onProblemStarted(i);
    }
    const problem = challengeItem.problem;
    const difficulty = challengeItem.difficulty;
    let n = 0;

    while (true) {
      if (abortController?.signal.aborted) {
        throw new Error('Aborted');
      }
      // try to find a sha226 with difficulty number of leading zeros
      const hash = await hashProblem(challenge.signature, problem, n);
      if (hash?.startsWith('0'.repeat(difficulty))) {
        solutions.solutions[i] = n;
        totalSolutionsFound++;
        if (onSolutionFound) {
          onSolutionFound(i, solutions.solutions[i], totalSolutionsFound);
        }
        break;
      }
      n++;
      // to avoid blocking the main thread, we can yield the event loop each 1000 iterations on browsers
      if (typeof window !== 'undefined') {
        if (n % 1000 === 0) {
          await new Promise((resolve) => setTimeout(() => resolve(true), 0));
        }
      }
    }
  };

  // we can solve all challenges in parallel
  await Promise.allSettled(
    challenge.challenges.map((challengeItem, i) => solveChallengeInternal(challengeItem, i))
  );

  if (abortController?.signal.aborted) {
    throw new Error('Aborted');
  }

  solutions.time = Date.now() - started;

  if (params?.onEnded) {
    params.onEnded(solutions);
  }

  return solutions;
}
