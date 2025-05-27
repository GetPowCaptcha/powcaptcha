import type { ChallengeInterface } from '@powcaptcha/core';
import * as powcaptcha from '@powcaptcha/core';
import { createLogger } from '@powcaptcha/logger';

import workerScriptUrl from './workers/challenge-solver.worker.js?worker&inline';

import type {
  CreateChallengeConfig,
  CreateChallengeErrorResponseInterface,
  CreateChallengeResponseInterface,
  SolveChallengeConfig,
} from './types';

const Logger = createLogger('widget:service');

/**
 * Service function to create a PoW challenge by fetching it from the backend.
 * @param config - Configuration object containing appId, backendUrl, signalsData, fingerprint.
 * @returns A Promise resolving with the ChallengeInterface object.
 * @throws If fetching or parsing fails, or if the API returns an error.
 */
export async function createChallengeService(
  config: CreateChallengeConfig
): Promise<ChallengeInterface> {
  Logger.log('Creating challenge...');
  const { appId, backendUrl, signalsData, fingerprint } = config;

  if (!appId) throw new Error('Public key is missing');

  const data = {
    app_id: appId,
    fingerprint: fingerprint,
    context: config.context,
    signals: signalsData,
  };
  const endpoint = `${backendUrl}/challenges/create`;
  let response: Response | null = null;

  try {
    // Try with compression first
    const compressedData = await powcaptcha.compress(JSON.stringify(data));
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
      },
      body: compressedData,
    });
  } catch (error) {
    Logger.warn('Compression failed or not supported, trying without.', error);
    // Fallback to no compression
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  if (!response?.ok) {
    const errorObject = (await response?.json()) as CreateChallengeErrorResponseInterface;
    Logger.error(
      `powCaptcha Service: Error fetching challenge (${response?.status}): ${errorObject?.error?.message}`
    );
    throw new Error(`${errorObject?.error?.message ?? 'Unknown error'}`);
  }

  const body = (await response.json()) as CreateChallengeResponseInterface;

  if (!body.success) {
    Logger.error('Error creating challenge from backend:', body.message);
    throw new Error(`Error creating challenge: ${body.message}`);
  }

  if (body.type !== 'item' || !body.data) {
    Logger.error('Invalid challenge response format:', body);
    throw new Error('Invalid challenge response format');
  }

  Logger.log('Challenge created successfully.');
  return body.data;
}

/**
 * Service function to solve a PoW challenge.
 * @param config - Configuration object containing the challenge and progress callback.
 * @returns A Promise resolving with the encoded solution token string.
 * @throws If solving fails.
 */
export async function solveChallengeService(config: SolveChallengeConfig): Promise<string> {
  Logger.log('Starting challenge solving process...');
  const { challenge, onProgress } = config;

  if (!challenge) throw new Error('Challenge object is required for solving.');

  const onSolutionFound = (_index: number, _solution: number, totalSolutionFound: number) => {
    // Calculate progress and call the callback
    const totalChallenges = challenge.challenges?.length || 1;
    const progress = Math.min(100, Math.floor((totalSolutionFound / totalChallenges) * 100));
    Logger.log(
      `powCaptcha Service: Progress - ${progress}% (${totalSolutionFound} solutions found)`
    );
    onProgress(progress);
  };

  try {
    const getWorker = () => {
      return new workerScriptUrl();
    };
    const solution = await powcaptcha.solveChallengeWithWorker(challenge, {
      getWorker: getWorker,
      abortController: config.abortController,
      onSolutionFound: onSolutionFound,
    });
    const encodedSolution = powcaptcha.encode(solution);
    Logger.log('Challenge solved. Encoded Solution generated.');
    return encodedSolution;
  } catch (error) {
    if (!window.isSecureContext) {
      console.warn(
        '[powCaptcha] You are not in a secure context. We will try to solve the challenge without a worker. But this may be slower and will block the UI. Please consider using a secure context.'
      );
      try {
        const solution = await powcaptcha.solveChallenge(challenge, {
          onSolutionFound: onSolutionFound,
          abortController: config.abortController,
        });
        const encodedSolution = powcaptcha.encode(solution);
        return encodedSolution;
      } finally {
        Logger.log('Challenge solving process finished.');
      }
    }
    Logger.error('Error solving challenge:', error);
    throw error;
  } finally {
    Logger.log('Challenge solving process finished.');
  }
}
