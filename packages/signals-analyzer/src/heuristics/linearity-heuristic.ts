import type { HeuristicConstants } from '../constants';
import type {
  AnalysisResult,
  CollectedSignalData,
  HeuristicContext,
  HeuristicSource,
} from '../types';

interface PointerMove {
  x: number;
  y: number;
  ts: number;
}

export class LinearityHeuristic implements HeuristicSource {
  readonly key = 'linearity';

  analyze(
    data: CollectedSignalData,
    _context: HeuristicContext,
    constants: Pick<
      HeuristicConstants,
      | 'UNNATURAL_TIMING_PENALTY'
      | 'HUMAN_LIKE_PATTERN_BONUS'
      | 'LINEARITY_THRESHOLD_HIGH'
      | 'LINEARITY_THRESHOLD_LOW'
    >
  ): AnalysisResult {
    let scoreDelta = 0;
    const logs: string[] = [];

    const moves = data.pointermove || data.mousemove || [];
    const linearityScore = this.analyzeMovementLinearity(moves as PointerMove[]);

    if (linearityScore > constants.LINEARITY_THRESHOLD_HIGH) {
      scoreDelta += constants.UNNATURAL_TIMING_PENALTY;
      logs.push(
        `Penalty: Detected suspiciously linear pointer movement (linearity: ${linearityScore.toFixed(2)}).`
      );
    } else if (linearityScore < constants.LINEARITY_THRESHOLD_LOW) {
      scoreDelta += constants.HUMAN_LIKE_PATTERN_BONUS * 0.5;
      logs.push(`Bonus: Detected natural, non-linear pointer movement.`);
    }

    return { scoreDelta, logs };
  }

  private analyzeMovementLinearity(moves: PointerMove[]): number {
    if (moves.length < 3) return 0;

    let totalDeviation = 0;
    let totalDistance = 0;

    for (let i = 1; i < moves.length - 1; i++) {
      const prev = moves[i - 1];
      const curr = moves[i];
      const next = moves[i + 1];

      // Calculate expected position based on linear movement
      const expectedX = prev.x + (next.x - prev.x) * 0.5;
      const expectedY = prev.y + (next.y - prev.y) * 0.5;

      // Calculate actual deviation
      const deviation = Math.sqrt(
        Math.pow(curr.x - expectedX, 2) + Math.pow(curr.y - expectedY, 2)
      );

      totalDeviation += deviation;
      totalDistance += Math.sqrt(Math.pow(next.x - prev.x, 2) + Math.pow(next.y - prev.y, 2));
    }

    // Calculate linearity score (0 = perfect linearity, 1 = completely non-linear)
    return totalDistance > 0 ? 1 - totalDeviation / totalDistance : 0;
  }
}
