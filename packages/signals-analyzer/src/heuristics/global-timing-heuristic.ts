import type { HeuristicConstants } from '../constants';
import type {
  AnalysisResult,
  CollectedSignalData,
  HeuristicContext,
  HeuristicSource,
} from '../types';

export class GlobalTimingHeuristic implements HeuristicSource {
  readonly key = 'globalTiming';

  analyze(
    data: CollectedSignalData,
    _context: HeuristicContext,
    constants: Pick<
      HeuristicConstants,
      'FAST_COMPLETION_PENALTY' | 'MIN_DURATION_THRESHOLD_MS' | 'MIN_EVENTS_FOR_DURATION_PENALTY' | 'SLOW_COMPLETION_BONUS' | 'MAX_BONUS_SLOW_COMPLETION'
    >
  ): AnalysisResult {
    let scoreDelta = 0;
    const logs: string[] = [];

    const globalTimmingEvent = data.gt || [];

    const firstTimestamp = globalTimmingEvent[0]?.ts || 0;
    const lastTimestamp = globalTimmingEvent[globalTimmingEvent.length - 1]?.ts || 0;
    const totalDurationMs = lastTimestamp - firstTimestamp;

    logs.push(`Total interaction duration: ${totalDurationMs.toFixed(0)}ms`);

    if (totalDurationMs < constants.MIN_DURATION_THRESHOLD_MS) {
      scoreDelta += constants.FAST_COMPLETION_PENALTY;
      logs.push(`Penalty: Total duration (${totalDurationMs.toFixed(0)}ms)`);
    } else{
      // bonus for long interactions
      const bonus = constants.SLOW_COMPLETION_BONUS * (totalDurationMs / constants.MIN_DURATION_THRESHOLD_MS);
      scoreDelta += Math.min(bonus, constants.MAX_BONUS_SLOW_COMPLETION);
    }

    return { scoreDelta, logs };
  }
}
