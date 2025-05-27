import {
  type ChallengeInterface,
  createChallengeSignature,
  hashProblem,
  type SolutionInterface,
  solveChallenge,
  validateSolution,
  type ValidateSolutionResponse,
} from '@powcaptcha/core';

import { type Logger } from './logger';

/**
 * Simulate Client api, storing challenges and checking if the challenge is valid.
 * This code will run in the client side. It can be a browser or the client server.
 */
export default class ClientExample {
  isValidChallenge = async (secret: string, challenge: ChallengeInterface) => {
    // validate that the challenge came from the server by checking the signature
    const validChallengeSignature = await createChallengeSignature(secret, challenge);
    // check if the signature is valid
    return validChallengeSignature === challenge.signature;
  };

  solveChallenge = async (challenge: ChallengeInterface, logger: Logger): Promise<string> => {
    const solution = await solveChallenge(challenge, {
      onSolutionFound: (index, solution, totalSolutionsFound) => {
        hashProblem(challenge.signature, challenge.challenges[index].problem, solution)
          .then((hash) => {
            logger.log(
              `Solution ${index} of ${totalSolutionsFound} found! solution: ${solution} time: ${solution}ms hash: ${hash}`
            );
          })
          .catch((error) => {
            logger.log(`Error hashing problem: ${error}`);
          });
      },
    });
    // returning the solution as a base64 string just like we would do in the form submission
    return btoa(JSON.stringify(solution));
  };

  verifySolution = async (
    secret: string,
    solution: string,
    challenge: ChallengeInterface
  ): Promise<ValidateSolutionResponse> => {
    try {
      const parsedSolution = JSON.parse(atob(solution)) as SolutionInterface;
      return this.verifySolutionObject(secret, parsedSolution, challenge);
    } catch {
      return {
        isValid: false,
        error: 'INVALID_SOLUTION',
      };
    }
  };

  verifySolutionObject = async (
    secret: string,
    solution: SolutionInterface,
    challenge: ChallengeInterface
  ): Promise<ValidateSolutionResponse> => {
    const isValid = await this.isValidChallenge(secret, challenge);
    if (!isValid) {
      return {
        isValid: false,
        error: 'INVALID_CHALLENGE',
      };
    }

    return validateSolution(solution, challenge);
  };
}
