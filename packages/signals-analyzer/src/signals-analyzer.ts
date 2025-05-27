import { createLogger } from '@powcaptcha/logger';

import { identifySyntheticSubmitClicks } from './utils/identify-synthetic-submit-clicks';

import { AnalyzerConstants, type HeuristicConstants } from './constants';
import { defaultHeuristics } from './heuristics';
import type { CollectedSignalData, HeuristicContext, HeuristicSource } from './types';

const Logger = createLogger('signals-analyzer');

/**
 * @class SignalsAnalyzer
 * @description Analyzes collected signal data to determine the probability of human-like behavior.
 * 0 = likely bot, 1 = likely human.
 */
export class SignalsAnalyzer {
  private data: CollectedSignalData;
  private score = 0.5;
  private constants: HeuristicConstants = AnalyzerConstants;
  private heuristics: HeuristicSource[];

  constructor(
    collectedData: CollectedSignalData,
    heuristicsToRun: HeuristicSource[] = defaultHeuristics
  ) {
    this.data = collectedData;
    this.heuristics = heuristicsToRun;
  }

  /**
   * Calculates the probability score indicating human-like behavior (0=synthetic, 1=human).
   * @returns The calculated score between 0 and 1.
   */
  public calculateProbability(): number {
    this.score = 0.5; // Start with a neutral score
    Logger.log(`Starting analysis...`);

    // Pre-analysis
    const syntheticClickTimestamps = identifySyntheticSubmitClicks(this.data, this.constants);
    if (syntheticClickTimestamps.size > 0) {
      Logger.log(
        `Info: Detected ${syntheticClickTimestamps.size} potential Enter->Submit pattern(s).`
      );
    }

    const analysisContext: HeuristicContext = {
      syntheticClickTimestamps: syntheticClickTimestamps,
    };

    Logger.log(
      `Running analysis pipeline with heuristics: ${this.heuristics.map((h) => h.key).join(', ')}`
    );
    const heuristicDeltaLog: Record<string, number> = {};
    this.heuristics.forEach((heuristic) => {
      try {
        Logger.log(`--- Running Heuristic: ${heuristic.key} ---`);
        const result = heuristic.analyze(this.data, analysisContext, this.constants);
        heuristicDeltaLog[heuristic.key] = result.scoreDelta;
        const initialScore = this.score;
        this.score += result.scoreDelta;
        // TODO: Clamp score after each heuristic to prevent extreme swings? .
        // this.score = Math.max(0, Math.min(1, this.score));

        result.logs.forEach((logMsg) => Logger.log(logMsg));
        if (result.scoreDelta !== 0) {
          Logger.log(
            `Score changed by ${result.scoreDelta.toFixed(
              3
            )} (from ${initialScore.toFixed(3)} to ${this.score.toFixed(3)})`
          );
        }
        Logger.log(`--- Finished Heuristic: ${heuristic.key} ---`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        Logger.log(`Error during heuristic ${heuristic.key}: ${errorMessage}`);
      }
    });
    Logger.log(`--- Finished Analysis Pipeline ---\nHeuristic Score Deltas:`);
    Logger.log(JSON.stringify(heuristicDeltaLog, null, 2));
    Logger.log(`--- End of Heuristic Score Deltas ---`);

    // prevent that some heuristics can push the score over 1 or below 0
    this.score = Math.max(0, Math.min(1, this.score));
    Logger.log(`Analysis pipeline completed. Final score: ${this.score.toFixed(3)}`);

    return this.score;
  }
}
