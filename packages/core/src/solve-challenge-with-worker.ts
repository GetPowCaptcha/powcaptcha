import type { ChallengeInterface } from './interfaces/challenge.interface';
import type { SolutionInterface } from './interfaces/solution.interface';

/**
 * Parameters for solving a challenge.
 *
 * @property abortController - An optional `AbortController` instance to allow cancellation of the challenge-solving process.
 * @property onStarted - A callback function that is invoked when the challenge-solving process starts.
 * @property onProblemStarted - A callback function that is invoked when a specific problem within the challenge starts.
 * Receives the problem's index as an argument.
 * @property onSolutionFound - A callback function that is invoked when a solution for a specific problem is found.
 * Receives the problem's index, the solution item as arguments and the total number of solutions found.
 * @property onEnded - A callback function that is invoked when the challenge-solving process ends.
 * Receives the solution object as an argument.
 */
interface SolveChallengeWithWorkerParams {
  getWorker: () => Worker | Promise<Worker>;
  abortController?: AbortController;
  onStarted?: () => void;
  onEnded?: (solution: SolutionInterface) => void;
  onProblemStarted?: (index: number) => void;
  onSolutionFound?: (index: number, solution: number, totalSolutionsFound: number) => void;
}

/**
 * Solves a given challenge using Web Workers for parallel computation,
 * finding solutions to its problems based on the specified difficulty.
 *
 * @param challenge - The challenge object containing the problems to solve and their respective difficulties.
 * @param params - Optional parameters to customize the solving process, including callbacks and an AbortController.
 *
 * @returns A promise that resolves to a `Solution` object containing the challenge ID and an array of solutions for each problem.
 *
 * @throws Will throw an error if the challenge is invalid, workers are unsupported, or if the solving process is aborted.
 */
export async function solveChallengeWithWorker(
  challenge: ChallengeInterface,
  params: SolveChallengeWithWorkerParams
): Promise<SolutionInterface> {
  if (typeof Worker === 'undefined') {
    throw new Error('Web Workers are not supported in this environment.');
  }
  if (!challenge?.challenges || challenge.challenges.length === 0) {
    throw new Error('Invalid challenge');
  }

  const { getWorker, onStarted, onProblemStarted, onSolutionFound, abortController, onEnded } =
    params;
  const started = Date.now();
  const solutions: SolutionInterface = {
    challenge_id: challenge.id,
    // pre fill with null values
    solutions: new Array(challenge.challenges.length).fill(null),
    time: 0,
  };
  let totalSolutionsFound = 0;
  const workers: Worker[] = [];
  const promises: Promise<void>[] = [];

  onStarted?.();

  challenge.challenges.forEach((challengeItem, index) => {
    const promise = new Promise<void>((resolve, reject) => {
      const buildWorker = async () => {
        const worker = await getWorker();
        workers.push(worker);

        worker.onmessage = (event: MessageEvent) => {
          const {
            status,
            index: workerIndex,
            solution,
            error,
          } = event.data as {
            status: string;
            index: number;
            solution: number;
            error?: string;
          };

          switch (status) {
            case 'solved':
              if (solutions.solutions[workerIndex] === null) {
                solutions.solutions[workerIndex] = solution;
                totalSolutionsFound++;
                onSolutionFound?.(workerIndex, solution, totalSolutionsFound);
              }
              worker.terminate();
              resolve();
              break;

            case 'error':
              console.error(`Worker ${workerIndex} reported error:`, error);
              worker.terminate();
              reject(new Error(`Worker ${workerIndex} failed: ${error}`));
              break;

            case 'ready':
              onProblemStarted?.(index);
              worker.postMessage({
                challengeSignature: challenge.signature,
                challengeItem: challengeItem,
                index: index,
              });
              break;
          }
        };

        worker.onerror = (event: ErrorEvent) => {
          console.error(`Error in Worker ${index}:`, event.message, event);
          worker.terminate();
          reject(new Error(`Worker ${index} error: ${event.message}`));
        };

        abortController?.signal.addEventListener(
          'abort',
          () => {
            worker.terminate();
            reject(new Error('Aborted'));
          },
          { once: true }
        );
      };
      void buildWorker();
    });

    promises.push(promise);
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error('Challenge solving failed or was aborted:', error);

    workers.forEach((worker) => {
      try {
        worker.terminate();
      } catch {
        // Ignore
      }
    });

    throw error instanceof Error ? error : new Error('Challenge solving failed or was aborted');
  }

  if (abortController?.signal.aborted) {
    workers.forEach((worker) => {
      try {
        worker.terminate();
      } catch {
        // Ignore
      }
    });
    throw new Error('Aborted');
  }

  solutions.time = Date.now() - started;
  onEnded?.(solutions);

  return solutions;
}
