import type { HeuristicConstants } from '../constants';
import type {
  AnalysisResult,
  CollectedSignalData,
  HeuristicContext,
  HeuristicSource,
} from '../types';

export class PointerMovementHeuristic implements HeuristicSource {
  readonly key = 'pointerMovement';

  analyze(
    data: CollectedSignalData,
    context: HeuristicContext,
    constants: Pick<
      HeuristicConstants,
      | 'UNNATURAL_TIMING_PENALTY'
      | 'HUMAN_LIKE_PATTERN_BONUS'
      | 'POINTER_MOVE_MIN_COUNT'
      | 'POINTER_MAX_SPEED_PPS'
      | 'POINTER_MIN_HESITATION_MS'
    >
  ): AnalysisResult {
    let scoreDelta = 0;
    const logs: string[] = [];
    const { syntheticClickTimestamps } = context;

    const moves = data.pointermove || data.mousemove || [];
    const allClicksAndPointerDowns = [...(data.click || []), ...(data.pointerdown || [])];
    const genuineClicksAndPointerDowns = allClicksAndPointerDowns.filter(
      (event) => !syntheticClickTimestamps.has(event.ts)
    );
    const genuineClickCount = genuineClicksAndPointerDowns.length;

    if (genuineClickCount > 0 && moves.length < constants.POINTER_MOVE_MIN_COUNT) {
      scoreDelta += constants.UNNATURAL_TIMING_PENALTY * 0.8;
      logs.push(
        `Penalty: Few (${moves.length}) pointer movements detected despite ${genuineClickCount} genuine click/pointerdown event(s).`
      );
    } else if (moves.length >= constants.POINTER_MOVE_MIN_COUNT) {
      scoreDelta += constants.HUMAN_LIKE_PATTERN_BONUS * 0.4;
      logs.push(`Minor bonus: Detected ${moves.length} pointer movements.`);
    }

    if (moves.length < 2) {
      logs.push('Info: Not enough pointer movement events for detailed speed/hesitation analysis.');
      return { scoreDelta, logs };
    }

    let totalDistance = 0,
      maxSpeed = 0,
      hesitationCount = 0;
    for (let i = 1; i < moves.length; i++) {
      const prev = moves[i - 1];
      const curr = moves[i];
      const dt = curr.dt ?? curr.ts - prev.ts;
      if (
        dt > 0 &&
        curr.x !== undefined &&
        curr.y !== undefined &&
        prev.x !== undefined &&
        prev.y !== undefined
      ) {
        const dist =
          curr.d ?? Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
        totalDistance += dist;
        const speed = curr.s ?? dist / (dt / 1000);
        if (speed > maxSpeed) maxSpeed = speed;
        if (dt > constants.POINTER_MIN_HESITATION_MS) hesitationCount++;
      }
    }
    logs.push(
      `Pointer Details: Total distance=${totalDistance.toFixed(
        0
      )}px, Max speed=${maxSpeed.toFixed(0)}pps, Hesitations=${hesitationCount}`
    );

    if (maxSpeed > constants.POINTER_MAX_SPEED_PPS) {
      scoreDelta += constants.UNNATURAL_TIMING_PENALTY;
      logs.push(`Penalty: Pointer maximum speed (${maxSpeed.toFixed(0)}pps) is suspiciously high.`);
    }
    if (hesitationCount > 0 && genuineClickCount > 0) {
      scoreDelta += constants.HUMAN_LIKE_PATTERN_BONUS * 0.3;
      logs.push(
        `Minor bonus: Detected ${hesitationCount} pointer movement hesitations before genuine interaction.`
      );
    }

    return { scoreDelta, logs };
  }
}
