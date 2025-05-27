import type { HeuristicConstants } from '../constants';
import type {
  AnalysisResult,
  CollectedSignalData,
  HeuristicContext,
  HeuristicSource,
} from '../types';

interface FocusEvent {
  ts: number;
  tid?: string;
}

export class RapidSwitchingHeuristic implements HeuristicSource {
  readonly key = 'rapidSwitching';

  analyze(
    data: CollectedSignalData,
    _context: HeuristicContext,
    constants: Pick<HeuristicConstants, 'SUSPICIOUS_SEQUENCE_PENALTY' | 'RAPID_FIELD_SWITCH_THRESHOLD_MS'>
  ): AnalysisResult {
    let scoreDelta = 0;
    const logs: string[] = [];

    const focuses = data.focus || [];
    const rapidSwitches = this.detectRapidFieldSwitching(focuses, constants.RAPID_FIELD_SWITCH_THRESHOLD_MS);
    
    if (rapidSwitches > 0) {
      scoreDelta += constants.SUSPICIOUS_SEQUENCE_PENALTY * rapidSwitches;
      logs.push(`Penalty: Detected ${rapidSwitches} instances of suspiciously rapid field switching.`);
    }

    return { scoreDelta, logs };
  }

  private detectRapidFieldSwitching(focuses: FocusEvent[], threshold: number): number {
    let rapidSwitches = 0;

    for (let i = 1; i < focuses.length; i++) {
      const timeDiff = focuses[i].ts - focuses[i - 1].ts;
      if (timeDiff < threshold) {
        rapidSwitches++;
      }
    }

    return rapidSwitches;
  }
} 