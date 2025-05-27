import type { HeuristicConstants } from '../constants';
import type {
  AnalysisResult,
  CollectedSignalData,
  HeuristicContext,
  HeuristicSource,
} from '../types';

export class PerfectTimingHeuristic implements HeuristicSource {
  readonly key = 'perfectTiming';

  analyze(
    data: CollectedSignalData,
    _context: HeuristicContext,
    constants: Pick<HeuristicConstants, 'UNNATURAL_TIMING_PENALTY' | 'PERFECT_TIMING_THRESHOLD_MS'>
  ): AnalysisResult {
    let scoreDelta = 0;
    const logs: string[] = [];

    const keydowns = data.keydown || [];
    const clicks = data.click || [];
    const perfectTimingCount = this.detectPerfectTiming(
      keydowns,
      clicks,
      constants.PERFECT_TIMING_THRESHOLD_MS
    );

    if (perfectTimingCount > 0) {
      scoreDelta += constants.UNNATURAL_TIMING_PENALTY * perfectTimingCount;
      logs.push(`Penalty: Detected ${perfectTimingCount} events with suspiciously perfect timing.`);
    }

    return { scoreDelta, logs };
  }

  private detectPerfectTiming(
    keydowns: { ts: number }[],
    clicks: { ts: number }[],
    threshold: number
  ): number {
    let perfectTimingCount = 0;
    const events = [...keydowns, ...clicks].sort((a, b) => a.ts - b.ts);

    for (let i = 1; i < events.length; i++) {
      const timeDiff = events[i].ts - events[i - 1].ts;
      // Check if time difference is suspiciously consistent
      if (timeDiff > 0 && timeDiff < threshold && timeDiff % 10 === 0) {
        perfectTimingCount++;
      }
    }

    return perfectTimingCount;
  }
}
