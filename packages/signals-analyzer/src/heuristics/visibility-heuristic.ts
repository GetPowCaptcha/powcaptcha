import type { HeuristicConstants } from "../constants";
import type {
  AnalysisResult,
  CollectedSignalData,
  HeuristicContext,
  HeuristicSource,
} from "../types";

export class VisibilityHeuristic implements HeuristicSource {
  readonly key = "visibility";

  analyze(
    data: CollectedSignalData,
    _context: HeuristicContext,
    constants: Pick<
      HeuristicConstants,
      "VISIBILITY_CHANGE_BONUS" | "MAX_VISIBILITY_CHANGE_BONUS"
    >
  ): AnalysisResult {
    let scoreDelta = 0;
    const logs: string[] = [];
    const visibilityChanges = data.visibilitychange || [];
    const hiddenEvents = visibilityChanges.filter((v) => v.vs === "hidden");

    if (hiddenEvents.length > 0) {
      scoreDelta += Math.min(
        constants.MAX_VISIBILITY_CHANGE_BONUS,
        constants.VISIBILITY_CHANGE_BONUS * hiddenEvents.length
      );
      logs.push(
        `Strong Bonus: Detected ${hiddenEvents.length} 'hidden' visibility change event(s) (tab switch/minimize).`
      );
    }

    return { scoreDelta, logs };
  }
}
