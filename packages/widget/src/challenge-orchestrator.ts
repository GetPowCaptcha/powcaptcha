import { type ChallengeInterface, encode } from '@powcaptcha/core';
import { generateFingerprint } from '@powcaptcha/fingerprint';
import { createLogger } from '@powcaptcha/logger';
import type { CollectedSignalData } from '@powcaptcha/signals';

import { t } from './localization';
import { createChallengeService, solveChallengeService } from './service';

const Logger = createLogger('widget:orchestrator');

export interface OrchestratorCallbacks {
  onLoadingChange: (isLoading: boolean) => void;
  onStatusUpdate: (message: string) => void;
  onProgress: (progress: number) => void;
  onSolved: (token: string) => void;
  onError: (error: Error, message: string) => void;
}

export interface OrchestratorConfig {
  appId?: string;
  backendUrl?: string;
  context?: string;
}

export class ChallengeOrchestrator {
  private config: OrchestratorConfig;
  private callbacks: OrchestratorCallbacks;
  private challengeObject?: ChallengeInterface;
  private isSolving = false;
  private abortController?: AbortController;

  constructor(config: OrchestratorConfig, callbacks: OrchestratorCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
    this.abortController = new AbortController();
    Logger.log('Orchestrator initialized.');
  }

  /**
   * Resets the internal state of the orchestrator.
   */
  public reset(): void {
    Logger.log('Resetting orchestrator state.');
    this.challengeObject = undefined;
    this.isSolving = false;
    this.abortController?.abort(); // Abort any ongoing process
    // Create a new one for future use
    this.abortController = new AbortController();
  }

  /**
   * Creates a new challenge by calling the backend service.
   * Notifies the component of state changes via callbacks.
   * @param signalsData - The collected signals data.
   * @returns The created challenge object.
   * @throws If challenge creation fails.
   */
  private async createChallenge(signalsData: CollectedSignalData): Promise<ChallengeInterface> {
    if (!this.config.appId) {
      // Let the solve method handle the onError callback for this
      throw new Error('Site key is required.');
    }

    this.callbacks.onStatusUpdate(t('widget.challenge-orchestrator.initializing'));

    try {
      const fingerprint = encode(await generateFingerprint());
      const challenge = await createChallengeService({
        appId: this.config.appId,
        backendUrl: this.config.backendUrl ?? 'http://localhost:4321',
        signalsData: signalsData,
        fingerprint: fingerprint,
        context: this.config.context,
      });
      this.challengeObject = challenge;
      this.callbacks.onStatusUpdate(t('widget.challenge-orchestrator.ready'));
      Logger.log('Challenge created successfully.');
      return challenge;
    } catch (error) {
      Logger.error('Failed to create challenge:', error);
      this.callbacks.onError(
        error as Error,
        t('widget.challenge-orchestrator.error-creating-challenge')
      );
      throw error; // Re-throw
    }
  }

  /**
   * Orchestrates the full challenge solving process:
   * 1. Creates a challenge if one doesn't exist.
   * 2. Solves the challenge using the service.
   * 3. Notifies the component of state changes (loading, progress, solved, error) via callbacks.
   * @param signalsData - The collected signals data, required for creating a challenge if needed.
   * @returns A promise that resolves with the solution token on success.
   * @throws If the process fails at any stage.
   */
  public async solve(signalsData: CollectedSignalData): Promise<string> {
    if (this.isSolving) {
      Logger.warn('Solve called while already solving.');
      return Promise.reject(new Error('Already solving challenge.'));
    }
    this.isSolving = true;
    this.callbacks.onLoadingChange(true);
    this.callbacks.onStatusUpdate(t('widget.challenge-orchestrator.verifying'));

    try {
      // Ensure challenge object exists
      if (!this.challengeObject) {
        Logger.warn('No challenge object found, creating one first.');
        await this.createChallenge(signalsData);
        if (!this.challengeObject) {
          throw new Error('Failed to get challenge object after creation attempt.');
        }
      }

      // Solve the challenge
      Logger.log('Starting challenge solving process...');
      this.callbacks.onStatusUpdate(t('widget.challenge-orchestrator.verifying-please-wait'));

      const token = await solveChallengeService({
        abortController: this.abortController!,
        challenge: this.challengeObject,
        onProgress: (progress) => {
          this.callbacks.onProgress(progress);
        },
      });

      // Notify success via callback
      Logger.log('Challenge solved successfully.');
      this.callbacks.onSolved(token);
      return token;
    } catch (error) {
      Logger.error('Error during challenge solving orchestration:', error);
      const message =
        error instanceof Error && error.message.includes('Public key')
          ? 'Error: Public key missing.'
          : 'Verification failed. Please try again.';
      this.callbacks.onError(error as Error, message);
      throw error;
    } finally {
      this.isSolving = false;
      this.callbacks.onLoadingChange(false);
      Logger.log('Challenge solving orchestration finished.');
    }
  }
}
